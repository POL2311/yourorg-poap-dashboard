'use client'

import { useMemo } from 'react'
import { useDashboardStats, useRecentActivity } from '@/hooks/use-api'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, TrendingUp, ExternalLink, Zap, Shield, Clock } from 'lucide-react'
import Link from 'next/link'

/** Ajusta este tipo si tu API devuelve más campos */
type Activity = {
  id: string
  type: 'claim' | 'campaign' | string
  title: string
  description?: string
  icon?: string
  badge?: string
  badgeVariant?: 'success' | 'default' | 'secondary' | 'warning'
}

export default function DashboardPage() {
  const stats = useDashboardStats()
  const { data: recentActivityData, isLoading: isLoadingActivity } = useRecentActivity(5)

  // Normalizamos data para evitar "possibly undefined" y duplicar ?. por todo el JSX
  const activities: Activity[] = useMemo(
    () => recentActivityData?.data?.activities ?? [],
    [recentActivityData]
  )

  const relayerBalance = stats?.relayerBalance ?? 0

  return (
    <div className="space-y-6">
      {/* Top / Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold on-glass-title">Dashboard</h1>
          <p className="mt-1 on-glass-muted">
            Welcome back! Here&apos;s what&apos;s happening with your POAP campaigns.
          </p>
        </div>

        <Link href="/dashboard/campaigns">
          <Button className="rounded-xl bg-white text-gray-900 hover:bg-white/90">
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Clock className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-white/70">
                Latest claims and campaign updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingActivity ? (
                  // Skeleton
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur animate-pulse"
                      >
                        <div className="h-8 w-8 rounded-full bg-white/10" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 rounded bg-white/10" />
                          <div className="h-3 w-1/2 rounded bg-white/10" />
                        </div>
                        <div className="h-6 w-12 rounded-full bg-white/10" />
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  // Items
                  activities.map((activity: Activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={[
                            'h-8 w-8 rounded-full grid place-items-center',
                            activity.type === 'claim'
                              ? 'bg-emerald-500/20'
                              : activity.type === 'campaign'
                              ? 'bg-sky-500/20'
                              : 'bg-purple-500/20',
                          ].join(' ')}
                        >
                          <span className="text-white/90 text-lg">{activity.icon ?? '•'}</span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium on-glass-text">{activity.title}</p>
                        {activity.description && (
                          <p className="truncate text-sm on-glass-text">{activity.description}</p>
                        )}
                      </div>

                      <Badge
                        variant={activity.badgeVariant ?? 'default'}
                        className="whitespace-nowrap"
                      >
                        {activity.badge ?? '—'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  // Empty
                  <div className="py-10 text-center">
                    <div className="mb-3 text-white/40">
                      <Clock className="mx-auto h-12 w-12" />
                    </div>
                    <p className="text-sm text-white/80">No recent activity</p>
                    <p className="mt-1 text-xs text-white/60">
                      Activity will appear here as users claim POAPs
                    </p>
                  </div>
                )}

                <div className="pt-4 text-center">
                  <Link href="/dashboard/analytics">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      View All Activity
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-white/70">Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/campaigns">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </Link>
              <Link href="/dashboard/api-keys">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate API Key
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                API Documentation
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Shield className="mr-2 h-5 w-5 text-emerald-400" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Row label="Solana Network">
                <Badge variant="success">Operational</Badge>
              </Row>
              <Row label="POAP Minting">
                <Badge variant="success">Operational</Badge>
              </Row>
              <Row label="API Services">
                <Badge variant="success">Operational</Badge>
              </Row>
              <Row label="Relayer Balance">
                <Badge variant={relayerBalance > 0.1 ? 'success' : 'warning'}>
                  {relayerBalance > 0.1 ? 'Healthy' : 'Low'}
                </Badge>
              </Row>
            </CardContent>
          </Card>

          {/* Getting Started (glass + acento) */}
          <Card className="relative overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-[.35]"
              style={{
                background:
                  'radial-gradient(600px 200px at 0% 0%, rgba(99,102,241,.7), transparent),' +
                  'radial-gradient(400px 200px at 100% 0%, rgba(168,85,247,.7), transparent)',
              }}
            />
            <CardHeader>
              <CardTitle className="text-white">Getting Started</CardTitle>
              <CardDescription className="text-white/80">New to Infrastructure?</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-white/90">
                <li className="flex items-center">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-300" />
                  Create your first campaign
                </li>
                <li className="flex items-center">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-300" />
                  Generate an API key
                </li>
                <li className="flex items-center">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-300" />
                  Test POAP claiming
                </li>
                <li className="flex items-center">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-300" />
                  Embed on your website
                </li>
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4 w-full rounded-xl border-white/15 bg-white/10 text-white hover:bg-white/15"
              >
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

/* Helper para System Status */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white/80">{label}</span>
      {children}
    </div>
  )
}
