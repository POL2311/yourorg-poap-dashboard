import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { useAnalytics } from '../../hooks/useApi'
import { TrendingUp, Users, Clock, MapPin } from 'lucide-react'

interface AnalyticsChartProps {
  data?: any
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data: propData }) => {
  const { data: analyticsData, isLoading } = useAnalytics()
  
  const data = propData || analyticsData

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.chartData || []
  
  // Prepare data for different chart types
  const claimsOverTime = chartData.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    claims: item.claims,
    users: item.unique_users,
  }))

  const hourlyData = [
    { hour: '00:00', claims: 12 },
    { hour: '02:00', claims: 8 },
    { hour: '04:00', claims: 5 },
    { hour: '06:00', claims: 15 },
    { hour: '08:00', claims: 45 },
    { hour: '10:00', claims: 78 },
    { hour: '12:00', claims: 123 },
    { hour: '14:00', claims: 156 },
    { hour: '16:00', claims: 134 },
    { hour: '18:00', claims: 89 },
    { hour: '20:00', claims: 67 },
    { hour: '22:00', claims: 34 },
  ]

  const deviceData = [
    { name: 'Mobile', value: 65, color: '#8884d8' },
    { name: 'Desktop', value: 30, color: '#82ca9d' },
    { name: 'Tablet', value: 5, color: '#ffc658' },
  ]

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{data.totalClaims?.toLocaleString() || '0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{data.successRate || 0}%</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Claim Time</p>
                <p className="text-2xl font-bold">{data.avgClaimTime || '0s'}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              -0.3s from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Location</p>
                <p className="text-2xl font-bold">{data.topLocation || 'N/A'}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Most active region
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claims">Claims Over Time</TabsTrigger>
          <TabsTrigger value="hourly">Hourly Distribution</TabsTrigger>
          <TabsTrigger value="devices">Device Types</TabsTrigger>
        </TabsList>

        <TabsContent value="claims">
          <Card>
            <CardHeader>
              <CardTitle>Claims and Unique Users Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={claimsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    name="Total Claims"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="#82ca9d" 
                    strokeWidth={2}
                    name="Unique Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly">
          <Card>
            <CardHeader>
              <CardTitle>Claims by Hour of Day</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="claims" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Claims by Device Type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentClaims?.slice(0, 5).map((claim: any) => (
              <div key={claim.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    🏅
                  </div>
                  <div>
                    <p className="font-medium">{claim.campaignName}</p>
                    <p className="text-sm text-muted-foreground">
                      {claim.userWallet.slice(0, 8)}...{claim.userWallet.slice(-8)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(claim.claimedAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(claim.claimedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-center text-muted-foreground py-8">
                No recent claims to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}