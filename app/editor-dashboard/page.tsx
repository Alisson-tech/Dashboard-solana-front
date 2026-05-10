'use client'

import { useState, useEffect } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { MainLayout } from '@/components/layout/main-layout'
import { Pool, Entry } from '@/lib/api'
import { getPools, getPoolEntries } from '@/lib/solana'
import { toast } from 'sonner'

export default function EditorDashboardPage() {
  const { publicKey } = useWallet()
  const { connection } = useConnection()
  const walletAddress = publicKey?.toBase58()

  const [myOpenEntries, setMyOpenEntries] = useState<Entry[]>([])
  const [myClosedEntries, setMyClosedEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!connection || !walletAddress) {
        setIsLoading(false)
        return
      }

      try {
        // Buscar todas as pools
        const openPools = await getPools(connection)
        
        // Para cada pool, buscar participantes do usuário
        const participatingOpen: Entry[] = []
        const participatingClosed: Entry[] = []

        for (const pool of openPools) {
          const entriesFromChain = await getPoolEntries(connection, pool.pda_address.toString())
          const myEntries = entriesFromChain.filter(e => e.user.toBase58() === walletAddress)

          for (const entry of myEntries) {
            // Se a pool ainda está aberta, adiciona em Open
            // Se fechou (expired), adiciona em Closed
            const isPoolExpired = pool.expiryTimestamp > 0 && pool.expiryTimestamp <= Math.floor(Date.now() / 1000)
            
            if (isPoolExpired) {
              participatingClosed.push({
                pda_address: entry.pool.toBase58(),
                pool_pda: entry.pool.toBase58(),
                user_wallet: entry.user.toBase58(),
                channel_id: entry.channelId,
                clip_link: entry.clipLink,
                views: entry.views,
                likes: entry.likes,
                comments: entry.comments,
                score: entry.score,
                claimed: entry.claimed,
              })
            } else {
              participatingOpen.push({
                pda_address: entry.pool.toBase58(),
                pool_pda: entry.pool.toBase58(),
                user_wallet: entry.user.toBase58(),
                channel_id: entry.channelId,
                clip_link: entry.clipLink,
                views: entry.views,
                likes: entry.likes,
                comments: entry.comments,
                score: entry.score,
                claimed: entry.claimed,
              })
            }
          }
        }

        setMyOpenEntries(participatingOpen)
        setMyClosedEntries(participatingClosed)
      } catch (err) {
        console.error('Failed to load editor data', err)
        toast.error('Failed to load data from blockchain')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [walletAddress, connection, publicKey])

  const handleClaim = async (entry: Entry) => {
    toast.info('Claim functionality coming soon!')
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
      {/* Header */}
      <div className="mb-12">
        <h1 className="mb-2 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
          Editor <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="max-w-lg text-on-surface-variant">
          Track your submissions and earn SOL rewards.
        </p>
      </div>

      {/* Stats */}
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
          <p className="font-headline text-3xl font-bold text-on-surface">{myClosedEntries.filter(e => !e.claimed).length}</p>
        </div>
      </div>

      {/* My Submissions */}
      <div className="space-y-8">
        {/* My Open Submissions */}
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
              <p className="text-sm text-on-surface-variant">You haven't submitted to any open pools yet.</p>
              <p className="mt-1 text-xs text-on-surface-variant">Browse the marketplace to find pools!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOpenEntries.map((entry) => (
                <div key={entry.pda_address + entry.clip_link} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">#{entry.pool_pda.slice(0, 8)}...</span>
                    <span className="text-xs text-secondary font-bold">{entry.score} pts</span>
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

        {/* My Closed Submissions (Claimable) */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-headline text-xl font-bold text-on-surface">
            <span className="h-5 w-2 rounded-full bg-tertiary"></span>
            My Submissions (Closed)
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-low" />
              ))}
            </div>
          ) : myClosedEntries.length === 0 ? (
            <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-center">
              <p className="text-sm text-on-surface-variant">No closed pools yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myClosedEntries.map((entry) => (
                <div key={entry.pda_address + entry.clip_link} className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">#{entry.pool_pda.slice(0, 8)}...</span>
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