'use client'

import { useState, useEffect } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useWallet } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { getCreatorPools, PoolStatus } from '@/lib/solana'

interface HealthMetrics {
  totalPrizeLocked: number
  totalParticipants: number
  avgParticipants: number
  poolsCount: number
  closedPools: number
}

export function BountyHealth() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [metrics, setMetrics] = useState<HealthMetrics>({
    totalPrizeLocked: 0,
    totalParticipants: 0,
    avgParticipants: 0,
    poolsCount: 0,
    closedPools: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!connection || !publicKey) {
      setIsLoading(false)
      return
    }

    const fetchHealthMetrics = async () => {
      try {
        const pools = await getCreatorPools(connection, publicKey, { includeClosed: true })
        
        if (pools.length > 0) {
          const totalPrizeLocked = pools
            .filter(p => p.status === PoolStatus.Open)
            .reduce((acc, p) => acc + Number(p.prizeAmount), 0)
          
          const totalParticipants = pools.reduce((acc, p) => acc + p.participantCount, 0)
          
          const avgParticipants = pools.length > 0 
            ? Math.round(totalParticipants / pools.length)
            : 0
          
          const closedPools = pools.filter(p => p.status === PoolStatus.Closed || p.status === PoolStatus.Distributed).length
          
          setMetrics({
            totalPrizeLocked,
            totalParticipants,
            avgParticipants,
            poolsCount: pools.length,
            closedPools,
          })
        }
      } catch (error) {
        console.error('Error fetching health metrics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealthMetrics()
  }, [connection, publicKey])

  const escrowPercentage = metrics.poolsCount > 0 
    ? Math.round(((metrics.poolsCount - metrics.closedPools) / metrics.poolsCount) * 100)
    : 0

  return (
    <div className="mt-6 rounded-2xl bg-gradient-to-br from-surface-container-high to-surface p-1 shadow-xl">
      <div className="flex flex-col items-center gap-8 rounded-xl bg-surface p-8 md:flex-row">
        <div className="w-full md:w-1/3">
          <h3 className="mb-2 font-headline text-lg font-bold">Bounty Health</h3>
          <p className="mb-6 text-sm text-on-surface-variant">
            Aggregated funding status across all your challenges.
          </p>
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-on-surface-variant">Active Pools</span>
                <span className="font-bold text-secondary">{escrowPercentage}%</span>
              </div>
              <div className="bounty-pulse">
                <div className="bounty-pulse-fill" style={{ width: `${escrowPercentage}%` }}></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Total Prize
                </p>
                <p className="text-xl font-bold text-on-surface">
                  {isLoading ? '...' : (metrics.totalPrizeLocked / 1e9).toFixed(1)} SOL
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                  Avg. Subs/Pool
                </p>
                <p className="text-xl font-bold text-secondary">
                  {isLoading ? '...' : metrics.avgParticipants}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden h-40 w-px bg-outline-variant/10 md:block"></div>
        <div className="w-full flex-1">
          {metrics.poolsCount === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-outline-variant/10 bg-surface-container-low p-6 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-on-surface-variant">
                video_library
              </span>
              <p className="mb-4 text-sm text-on-surface-variant">
                No challenges created yet
              </p>
              <Link 
                href="/create"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary-fixed transition-colors hover:bg-primary/90"
              >
                Create Your First Challenge
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-surface-container-low p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{metrics.poolsCount}</p>
                <p className="text-xs text-on-surface-variant">Total Pools</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{metrics.totalParticipants}</p>
                <p className="text-xs text-on-surface-variant">Total Participants</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4 text-center">
                <p className="text-2xl font-bold text-secondary">{metrics.closedPools}</p>
                <p className="text-xs text-on-surface-variant">Completed</p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4 text-center">
                <p className="text-2xl font-bold text-on-surface">{metrics.poolsCount - metrics.closedPools}</p>
                <p className="text-xs text-on-surface-variant">Active</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}