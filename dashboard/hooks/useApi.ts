import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = 'http://localhost:3000'

// API Client
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Types
export interface Campaign {
  id: string
  name: string
  description: string
  eventDate: string
  location: string
  image: string
  secretCode?: string
  maxSupply?: number
  totalClaimed: number
  isActive: boolean
  organizerId: string
  createdAt: string
  updatedAt: string
  claimUrl: string
  widgetCode: string
}

export interface AnalyticsData {
  totalClaims: number
  successRate: number
  peakTime: string
  topLocation: string
  avgClaimTime: string
  chartData: Array<{
    date: string
    claims: number
    unique_users: number
  }>
  recentClaims: Array<{
    id: string
    campaignName: string
    userWallet: string
    claimedAt: string
    transactionSignature: string
  }>
}

export interface RelayerStats {
  relayerPublicKey: string
  balance: number
  balanceLamports: number
  network: string
  rpcUrl: string
  timestamp: string
}

// API Hooks
export function useRelayerStats() {
  return useQuery({
    queryKey: ['relayer-stats'],
    queryFn: async (): Promise<RelayerStats> => {
      const response = await api.get('/api/relayer/stats')
      return response.data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      // Mock data for now - replace with real API call
      return [
        {
          id: 'camp_1',
          name: 'Solana Breakpoint 2024',
          description: 'The premier Solana conference bringing together builders and creators.',
          eventDate: '2024-09-20',
          location: 'Singapore',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
          secretCode: 'BREAKPOINT2024',
          maxSupply: 5000,
          totalClaimed: 1247,
          isActive: true,
          organizerId: 'org_1',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-20T15:45:00Z',
          claimUrl: 'http://localhost:5173',
          widgetCode: '<iframe src="http://localhost:5173" width="400" height="600"></iframe>',
        },
        {
          id: 'camp_2',
          name: 'DeFi Summit Miami',
          description: 'Exploring the future of decentralized finance.',
          eventDate: '2024-03-15',
          location: 'Miami, FL',
          image: 'https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=400&h=300&fit=crop',
          secretCode: 'DEFI2024',
          maxSupply: 2000,
          totalClaimed: 856,
          isActive: true,
          organizerId: 'org_1',
          createdAt: '2024-02-01T09:00:00Z',
          updatedAt: '2024-02-10T12:30:00Z',
          claimUrl: 'http://localhost:5173',
          widgetCode: '<iframe src="http://localhost:5173" width="400" height="600"></iframe>',
        },
      ]
    },
  })
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      // Mock analytics data
      return {
        totalClaims: 2103,
        successRate: 98.5,
        peakTime: '2:00 PM - 4:00 PM',
        topLocation: 'Singapore',
        avgClaimTime: '2.3 seconds',
        chartData: [
          { date: '2024-01-15', claims: 45, unique_users: 42 },
          { date: '2024-01-16', claims: 78, unique_users: 71 },
          { date: '2024-01-17', claims: 123, unique_users: 115 },
          { date: '2024-01-18', claims: 89, unique_users: 83 },
          { date: '2024-01-19', claims: 156, unique_users: 142 },
          { date: '2024-01-20', claims: 234, unique_users: 201 },
          { date: '2024-01-21', claims: 189, unique_users: 167 },
        ],
        recentClaims: [
          {
            id: 'claim_1',
            campaignName: 'Solana Breakpoint 2024',
            userWallet: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
            claimedAt: '2024-01-21T14:30:00Z',
            transactionSignature: '5VfYmGjjGKQH9ziiFbAaYJMwinVVr6kv8V3gU8hCsFQyxnHhvntq2VjBQrX9UvMjEuQV1wEyuvEyivQoAuHDQDRv',
          },
          {
            id: 'claim_2',
            campaignName: 'DeFi Summit Miami',
            userWallet: 'DRiP2Pn2K6fuMLKQmt5rZWyHiUZ6zDvNrXK8gSMdWC7X',
            claimedAt: '2024-01-21T14:25:00Z',
            transactionSignature: '3NMremQiDiXqtXKyQKiSiJmGsWLvjxoHdHooo1wPQKrvzgdeMApV6L8uVK5partJeVSqAB8TQMCtZouiJ8tHMaps',
          },
        ],
      }
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignData: Partial<Campaign>) => {
      // Mock campaign creation - replace with real API call
      const newCampaign: Campaign = {
        id: `camp_${Date.now()}`,
        name: campaignData.name || '',
        description: campaignData.description || '',
        eventDate: campaignData.eventDate || '',
        location: campaignData.location || '',
        image: campaignData.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${Date.now()}`,
        secretCode: campaignData.secretCode,
        maxSupply: campaignData.maxSupply,
        totalClaimed: 0,
        isActive: true,
        organizerId: 'org_1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        claimUrl: 'http://localhost:5173',
        widgetCode: '<iframe src="http://localhost:5173" width="400" height="600"></iframe>',
      }
      
      return newCampaign
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign created successfully!')
    },
    onError: (error) => {
      console.error('Create campaign error:', error)
      toast.error('Failed to create campaign')
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Campaign> }) => {
      // Mock campaign update - replace with real API call
      return { id, ...updates }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign updated successfully!')
    },
    onError: (error) => {
      console.error('Update campaign error:', error)
      toast.error('Failed to update campaign')
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignId: string) => {
      // Mock campaign deletion - replace with real API call
      return { id: campaignId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast.success('Campaign deleted successfully!')
    },
    onError: (error) => {
      console.error('Delete campaign error:', error)
      toast.error('Failed to delete campaign')
    },
  })
}

// Health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/health')
      return response.data
    },
    refetchInterval: 60000, // Check every minute
  })
}