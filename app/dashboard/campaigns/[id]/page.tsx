'use client'
import { PublicCampaign } from '@/lib/types'  // ✅
import { useState } from 'react'
import { useCampaign, useCampaignAnalytics, useCampaignClaims } from '@/hooks/use-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { 
  Calendar, 
  Users, 
  MapPin, 
  ExternalLink, 
  Copy, 
  Edit,
  TrendingUp,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { formatDate, formatDateTime, formatNumber, formatSOL, truncateAddress } from '@/lib/utils'
import { CampaignActions } from '@/components/campaigns/campaign-actions'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface CampaignDetailPageProps {
  params: {
    id: string
  }
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const { data: campaignData, isLoading: campaignLoading } = useCampaign(params.id)
  const { data: analyticsData, isLoading: analyticsLoading } = useCampaignAnalytics(params.id)
  const { data: claimsData, isLoading: claimsLoading } = useCampaignClaims(params.id, {
    page: currentPage,
    limit: 20,
  })

  const campaign = campaignData?.data
  const analytics = analyticsData?.data
  const claims = claimsData?.data?.claims || []
  const pagination = claimsData?.data?.pagination

  if (campaignLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Not Found</h1>
        <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist.</p>
        <Link href="/dashboard/campaigns">
          <Button>Back to Campaigns</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <Badge variant={campaign.isActive ? "success" : "secondary"}>
              {campaign.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-gray-600 mb-2">{campaign.description}</p>
          )}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {formatDate(campaign.eventDate)}
            </div>
            {campaign.location && (
              <div className="flex items-center">
                <MapPin className="mr-1 h-4 w-4" />
                {campaign.location}
              </div>
            )}
            {campaign.organizer && (
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                {campaign.organizer.name}
              </div>
            )}
          </div>
        </div>
        <CampaignActions
          campaignId={campaign.id}
          campaignName={campaign.name}
          showViewDetails={false}
        />
      </div>

      {/* Stats Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.claims.total)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.claims.remaining !== null && (
                  `${formatNumber(analytics.claims.remaining)} remaining`
                )}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analytics.claims.thisMonth)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(analytics.claims.thisWeek)} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gas Costs</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatSOL(analytics.gas.totalCost)}</div>
              <p className="text-xs text-muted-foreground">
                {formatSOL(analytics.gas.averageCost)} avg per claim
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {campaign.maxClaims 
                  ? `${((analytics.claims.total / campaign.maxClaims) * 100).toFixed(1)}%`
                  : '∞'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {campaign.maxClaims ? `of ${formatNumber(campaign.maxClaims)} max` : 'No limit set'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Claims Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Claims</CardTitle>
                  <CardDescription>
                    Claims over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.dailyClaims}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="claims" 
                        stroke="#6366f1" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Claims Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Claims Summary</CardTitle>
                  <CardDescription>
                    Breakdown of claim activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today</span>
                    <span className="font-medium">{formatNumber(analytics.claims.today)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Week</span>
                    <span className="font-medium">{formatNumber(analytics.claims.thisWeek)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-medium">{formatNumber(analytics.claims.thisMonth)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">All Time</span>
                    <span className="font-medium">{formatNumber(analytics.claims.total)}</span>
                  </div>
                  {analytics.claims.remaining !== null && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="font-medium text-green-600">
                        {formatNumber(analytics.claims.remaining)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Claims</CardTitle>
              <CardDescription>
                Latest POAP claims for this campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : claims.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No claims yet
                  </h3>
                  <p className="text-gray-600">
                    Claims will appear here once users start claiming POAPs
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>NFT Mint</TableHead>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Gas Cost</TableHead>
                        <TableHead>Claimed At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {truncateAddress(claim.userPublicKey)}
                            </code>
                          </TableCell>
                          <TableCell>
                            {claim.mintAddress ? (
                              <a
                                href={`https://explorer.solana.com/address/${claim.mintAddress}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {truncateAddress(claim.mintAddress)}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {claim.transactionHash ? (
                              <a
                                href={`https://explorer.solana.com/tx/${claim.transactionHash}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                {truncateAddress(claim.transactionHash)}
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {claim.gasCost ? formatSOL(claim.gasCost) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {formatDateTime(claim.claimedAt)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {pagination && pagination.pages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} claims
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Claim Integration</CardTitle>
              <CardDescription>
                Share these links and QR codes for easy POAP claiming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Direct Claim URL */}
              <div>
                <h4 className="font-medium mb-2">Public Claim Page</h4>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-gray-100 p-3 rounded text-sm">
                    {`${window.location.origin}/claim/${params.id}`}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/claim/${params.id}`)
                    toast.success('Claim URL copied!')
                  }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Share this URL with your event attendees for direct POAP claiming
                </p>
              </div>

              {/* Campaign Actions */}
              <div>
                <h4 className="font-medium mb-2">Quick Actions</h4>
                <CampaignActions
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  showViewDetails={false}
                />
              </div>

              {/* Campaign Details */}
              <div>
                <h4 className="font-medium mb-2">Campaign Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Campaign ID:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{campaign.id}</code>
                  </div>
                  {campaign.secretCode && (
                    <div>
                      <span className="text-gray-600">Secret Code:</span>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{campaign.secretCode}</code>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Max Claims:</span>
                    <span className="ml-2">{campaign.maxClaims || 'Unlimited'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={campaign.isActive ? "success" : "secondary"} className="ml-2">
                      {campaign.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
              <CardDescription>
                Manage campaign configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Settings Coming Soon
                </h3>
                <p className="text-gray-600">
                  Campaign settings and configuration options will be available in a future update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}