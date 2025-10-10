'use client'

import { useDashboardStats } from '@/hooks/use-api'
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
                {/* Activity items */}
                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      New POAP claimed
                    </p>
                    <p className="text-sm text-gray-500">
                      Solana Breakpoint 2024 • 2 minutes ago
                    </p>
                  </div>
                  <Badge variant="success">+1</Badge>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Campaign updated
                    </p>
                    <p className="text-sm text-gray-500">
                      Web3 Conference 2024 • 1 hour ago
                    </p>
                  </div>
                  <Badge variant="secondary">Updated</Badge>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      API key created
                    </p>
                    <p className="text-sm text-gray-500">
                      Production API Key • 3 hours ago
                    </p>
                  </div>
                  <Badge variant="default">New</Badge>
                </div>

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