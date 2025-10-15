'use client'

import { useState } from 'react'
import { useApiKeys, useCreateApiKey, useDeactivateApiKey } from '@/hooks/use-api'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Key, 
  MoreHorizontal, 
  Copy, 
  Trash2, 
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { formatDateTime, truncateAddress } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export default function ApiKeysPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const { organizer } = useAuth()
  
  const { data: apiKeysData, isLoading } = useApiKeys()
  const createApiKeyMutation = useCreateApiKey()
  const deactivateApiKeyMutation = useDeactivateApiKey()

  const apiKeys = apiKeysData?.data || []

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }

    const result = await createApiKeyMutation.mutateAsync({ name: newKeyName })
    if (result.success) {
      setIsCreateDialogOpen(false)
      setNewKeyName('')
      // Show the new key temporarily
      if (result.data) {
        setVisibleKeys(prev => new Set(prev).add(result.data.id))
        setTimeout(() => {
          setVisibleKeys(prev => {
            const newSet = new Set(prev)
            newSet.delete(result.data.id)
            return newSet
          })
        }, 30000) // Hide after 30 seconds
      }
    }
  }

  const handleDeactivateApiKey = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate "${name}"? This action cannot be undone.`)) {
      await deactivateApiKeyMutation.mutateAsync(id)
    }
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('API key copied to clipboard!')
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const canCreateApiKey = organizer ? 
    (organizer.tier === 'free' ? apiKeys.length < 2 : 
     organizer.tier === 'pro' ? apiKeys.length < 10 : 
     apiKeys.length < 50) : false

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
            <p className="text-gray-600 mt-1">Manage your API keys</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-600 mt-1">
            Manage API keys for accessing the POAP claiming endpoints
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateApiKey}>
              <Plus className="mr-2 h-4 w-4" />
              New API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for accessing POAP claiming endpoints
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keyName">API Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="e.g., Production API Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={createApiKeyMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createApiKeyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateApiKey}
                  disabled={createApiKeyMutation.isPending}
                >
                  {createApiKeyMutation.isPending ? 'Creating...' : 'Create API Key'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.filter(k => k.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {apiKeys.length} total keys
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tier Limit</CardTitle>
            <Badge variant="secondary">{organizer?.tier}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.length} / {organizer?.tier === 'free' ? 2 : organizer?.tier === 'pro' ? 10 : 50}
            </div>
            <p className="text-xs text-muted-foreground">
              Keys used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Used</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {apiKeys.some(k => k.lastUsedAt) ? 'Recently' : 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">
              API activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate requests to the POAP claiming API
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canCreateApiKey && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You've reached the maximum number of API keys for your {organizer?.tier} tier. 
                Upgrade to create more keys.
              </AlertDescription>
            </Alert>
          )}

          {apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No API keys yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first API key to start using the POAP claiming API
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!canCreateApiKey}>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell>
                      <div className="font-medium">{apiKey.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {visibleKeys.has(apiKey.id) 
                            ? apiKey.key 
                            : truncateAddress(apiKey.key, 8)
                          }
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyApiKey(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={apiKey.isActive ? "success" : "secondary"}>
                        {apiKey.isActive ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          'Inactive'
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {apiKey.lastUsedAt 
                          ? formatDateTime(apiKey.lastUsedAt)
                          : 'Never'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(apiKey.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyApiKey(apiKey.key)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Key
                          </DropdownMenuItem>
                          {apiKey.isActive && (
                            <DropdownMenuItem 
                              onClick={() => handleDeactivateApiKey(apiKey.id, apiKey.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use API Keys</CardTitle>
          <CardDescription>
            Include your API key in the Authorization header when making requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Authentication Header</h4>
            <code className="block bg-gray-100 p-3 rounded text-sm">
              Authorization: ApiKey YOUR_API_KEY_HERE
            </code>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Example POAP Claim Request</h4>
            <code className="block bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap">
              {`curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/api/poap/claim \\
                -H "Authorization: ApiKey YOUR_API_KEY_HERE" \\
                -H "Content-Type: application/json" \\
                -d '{
                  "userPublicKey": "USER_SOLANA_PUBLIC_KEY",
                  "campaignId": "CAMPAIGN_ID",
                  "secretCode": "EVENT_SECRET_CODE"
                }'`}
            </code>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Keep your API keys secure!</strong> Never expose them in client-side code or public repositories.
              Use them only in server-side applications or secure environments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}