'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  Zap, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { cn, formatNumber, formatSOL, getInitials } from '@/lib/utils'

interface StatsCardsProps {
  stats: {
    totalCampaigns: number
    activeCampaigns: number
    totalClaims: number
    relayerBalance: number
    isLoading: boolean
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Campaigns',
      value: formatNumber(stats.totalCampaigns),
      icon: Calendar,
      description: `${stats.activeCampaigns} active`,
      trend: stats.activeCampaigns > 0 ? 'up' : 'neutral',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Claims',
      value: formatNumber(stats.totalClaims),
      icon: Users,
      description: 'All time',
      trend: 'up',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Relayer Balance',
      value: formatSOL(stats.relayerBalance * 1e9),
      icon: Zap,
      description: 'Available for minting',
      trend: stats.relayerBalance > 0.1 ? 'up' : 'down',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Success Rate',
      value: '99.8%',
      icon: TrendingUp,
      description: 'Last 30 days',
      trend: 'up',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ]

  if (stats.isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  {card.trend === 'up' && (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  )}
                  {card.trend === 'down' && (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  )}
                  {card.description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}