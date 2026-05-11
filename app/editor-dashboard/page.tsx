'use client'

import { useState, useEffect, useRef } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Entry } from '@/lib/api'
import { coreApi } from '@/lib/api'
import { toast } from 'sonner'
import { getProgram } from '@/lib/anchor/program'
import { sha256, getPrizeVaultPDA, getUserProfilePDA, getStakeAccountPDA, getGlobalConfigPDA } from '@/lib/solana'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'

export default function EditorDashboardPage() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const walletAddress = publicKey?.toBase58()

  const [myOpenEntries, setMyOpenEntries] = useState<Entry[]>([])
  const [myExpiredEntries, setMyExpiredEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const claimedLocally = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) {
        setIsLoading(false)
        return
      }

      try {
        const data = await coreApi.getUserParticipations(walletAddress)
        const entries: Entry[] = data.items

        const open: Entry[] = []
        const expired: Entry[] = []

        for (const entry of entries) {
          const poolExpiry = (entry as any).pool_expiry_timestamp
          const isExpired = poolExpiry && new Date(poolExpiry) < new Date()
          if (isExpired) {
            expired.push(entry)
          } else {
            open.push(entry)
          }
        }

        setMyOpenEntries(open.map(e =>
          claimedLocally.current.has(e.pda_address) ? { ...e, claimed: true } : e
        ))
        setMyExpiredEntries(expired.map(e =>
          claimedLocally.current.has(e.pda_address) ? { ...e, claimed: true } : e
        ))
      } catch (err) {
        console.error('Failed to load editor data', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [walletAddress])

  const handleClaim = async (entry: Entry) => {
    if (!publicKey || !connection || !signTransaction) {
      toast.error('Wallet not connected')
      return
    }

    try {
      toast.loading('Claiming prize...', { id: 'claim_toast' })

      const linkHash = await sha256(entry.clip_link)

      const anchorWallet = {
        publicKey,
        signTransaction: async (tx: any) => {
          if (!signTransaction) throw new Error('Wallet does not support signTransaction')
          return signTransaction(tx)
        },
        signAllTransactions: async (txs: any[]) => {
          for (const tx of txs) {
            if (!signTransaction) throw new Error('Wallet does not support signTransaction')
            await signTransaction(tx)
          }
          return txs
        },
      }

      const program = getProgram(connection, anchorWallet)
      const poolPda = new PublicKey(entry.pool_pda)
      const entryPda = new PublicKey(entry.pda_address)
      const prizeVaultPda = getPrizeVaultPDA(poolPda)
      const userProfilePda = getUserProfilePDA(publicKey)
      const stakeAccountPda = getStakeAccountPDA(publicKey)
      const configPda = getGlobalConfigPDA()

      const ix = await program.methods
        .claimPrize(Array.from(linkHash))
        .accounts({
          pool: poolPda,
          prizeVault: prizeVaultPda,
          entry: entryPda,
          userProfile: userProfilePda,
          stakeAccount: stakeAccountPda,
          config: configPda,
          authority: publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        } as any)
        .instruction()

      const tx = new anchor.web3.Transaction().add(ix)
      const MAX_RETRIES = 3
      let txid: string | null = null

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const latestBlockhash = await connection.getLatestBlockhash({ commitment: 'processed' })
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = publicKey

        try {
          const signed = await signTransaction(tx)
          txid = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true })
        } catch (sendError: any) {
          const isBlockhash = sendError?.message?.includes?.('Blockhash')
          if (isBlockhash && attempt < MAX_RETRIES - 1) {
            console.log(`Blockhash expired on send attempt ${attempt + 1}, retrying...`)
            continue
          }
          throw sendError
        }

        try {
          await connection.confirmTransaction({
            signature: txid,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          }, 'confirmed')
          break
        } catch (confirmError: any) {
          const isBlockHeightExceeded = confirmError?.message?.includes?.('block height exceeded')
            || confirmError?.name === 'TransactionExpiredBlockheightExceededError'

          if (isBlockHeightExceeded && attempt < MAX_RETRIES - 1) {
            console.log(`Blockhash expired on confirm attempt ${attempt + 1}, retrying...`)
            continue
          }

          let txLanded = false
          for (let i = 0; i < 6; i++) {
            await new Promise(r => setTimeout(r, 2000))
            const txInfo = await connection.getTransaction(txid!, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
            if (txInfo) { txLanded = true; break }
          }
          if (!txLanded) throw confirmError
          break
        }
      }

      toast.success('Prize claimed successfully!', { id: 'claim_toast' })

      claimedLocally.current.add(entry.pda_address)
      setMyExpiredEntries(prev => prev.map(e =>
        e.pda_address === entry.pda_address ? { ...e, claimed: true } : e
      ))
    } catch (error: any) {
      console.error('Claim error:', error)
      const errMsg = error?.message || 'Unknown error'
      if (errMsg.includes('PoolNotDistributed') || errMsg.includes('6029')) {
        toast.error('Pool has not been distributed yet', { id: 'claim_toast' })
      } else if (errMsg.includes('ClaimAlreadyMade') || errMsg.includes('6028')) {
        toast.error('You already claimed this prize', { id: 'claim_toast' })
      } else if (errMsg.includes('UserBanned') || errMsg.includes('6001')) {
        toast.error('Your account has been banned', { id: 'claim_toast' })
      } else if (errMsg.includes('ParticipantInsufficientStake') || errMsg.includes('6023')) {
        toast.error('Insufficient stake to claim prize. You need at least 0.15 SOL staked.', { id: 'claim_toast' })
      } else {
        toast.error('Claim failed: ' + errMsg, { id: 'claim_toast' })
      }
    }
  }

  if (!walletAddress) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined mb-6 text-6xl text-primary">
            wallet
          </span>
          <h1 className="mb-4 font-headline text-3xl font-bold text-on-surface">
            Connect Your Wallet
          </h1>
          <p className="max-w-md text-on-surface-variant">
            Connect your Solana wallet to view your editor dashboard.
          </p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mb-12">
        <h1 className="mb-2 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
          Editor <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="max-w-lg text-on-surface-variant">
          Track your submissions and earn SOL rewards.
        </p>
      </div>

      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary">movie</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">My Submissions (Open)</span>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">{myOpenEntries.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-tertiary">emoji_events</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Claimable</span>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">{myExpiredEntries.filter(e => !e.claimed).length}</p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
            <span className="h-5 w-2 rounded-full bg-secondary"></span>
            My Submissions (Open)
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
              ))}
            </div>
          ) : myOpenEntries.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-center">
              <p className="text-sm text-on-surface-variant">You haven&apos;t submitted to any open pools yet.</p>
              <p className="mt-1 text-xs text-on-surface-variant">Browse the marketplace to find pools!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOpenEntries.map((entry) => (
                <div key={entry.pda_address} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">{(entry as any).pool_video_title || `#${entry.pool_pda.slice(0, 8)}...`}</span>
                    <span className="text-xs text-secondary font-bold">{entry.score.toLocaleString()} pts</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-on-surface-variant">
                    <span>{entry.views} views</span>
                    <span>{entry.likes} likes</span>
                    <span>{entry.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
            <span className="h-5 w-2 rounded-full bg-tertiary"></span>
            My Submissions (Expired)
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
              ))}
            </div>
          ) : myExpiredEntries.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-center">
              <p className="text-sm text-on-surface-variant">No expired pools yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myExpiredEntries.map((entry) => (
                <div key={entry.pda_address} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">{(entry as any).pool_video_title || `#${entry.pool_pda.slice(0, 8)}...`}</span>
                    <div className="flex items-center gap-2">
                      {entry.claimed ? (
                        <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs font-bold text-green-400">
                          Claimed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleClaim(entry)}
                          className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary-fixed hover:bg-primary/80"
                        >
                          Claim
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
                    <span>{entry.score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
