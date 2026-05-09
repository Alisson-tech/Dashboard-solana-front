'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useConnection } from '@solana/wallet-adapter-react'
import { MainLayout } from '@/components/layout/main-layout'
import { formatTimeLeft, getCategoryColor } from '@/lib/mock-data'
import { coreApi, Pool } from '@/lib/api'
import { toast } from 'sonner'
import { getPools, PoolStatus } from '@/lib/solana'

export default function BountiesPage() {
  const [pools, setPools] = useState<Pool[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('open')
  const [filterDate, setFilterDate] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<string>('newest')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const { connection } = useConnection()
  
  const itemsPerPage = 9

  useEffect(() => {
    const fetchPools = async () => {
      if (!connection) return

      try {
        const poolsFromChain = await getPools(connection)
        
        const mappedPools: Pool[] = poolsFromChain.map(p => {
          // Clean up the original video ID - remove null chars and trim
          const cleanVideoId = p.originalVideoId.replace(/\0/g, '').trim()
          return {
            pda_address: p.prizeVault.toBase58(),
            creator_wallet: p.creator.toBase58(),
            original_video_id: cleanVideoId || 'Unknown',
            prize_amount: p.prizeAmount,
            participant_count: p.participantCount,
            status: p.status === PoolStatus.Open ? 'OPEN' as const : p.status === PoolStatus.Distributed ? 'DISTRIBUTED' as const : 'CLOSED' as const,
            expiry_timestamp: new Date(p.expiryTimestamp * 1000).toISOString(),
            total_score: p.totalScore,
            scoring_rules: { views_weight: p.scoringRules.viewsWeight, likes_weight: p.scoringRules.likesWeight, comments_weight: p.scoringRules.commentsWeight },
          }
        })
        setPools(mappedPools)
      } catch (error) {
        console.error('Error fetching pools:', error)
        toast.error('Failed to load pools from blockchain')
        setPools([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPools()
  }, [connection])

  // Compute filtered & paginated pools
  const filteredPools = pools.filter(pool => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'open') return pool.status === 'OPEN'
    if (filterStatus === 'closed') return pool.status === 'CLOSED' || pool.status === 'DISTRIBUTED'
    return true
  }).filter(pool => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return pool.original_video_id.toLowerCase().includes(q) || pool.pda_address.toLowerCase().includes(q)
  }).filter(pool => {
    if (filterDate === 'all') return true
    
    const expiryDate = new Date(pool.expiry_timestamp).getTime()
    const now = Date.now()
    const hoursLeft = (expiryDate - now) / (1000 * 60 * 60)
    
    if (filterDate === '24h') return hoursLeft > 0 && Math.abs(hoursLeft) <= 24
    if (filterDate === '7d') return hoursLeft > 0 && Math.abs(hoursLeft) <= (24 * 7)
    if (filterDate === 'later') return hoursLeft > (24 * 7)
    
    return true
  }).sort((a, b) => {
    if (sortOrder === 'prize') return b.prize_amount - a.prize_amount
    if (sortOrder === 'deadline') return new Date(a.expiry_timestamp).getTime() - new Date(b.expiry_timestamp).getTime()
    return b.participant_count - a.participant_count
  })
  
  const totalPages = Math.max(1, Math.ceil(filteredPools.length / itemsPerPage))
  const paginatedPools = filteredPools.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <MainLayout showSidebar={true} showHeader={false}>
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 font-headline text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Bounty{' '}
            <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="max-w-2xl text-on-surface-variant">
            Explore active bounties, join as an editor, and earn SOL
            based on your engagement.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              filter_list
            </span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-transparent text-sm text-on-surface outline-none"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              schedule
            </span>
            <select
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-transparent text-sm text-on-surface outline-none"
            >
              <option value="all">All Dates</option>
              <option value="24h">Expiring in 24h</option>
              <option value="7d">Expiring in 7 Days</option>
              <option value="later">Later</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              sort
            </span>
            <select 
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-transparent text-sm text-on-surface outline-none"
            >
              <option value="newest">Featured / Popular</option>
              <option value="prize">Highest Prize</option>
              <option value="deadline">Ending Soon</option>
            </select>
          </div>

          <div className="flex flex-1 items-center gap-2 rounded-xl bg-surface-container-low px-4 py-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              placeholder="Search bounties by Video ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant outline-none"
            />
          </div>
        </div>

        {/* Bounty Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={`loading-${i}`} className="h-[400px] animate-pulse rounded-2xl bg-surface-container-low"></div>
            ))
          ) : paginatedPools.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-on-surface-variant text-lg">No bounties found.</p>
            </div>
          ) : (
            paginatedPools.map((pool, index) => {
              // Create a unique key using index to avoid duplicates
              const uniqueKey = `${pool.pda_address}-${index}`
              const deadline = new Date(pool.expiry_timestamp)
              const prizePool = pool.prize_amount / 1e9
              // Format explicit date e.g., 22/04/2026, 11:05
              const formattedDate = deadline.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

              return (
                <Link
                  key={uniqueKey}
                  href={`/bounties/${pool.pda_address}`}
                  className="group overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low transition-all hover:border-primary/30 hover:shadow-xl"
                >
                  <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-on-surface/20">
                        movie
                      </span>
                    </div>
                    <div className="absolute left-4 top-4">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${getCategoryColor('other')}`}
                      >
                        Community
                      </span>
                    </div>
                    <div className="absolute right-4 top-4">
                      {pool.status === 'OPEN' && (
                        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary">
                          Open
                        </span>
                      )}
                      {pool.status === 'CLOSED' && (
                        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-warning/20 text-warning">
                          ⚠️ Closed
                        </span>
                      )}
                      {pool.status === 'DISTRIBUTED' && (
                        <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-error/20 text-error">
                          End
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="mb-1 text-lg font-bold text-on-surface truncate">
                        Challenge #{pool.original_video_id}
                      </h3>
                      <span className="text-sm text-secondary">
                        by {pool.creator_wallet.slice(0, 4)}...{pool.creator_wallet.slice(-4)}
                      </span>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface truncate max-w-[150px]">
                          {pool.creator_wallet.slice(0, 4)}...{pool.creator_wallet.slice(-4)}
                        </p>
                        <p className="text-[10px] text-on-surface-variant">
                          Creator
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl bg-surface-container-high p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                          Prize Pool
                        </span>
                        <span className="font-headline text-2xl font-bold text-secondary">
                          {prizePool} SOL
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">
                          movie
                        </span>
                        {pool.participant_count} clips
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        Exp: {formattedDate}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center rounded-xl bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined mr-1 text-sm">chevron_left</span>
              Prev
            </button>
            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                // Simple logic to truncate pagination buttons if there are too many pages
                if (totalPages > 7) {
                  if (pageNum !== 1 && pageNum !== totalPages && Math.abs(currentPage - pageNum) > 1) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="text-on-surface-variant">...</span>
                    }
                    return null;
                  }
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                        : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center rounded-xl bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <span className="material-symbols-outlined ml-1 text-sm">chevron_right</span>
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-primary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-primary">
              analytics
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              1.2M+
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Total Impressions
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-secondary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-secondary">
              groups
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              942
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Active Editors
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-tertiary/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-tertiary">
              psychology
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              94%
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              AI Quality Avg
            </div>
          </div>
          <div className="group rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-error/30">
            <span className="material-symbols-outlined mb-4 block text-3xl text-error">
              stadium
            </span>
            <div className="mb-1 font-headline text-4xl font-bold text-on-surface">
              {pools.length}
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              Active Bounties
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
