'use client'

import { useState, useEffect } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MainLayout } from '@/components/layout/main-layout'
import { getProgram, PROGRAM_ID } from '@/lib/anchor/program'
import { getGlobalConfig } from '@/lib/solana'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import { toast } from 'sonner'

interface FormData {
  name: string
  hashtag: string
  videoUrl: string
  prizePool: string
  deadline: string
}

export default function CreateBountyPage() {
  const { publicKey, wallet, connected, signTransaction, signAllTransactions } = useWallet()
  const { connection } = useConnection()

  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [treasury, setTreasury] = useState<string>('')
  const [isLoadingTreasury, setIsLoadingTreasury] = useState(true)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    hashtag: '',
    videoUrl: '',
    prizePool: '5.00',
    deadline: '',
  })

  useEffect(() => {
    const fetchTreasury = async () => {
      if (!connection) {
        setIsLoadingTreasury(false)
        return
      }
      
      try {
        const config = await getGlobalConfig(connection)
        if (config?.treasury) {
          setTreasury(config.treasury.toString())
          console.log('Treasury fetched:', config.treasury.toString())
        } else {
          console.warn('GlobalConfig not found or treasury not set')
        }
      } catch (error) {
        console.error('Error fetching treasury:', error)
      } finally {
        setIsLoadingTreasury(false)
      }
    }

    fetchTreasury()
  }, [connection])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const platformFee = parseFloat(formData.prizePool || '0') * 0.005
  const totalEscrow = parseFloat(formData.prizePool || '0') + platformFee

  const handleCreateBounty = async () => {
    // Validate all fields
    if (!formData.name || !formData.hashtag || !formData.prizePool || !formData.deadline) {
      toast.error('Please fill in all fields')
      return
    }

    if (!connected || !wallet || !publicKey) {
      toast.error('Please connect your Solana wallet to finalize.')
      return
    }

    setIsCreating(true)

    try {
      const anchorWallet = {
        publicKey,
        signTransaction: async (tx: any) => {
          if (!signTransaction) throw new Error('Wallet does not support signTransaction')
          return signTransaction(tx)
        },
        signAllTransactions: async (txs: any[]) => {
          if (!signAllTransactions) throw new Error('Wallet does not support signAllTransactions')
          return signAllTransactions(txs)
        },
      }

      const program = getProgram(connection, anchorWallet)

      const originalVideoId = formData.videoUrl.split('v=')[1]?.split('&')[0] ||
                             Math.random().toString(36).substring(7)

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(originalVideoId)],
        PROGRAM_ID
      )

      // Check if pool already exists
      const existingPool = await connection.getAccountInfo(poolPda)
      if (existingPool) {
        throw new Error('A pool for this video already exists. Please use a different video URL.')
      }

      const [prizeVaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('vault'), poolPda.toBuffer()],
        PROGRAM_ID
      )

      const [creatorStatsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('creator_stats'), anchorWallet.publicKey.toBuffer()],
        PROGRAM_ID
      )

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('global_config_v1')],
        PROGRAM_ID
      )

      // Verify GlobalConfig exists and belongs to our program
      const configAccount = await connection.getAccountInfo(configPda)
      if (!configAccount) {
        throw new Error('Platform not initialized. Please contact the admin to initialize the platform first.')
      }

      // Use treasury from GlobalConfig (fetched on page load)
      if (!treasury) {
        throw new Error('Treasury not loaded. Please refresh the page.')
      }
      const treasuryPubkey = new PublicKey(treasury)

      const prizeAmount = new anchor.BN(parseFloat(formData.prizePool) * 1e9)
      
      // Parse Brazilian date format (DD/MM/YYYY) to Unix timestamp
      function parseBrazilianDate(dateStr: string): number {
        // Try Brazilian format DD/MM/YYYY
        const brazilianFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/
        const match = dateStr.match(brazilianFormat)
        
        if (match) {
          const [, day, month, year] = match
          // Create date in UTC to avoid timezone issues
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 23, 59, 59)
          return Math.floor(date.getTime() / 1000)
        }
        
        // Try ISO format YYYY-MM-DD (for date input fallback)
        const isoDate = new Date(dateStr)
        if (!isNaN(isoDate.getTime())) {
          return Math.floor(isoDate.getTime() / 1000)
        }
        
        // Invalid date
        return NaN
      }

      const deadlineTimestamp = parseBrazilianDate(formData.deadline)
      const nowTimestamp = Math.floor(Date.now() / 1000)
      
      // Validate deadline format
      if (isNaN(deadlineTimestamp)) {
        throw new Error('Invalid date format. Please use DD/MM/YYYY format (e.g., 20/10/2026)')
      }

      // Debug logs
      console.log('=== DEBUG CREATE POOL ===')
      console.log('originalVideoId:', originalVideoId)
      console.log('prizeAmount (lamports):', prizeAmount.toString())
      console.log('prizeAmount (SOL):', parseFloat(formData.prizePool))
      console.log('deadline input:', formData.deadline)
      console.log('deadlineTimestamp:', deadlineTimestamp)
      console.log('nowTimestamp:', nowTimestamp)
      console.log('isInPast:', deadlineTimestamp <= nowTimestamp)
      console.log('poolPda:', poolPda.toString())
      console.log('prizeVaultPda:', prizeVaultPda.toString())
      console.log('creatorStatsPda:', creatorStatsPda.toString())
      console.log('configPda:', configPda.toString())
      console.log('treasuryPubkey:', treasuryPubkey.toString())
      console.log('=========================')

      // Validate deadline is in the future
      if (deadlineTimestamp <= nowTimestamp) {
        throw new Error('Deadline must be in the future. Please select a future date.')
      }

      const expiryTimestamp = new anchor.BN(deadlineTimestamp)

      // Validate prize amount
      if (parseFloat(formData.prizePool) <= 0) {
        throw new Error('Prize amount must be greater than 0')
      }

      const scoringRules = {
        viewsWeight: 5000,
        likesWeight: 3000,
        commentsWeight: 2000,
      }

      // Build the transaction using Anchor
      const transaction = await program.methods
        .createPool(originalVideoId, prizeAmount, scoringRules, expiryTimestamp)
        .accounts({
          pool: poolPda,
          prizeVault: prizeVaultPda,
          creatorStats: creatorStatsPda,
          config: configPda,
          treasury: treasuryPubkey,
          creator: anchorWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .transaction()

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = anchorWallet.publicKey

      // Sign and send the transaction
      const signedTx = await anchorWallet.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation with 60 second timeout
      console.log('Waiting for confirmation... Signature:', signature)
      
      let confirmed = false
      let retries = 0
      const maxRetries = 30
      
      while (!confirmed && retries < maxRetries) {
        try {
          const status = await connection.getSignatureStatus(signature)
          if (status.value?.err) {
            throw new Error('Transaction failed: ' + JSON.stringify(status.value.err))
          }
          if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
            confirmed = true
            console.log('Transaction confirmed! TX:', signature)
            toast.success('Bounty created successfully!')
            setShowSuccess(true)
          }
        } catch (checkError) {
          // Transaction may not be found yet, continue waiting
        }
        
        if (!confirmed) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          retries++
        }
      }

      if (!confirmed) {
        // Check if transaction was sent anyway
        const status = await connection.getSignatureStatus(signature).catch(() => null)
        if (status?.value?.err) {
          throw new Error('Transaction failed: ' + JSON.stringify(status.value.err))
        }
        // Transaction may have been sent but not confirmed in time
        console.log('Transaction sent but not confirmed yet. Signature:', signature)
        toast.success('Bounty created! (Transaction sent, awaiting confirmation)')
        setShowSuccess(true)
      }
    } catch (error: any) {
      console.error('Error creating bounty:', error)
      toast.error('Failed to create bounty: ' + (error.message || 'Unknown error'))
    } finally {
      setIsCreating(false)
    }
  }

  if (!connected) {
    return (
      <MainLayout showSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined mb-6 text-6xl text-primary">
            account_balance_wallet
          </span>
          <h1 className="mb-4 font-headline text-3xl font-bold text-on-surface">
            Connect Your Wallet
          </h1>
          <p className="mb-8 max-w-md text-on-surface-variant">
            Connect your Solana wallet to create a new bounty.
          </p>
          <WalletMultiButton />
        </div>
      </MainLayout>
    )
  }

  if (showSuccess) {
    return (
      <MainLayout showSidebar={false}>
        <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-secondary/20">
            <span
              className="material-symbols-outlined text-6xl text-secondary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <h1 className="mb-4 font-headline text-4xl font-bold text-on-surface">
            Bounty Created Successfully!
          </h1>
          <p className="mb-2 max-w-md text-on-surface-variant">
            Your bounty <span className="font-bold text-secondary">{formData.name || 'New Bounty'}</span> is now live.
          </p>
          <p className="mb-8 max-w-md text-sm text-on-surface-variant">
            {totalEscrow.toFixed(3)} SOL has been locked in escrow. Editors can now start submitting their clips!
          </p>
          <div className="flex gap-4">
            <a
              href="/bounties"
              className="rounded-xl border border-outline-variant/20 px-8 py-3 font-bold text-on-surface transition-all hover:bg-surface-container-high"
            >
              View All Bounties
            </a>
            <a
              href="/dashboard"
              className="gradient-solana rounded-xl px-8 py-3 font-bold text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(52,254,160,0.4)]"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout showSidebar={false}>
      {/* Background Effects */}
      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 opacity-10 blur-3xl">
        <div className="h-[500px] w-[500px] rounded-full bg-primary"></div>
      </div>
      <div className="pointer-events-none fixed left-0 top-0 -z-10 opacity-5 blur-3xl">
        <div className="h-[800px] w-[800px] rounded-full bg-secondary"></div>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Sidebar: Progress and Context */}
          <aside className="space-y-8 lg:col-span-4">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold tracking-tighter text-on-surface">
                Launch a new <br />
                <span className="text-secondary">Attention Bounty</span>
              </h2>
              <p className="leading-relaxed text-on-surface-variant">
                Define your challenge, lock the prize pool in escrow, and let
                the AI Oracle validate the best creators.
              </p>
            </div>

            {/* How it works */}
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-on-surface">How it works</h3>
              <div className="space-y-3 text-sm text-on-surface-variant">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xs">video_library</span>
                  <span>Enter a YouTube video link</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xs">sell</span>
                  <span>Set your prize pool in SOL</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xs">event</span>
                  <span>Choose a deadline for submissions</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xs">groups</span>
                  <span>Editors submit clips and compete</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xs">emoji_events</span>
                  <span>Winner receives the prize automatically</span>
                </div>
              </div>
            </div>

            {/* AI Oracle Summary */}
            <div className="ghost-border space-y-4 rounded-xl bg-surface-container-low p-6">
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  verified_user
                </span>
                <h3 className="font-headline font-bold">AI Oracle Validation</h3>
              </div>
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Our AI model automatically scans social media for the designated
                hashtag, verifies the source video match, and evaluates
                engagement metrics.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-bold uppercase tracking-tighter text-secondary-dim">
                <span className="material-symbols-outlined text-sm">
                  auto_awesome
                </span>
                99.8% Proof-of-Work Accuracy
              </div>
            </div>
          </aside>

          {/* Main Form Canvas */}
          <section className="lg:col-span-8">
            <div className="glass-panel ghost-border space-y-10 rounded-3xl p-8 md:p-12">
              {/* Section 1: Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold">
                    Bounty Fundamentals
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Challenge Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full border-0 border-b border-outline-variant bg-surface-container-low px-0 py-3 text-on-surface transition-all placeholder:text-outline-variant focus:border-primary focus:ring-0"
                      placeholder="e.g. The Solana Summer Sizzle"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Social Hashtag
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-3 text-on-surface-variant">
                        #
                      </span>
                      <input
                        type="text"
                        name="hashtag"
                        value={formData.hashtag}
                        onChange={handleInputChange}
                        className="w-full border-0 border-b border-outline-variant bg-surface-container-low py-3 pl-4 pr-0 text-on-surface transition-all placeholder:text-outline-variant focus:border-primary focus:ring-0"
                        placeholder="SolCutsChallenge"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Assets */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <span className="material-symbols-outlined text-secondary">
                      movie
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold">
                    Source Material
                  </h3>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Video URL (YouTube, Drive, or Loom)
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="w-full border-0 border-b border-outline-variant bg-surface-container-low px-0 py-3 text-on-surface transition-all placeholder:text-outline-variant focus:border-primary focus:ring-0"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-[10px] italic text-on-surface-variant">
                    Editors will use this specific source to generate clips.
                  </p>
                </div>
              </div>

              {/* Section 3: Economics */}
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10">
                    <span className="material-symbols-outlined text-tertiary">
                      payments
                    </span>
                  </div>
                  <h3 className="font-headline text-xl font-bold">
                    Incentive Structure
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Total Prize Pool ($SOL)
                    </label>
                    <div className="group relative">
                      <input
                        type="number"
                        name="prizePool"
                        value={formData.prizePool}
                        onChange={handleInputChange}
                        step="0.1"
                        min="0.1"
                        className="w-full border-0 border-b border-outline-variant bg-surface-container-low px-0 py-3 font-headline text-2xl font-bold text-on-surface transition-all placeholder:text-outline-variant focus:border-primary focus:ring-0"
                        placeholder="5.00"
                      />
                      <span className="absolute right-0 top-4 font-bold text-on-surface-variant">
                        SOL
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleInputChange}
                      className="w-full border-0 border-b border-outline-variant bg-surface-container-low px-0 py-3 text-on-surface transition-all focus:border-primary focus:ring-0"
                    />
                  </div>
                </div>

                {/* Escrow Preview Card */}
                <div className="mt-4 flex items-center justify-between rounded-2xl border-l-4 border-primary bg-surface-container-high p-6">
                  <div>
                    <p className="mb-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Escrow Deposit Preview
                    </p>
                    <p className="font-headline text-2xl font-bold">
                      {totalEscrow.toFixed(3)}{' '}
                      <span className="text-sm text-on-surface-variant">
                        SOL
                      </span>
                    </p>
                    <p className="mt-1 text-[10px] text-on-surface-variant">
                      Includes 0.5% platform protocol fee ({platformFee.toFixed(3)}{' '}
                      SOL)
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary/20">
                      <span
                        className="material-symbols-outlined text-3xl text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        lock
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex justify-end border-t border-outline-variant/10 pt-8">
                <button
                  onClick={handleCreateBounty}
                  disabled={isCreating}
                  className="gradient-solana flex items-center justify-center gap-2 rounded-xl px-10 py-4 font-bold text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(52,254,160,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreating ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Creating Bounty...
                    </>
                  ) : (
                    'Create Bounty'
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
