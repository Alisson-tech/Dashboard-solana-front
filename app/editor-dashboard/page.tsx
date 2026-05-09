'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { MainLayout } from '@/components/layout/main-layout'
import { coreApi, Pool, Entry } from '@/lib/api'
import { formatTimeLeft } from '@/lib/mock-data'

export default function EditorDashboardPage() {
  const { publicKey } = useWallet()
  const walletAddress = publicKey?.toBase58()

  const [openPools, setOpenPools] = useState<Pool[]>([])
  const [myEntries, setMyEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [poolsData] = await Promise.all([
          coreApi.getPools({ status: 'OPEN' }),
          ...(walletAddress ? [coreApi.getEntries({ user_wallet: walletAddress })] : []),
        ])

        if (poolsData.items.length > 0) {
          setOpenPools(poolsData.items)
        } else {
          const { mockBounties } = await import('@/lib/mock-data')
          setOpenPools(mockBounties.map(b => ({
            pda_address: b.id,
            creator_wallet: 'DemoOwner',
            original_video_id: b.hashtag,
            prize_amount: b.prizePool * 1e9,
            participant_count: b.totalClips,
            status: 'OPEN' as const,
            expiry_timestamp: b.deadline.toISOString(),
            total_score: 0,
            scoring_rules: { views_weight: 50, likes_weight: 30, comments_weight: 20 },
          })))
        }
      } catch (err) {
        console.error('Failed to load editor data', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [walletAddress])

  const myPoolPdas = new Set(myEntries.map(e => e.pool_pda))

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-12">
        <h1 className="mb-2 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
          Editor <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="max-w-lg text-on-surface-variant">
          Browse open pools, track your submissions, and earn SOL rewards.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-primary">payments</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Open Pools</span>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">{openPools.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-secondary">movie</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">My Submissions</span>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">{myEntries.length}</p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-tertiary">emoji_events</span>
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Participating</span>
          </div>
          <p className="font-headline text-3xl font-bold text-on-surface">{myPoolPdas.size}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 xl:grid-cols-5">
        {/* Open Pools */}
        <div className="space-y-6 xl:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-headline text-2xl font-bold text-on-surface">
              <span className="h-6 w-2 rounded-full bg-primary"></span>
              Open Pools
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-container-low" />
              ))}
            </div>
          ) : openPools.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">search</span>
              <p className="text-on-surface-variant">No open pools available right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {openPools.map((pool) => {
                const deadline = new Date(pool.expiry_timestamp)
                const timeLeft = formatTimeLeft(deadline)
                const prizePool = pool.prize_amount / 1e9
                const joined = myPoolPdas.has(pool.pda_address)

                return (
                  <Link
                    key={pool.pda_address}
                    href={`/bounties/${pool.pda_address}`}
                    className="group flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all hover:border-primary/30 hover:shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high">
                        <span className="material-symbols-outlined text-on-surface-variant">movie</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface group-hover:text-primary transition-colors">
                          Challenge #{pool.pda_address.slice(0, 8)}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          by {pool.creator_wallet.slice(0, 4)}...{pool.creator_wallet.slice(-4)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {joined && (
                        <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary">
                          Participating
                        </span>
                      )}
                      <div className="text-right">
                        <p className="font-headline text-lg font-bold text-secondary">
                          {prizePool} SOL
                        </p>
                        <p className="text-xs text-on-surface-variant">{pool.participant_count} clips</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-on-surface-variant">Time left</p>
                        <p className={`text-sm font-bold ${deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 ? 'text-error' : 'text-on-surface'}`}>
                          {timeLeft}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* My Participation */}
        <div className="xl:col-span-2">
          <h2 className="mb-6 flex items-center gap-2 font-headline text-2xl font-bold text-on-surface">
            <span className="h-6 w-2 rounded-full bg-secondary"></span>
            My Participation
          </h2>

          {myEntries.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-3">note_add</span>
              <p className="text-sm text-on-surface-variant mb-2">No submissions yet</p>
              <p className="text-xs text-on-surface-variant/60">
                Join an open pool and submit your first clip!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myEntries.map((entry) => (
                <div
                  key={entry.pda_address}
                  className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">Pool</p>
                      <p className="font-mono text-xs text-on-surface">
                        {entry.pool_pda.slice(0, 8)}...{entry.pool_pda.slice(-4)}
                      </p>
                    </div>
                    {entry.claimed ? (
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">Claimed</span>
                    ) : (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${entry.score > 0 ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {entry.score > 0 ? 'Scored' : 'Pending'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Score</span>
                    <span className="font-bold text-on-surface">{entry.score.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-on-surface-variant">Views / Likes / Comments</span>
                    <span className="text-on-surface">{entry.views}/{entry.likes}/{entry.comments}</span>
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
