'use client'

import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getCreatorEntries, ParticipantEntryData } from '@/lib/solana'

const getActivityIcon = (claimed: boolean) => {
  if (claimed) {
    return { icon: 'check_circle', color: 'bg-primary' }
  }
  return { icon: 'upload', color: 'bg-secondary' }
}

export function ActivityFeed() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [entries, setEntries] = useState<ParticipantEntryData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!connection || !publicKey) {
      setIsLoading(false)
      return
    }

    const fetchRecentActivity = async () => {
      try {
        const creatorEntries = await getCreatorEntries(connection, publicKey)
        setEntries(creatorEntries.slice(0, 8))
      } catch (error) {
        console.error('Error fetching activity:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentActivity()
  }, [connection, publicKey])

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
            No recent submissions to your challenges.
          </div>
        ) : (
          entries.map((entry) => {
            const { icon, color } = getActivityIcon(entry.claimed)
            const userWallet = entry.user.toString()

            return (
              <div key={entry.user.toString() + entry.pool.toString()} className="group flex gap-4">
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
                      {userWallet.slice(0, 6)}...
                    </span>{' '}
                    submitted a video to challenge{' '}
                    <span className="text-on-surface-variant">
                      #{entry.pool.toString().slice(0, 8)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    Score: {Number(entry.score).toLocaleString()} • {entry.claimed ? 'Prize claimed' : 'Pending'}
                  </p>
                </div>
              </div>
            )
          })
        )}

        {entries.length > 0 && (
          <button className="mt-4 w-full rounded-xl border border-outline-variant/20 py-3 text-sm font-bold text-on-surface-variant transition-colors hover:bg-surface-container-high">
            Load More Activity
          </button>
        )}
      </div>
    </div>
  )
}