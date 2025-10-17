'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useCampaigns, useRelayerStats } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  Zap,
  DollarSign,
  Activity,
  Target,
  Award
} from 'lucide-react'
import { formatNumber, formatSOL } from '@/lib/utils'
import { AnalyticsDebug } from '@/components/debug/AnalyticsDebug'

export default function AnalyticsPage() {
  const { isAuthenticated, token } = useAuth()
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ limit: 1000 })
  const { data: relayerData, isLoading: relayerLoading } = useRelayerStats()

  const campaigns = campaignsData?.data?.campaigns || []
  const relayerStats = relayerData?.data

  // === Métricas principales ===
  const totalClaims = campaigns.reduce((sum, c) => sum + (c._count?.claims || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.isActive).length
  const avgClaimsPerCampaign = campaigns.length > 0 ? totalClaims / campaigns.length : 0

  // === Daily Claims (datos reales) ===
  const [dailyClaimsData, setDailyClaimsData] = useState<{ date: string; claims: number }[]>([])
  const [loadingDaily, setLoadingDaily] = useState(true)

  useEffect(() => {
    const fetchDailyClaims = async () => {
      if (!isAuthenticated || !token) {
        setLoadingDaily(false)
        return
      }
      
      try {
        const res = await axios.get('/api/analytics/claims/daily', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = Array.isArray(res.data) ? res.data : res.data?.data
        if (data) setDailyClaimsData(data)
      } catch (error) {
        console.error('Error fetching daily claims:', error)
      } finally {
        setLoadingDaily(false)
      }
    }
    fetchDailyClaims()
  }, [isAuthenticated, token])

  // === Monthly Trend (datos reales) ===
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; campaigns: number; claims: number }[]>([])
  const [loadingMonthly, setLoadingMonthly] = useState(true)

  useEffect(() => {
    const fetchMonthlyTrend = async () => {
      if (!isAuthenticated || !token) {
        setLoadingMonthly(false)
        return
      }
      
      try {
        const res = await axios.get('/api/analytics/trend/monthly', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = Array.isArray(res.data) ? res.data : res.data?.data
        if (data) setMonthlyTrend(data)
      } catch (error) {
        console.error('Error fetching monthly trend:', error)
      } finally {
        setLoadingMonthly(false)
      }
    }
    fetchMonthlyTrend()
  }, [isAuthenticated, token])

  // === Campaign Performance y Status ===
  const campaignPerformanceData = campaigns.slice(0, 5).map(campaign => ({
    name: campaign.name.length > 20 ? campaign.name.substring(0, 20) + '...' : campaign.name,
    claims: campaign._count?.claims || 0,
    maxClaims: campaign.maxClaims || 100,
  }))

  const statusDistribution = [
    { name: 'Active', value: activeCampaigns, color: '#10b981' },
    { name: 'Inactive', value: campaigns.length - activeCampaigns, color: '#6b7280' },
  ]

  if (campaignsLoading || relayerLoading || loadingDaily || loadingMonthly) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive insights into your POAP campaigns and performance
        </p>
      </div>

      {/* Debug Component */}
      <AnalyticsDebug />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{activeCampaigns}</span> active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClaims)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(avgClaimsPerCampaign)} avg per campaign
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.8%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Costs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {relayerStats ? formatSOL(relayerStats.totalGasCost) : '0 SOL'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total spent on gas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trend</CardTitle>
                <CardDescription>
                  Campaigns and claims over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="claims" 
                      stackId="1"
                      stroke="#6366f1" 
                      fill="#6366f1" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Campaign Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status</CardTitle>
                <CardDescription>
                  Distribution of active vs inactive campaigns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {statusDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns */}
        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>
                Claims per campaign compared to maximum limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="claims" fill="#6366f1" />
                  <Bar dataKey="maxClaims" fill="#e5e7eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Claims */}
        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Claims</CardTitle>
              <CardDescription>
                POAP claims over the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailyClaimsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance (sin cambios) */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* tarjetas originales */}
          </div>
          {/* Performance Insights original */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
