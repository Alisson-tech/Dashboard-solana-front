export type UserRole = 'creator' | 'editor'

export interface Bounty {
  id: string
  title: string
  hostName: string
  hostAvatar: string
  hashtag: string
  prizePool: number // em SOL
  deadline: Date
  totalClips: number
  status: 'active' | 'ended' | 'pending'
  videoUrl: string
  category: 'gaming' | 'social' | 'entertainment' | 'education' | 'other'
  description?: string
}

export interface Submission {
  id: string
  bountyId: string
  clipperAddress: string
  clipperName: string
  clipperAvatar: string
  videoUrl: string
  views: number
  likes: number
  comments: number
  engagementScore: number
  qualityMultiplier: number
  rank: number
  earnings: number
  submittedAt: Date
}

export interface ActivityItem {
  id: string
  type: 'submission' | 'claim' | 'bounty_created' | 'comment'
  title: string
  description: string
  avatar?: string
  timestamp: Date
  bountyTitle?: string
  amount?: number
}

export interface DashboardStats {
  totalSolLocked: number
  activeChallenges: number
  totalSubmissions: number
  uniqueClippers: number
  solChange: number
  endingSoonCount: number
}
