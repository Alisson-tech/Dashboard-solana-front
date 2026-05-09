'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatTimeLeft, getCategoryColor } from '@/lib/mock-data'
import { coreApi, Pool } from '@/lib/api'
import { toast } from 'sonner'

export function ActiveBountiesTable() {
  const [pools, setPools] = useState<Pool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const data = await coreApi.getPools({ limit: 5 })
        if (data.items.length > 0) {
          setPools(data.items)
        } else {
          // Fallback to mock data if API is empty
          const mockPools: Pool[] = [
            {
              pda_address: 'Pool1...abc',
              creator_wallet: 'Demo',
              original_video_id: 'v123',
              prize_amount: 5 * 1e9,
              participant_count: 12,
              status: 'OPEN',
              expiry_timestamp: new Date(Date.now() + 86400000).toISOString(),
              total_score: 0,
              scoring_rules: { views_weight: 50, likes_weight: 30, comments_weight: 20 }
            },
            {
              pda_address: 'Pool2...def',
              creator_wallet: 'Demo',
              original_video_id: 'v456',
              prize_amount: 2.5 * 1e9,
              participant_count: 8,
              status: 'OPEN',
              expiry_timestamp: new Date(Date.now() + 172800000).toISOString(),
              total_score: 0,
              scoring_rules: { views_weight: 50, likes_weight: 30, comments_weight: 20 }
            }
          ]
          setPools(mockPools)
        }
      } catch (error) {
        console.error('Error fetching pools for dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-headline text-xl font-bold">
          <span className="h-6 w-2 rounded-full bg-secondary"></span>
          Recent Challenges
        </h2>
        <Link
          href="/bounties"
          className="flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-secondary"
        >
          View All{' '}
          <span className="material-symbols-outlined text-xs">
            arrow_forward
          </span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-surface-container-low">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Challenge
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Prize Pool
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Time Left
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Subs
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8 h-10 bg-surface-container-high/20"></td>
                  </tr>
                ))
              ) : pools.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                    No active challenges found.
                  </td>
                </tr>
              ) : (
                pools.map((pool) => {
                  const deadline = new Date(pool.expiry_timestamp)
                  const timeLeft = formatTimeLeft(deadline)
                  const isEndingSoon =
                    deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000

                  return (
                    <tr
                      key={pool.pda_address}
                      className="transition-colors hover:bg-surface-container-high/50"
                    >
                      <td className="px-6 py-5">
                        <Link href={`/bounties/${pool.pda_address}`}>
                          <p className="mb-1 font-bold text-on-surface hover:text-secondary">
                            Challenge #{pool.pda_address.slice(0, 8)}
                          </p>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter bg-primary/10 text-primary`}
                          >
                            {pool.original_video_id}
                          </span>
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-on-surface">
                            {(pool.prize_amount / 1e9).toFixed(1)}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            SOL
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div
                          className={`text-sm font-medium ${isEndingSoon ? 'text-error' : 'text-on-surface'}`}
                        >
                          {timeLeft}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm text-on-surface">
                          {pool.participant_count}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link href={`/bounties/${pool.pda_address}`} className="rounded-lg p-2 transition-colors hover:bg-surface-bright inline-block">
                          <span className="material-symbols-outlined text-on-surface-variant">
                            chevron_right
                          </span>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
