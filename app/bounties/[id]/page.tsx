'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)
import { MainLayout } from '@/components/layout/main-layout'
import { LeaderboardTable } from '@/components/bounty/leaderboard-table'
import { coreApi, Pool } from '@/lib/api'
import { getProgram, PROGRAM_ID } from '@/lib/anchor/program'
import { getPools, PoolStatus } from '@/lib/solana'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { toast } from 'sonner'

async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer as any);
  return new Uint8Array(hashBuffer);
}

interface BountyDetailPageProps {
  params: Promise<{ id: string }>
}

function CountdownTimer({ deadline }: { deadline: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = deadline.getTime() - Date.now()
      if (diff <= 0) {
        return { hours: 0, minutes: 0, seconds: 0 }
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      return { hours: totalHours, minutes, seconds }
    }

    setTimeLeft(calculateTimeLeft())

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(timer)
  }, [deadline])

  return (
    <div className="flex gap-4 font-headline text-3xl font-bold">
      <div className="flex flex-col items-center">
        <span className="text-primary">
          {timeLeft.hours.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
          Hours
        </span>
      </div>
      <span className="text-outline-variant">:</span>
      <div className="flex flex-col items-center">
        <span className="text-primary">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
          Mins
        </span>
      </div>
      <span className="text-outline-variant">:</span>
      <div className="flex flex-col items-center">
        <span className="text-secondary">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </span>
        <span className="text-[10px] uppercase tracking-tighter text-on-surface-variant">
          Secs
        </span>
      </div>
    </div>
  )
}

