import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ActiveBountiesTable } from '@/components/dashboard/active-bounties-table'
import { BountyHealth } from '@/components/dashboard/bounty-health'
import { ActivityFeed } from '@/components/dashboard/activity-feed'

export default function DashboardPage() {
  return (
    <MainLayout>
      {/* Header Section */}
      <header className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="mb-2 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Creator Hub
          </h1>
          <p className="max-w-lg text-on-surface-variant">
            Monitor your clip challenges, reward your community, and track
            ecosystem growth in real-time.
          </p>
        </div>
        <Link
          href="/create"
          className="gradient-solana flex items-center gap-3 rounded-xl px-8 py-4 font-bold text-on-primary-fixed shadow-[0_20px_40px_-10px_rgba(52,254,160,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Create New Bounty
        </Link>
      </header>

      {/* Metrics */}
      <StatsCards />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        {/* Left: Active Bounties Table (2/3 width) */}
        <div className="space-y-6 xl:col-span-2">
          <ActiveBountiesTable />
          <BountyHealth />
        </div>

        {/* Right: Recent Activity Feed (1/3 width) */}
        <div>
          <ActivityFeed />
        </div>
      </div>
    </MainLayout>
  )
}
