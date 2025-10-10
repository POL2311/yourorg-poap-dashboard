'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Database, 
  Zap, 
  Shield,
  Activity,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Info
} from 'lucide-react'
import { cn, formatNumber, formatSOL, getInitials } from '@/lib/utils'

interface SystemHealth {
  timestamp: string
  uptime: number
  service: string
  version: string
  environment: string
  database: {
    status: string
    provider?: string
    organizers?: number
    campaigns?: number
    claims?: number
    responseTime?: number
    error?: string
  }
  solana: {
    status: string
    network?: string
    rpcUrl?: string
    currentSlot?: number
    blockTime?: string
    responseTime?: number
    error?: string
  }
  relayer: {
    status: string
    publicKey?: string
    balance?: number
    balanceLamports?: number
    warning?: string
    error?: string
  }
  environment: {
    status: string
    required: number
    configured: number
    missing: string[]
  }
  overall: {
    status: string
    ready: boolean
    totalResponseTime: number
    error?: string
  }
}

interface SystemStats {
  overview: {
    totalOrganizers: number
    totalCampaigns: number
    totalClaims: number
    totalGasCost: number
    totalGasCostSOL: number
  }
  activity: {
    recentClaims: Array<{
      id: string
      userPublicKey: string
      claimedAt: string
      campaign: {
        name: string
        organizer: { name: string }
      }
    }>
    dailyClaims: Array<{
      date: string
      claims: number
    }>
  }
  timestamp: string
}

export function SystemStatusDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchSystemData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [healthResponse, statsResponse] = await Promise.all([
        fetch('/api/system/health'),
        fetch('/api/system/stats')
      ])

      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setHealth(healthData.data)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.data)
      }

      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'complete':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
      case 'low_balance':
      case 'incomplete':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
      case 'failed':
      case 'not_configured':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'complete':
        return <Badge variant="success">{status}</Badge>
      case 'warning':
      case 'low_balance':
      case 'incomplete':
        return <Badge variant="warning">{status}</Badge>
      case 'error':
      case 'failed':
      case 'not_configured':
        return <Badge variant="destructive">{status}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading && !health) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">System Status</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-gray-600">
            Real-time monitoring of POAP infrastructure components
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {lastRefresh && (
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          <Button 
            variant="outline" 
            onClick={fetchSystemData}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Overall Status */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon(health.overall.status)}
              <span className="ml-2">Overall System Status</span>
              {getStatusBadge(health.overall.status)}
            </CardTitle>
            <CardDescription>
              {health.service} v{health.version} • Uptime: {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {health.overall.ready ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-600">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {health.overall.totalResponseTime}ms
                </div>
                <div className="text-sm text-gray-600">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {health.environment.configured}/{health.environment.required}
                </div>
                <div className="text-sm text-gray-600">Config Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {health.environment.environment}
                </div>
                <div className="text-sm text-gray-600">Environment</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Status */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Database
                {getStatusBadge(health.database.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.database.status === 'connected' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Provider:</span>
                    <span className="text-sm font-medium">{health.database.provider}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Organizers:</span>
                    <span className="text-sm font-medium">{formatNumber(health.database.organizers || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Campaigns:</span>
                    <span className="text-sm font-medium">{formatNumber(health.database.campaigns || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Claims:</span>
                    <span className="text-sm font-medium">{formatNumber(health.database.claims || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response:</span>
                    <span className="text-sm font-medium">{health.database.responseTime}ms</span>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {health.database.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Solana Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5" />
                Solana Network
                {getStatusBadge(health.solana.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.solana.status === 'connected' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Network:</span>
                    <span className="text-sm font-medium">{health.solana.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Current Slot:</span>
                    <span className="text-sm font-medium">{formatNumber(health.solana.currentSlot || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Block Time:</span>
                    <span className="text-sm font-medium">
                      {health.solana.blockTime ? new Date(health.solana.blockTime).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Response:</span>
                    <span className="text-sm font-medium">{health.solana.responseTime}ms</span>
                  </div>
                </>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {health.solana.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Relayer Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Relayer
                {getStatusBadge(health.relayer.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {health.relayer.status !== 'error' && health.relayer.publicKey ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Balance:</span>
                    <span className="text-sm font-medium">
                      {health.relayer.balance?.toFixed(4)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Public Key:</span>
                    <span className="text-xs font-mono">
                      {health.relayer.publicKey.slice(0, 8)}...{health.relayer.publicKey.slice(-8)}
                    </span>
                  </div>
                  {health.relayer.warning && (
                    <Alert variant="default" className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-sm text-yellow-800">
                        {health.relayer.warning}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {health.relayer.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Statistics */}
      {stats && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              System Statistics
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Organizers</p>
                      <p className="text-2xl font-bold">{formatNumber(stats.overview.totalOrganizers)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Campaigns</p>
                      <p className="text-2xl font-bold">{formatNumber(stats.overview.totalCampaigns)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Zap className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">POAPs Claimed</p>
                      <p className="text-2xl font-bold">{formatNumber(stats.overview.totalClaims)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Gas Paid (SOL)</p>
                      <p className="text-2xl font-bold">{stats.overview.totalGasCostSOL.toFixed(4)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            {stats.activity.recentClaims.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Claims</CardTitle>
                  <CardDescription>Latest POAP claims across all campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.activity.recentClaims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{claim.campaign.name}</p>
                          <p className="text-sm text-gray-600">
                            by {claim.campaign.organizer.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">
                            {claim.userPublicKey.slice(0, 8)}...{claim.userPublicKey.slice(-8)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(claim.claimedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This dashboard shows real-time system health and statistics. 
          Data is automatically refreshed every 30 seconds.
        </AlertDescription>
      </Alert>
    </div>
  )
}