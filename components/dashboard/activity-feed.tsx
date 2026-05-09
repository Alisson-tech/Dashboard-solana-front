'use client'

import { useState, useEffect } from 'react'
import { formatRelativeTime } from '@/lib/mock-data'
import { coreApi, Entry } from '@/lib/api'

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'submission':
      return { icon: 'upload', color: 'bg-secondary' }
    case 'claim':
      return { icon: 'payments', color: 'bg-primary' }
    default:
      return { icon: 'info', color: 'bg-outline' }
  }
}

export function ActivityFeed() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const data = await coreApi.getEntries({ limit: 8 })
        if (data.items.length > 0) {
          setEntries(data.items)
        } else {
          // Fallback to mock activity
          const mockEntries: Entry[] = [
            { pda_address: '1', pool_pda: 'Challenge #1', user_wallet: '0x123...abc', score: 1250, clip_link: '', views: 1000, likes: 200, comments: 50, claimed: false, channel_id: '' },
            { pda_address: '2', pool_pda: 'Challenge #2', user_wallet: '0x456...def', score: 850, clip_link: '', views: 500, likes: 100, comments: 20, claimed: false, channel_id: '' },
          ]
          setEntries(mockEntries)
        }
      } catch (error) {
        console.error('Error fetching activity:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-2 font-headline text-xl font-bold">
        <span className="h-6 w-2 rounded-full bg-primary"></span>
        Recent Activity
      </h2>

      <div className="space-y-6 rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-surface-container-highest"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 bg-surface-container-highest rounded"></div>
                <div className="h-2 w-1/2 bg-surface-container-highest rounded"></div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant text-sm">
            No recent activity.
          </div>
        ) : (
          entries.map((entry) => {
            const { icon, color } = getActivityIcon('submission')

            return (
              <div key={entry.pda_address} className="group flex gap-4">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-highest">
                    <span className="material-symbols-outlined text-primary">
                      {icon}
                    </span>
                  </div>
                  <div
                    className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface-container-low ${color}`}
                  >
                    <span
                      className="material-symbols-outlined text-[10px] text-on-primary-fixed"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {icon}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-snug text-on-surface">
                    <span className="font-bold text-primary">
                      {entry.user_wallet.slice(0, 6)}...
                    </span>{' '}
                    submitted a video to challenge{' '}
                    <span className="text-on-surface-variant">
                      #{entry.pool_pda.slice(0, 8)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Score: {entry.score.toLocaleString()}
                  </p>
                </div>
              </div>
            )
          })
        )}

        <button className="mt-4 w-full rounded-xl border border-outline-variant/20 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high">
          Load More Activity
        </button>
      </div>
    </div>
  )
}
