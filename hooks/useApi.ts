'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { handleApiError } from '@/lib/handleApiError'
import toast from 'react-hot-toast'

// =======================
// 📡 API CLIENT
// =======================
const API_BASE_URL =
  (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function getAuthToken() {
  if (typeof window === 'undefined') return ''
  return (
    localStorage.getItem('auth-token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    ''
  )
}

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      // 👇 no patear desde páginas públicas
      const here = typeof window !== 'undefined' ? window.location.pathname : ''
      const isPublic =
        here.startsWith('/market') ||
        here === '/' ||
        here.startsWith('/claim') ||
        here.startsWith('/explore')

      localStorage.removeItem('auth-token')
      if (!isPublic && typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
    return Promise.reject(error)
  }
)

// =======================
// 🧾 TYPES
// =======================
export interface Campaign {
  id: string
  name: string
  description?: string
  eventDate: string
  location?: string
  imageUrl?: string
  externalUrl?: string
  secretCode?: string
  maxClaims?: number
  isActive: boolean
  organizerId: string
  createdAt: string
  updatedAt: string
  metadata?: any
  _count?: { claims: number }
  organizer?: { name: string; email: string; company?: string }
}

export interface CampaignAnalytics {
  campaign: { id: string; name: string; maxClaims?: number }
  claims: { total: number; today: number; thisWeek: number; thisMonth: number; remaining?: number }
  gas: { totalCost: number; averageCost: number; totalCostSOL: number }
  dailyClaims: Array<{ date: string; claims: number }>
}

export interface Claim {
  id: string
  campaignId: string
  userPublicKey: string
  mintAddress?: string
  transactionHash?: string
  claimedAt: string
}

export interface RelayerStats {
  relayerPublicKey: string
  balance: number
  balanceLamports: number
  network: string
  rpcUrl: string
  timestamp: string
}

// =======================
// 🪙 RELAYER
// =======================
export function useRelayerStats() {
  return useQuery({
    queryKey: ['relayer-stats'],
    queryFn: async (): Promise<RelayerStats> => {
      const { data } = await api.get('/api/relayer/stats')
      return data.data
    },
    refetchInterval: 30000,
  })
}

// =======================
// 🧠 HEALTH CHECK
// =======================
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const { data } = await api.get('/health')
      return data
    },
    refetchInterval: 60000,
  })
}

// =======================
// 🪙 CAMPAIGNS (privadas del organizer)
// =======================
export function useCampaigns() {
  const enabled =
    typeof window !== 'undefined' && !!localStorage.getItem('auth-token')

  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      const { data } = await api.get('/api/campaigns')
      const raw = data.data
      const campaigns = Array.isArray(raw) ? raw : (raw?.campaigns ?? [])
      return campaigns.map((c: any) => ({
        ...c,
        image: c.image ?? c.imageUrl ?? '',
        totalClaimed: c.totalClaimed ?? c._count?.claims ?? 0,
        maxSupply: c.maxSupply ?? c.maxClaims ?? null,
      }))
    },
    enabled, // solo si hay token
  })
}

export function useCampaignAnalytics(campaignId: string) {
  const enabled =
    !!campaignId &&
    (typeof window === 'undefined' || !!localStorage.getItem('auth-token'))

  return useQuery({
    queryKey: ['campaign-analytics', campaignId],
    queryFn: async (): Promise<CampaignAnalytics> => {
      const { data } = await api.get(`/api/campaigns/${campaignId}/analytics`)
      return data.data
    },
    enabled,
  })
}

export function useCampaignClaims(campaignId: string, page = 1, limit = 50) {
  const enabled =
    !!campaignId &&
    (typeof window === 'undefined' || !!localStorage.getItem('auth-token'))

  return useQuery({
    queryKey: ['campaign-claims', campaignId, page, limit],
    queryFn: async () => {
      const { data } = await api.get(`/api/campaigns/${campaignId}/claims`, { params: { page, limit } })
      return data.data
    },
    enabled,
  })
}

