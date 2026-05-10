'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getPools, getCreatorPools, VideoPoolData, PoolStatus } from '@/lib/solana'
import { coreApi } from '@/lib/api'

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
  const [metadataMap, setMetadataMap] = useState<Record<string, {name: string | null, hashtag: string | null, video_title: string | null}>>({})

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!connection || !publicKey) {
      setIsLoading(false)
      return
    }

    const fetchCreatorPools = async () => {
      try {
        const _pools = await getPools(connection, { includeClosed: true })
        const creatorPools = _pools.filter(pool => pool.creator.equals(publicKey))
        setAllPools(creatorPools)

        if (creatorPools.length === 0) return

        const pdas = creatorPools.map(p => p.pda_address.toBase58())
        try {
          const meta = await coreApi.getBatchPoolMetadata(pdas)
          setMetadataMap(meta)

          // Enrich DB in background for pools that don't have a video_title yet
          const needsEnrich = creatorPools
            .map(p => ({
              pda: p.pda_address.toBase58(),
              video_id: p.originalVideoId.replace(/\0/g, '').trim(),
            }))
            .filter(item => {
              return item.video_id && !meta[item.pda]?.video_title
            })
          if (needsEnrich.length > 0) {
            coreApi.batchEnrichTitles(needsEnrich).catch(e =>
              console.error('Background title enrichment failed', e)
            )
          }
        } catch (e) {
          console.error('Failed to fetch metadata', e)
        }
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
            These videos already have pools created. Use a different video to create a new bounty.
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

      {/* Section: Active Bountys */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-headline text-xl font-bold">
            <span className="h-6 w-2 rounded-full bg-secondary"></span>
            Active Bountys ({activePools.length})
          </h2>
        </div>

        <div className="overflow-hidden rounded-2xl bg-surface-container-low">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    Bounty
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
                      No active bountys found. Create your first bounty!
                    </td>
                  </tr>
                ) : (
                  activePools.map((pool) => {
                    const timeLeft = formatTimeLeft(pool.expiryTimestamp)
                    const now = Math.floor(Date.now() / 1000)
                    const isEndingSoon = pool.expiryTimestamp > now && pool.expiryTimestamp - now < 3 * 24 * 60 * 60
                    const pdaStr = pool.pda_address.toString()
                    const cleanVideoId = pool.originalVideoId.replace(/\0/g, '').trim()
                    const displayName =
                      metadataMap[pdaStr]?.name ||
                      metadataMap[pdaStr]?.video_title ||
                      `Bounty #${pdaStr.slice(0, 8)}`
                    const displayHashtag =
                      metadataMap[pdaStr]?.hashtag ||
                      (cleanVideoId ? `#${cleanVideoId.slice(0, 8)}` : null)

                    return (
                      <tr
                        key={pdaStr}
                        className="transition-colors hover:bg-surface-container-high/50"
                      >
                        <td className="px-6 py-5">
                          <Link href={`/bounties/${pdaStr}`}>
                            <p className="mb-1 font-bold text-on-surface hover:text-secondary">
                              {displayName}
                            </p>
                            {displayHashtag && (
                              <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter bg-primary/10 text-primary">
                                {displayHashtag}
                              </span>
                            )}
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
                          <Link href={`/bounties/${pdaStr}`} className="rounded-lg p-2 transition-colors hover:bg-surface-bright inline-block">
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