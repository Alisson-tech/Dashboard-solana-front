'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getPools, getCreatorPools, VideoPoolData, PoolStatus } from '@/lib/solana'

function formatTimeLeft(expiryTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = expiryTimestamp - now

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / (24 * 60 * 60))
  const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60))

  if (days > 0) return `${days}d ${hours}h`
  const minutes = Math.floor((diff % (60 * 60)) / 60)
  return `${hours}h ${minutes}m`
}

export function ActiveBountiesTable() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [allPools, setAllPools] = useState<VideoPoolData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!connection || !publicKey) {
      console.log('No connection or publicKey:', { connection: !!connection, publicKey: !!publicKey })
      setIsLoading(false)
      return
    }

    console.log('Fetching pools for wallet:', publicKey.toString())

    const fetchCreatorPools = async () => {
      try {
        const allPools = await getPools(connection, { includeClosed: true })
        console.log('Total pools found:', allPools.length)
        
        const creatorPools = allPools.filter(pool => {
          const isCreator = pool.creator.equals(publicKey)
          console.log('Pool creator:', pool.creator.toString(), 'Is match:', isCreator)
          return isCreator
        })
        
        console.log('Creator pools:', creatorPools.length)
        creatorPools.forEach(p => console.log('  -', p.originalVideoId, p.pda_address.toString()))
        
        setAllPools(creatorPools)
      } catch (error) {
        console.error('Error fetching creator pools:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreatorPools()
  }, [connection, publicKey])

  // Filter active pools (Open status)
  const activePools = allPools
    .filter(p => p.status === PoolStatus.Open)
    .sort((a, b) => b.expiryTimestamp - a.expiryTimestamp)

  // Get unique video IDs used by this creator
  const usedVideoIds = [...new Set(allPools.map(p => p.originalVideoId))]

  return (
    <div className="space-y-8">
      {/* Section: Videos Already Used */}
      {usedVideoIds.length > 0 && (
        <div className="rounded-2xl bg-surface-container-low p-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline text-lg font-bold">
            <span className="material-symbols-outlined text-error">block</span>
            Videos Already Used
          </h3>
          <p className="mb-4 text-sm text-on-surface-variant">
            These videos already have pools created. Use a different video to create a new challenge.
          </p>
          <div className="flex flex-wrap gap-2">
            {usedVideoIds.map((videoId) => (
              <a
                key={videoId}
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-sm text-error hover:bg-error/20"
              >
                <span className="material-symbols-outlined text-xs">videocam</span>
                {videoId}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Section: Active Challenges */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-headline text-xl font-bold">
            <span className="h-6 w-2 rounded-full bg-secondary"></span>
            Active Challenges ({activePools.length})
          </h2>
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
                ) : activePools.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-on-surface-variant">
                      No active challenges found. Create your first challenge!
                    </td>
                  </tr>
                ) : (
                  activePools.map((pool) => {
                    const timeLeft = formatTimeLeft(pool.expiryTimestamp)
                    const now = Math.floor(Date.now() / 1000)
                    const isEndingSoon = pool.expiryTimestamp > now && pool.expiryTimestamp - now < 3 * 24 * 60 * 60

                    return (
                      <tr
                        key={pool.pda_address.toString()}
                        className="transition-colors hover:bg-surface-container-high/50"
                      >
                        <td className="px-6 py-5">
                          <Link href={`/bounties/${pool.pda_address.toString()}`}>
                            <p className="mb-1 font-bold text-on-surface hover:text-secondary">
                              Challenge #{pool.pda_address.toString().slice(0, 8)}
                            </p>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter bg-primary/10 text-primary`}
                            >
                              {pool.originalVideoId}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface">
                              {(Number(pool.prizeAmount) / 1e9).toFixed(1)}
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
                            {pool.participantCount}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link href={`/bounties/${pool.pda_address.toString()}`} className="rounded-lg p-2 transition-colors hover:bg-surface-bright inline-block">
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
    </div>
  )
}