export default function BountyDetailPage({ params }: BountyDetailPageProps) {
  const { id: poolPda } = use(params)
  const [pool, setPool] = useState<Pool | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { publicKey, connected } = useWallet()
  const { connection } = useConnection()

  const [submitUrl, setSubmitUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const fetchPool = async () => {
      if (!connection) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch from blockchain
        const allPools = await getPools(connection)
        
        // Find the specific pool by prizeVault address
        const foundPool = allPools.find(p => p.prizeVault.toBase58() === poolPda)
        
        if (foundPool) {
          setPool({
            pda_address: foundPool.prizeVault.toBase58(),
            creator_wallet: foundPool.creator.toBase58(),
            original_video_id: foundPool.originalVideoId,
            prize_amount: foundPool.prizeAmount,
            participant_count: foundPool.participantCount,
            status: 'OPEN' as const,
            expiry_timestamp: new Date(foundPool.expiryTimestamp * 1000).toISOString(),
            total_score: foundPool.totalScore,
            scoring_rules: { 
              views_weight: foundPool.scoringRules.viewsWeight, 
              likes_weight: foundPool.scoringRules.likesWeight, 
              comments_weight: foundPool.scoringRules.commentsWeight 
            }
          })
        } else {
          // Pool not found or expired - try to get from all accounts directly
          console.log('Pool not found in filtered list, trying to get from chain directly')
        }
      } catch (error) {
        console.error('Error fetching pool details:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPool()
  }, [poolPda, connection])

  const handleSubmit = async () => {
    if (!submitUrl.trim() || !pool) {
      setSubmitError('Please enter a valid URL')
      return
    }

    if (!connected || !publicKey) {
      setSubmitError('Please connect your wallet first')
      return
    }

    const urlPattern = /^https?:\/\/(www\.)?(tiktok\.com|instagram\.com|youtube\.com|youtu\.be)/i
    if (!urlPattern.test(submitUrl)) {
      setSubmitError('Please enter a valid TikTok, Instagram, or YouTube URL')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const anchorWallet = {
        publicKey,
        signTransaction: async (tx: any) => {
          const signer = await (window as any).solana?.signTransaction
          return signer(tx)
        },
        signAllTransactions: async (txs: any[]) => {
          const signer = await (window as any).solana?.signAllTransactions
          return signer(txs)
        },
      }

      const program = getProgram(connection, anchorWallet)

      const linkHash = await sha256(submitUrl)

      const [entryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('entry'), new PublicKey(poolPda).toBuffer(), linkHash],
        PROGRAM_ID
      )

      const [userProfilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_profile'), publicKey.toBuffer()],
        PROGRAM_ID
      )

      const [stakeAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('stake_account'), publicKey.toBuffer()],
        PROGRAM_ID
      )

      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('global_config_v1')],
        PROGRAM_ID
      )

      toast.info("Preparing transaction...", { id: 'submit_toast' })
      const tx = new anchor.web3.Transaction()

      try {
        const userExists = await connection.getAccountInfo(userProfilePda)
        if (!userExists) {
            console.log("Adding initializeUser instruction")
            const initIx = await program.methods.initializeUser(["UC_Placeholder"]).accounts({
                userProfile: userProfilePda,
                config: configPda,
                authority: publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any).instruction()
            tx.add(initIx)
        }

        const stakeExists = await connection.getAccountInfo(stakeAccountPda)
        if (!stakeExists) {
            console.log("Adding depositStake instruction")
            const depositIx = await program.methods.depositStake(new anchor.BN(150_000_000)).accounts({
                stakeAccount: stakeAccountPda,
                config: configPda,
                authority: publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            } as any).instruction()
            tx.add(depositIx)
        }
      } catch (e) {
        console.log("Error checking account existence", e)
      }

      const joinIx = await program.methods
        .joinPool(Array.from(linkHash), submitUrl, "CHANNEL_ID")
        .accounts({
          entry: entryPda,
          pool: new PublicKey(poolPda),
          userProfile: userProfilePda,
          stakeAccount: stakeAccountPda,
          config: configPda,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .instruction()

      tx.add(joinIx)

      const latestBlockhash = await connection.getLatestBlockhash()
      tx.recentBlockhash = latestBlockhash.blockhash
      tx.feePayer = publicKey

      const signedTx = await anchorWallet.signTransaction(tx)
      const txid = await connection.sendRawTransaction(signedTx.serialize())
      await connection.confirmTransaction(txid)

      console.log('Submission success! TX:', txid)
      toast.success('Clip submitted successfully! Waiting for AI Oracle...', { id: 'submit_toast' })
      setSubmitSuccess(true)
      setSubmitUrl('')
    } catch (error: any) {
      console.error('Error submitting clip:', error)
      setSubmitError('Failed to submit: ' + (error.message || 'Unknown error'))
      toast.error('Submission failed')
    } finally {
      setIsSubmitting(false)
    }

    setTimeout(() => setSubmitSuccess(false), 5000)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </MainLayout>
    )
  }

  if (!pool) {
    return (
      <MainLayout showSidebar={false}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-bold mb-4">Pool Not Found</h1>
          <Link href="/bounties" className="text-primary hover:underline">Back to Marketplace</Link>
        </div>
      </MainLayout>
    )
  }

  const deadline = new Date(pool.expiry_timestamp)
  const prizePool = pool.prize_amount / 1e9

  return (
    <MainLayout showSidebar={false}>
      <div className="mx-auto max-w-[1440px]">
        {/* Header & Countdown */}
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <nav className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-on-surface-variant">
              <Link href="/bounties" className="hover:text-on-surface">
                Active Bounties
              </Link>
              <span className="material-symbols-outlined text-sm">
                chevron_right
              </span>
              <span className="text-secondary">
                Challenge #{pool.pda_address.slice(0, 8)}
              </span>
            </nav>
            <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface md:text-6xl">
              Viral Clip <span className="gradient-text">Challenge</span>
            </h1>
            <p className="mt-2 text-on-surface-variant">Original Video: {pool.original_video_id}</p>
          </div>

          <div className="flex min-w-[240px] flex-col items-center rounded-2xl border border-outline-variant/15 bg-surface-container-low p-6">
            <span className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              AI Oracle Finalization
            </span>
            <CountdownTimer deadline={deadline} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Video & Submission Column */}
          <div className="space-y-8 lg:col-span-7">
            {/* Source Video Player */}
            <div className="group relative aspect-video overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-2xl">
              <img
                className="h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
                src={`https://img.youtube.com/vi/${pool.original_video_id}/maxresdefault.jpg`}
                alt="Source video thumbnail"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDohfVIfnpUHmV-9wVMsR2r3zwJAparleMwUCzkCuA5RmTN_-imD1ONas7pY4Dg7ChBfVaX6-ErBYCfvlBCsxCAqRpTvt9gY3NIqHitkrEcJd6RHlstWj827X11s83ZgfWvQr7bmxqwPqjm7RSlJP5CyiutVIOp_85emFqT9OZSaVaEDbY-n7xILI47UGr-SQHtUyXKMo9LZ6we6x3U1BB9SyMnk_aOjNBQgYdsWcnT95Iq7beme3xvi37sDfWPiguAq4_aK5Z-ktxR'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <a 
                  href={`https://youtube.com/watch?v=${pool.original_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full border border-primary/40 bg-primary/20 backdrop-blur-md transition-transform hover:scale-110"
                >
                  <span
                    className="material-symbols-outlined text-5xl text-primary"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </a>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-surface-container-lowest to-transparent p-8">
                <div className="flex items-center gap-4">
                  <span className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Source Material
                  </span>
                  <span className="text-sm text-on-surface/60">
                    Video ID: {pool.original_video_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="rounded-[2rem] border border-outline-variant/10 bg-surface-container-low p-8">
              <h3 className="mb-6 font-headline text-xl font-semibold">
                Submit Your Clip
              </h3>
              
              {submitSuccess && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-secondary/10 p-4 text-secondary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <div>
                    <p className="font-bold">Submission Successful!</p>
                    <p className="text-sm opacity-80">Your clip is being processed by the AI Oracle.</p>
                  </div>
                </div>
              )}

              {submitError && (
                <div className="mb-6 flex items-center gap-3 rounded-xl bg-error/10 p-4 text-error">
                  <span className="material-symbols-outlined">error</span>
                  <p>{submitError}</p>
                </div>
              )}

              {!connected ? (
                <div className="flex flex-col items-center gap-4 rounded-xl bg-surface-container-high p-8 text-center">
                  <span className="material-symbols-outlined text-4xl text-primary">
                    account_balance_wallet
                  </span>
                  <div>
                    <p className="font-bold text-on-surface">Connect Wallet to Submit</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      You need to connect your Solana wallet and pay the entry stake (0.05 SOL)
                    </p>
                  </div>
                  <WalletMultiButton />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 md:flex-row">
                    <div className="relative flex-grow">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                        link
                      </span>
                      <input
                        type="text"
                        value={submitUrl}
                        onChange={(e) => {
                          setSubmitUrl(e.target.value)
                          setSubmitError('')
                        }}
                        className="w-full rounded-xl border-b border-outline-variant/30 bg-surface-container-high py-4 pl-12 pr-4 text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-secondary"
                        placeholder="Paste your TikTok or Instagram URL..."
                        disabled={isSubmitting}
                      />
                    </div>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !submitUrl.trim()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-highest px-8 py-4 font-bold text-on-surface transition-all hover:bg-surface-bright disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-secondary">rocket_launch</span>
                          Submit Link
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">info</span>
                      AI Oracle will process engagement metrics within 15 minutes.
                    </p>
                    <p className="flex items-center gap-1 text-xs font-bold text-secondary">
                      <span className="material-symbols-outlined text-sm">lock</span>
                      Entry Stake: 0.15 SOL
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Leaderboard Column */}
          <div className="lg:col-span-5">
            <LeaderboardTable poolPda={poolPda} prizePool={prizePool} />
          </div>
        </div>

        {/* Metric Details */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-primary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-primary">
              analytics
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {pool.total_score.toLocaleString()}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Total Engagement
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-secondary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-secondary">
              groups
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {pool.participant_count}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Active Editors
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-tertiary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-tertiary">
              psychology
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {(pool.scoring_rules.views_weight / 100).toFixed(0)}/{(pool.scoring_rules.likes_weight / 100).toFixed(0)}/{(pool.scoring_rules.comments_weight / 100).toFixed(0)}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              V/L/C Weight (%)
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-error/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-error">
              stadium
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {pool.status}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Pool Status
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
