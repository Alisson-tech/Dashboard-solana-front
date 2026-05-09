'use client'

import { useState, useEffect } from 'react'
import { mockDashboardStats } from '@/lib/mock-data'
import { coreApi } from '@/lib/api'

export function StatsCards() {
  const [stats, setStats] = useState(mockDashboardStats)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const poolsData = await coreApi.getPools({ limit: 100 })
        if (poolsData.items.length > 0) {
          const totalSol = poolsData.items.reduce((acc, pool) => acc + (pool.prize_amount / 1e9), 0)
          const active = poolsData.items.filter(p => p.status === 'OPEN').length
          const totalSubs = poolsData.items.reduce((acc, pool) => acc + pool.participant_count, 0)
          
          setStats({
            ...mockDashboardStats,
            totalSolLocked: totalSol,
            activeChallenges: active,
            totalSubmissions: totalSubs,
          })
          setIsLive(true)
        }
      } catch (error) {
        console.error('Error fetching real stats:', error)
      }
    }

    fetchRealStats()
  }, [])

  return (
    <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      {/* Metric 1 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Total $SOL Locked
          </p>
          {isLive && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {stats.totalSolLocked.toLocaleString('en-US', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="mb-1 font-bold text-secondary">SOL</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>+{stats.solChange}% this month</span>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-secondary/5 blur-3xl transition-colors group-hover:bg-secondary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Active Challenges
          </p>
          {isLive && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {stats.activeChallenges}
          </span>
          <span className="mb-1 font-medium text-on-surface-variant">LIVE</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-primary">
          <span className="material-symbols-outlined text-sm">bolt</span>
          <span>{stats.endingSoonCount} ending soon</span>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="group relative overflow-hidden rounded-2xl bg-surface-container-low p-8">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-tertiary/5 blur-3xl transition-colors group-hover:bg-tertiary/10"></div>
        <div className="flex items-center justify-between mb-4">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Total Submissions
          </p>
          {isLive && <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" title="Live Data"></span>}
        </div>
        <div className="flex items-end gap-2">
          <span className="font-headline text-4xl font-bold text-on-surface">
            {stats.totalSubmissions.toLocaleString()}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            stars
          </span>
          <span>{stats.uniqueClippers} unique clippers</span>
        </div>
      </div>
    </div>
  )
}

