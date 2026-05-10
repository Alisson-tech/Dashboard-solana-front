'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { getCreatorEntries, ParticipantEntryData } from '@/lib/solana'
import { coreApi } from '@/lib/api'

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') || u.pathname.split('/').pop() || null
  } catch {
    return null
  }
}

export function ActivityFeed() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [entries, setEntries] = useState<ParticipantEntryData[]>([])
  const [poolNames, setPoolNames] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!connection || !publicKey) {
      setIsLoading(false)
      return
    }

    const fetchRecentActivity = async () => {
      try {
        const creatorEntries = await getCreatorEntries(connection, publicKey)
        const recent = creatorEntries.slice(0, 8)
        setEntries(recent)

        // Fetch bounty names for the pools that appear in entries
        const uniquePdas = [...new Set(recent.map(e => e.pool.toString()))]
        if (uniquePdas.length > 0) {
          const meta = await coreApi.getBatchPoolMetadata(uniquePdas)
          const names: Record<string, string> = {}
          for (const pda of uniquePdas) {
            const m = meta[pda]
            names[pda] = m?.name || m?.video_title || `Bounty #${pda.slice(0, 8)}`
          }
          setPoolNames(names)
        }
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

      <div className="space-y-4 rounded-2xl border border-outline-variant/5 bg-surface-container-low p-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-surface-container-highest"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-surface-container-highest"></div>
                <div className="h-2 w-1/2 rounded bg-surface-container-highest"></div>
              </div>
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="py-10 text-center text-sm text-on-surface-variant">
            No recent submissions to your challenges.
          </div>
        ) : (
          entries.map((entry) => {
            const pdaStr = entry.pool.toString()
            const userWallet = entry.user.toString()
            const bountyName = poolNames[pdaStr] || `Bounty #${pdaStr.slice(0, 8)}`
            const clipYtId = extractYoutubeId(entry.clipLink)

            return (
              <div
                key={userWallet + pdaStr}
                className="flex gap-3 rounded-xl border border-outline-variant/5 bg-surface-container-high p-3"
              >
                {/* Clip thumbnail or fallback icon */}
                <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-highest">
                  {clipYtId ? (
                    <img
                      src={`https://img.youtube.com/vi/${clipYtId}/default.jpg`}
                      alt="clip thumbnail"
                      className="h-full w-full object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">
                      play_circle
                    </span>
                  </div>
                  {entry.claimed && (
                    <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5">
                      <span className="material-symbols-outlined text-[10px] text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                        check
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-on-surface">
                    <span className="text-secondary">
                      {userWallet.slice(0, 4)}...{userWallet.slice(-4)}
                    </span>
                    {' '}submitted a clip
                  </p>
                  <Link
                    href={`/bounties/${pdaStr}`}
                    className="mt-0.5 block truncate text-[11px] text-on-surface-variant hover:text-primary"
                  >
                    {bountyName}
                  </Link>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      Score: {Number(entry.score).toLocaleString()}
                    </span>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      entry.claimed
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    }`}>
                      {entry.claimed ? 'Claimed' : 'Pending'}
                    </span>
                    {entry.clipLink && (
                      <a
                        href={entry.clipLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-[10px] text-on-surface-variant hover:text-primary"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}