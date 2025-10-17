'use client'

import { useDashboardStats, useRecentActivity } from '@/hooks/use-api'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp,
  ExternalLink,
  Zap,
  Shield,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const stats = useDashboardStats()
  const { data: recentActivityData, isLoading: isLoadingActivity } = useRecentActivity(5)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your POAP campaigns.
          </p>
        </div>
        <Link href="/dashboard/campaigns">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest claims and campaign updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingActivity ? (
                  // Loading state
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg animate-pulse">
                        <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-6 w-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recentActivityData?.data?.activities?.length > 0 ? (
                  // Dynamic activity items
                  recentActivityData?.data?.activities?.map((activity: any) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          activity.type === 'claim' ? 'bg-green-100' : 
                          activity.type === 'campaign' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          <span className="text-lg">{activity.icon}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.description}
                        </p>
                      </div>
                      <Badge variant={activity.badgeVariant || 'default'}>
                        {activity.badge}
                      </Badge>
                    </div>
                  ))
                ) : (
                  // Empty state
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <Clock className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-1">Activity will appear here as users claim POAPs</p>
                  </div>
                )}

                <div className="text-center pt-4">
                  <Link href="/dashboard/analytics">
                    <Button variant="outline" size="sm">
                      View All Activity
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/campaigns">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
              <Link href="/dashboard/api-keys">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="mr-2 h-4 w-4" />
                  Generate API Key
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <ExternalLink className="mr-2 h-4 w-4" />
                API Documentation
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Solana Network</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">POAP Minting</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API Services</span>
                <Badge variant="success">Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Relayer Balance</span>
                <Badge variant={stats.relayerBalance > 0.1 ? "success" : "warning"}>
                  {stats.relayerBalance > 0.1 ? "Healthy" : "Low"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-indigo-900">Getting Started</CardTitle>
              <CardDescription className="text-indigo-700">
                New to Infrastructure?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-indigo-800">
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-2"></div>
                  Create your first campaign
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-2"></div>
                  Generate an API key
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-2"></div>
                  Test POAP claiming
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 bg-indigo-400 rounded-full mr-2"></div>
                  Embed on your website
                </div>
              </div>
              <Button variant="secondary" size="sm" className="w-full mt-4">
                View Guide
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}