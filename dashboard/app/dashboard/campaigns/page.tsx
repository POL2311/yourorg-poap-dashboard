'use client'

import { useState } from 'react'
import { useCampaigns, useCreateCampaign, useDeleteCampaign } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { Campaign } from '@/lib/types' // 👈 usa Campaign, no PublicCampaign

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Search, Calendar, Users } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'
import { CampaignForm } from '@/components/forms/campaign-form'
import { CampaignActions } from '@/components/campaigns/campaign-actions'

export default function CampaignsPage() {
  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { organizer } = useAuth()

  const { data: campaignsData, isLoading } = useCampaigns({
    search: search || undefined,
    limit: 50,
  })

  const createCampaignMutation = useCreateCampaign()
  const deleteCampaignMutation = useDeleteCampaign()

  const campaigns: Campaign[] = campaignsData?.data?.campaigns || []

  const handleCreateCampaign = async (data: any) => {
    const result = await createCampaignMutation.mutateAsync(data)
    if (result.success) setIsCreateDialogOpen(false)
  }

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaignMutation.mutateAsync(id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your POAP campaigns</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Manage your POAP campaigns and track their performance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>Set up a new POAP campaign for your event</DialogDescription>
            </DialogHeader>
            <CampaignForm 
              onSubmit={handleCreateCampaign}
              isLoading={createCampaignMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(campaigns.reduce((sum, c) => sum + (c._count?.claims || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Limit</CardTitle>
            <Badge variant="secondary">{organizer?.tier}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length} / {organizer?.tier === 'free' ? 3 : organizer?.tier === 'pro' ? 50 : 500}
            </div>
            <p className="text-xs text-muted-foreground">Campaigns used</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-6">Create your first POAP campaign to get started</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Event Date</TableHead>
                  <TableHead>Claims</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const remaining =
                    campaign.maxClaims != null
                      ? Math.max(0, campaign.maxClaims - (campaign._count?.claims ?? 0))
                      : null

                  return (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{campaign.name}</div>
                          {campaign.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {campaign.description}
                            </div>
                          )}
                          {campaign.location && (
                            <div className="text-xs text-gray-400">📍 {campaign.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(campaign.eventDate)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {formatNumber(campaign._count?.claims || 0)}
                          </span>
                          {campaign.maxClaims != null && (
                            <span className="text-xs text-muted-foreground">
                              {formatNumber(remaining ?? 0)} remaining
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={campaign.isActive ? 'success' : 'secondary'}>
                          {campaign.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <CampaignActions
                          campaignId={campaign.id}
                          campaignName={campaign.name}
                          onDelete={() => handleDeleteCampaign(campaign.id)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}