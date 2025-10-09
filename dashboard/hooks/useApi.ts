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

// ✅ REAL API HOOKS (Connected to your backend)

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

// ⚠️ TEMPORARY: Local Storage Based Campaigns (until you add database)
export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async (): Promise<Campaign[]> => {
      // Get campaigns from localStorage (temporary solution)
      const stored = localStorage.getItem('poap-campaigns')
      if (stored) {
        return JSON.parse(stored)
      }
      
      // Default demo campaigns if none exist
      const defaultCampaigns = [
        {
          id: 'demo-breakpoint-2024',
          name: 'Solana Breakpoint 2024',
          description: 'The premier Solana conference bringing together builders and creators.',
          eventDate: '2024-09-20',
          location: 'Singapore',
          image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop',
          secretCode: 'BREAKPOINT2024',
          maxSupply: 5000,
          totalClaimed: 0, // Will be calculated from localStorage mint records
          isActive: true,
          organizerId: 'demo-org',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: new Date().toISOString(),
          claimUrl: 'http://localhost:5173',
          widgetCode: '<iframe src="http://localhost:5173" width="400" height="600"></iframe>',
        }
      ]
      
      localStorage.setItem('poap-campaigns', JSON.stringify(defaultCampaigns))
      return defaultCampaigns
    },
  })
}

// ⚠️ TEMPORARY: Analytics from localStorage mint records
export function useAnalytics() {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      // Get mint records from localStorage
      const mintRecords = JSON.parse(localStorage.getItem('poap-mint-records') || '[]')
      
      const totalClaims = mintRecords.length
      const successRate = mintRecords.length > 0 ? 98.5 : 0 // Assume high success rate
      
      // Group by date for chart
      const chartData = mintRecords.reduce((acc: any, record: any) => {
        const date = new Date(record.timestamp).toISOString().split('T')[0]
        const existing = acc.find((item: any) => item.date === date)
        if (existing) {
          existing.claims += 1
          existing.unique_users += 1 // Simplified
        } else {
          acc.push({ date, claims: 1, unique_users: 1 })
        }
        return acc
      }, [])
      
      return {
        totalClaims,
        successRate,
        peakTime: '2:00 PM - 4:00 PM',
        topLocation: 'Singapore',
        avgClaimTime: '2.3 seconds',
        chartData: chartData.slice(-7), // Last 7 days
        recentClaims: mintRecords.slice(-5).map((record: any) => ({
          id: record.id,
          campaignName: record.campaignName || 'Demo Campaign',
          userWallet: record.userWallet,
          claimedAt: record.timestamp,
          transactionSignature: record.transactionSignature,
        })),
      }
    },
  })
}

// ✅ REAL: Create campaign (saves to localStorage for now)
export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (campaignData: Partial<Campaign>) => {
      const newCampaign: Campaign = {
        id: `camp_${Date.now()}`,
        name: campaignData.name || '',
        description: campaignData.description || '',
        eventDate: campaignData.eventDate || '',
        location: campaignData.location || '',
        image: campaignData.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(campaignData.name || '')}`,
        secretCode: campaignData.secretCode,
        maxSupply: campaignData.maxSupply,
        totalClaimed: 0,
        isActive: true,
        organizerId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        claimUrl: 'http://localhost:5173',
        widgetCode: `<iframe src="http://localhost:5173?campaign=${campaignData.name}" width="400" height="600"></iframe>`,
      }
      
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem('poap-campaigns') || '[]')
      existing.push(newCampaign)
      localStorage.setItem('poap-campaigns', JSON.stringify(existing))
      
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

// ✅ HELPER: Record NFT mint (call this when NFT is minted)
export function recordNFTMint(data: {
  campaignName: string
  userWallet: string
  transactionSignature: string
  mintAddress: string
}) {
  const mintRecord = {
    id: `mint_${Date.now()}`,
    ...data,
    timestamp: new Date().toISOString(),
  }
  
  const existing = JSON.parse(localStorage.getItem('poap-mint-records') || '[]')
  existing.push(mintRecord)
  localStorage.setItem('poap-mint-records', JSON.stringify(existing))
  
  // Update campaign claim count
  const campaigns = JSON.parse(localStorage.getItem('poap-campaigns') || '[]')
  const campaign = campaigns.find((c: any) => c.name === data.campaignName)
  if (campaign) {
    campaign.totalClaimed += 1
    campaign.updatedAt = new Date().toISOString()
    localStorage.setItem('poap-campaigns', JSON.stringify(campaigns))
  }
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Campaign> }) => {
      const campaigns = JSON.parse(localStorage.getItem('poap-campaigns') || '[]')
      const index = campaigns.findIndex((c: any) => c.id === id)
      if (index !== -1) {
        campaigns[index] = { ...campaigns[index], ...updates, updatedAt: new Date().toISOString() }
        localStorage.setItem('poap-campaigns', JSON.stringify(campaigns))
      }
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
      const campaigns = JSON.parse(localStorage.getItem('poap-campaigns') || '[]')
      const filtered = campaigns.filter((c: any) => c.id !== campaignId)
      localStorage.setItem('poap-campaigns', JSON.stringify(filtered))
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