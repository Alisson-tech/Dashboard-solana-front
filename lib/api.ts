import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8001/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface Pool {
  pda_address: string
  creator_wallet: string
  original_video_id: string
  name?: string
  hashtag?: string
  prize_amount: number
  scoring_rules: {
    views_weight: number
    likes_weight: number
    comments_weight: number
  }
  participant_count: number
  total_score: number
  status: 'OPEN' | 'CLOSED' | 'DISTRIBUTED'
  expiry_timestamp: string
}

export interface Entry {
  pda_address: string
  pool_pda: string
  user_wallet: string
  channel_id: string
  clip_link: string
  views: number
  likes: number
  comments: number
  score: number
  claimed: boolean
}

export interface UserProfile {
  walletAddress: string
  role: 'creator' | 'editor'
  created_at?: string
}

export interface AuditLog {
  id: string
  entry_pda: string
  validation_type: 'TRANSCRIPT' | 'SSIM_FRAME' | 'CHANNEL_CHECK'
  status: 'PASS' | 'FAIL' | 'FRAUD'
  details: any
  created_at: string
}

export const coreApi = {
  // Users
  getUser: async (walletAddress: string) => {
    const { data } = await apiClient.get<UserProfile>(`/users/${walletAddress}`)
    return data
  },

  createUser: async (params: { walletAddress: string; role: 'creator' | 'editor' }) => {
    const { data } = await apiClient.post<UserProfile>('/users', {
      wallet_address: params.walletAddress,
      role: params.role,
    })
    return data
  },

  getUserParticipations: async (walletAddress: string) => {
    const { data } = await apiClient.get<PaginatedResponse<Entry>>(`/users/${walletAddress}/participations`)
    return data
  },

  // Pools
  getPools: async (params?: { status?: string; creator_wallet?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Pool>>('/pools', { params })
    return data
  },

  getPool: async (poolPda: string) => {
    const { data } = await apiClient.get<Pool>(`/pools/${poolPda}`)
    return data
  },

  updatePoolMetadata: async (poolPda: string, name: string, hashtag?: string, videoTitle?: string) => {
    const { data } = await apiClient.post(`/pools/${poolPda}/metadata`, { name, hashtag, video_title: videoTitle })
    return data
  },

  getPoolMetadata: async (poolPda: string) => {
    const { data } = await apiClient.get<{name: string | null, hashtag: string | null}>(`/pools/${poolPda}/metadata`)
    return data
  },

  getBatchPoolMetadata: async (pdas: string[]) => {
    if (!pdas.length) return {};
    const { data } = await apiClient.post<Record<string, {name?: string; hashtag?: string; video_title?: string}>>('/pools/batch-metadata', { pdas })
    return data
  },

  batchEnrichTitles: async (_items: { pda: string; video_id: string }[]) => {
    return { updated: 0, skipped: 0 }
  },

  getPoolEntries: async (poolPda: string, params?: { page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Entry>>(`/pools/${poolPda}/entries`, { params })
    return data
  },

  // Entries
  getEntries: async (params?: { user_wallet?: string; pool_pda?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Entry>>('/entries', { params })
    return data
  },

  getEntry: async (entryPda: string) => {
    const { data } = await apiClient.get<Entry>(`/entries/${entryPda}`)
    return data
  },

  getEntryAuditLogs: async (entryPda: string) => {
    const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(`/entries/${entryPda}/audit-logs`)
    return data
  },

  // Utils
  hashLink: async (url: string) => {
    const { data } = await apiClient.post<{
      original_url: string
      normalized_url: string
      hash_bytes: number[]
      hash_hex: string
    }>('/utils/hash-link', { url })
    return data
  },

  getYoutubeTitles: async (videoIds: string[]): Promise<Record<string, string | null>> => {
    if (!videoIds.length) return {}
    const { data } = await apiClient.get<Record<string, string | null>>('/utils/youtube-titles', {
      params: { video_ids: videoIds.join(',') },
    })
    return data
  },
}
