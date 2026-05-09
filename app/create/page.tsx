'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { MainLayout } from '@/components/layout/main-layout'
import { getProgram, PROGRAM_ID } from '@/lib/anchor/program'
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
  const { publicKey, wallet, connected } = useWallet()
  const { connection } = useConnection()

  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    hashtag: '',
    videoUrl: '',
    prizePool: '5.00',
    deadline: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const platformFee = parseFloat(formData.prizePool || '0') * 0.005
  const totalEscrow = parseFloat(formData.prizePool || '0') + platformFee

  const handleCreateBounty = async () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
      return
    }

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
          const signer = (wallet as any).signTransaction
          return signer(tx)
        },
        signAllTransactions: async (txs: any[]) => {
          const signer = (wallet as any).signAllTransactions
          return signer(txs)
        },
      }

      const program = getProgram(connection, anchorWallet)

      const originalVideoId = formData.videoUrl.split('v=')[1]?.split('&')[0] ||
                             Math.random().toString(36).substring(7)

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(originalVideoId)],
        PROGRAM_ID
      )

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

      // TODO: Fetch config using RPC or use lib/solana.ts
      // const configAccount = await program.account.globalConfig.fetch(configPda)
      // const treasury = configAccount.treasury as PublicKey

      // Use treasury from .env or known address
      const treasury = new PublicKey('TR7noH7kGELu4rZ7oA5Z9Y9X5Yz6Zz8Zz7Zz8Zz7Zz')

      const prizeAmount = new anchor.BN(parseFloat(formData.prizePool) * 1e9)
      const expiryTimestamp = new anchor.BN(new Date(formData.deadline).getTime() / 1000)

      const scoringRules = {
        viewsWeight: 5000,
        likesWeight: 3000,
        commentsWeight: 2000,
      }

      const tx = await program.methods
        .createPool(originalVideoId, prizeAmount, scoringRules, expiryTimestamp)
        .accounts({
          pool: poolPda,
          prizeVault: prizeVaultPda,
          creatorStats: creatorStatsPda,
          config: configPda,
          treasury: treasury,
          creator: anchorWallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .rpc()

      console.log('Bounty created! TX:', tx)
      toast.success('Bounty created successfully!')
      setShowSuccess(true)
    } catch (error: any) {
      console.error('Error creating bounty:', error)
      toast.error('Failed to create bounty: ' + (error.message || 'Unknown error'))
    } finally {
      setIsCreating(false)
    }
  }

  const steps = [
    { step: 1, label: 'Bounty Details', completed: currentStep > 1 },
    { step: 2, label: 'Prize & Escrow', completed: currentStep > 2 },
    { step: 3, label: 'Confirmation', completed: false },
  ]

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

            {/* Progress Indicator */}
            <div className="relative space-y-8 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-[2px] before:bg-surface-container-high">
              {steps.map((s) => (
                <div key={s.step} className="relative flex items-start gap-4">
                  <div
                    className={`z-10 flex h-6 w-6 items-center justify-center rounded-full ${
                      s.completed
                        ? 'bg-secondary'
                        : currentStep === s.step
                          ? 'border-2 border-surface bg-primary'
                          : 'bg-surface-container-high'
                    }`}
                  >
                    {s.completed && (
                      <span
                        className="material-symbols-outlined text-xs font-bold text-surface-container-lowest"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check
                      </span>
                    )}
                    {!s.completed && currentStep === s.step && (
                      <div className="h-2 w-2 rounded-full bg-surface"></div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-bold uppercase tracking-widest ${
                        currentStep === s.step
                          ? 'text-secondary'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      Step {s.step}
                    </span>
                    <span
                      className={`font-headline text-lg ${
                        currentStep === s.step
                          ? 'text-on-surface'
                          : 'text-on-surface-variant'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </div>
              ))}
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
              <div className="flex flex-col items-center justify-between gap-6 border-t border-outline-variant/10 pt-8 md:flex-row">
                <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-colors hover:text-on-surface">
                  <span className="material-symbols-outlined text-lg">
                    arrow_back
                  </span>
                  Cancel
                </button>
                <div className="flex w-full gap-4 md:w-auto">
                  <button className="flex-1 rounded-xl border border-outline-variant px-10 py-4 font-bold text-on-surface transition-all hover:bg-surface-container-high md:flex-initial">
                    Save Progress
                  </button>
                  <button
                    onClick={handleCreateBounty}
                    disabled={isCreating}
                    className="gradient-solana flex flex-1 items-center justify-center gap-2 rounded-xl px-10 py-4 font-bold text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(52,254,160,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 md:flex-initial"
                  >
                    {isCreating ? (
                      <>
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        Creating Bounty...
                      </>
                    ) : currentStep < 3 ? (
                      'Next: Prize Pool'
                    ) : (
                      'Create Bounty'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}
