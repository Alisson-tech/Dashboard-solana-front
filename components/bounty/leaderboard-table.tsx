'use client'

import { useState, useEffect } from 'react'
import { formatNumber } from '@/lib/mock-data'
import { coreApi, Entry } from '@/lib/api'
import { toast } from 'sonner'

interface LeaderboardTableProps {
  poolPda?: string
  prizePool?: number
}

export function LeaderboardTable({
  poolPda,
  prizePool = 25.5,
}: LeaderboardTableProps) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEntries = async () => {
      if (!poolPda) return
      
      try {
        const data = await coreApi.getPoolEntries(poolPda)
        setEntries(data.items)
      } catch (error) {
        console.error('Error fetching entries:', error)
        // Silence toast here to avoid multiple toasts on detail page
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntries()
  }, [poolPda])

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-low">
      <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
        <div>
          <h2 className="font-headline text-2xl font-bold">Top 10 Clippers</h2>
          <p className="text-sm text-on-surface-variant">
            Sorted by{' '}
            <span className="font-medium text-primary">Engagement Score</span>
          </p>
        </div>
        <div className="text-right">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Total Prize Pool
          </span>
          <span className="font-headline text-2xl font-bold text-secondary">
            {prizePool} SOL
          </span>
        </div>
      </div>

      <div className="custom-scrollbar max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex py-20 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center text-on-surface-variant">
            No submissions yet. Be the first!
          </div>
        ) : (
          entries.map((entry, index) => {
            const isFirst = index === 0
            const isSecond = index === 1

            return (
              <div
                key={entry.pda_address}
                className={`group flex items-center gap-4 p-6 transition-colors hover:bg-surface-container-high ${index % 2 === 1 ? 'bg-surface-container-low' : ''}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center font-headline text-xl font-bold ${isFirst ? 'text-secondary' : 'text-on-surface-variant'}`}
                >
                  {index + 1}
                </div>

                <div
                  className={`h-12 w-12 overflow-hidden rounded-full border-2 p-0.5 ${
                    isFirst
                      ? 'border-secondary'
                      : isSecond
                        ? 'border-primary/40'
                        : 'border-outline-variant/30'
                  }`}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-high">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      person
                    </span>
                  </div>
                </div>

                <div className="flex-grow">
                  <h4 className="truncate font-bold text-on-surface">
                    {entry.user_wallet.slice(0, 6)}...{entry.user_wallet.slice(-4)}
                  </h4>
                  <div className="mt-1 flex items-center gap-3 text-[10px] font-bold uppercase text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-tertiary">
                        visibility
                      </span>
                      {formatNumber(entry.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-error">
                        favorite
                      </span>
                      {formatNumber(entry.likes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] text-secondary">
                        comment
                      </span>
                      {formatNumber(entry.comments)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-headline text-lg font-bold text-on-surface">
                    {entry.score.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase text-on-surface-variant">
                    Score
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Formula Reference */}
      <div className="mt-auto border-t border-outline-variant/10 bg-surface-container-high p-6">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <span>Scoring Formula</span>
          <span className="material-symbols-outlined text-sm">function</span>
        </div>
        <p className="mt-2 text-xs italic leading-relaxed text-on-surface-variant/80">
          (Views * Wv) + (Likes * Wl) + (Comments * Wc) x AI Multiplier
        </p>
      </div>
    </div>
  )
}
