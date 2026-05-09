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

export interface AuditLog {
  id: string
  entry_pda: string
  validation_type: 'TRANSCRIPT' | 'SSIM_FRAME' | 'CHANNEL_CHECK'
  status: 'PASS' | 'FAIL' | 'FRAUD'
  details: any
  created_at: string
}

export const coreApi = {
  // Pools
  getPools: async (params?: { status?: string; creator_wallet?: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<PaginatedResponse<Pool>>('/pools', { params })
    return data
  },

  getPool: async (poolPda: string) => {
    const { data } = await apiClient.get<Pool>(`/pools/${poolPda}`)
    return data
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
}
