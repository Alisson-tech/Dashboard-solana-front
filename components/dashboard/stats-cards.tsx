'use client'

import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { getCreatorPools, type VideoPoolData } from '@/lib/solana'
import { PoolStatus } from '@/lib/solana'

interface Stats {
  totalSolLocked: number
  activeChallenges: number
  totalSubmissions: number
  uniqueClippers: number
  endingSoonCount: number
}

const defaultStats: Stats = {
  totalSolLocked: 0,
  activeChallenges: 0,
  totalSubmissions: 0,
  uniqueClippers: 0,
  endingSoonCount: 0,
}

export function StatsCards() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [stats, setStats] = useState<Stats>(defaultStats)
  const [isLoading, setIsLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    if (!connection || !publicKey) {
      setIsLoading(false)
      return
    }

    const fetchCreatorStats = async () => {
      try {
        const pools = await getCreatorPools(connection, publicKey)
        
        if (pools.length > 0) {
          const now = Math.floor(Date.now() / 1000)
          
          const totalSol = pools.reduce((acc, pool) => acc + Number(pool.prizeAmount) / 1e9, 0)
          const activePools = pools.filter(p => p.status === PoolStatus.Open)
          const active = activePools.length
          const totalSubs = pools.reduce((acc, pool) => acc + pool.participantCount, 0)
          
          const endingSoon = activePools.filter(p => {
            return p.expiryTimestamp > now && p.expiryTimestamp - now < 3 * 24 * 60 * 60
          }).length

          setStats({
            totalSolLocked: totalSol,
            activeChallenges: active,
            totalSubmissions: totalSubs,
            uniqueClippers: 0,
            endingSoonCount: endingSoon,
          })
          setIsLive(true)
        }
      } catch (error) {
        console.error('Error fetching creator stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreatorStats()
  }, [connection, publicKey])

  return (
    <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Metric 1 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Total $SOL Locked
          </p>
          {isLive && !isLoading && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {isLoading ? '...' : stats.totalSolLocked.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="mb-1 font-bold text-secondary">SOL</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>On-chain data</span>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-secondary/5 blur-3xl transition-colors group-hover:bg-secondary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Active Challenges
          </p>
          {isLive && !isLoading && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {isLoading ? '...' : stats.activeChallenges}
          </span>
          <span className="mb-1 font-medium text-on-surface-variant">LIVE</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-primary">
          <span className="material-symbols-outlined text-sm">bolt</span>
          <span>{isLoading ? '...' : stats.endingSoonCount} ending soon</span>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-tertiary/5 blur-3xl transition-colors group-hover:bg-tertiary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Total Submissions
          </p>
          {isLive && !isLoading && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {isLoading ? '...' : stats.totalSubmissions.toLocaleString()}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stars
          </span>
          <span>Across all your challenges</span>
        </div>
      </div>
    </div>
  )
}