'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { 
  Campaign, 
  ApiKey, 
  CampaignForm, 
  ApiKeyForm,
  CampaignAnalytics,
  Claim,
  RelayerStats
} from '@/lib/types'
import { toast } from 'react-hot-toast'

// ===== CAMPAIGN HOOKS =====

export function useCampaigns(params?: {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => apiClient.getCampaigns(params),
    staleTime: 30000, // 30 seconds
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
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useCampaignClaims(id: string, params?: {
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['campaign-claims', id, params],
    queryFn: () => apiClient.getCampaignClaims(id, params),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CampaignForm) => apiClient.createCampaign(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        toast.success('Campaign created successfully!')
      } else {
        toast.error(response.error || 'Failed to create campaign')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create campaign')
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CampaignForm> }) => 
      apiClient.updateCampaign(id, data),
    onSuccess: (response, { id }) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        queryClient.invalidateQueries({ queryKey: ['campaign', id] })
        toast.success('Campaign updated successfully!')
      } else {
        toast.error(response.error || 'Failed to update campaign')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update campaign')
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCampaign(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] })
        toast.success('Campaign deleted successfully!')
      } else {
        toast.error(response.error || 'Failed to delete campaign')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete campaign')
    },
  })
}

// ===== API KEY HOOKS =====

export function useApiKeys() {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiClient.getApiKeys(),
    staleTime: 60000, // 1 minute
  })
}

export function useCreateApiKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: ApiKeyForm) => apiClient.createApiKey(data),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['api-keys'] })
        toast.success('API key created successfully!')
      } else {
        toast.error(response.error || 'Failed to create API key')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create API key')
    },
  })
}

export function useDeactivateApiKey() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deactivateApiKey(id),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['api-keys'] })
        toast.success('API key deactivated successfully!')
      } else {
        toast.error(response.error || 'Failed to deactivate API key')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to deactivate API key')
    },
  })
}

// ===== SYSTEM HOOKS =====

export function useRelayerStats() {
  return useQuery({
    queryKey: ['relayer-stats'],
    queryFn: () => apiClient.getRelayerStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useUserPOAPs(userPublicKey: string, params?: {
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ['user-poaps', userPublicKey, params],
    queryFn: () => apiClient.getUserPOAPs(userPublicKey, params),
    enabled: !!userPublicKey,
  })
}

// ===== DASHBOARD STATS HOOK =====

export function useDashboardStats() {
  const campaignsQuery = useCampaigns({ limit: 1000 }) // Get all campaigns for stats
  const relayerQuery = useRelayerStats()
  
  const stats = {
    totalCampaigns: campaignsQuery.data?.data?.campaigns?.length || 0,
    activeCampaigns: campaignsQuery.data?.data?.campaigns?.filter(c => c.isActive).length || 0,
    totalClaims: campaignsQuery.data?.data?.campaigns?.reduce((sum, c) => sum + (c._count?.claims || 0), 0) || 0,
    relayerBalance: relayerQuery.data?.data?.balance || 0,
    isLoading: campaignsQuery.isLoading || relayerQuery.isLoading,
    error: campaignsQuery.error || relayerQuery.error,
  }
  
  return stats
}