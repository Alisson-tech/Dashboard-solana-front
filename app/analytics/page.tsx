'use client'

import { MainLayout } from '@/components/layout/main-layout'

const weeklyData = [
  { day: 'Mon', views: 45000, engagement: 3200 },
  { day: 'Tue', views: 52000, engagement: 4100 },
  { day: 'Wed', views: 49000, engagement: 3800 },
  { day: 'Thu', views: 63000, engagement: 5200 },
  { day: 'Fri', views: 78000, engagement: 6400 },
  { day: 'Sat', views: 92000, engagement: 7800 },
  { day: 'Sun', views: 85000, engagement: 7100 },
]

const topPlatforms = [
  { name: 'TikTok', value: 58, color: 'bg-secondary' },
  { name: 'Instagram', value: 28, color: 'bg-primary' },
  { name: 'YouTube', value: 14, color: 'bg-tertiary' },
]

const recentClips = [
  { id: 1, title: 'Epic Solana Tutorial Clip', views: 125000, engagement: 8.2, platform: 'TikTok' },
  { id: 2, title: 'DeFi Explained in 60s', views: 89000, engagement: 7.5, platform: 'Instagram' },
  { id: 3, title: 'NFT Drop Highlight', views: 67000, engagement: 6.8, platform: 'TikTok' },
  { id: 4, title: 'Web3 Gaming Moments', views: 54000, engagement: 5.9, platform: 'YouTube' },
]

export default function AnalyticsPage() {
  const maxViews = Math.max(...weeklyData.map(d => d.views))

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
              Analytics
            </h1>
            <p className="text-on-surface-variant">
              Track your bounty performance and engagement metrics
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              Last 7 Days
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high">
              Last 30 Days
            </button>
            <button className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-high">
              All Time
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary">visibility</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">464K</p>
                <p className="text-xs text-on-surface-variant">Total Views</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12.5% vs last week
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <span className="material-symbols-outlined text-secondary">favorite</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">37.6K</p>
                <p className="text-xs text-on-surface-variant">Engagements</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +8.3% vs last week
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary">movie</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">142</p>
                <p className="text-xs text-on-surface-variant">Total Clips</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +23 this week
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error/10">
                <span className="material-symbols-outlined text-error">paid</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-on-surface">32.5 SOL</p>
                <p className="text-xs text-on-surface-variant">Total Distributed</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-on-surface-variant">
              Across 8 bounties
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Weekly Chart */}
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 lg:col-span-2">
            <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">
              Weekly Performance
            </h3>
            <div className="flex h-64 items-end gap-4">
              {weeklyData.map((day) => (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                  <div className="relative w-full">
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary/80 to-primary transition-all hover:from-primary hover:to-primary"
                      style={{ height: `${(day.views / maxViews) * 200}px` }}
                    />
                    <div
                      className="absolute bottom-0 w-full rounded-t-lg bg-secondary/60"
                      style={{ height: `${(day.engagement / maxViews) * 200}px` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-on-surface-variant">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-xs text-on-surface-variant">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-secondary" />
                <span className="text-xs text-on-surface-variant">Engagement</span>
              </div>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">
              Platform Distribution
            </h3>
            <div className="space-y-4">
              {topPlatforms.map((platform) => (
                <div key={platform.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-on-surface">{platform.name}</span>
                    <span className="text-sm font-bold text-on-surface-variant">{platform.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className={`h-full rounded-full ${platform.color} transition-all`}
                      style={{ width: `${platform.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-xl bg-surface-container-high p-4">
              <p className="text-xs font-medium text-on-surface-variant">Top Performing Platform</p>
              <p className="mt-1 font-headline text-xl font-bold text-secondary">TikTok</p>
              <p className="text-xs text-on-surface-variant">269K views this week</p>
            </div>
          </div>
        </div>

        {/* Top Clips Table */}
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <h3 className="mb-6 font-headline text-lg font-semibold text-on-surface">
            Top Performing Clips
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/10">
                  <th className="pb-4 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Clip
                  </th>
                  <th className="pb-4 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Platform
                  </th>
                  <th className="pb-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Views
                  </th>
                  <th className="pb-4 text-right text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Engagement
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentClips.map((clip, index) => (
                  <tr key={clip.id} className="border-b border-outline-variant/5">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high font-bold text-on-surface-variant">
                          {index + 1}
                        </span>
                        <span className="font-medium text-on-surface">{clip.title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-medium text-on-surface-variant">
                        {clip.platform}
                      </span>
                    </td>
                    <td className="py-4 text-right font-medium text-on-surface">
                      {(clip.views / 1000).toFixed(0)}K
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-bold text-secondary">{clip.engagement}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
