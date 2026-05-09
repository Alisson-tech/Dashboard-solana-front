'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection } from '@solana/wallet-adapter-react'
import { MainLayout } from '@/components/layout/main-layout'
import { formatTimeLeft, getCategoryColor } from '@/lib/mock-data'
import { coreApi, Pool } from '@/lib/api'
import { toast } from 'sonner'
import { getPools, PoolStatus } from '@/lib/solana'

export default function BountiesPage() {
  const [pools, setPools] = useState<Pool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { connection } = useConnection()

  useEffect(() => {
    const fetchPools = async () => {
      if (!connection) return

      try {
        const poolsFromChain = await getPools(connection)
        
        const mappedPools: Pool[] = poolsFromChain.map(p => {
          // Clean up the original video ID - remove null chars and trim
          const cleanVideoId = p.originalVideoId.replace(/\0/g, '').trim()
          return {
            pda_address: p.prizeVault.toBase58(),
            creator_wallet: p.creator.toBase58(),
            original_video_id: cleanVideoId || 'Unknown',
            prize_amount: p.prizeAmount,
            participant_count: p.participantCount,
            status: p.status === PoolStatus.Open ? 'OPEN' as const : p.status === PoolStatus.Distributed ? 'DISTRIBUTED' as const : 'CLOSED' as const,
            expiry_timestamp: new Date(p.expiryTimestamp * 1000).toISOString(),
            total_score: p.totalScore,
            scoring_rules: { views_weight: p.scoringRules.viewsWeight, likes_weight: p.scoringRules.likesWeight, comments_weight: p.scoringRules.commentsWeight },
          }
        })
        setPools(mappedPools)
      } catch (error) {
        console.error('Error fetching pools:', error)
        toast.error('Failed to load pools from blockchain')
        setPools([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [connection])

  return (
    <MainLayout showSidebar={true} showHeader={false}>
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Bounty{' '}
            <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="max-w-2xl text-on-surface-variant">
            Explore active bounties, join as an editor, and earn SOL
            based on your engagement.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              filter_list
            </span>
            <select className="bg-transparent text-sm text-on-surface outline-none">
              <option value="all">All Categories</option>
              <option value="gaming">Gaming</option>
              <option value="social">Social</option>
              <option value="entertainment">Entertainment</option>
              <option value="education">Education</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              sort
            </span>
            <select className="bg-transparent text-sm text-on-surface outline-none">
              <option value="prize">Highest Prize</option>
              <option value="deadline">Ending Soon</option>
              <option value="submissions">Most Submissions</option>
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search bounties..."
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
            />
          </div>
        </div>

        {/* Bounty Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`loading-${i}`} className="h-[400px] animate-pulse rounded-2xl bg-surface-container-low"></div>
            ))
          ) : pools.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-on-surface-variant text-lg">No active bounties found.</p>
            </div>
          ) : (
            pools.map((pool, index) => {
              // Create a unique key using index to avoid duplicates
              const uniqueKey = `${pool.pda_address}-${index}`
              const deadline = new Date(pool.expiry_timestamp)
              const timeLeft = formatTimeLeft(deadline)
              const isEndingSoon =
                deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000
              const prizePool = pool.prize_amount / 1e9

              return (
                <Link
                  key={uniqueKey}
                  href={`/bounties/${pool.pda_address}`}
                  className="group overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low transition-all hover:border-primary/30 hover:shadow-xl"
                >
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface/20">
                        movie
                      </span>
                    </div>
                    <div className="absolute left-4 top-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getCategoryColor('other')}`}
                      >
                        Community
                      </span>
                    </div>
                    <div className="absolute right-4 top-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${isEndingSoon ? 'bg-error/20 text-error' : 'bg-secondary/20 text-secondary'}`}
                      >
                        {isEndingSoon ? 'Ending Soon' : 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="mb-1 text-lg font-bold text-on-surface truncate">
                        Challenge #{pool.original_video_id}
                      </h3>
                      <span className="text-sm text-secondary">
                        by {pool.creator_wallet.slice(0, 4)}...{pool.creator_wallet.slice(-4)}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface truncate max-w-[150px]">
                          {pool.creator_wallet.slice(0, 4)}...{pool.creator_wallet.slice(-4)}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          Creator
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl bg-surface-container-high p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Prize Pool
                        </span>
                        <span className="font-headline text-2xl font-bold text-secondary">
                          {prizePool} SOL
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">
                          movie
                        </span>
                        {pool.participant_count} clips
                      </div>
                      <div
                        className={`flex items-center gap-1 ${isEndingSoon ? 'text-error' : 'text-on-surface-variant'}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        {timeLeft}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-primary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-primary">
              analytics
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              1.2M+
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Total Impressions
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-secondary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-secondary">
              groups
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              942
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
              94%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              AI Quality Avg
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-error/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-error">
              stadium
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {pools.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Active Bounties
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
