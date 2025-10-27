'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { CampaignForm, ApiKeyForm } from '@/lib/types'
import { toast } from 'react-hot-toast'

// ===== CAMPAIGNS =====

export function useCampaigns(params?: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => apiClient.getCampaigns(params),
    staleTime: 30_000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.getCampaign(id),
    enabled: !!id,
  })
}

export function useCampaignAnalytics(id: string) {
  return useQuery({
    queryKey: ['campaign-analytics', id],
    queryFn: () => apiClient.getCampaignAnalytics(id),
    enabled: !!id,
    refetchInterval: 60_000,
  })
}

export function useCampaignClaims(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['campaign-claims', id, params],
    queryFn: () => apiClient.getCampaignClaims(id, params),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CampaignForm) => apiClient.createCampaign(data),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['campaigns'] })
        toast.success('Campaign created successfully!')
      } else {
        toast.error(res.error || 'Failed to create campaign')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create campaign')
    },
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignForm> }) =>
      apiClient.updateCampaign(id, data),
    onSuccess: (res, { id }) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['campaigns'] })
        qc.invalidateQueries({ queryKey: ['campaign', id] })
        toast.success('Campaign updated successfully!')
      } else {
        toast.error(res.error || 'Failed to update campaign')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update campaign')
    },
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCampaign(id),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['campaigns'] })
        toast.success('Campaign deleted successfully!')
      } else {
        toast.error(res.error || 'Failed to delete campaign')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to delete campaign')
    },
  })
}

// ===== API KEYS =====

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.getApiKeys(),
    staleTime: 60_000,
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ApiKeyForm) => apiClient.createApiKey(data),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['api-keys'] })
        toast.success('API key created successfully!')
      } else {
        toast.error(res.error || 'Failed to create API key')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create API key')
    },
  })
}

export function useDeactivateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.deactivateApiKey(id),
    onSuccess: (res) => {
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['api-keys'] })
        toast.success('API key deactivated successfully!')
      } else {
        toast.error(res.error || 'Failed to deactivate API key')
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to deactivate API key')
    },
  })
}

// ===== RELAYER & USER POAPs =====

export function useRelayerStats() {
  return useQuery({
    queryKey: ['relayer-stats'],
    queryFn: () => apiClient.getRelayerStats(),
    refetchInterval: 30_000,
  })
}

export function useUserPOAPs(userPublicKey: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['user-poaps', userPublicKey, params],
    queryFn: () => apiClient.getUserPOAPs(userPublicKey, params),
    enabled: !!userPublicKey,
  })
}

// ===== DASHBOARD STATS =====
export function usePublicCampaign(id: string) {
  return useQuery({
    queryKey: ['public-campaign', id],
    queryFn: () => apiClient.getPublicCampaign(id),
    enabled: !!id,
    staleTime: 30000,
  })
}
export function useDashboardStats() {
  const campaignsQuery = useCampaigns({ limit: 1000 })
  const relayerQuery = useRelayerStats()

  return {
    totalCampaigns: campaignsQuery.data?.data?.campaigns?.length || 0,
    activeCampaigns: campaignsQuery.data?.data?.campaigns?.filter(c => c.isActive).length || 0,
    totalClaims:
      campaignsQuery.data?.data?.campaigns?.reduce((sum, c) => sum + (c._count?.claims || 0), 0) || 0,
    relayerBalance: relayerQuery.data?.data?.balance || 0,
    isLoading: campaignsQuery.isLoading || relayerQuery.isLoading,
    error: campaignsQuery.error || relayerQuery.error,
  }
}

// ===== RECENT ACTIVITY =====

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => apiClient.getRecentActivity(limit),
    refetchInterval: 30_000, // Refrescar cada 30 segundos
    staleTime: 15_000, // Considerar datos frescos por 15 segundos
  })
}