// =======================
// 📊 AGGREGATED ANALYTICS (privado)
// =======================
export function useAnalytics() {
  const { data: campaigns } = useCampaigns()
  const enabled =
    !!campaigns &&
    (typeof window === 'undefined' || !!localStorage.getItem('auth-token'))

  return useQuery({
    queryKey: ['analytics', campaigns?.length],
    queryFn: async () => {
      if (!campaigns?.length) {
        return {
          totalClaims: 0,
          successRate: 0,
          peakTime: 'N/A',
          topLocation: 'N/A',
          avgClaimTime: 'N/A',
          chartData: [],
          recentClaims: [],
        }
      }

      const MAX_CAMPAIGNS = 10
      const analyticsPromises = campaigns.slice(0, MAX_CAMPAIGNS).map((c) =>
        api.get(`/api/campaigns/${c.id}/analytics`).catch(() => null)
      )
      const analyticsResults = await Promise.all(analyticsPromises)
      const valid = analyticsResults.filter(r => r?.data?.success).map(r => r!.data.data)

      const totalClaims = valid.reduce((sum, a) => sum + (a.claims?.total || 0), 0)
      const totalGasCost = valid.reduce((sum, a) => sum + (a.gas?.totalCost || 0), 0)

      const allDailyClaims = valid.flatMap(a => a.dailyClaims || [])
      const chartData = allDailyClaims.reduce((acc: any[], claim) => {
        const existing = acc.find(x => x.date === claim.date)
        existing ? existing.claims += claim.claims : acc.push({ date: claim.date, claims: claim.claims })
        return acc
      }, []).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)

      return {
        totalClaims,
        successRate: totalClaims > 0 ? 98.5 : 0,
        peakTime: '2:00 PM - 4:00 PM',
        topLocation: campaigns[0]?.location || 'Virtual',
        avgClaimTime: '2.3 seconds',
        chartData,
        recentClaims: [],
        totalGasCostSOL: totalGasCost / 1e9,
      }
    },
    enabled,
  })
}

// =======================
// ✍️ CAMPAIGN MUTATIONS
// =======================
export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Campaign>) => api.post('/api/campaigns', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign created successfully!')
    },
    onError: (e) => handleApiError(e, 'Failed to create campaign'),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Campaign> }) =>
      api.put(`/api/campaigns/${id}`, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign updated successfully!')
    },
    onError: (e) => handleApiError(e, 'Failed to update campaign'),
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/campaigns/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign deleted successfully!')
    },
    onError: (e) => handleApiError(e, 'Failed to delete campaign'),
  })
}

// =======================
// 🔐 AUTH
// =======================
export function useLogin() {
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post('/api/auth/login', credentials),
    onSuccess: () => toast.success('Logged in successfully!'),
    onError: (e) => handleApiError(e, 'Login failed'),
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string; company?: string }) =>
      api.post('/api/auth/register', data),
    onSuccess: () => toast.success('Account created successfully! Please log in.'),
    onError: (e) => handleApiError(e, 'Registration failed'),
  })
}

export function useProfile() {
  const enabled =
    typeof window !== 'undefined' && !!localStorage.getItem('auth-token')

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/api/auth/profile')
      return data.data
    },
    enabled,
  })
}

// =======================
// 🌐 PUBLIC CAMPAIGNS (Market)
// =======================
export type PublicCampaign = {
  id: string
  name: string
  description?: string
  eventDate: string
  location?: string
  imageUrl?: string
  externalUrl?: string
  maxClaims?: number | null
  isActive: boolean
  createdAt: string
  organizer: { id: string; name: string; company?: string | null }
  totalClaims: number
  claimsRemaining: number | null
}

export function useMarketCampaigns(params?: {
  search?: string
  sort?: 'recent' | 'popular' | 'upcoming'
  page?: number
  limit?: number
  organizerId?: string
}) {
  return useQuery({
    queryKey: ['market-campaigns', params],
    queryFn: async (): Promise<PublicCampaign[]> => {
      const { data } = await api.get('/api/public/campaigns', { params })
      return data.data.campaigns as PublicCampaign[]
    },
  })
}
