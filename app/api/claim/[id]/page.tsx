'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Calendar, MapPin, Users, ExternalLink, CheckCircle, AlertTriangle, Loader2, Copy, Zap, X, Check, Info } from 'lucide-react'
import { formatDate, formatNumber } from '@/lib/utils'
import { apiClient } from '@/lib/api'
import type { PublicCampaign } from '@/lib/types'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

interface ClaimPageProps {
  params: { id: string }
}

interface ClaimState {
  status: 'idle' | 'loading' | 'success' | 'error'
  error?: string
  result?: {
    message: string
    nft: { mint: string; transactionSignature: string }
    explorerUrl: string
  }
}

interface CodeValidationState {
  status: 'idle' | 'validating' | 'valid' | 'invalid' | 'unknown'
  message?: string
  requiresCode?: boolean
}

export default function ClaimPage({ params }: ClaimPageProps) {
  const { publicKey, connected } = useWallet()
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [secretCode, setSecretCode] = useState('')
  const [claimState, setClaimState] = useState<ClaimState>({ status: 'idle' })
  const [codeValidation, setCodeValidation] = useState<CodeValidationState>({ status: 'idle' })

  useEffect(() => {
    (async () => {
      try {
        const response = await apiClient.getPublicCampaign(params.id)
        if (response.success && response.data) setCampaign(response.data)
        else setClaimState({ status: 'error', error: 'Campaign not found or inactive' })
      } catch {
        setClaimState({ status: 'error', error: 'Failed to load campaign' })
      } finally {
        setLoading(false)
      }
    })()
  }, [params.id])

  // Debounced code validation
  const validateCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setCodeValidation({ status: 'idle' })
      return
    }

    // If campaign doesn't require a secret code, mark as valid
    if (!campaign?.secretCode) {
      setCodeValidation({ 
        status: 'valid', 
        message: 'No code required for this campaign',
        requiresCode: false 
      })
      return
    }

    setCodeValidation({ status: 'validating' })

    try {
      const response = await fetch(`/api/validate-code/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ secretCode: code }),
      })

      const data = await response.json()

      if (data.success) {
        setCodeValidation({
          status: data.data.isValid ? 'valid' : 'invalid',
          message: data.data.message,
          requiresCode: data.data.requiresCode
        })
      } else {
        setCodeValidation({
          status: 'unknown',
          message: 'Code validation unavailable - will be checked during claim'
        })
      }
    } catch (error) {
      setCodeValidation({
        status: 'unknown',
        message: 'Code validation unavailable - will be checked during claim'
      })
    }
  }, [params.id, campaign?.secretCode])

  // Debounce the validation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateCode(secretCode)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [secretCode, validateCode])

  const handleClaim = async () => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    if (campaign?.secretCode && !secretCode) {
      toast.error('Please enter the secret code')
      return
    }

    // Only block if we know for sure the code is invalid
    if (campaign?.secretCode && codeValidation.status === 'invalid') {
      toast.error('Please enter a valid secret code')
      return
    }

    setClaimState({ status: 'loading' })

    try {
      // Use the Next.js API route to proxy the claim
      const response = await fetch(`/api/claim/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPublicKey: publicKey.toString(),
          secretCode: secretCode || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setClaimState({
          status: 'success',
          result: {
            message: data.data.message,
            nft: data.data.nft,
            explorerUrl: data.data.explorerUrl,
          }
        })
        toast.success('POAP claimed successfully!')
      } else {
        setClaimState({
          status: 'error',
          error: data.error || 'Failed to claim POAP'
        })
        toast.error(data.error || 'Failed to claim POAP')
      }
    } catch (error) {
      setClaimState({
        status: 'error',
        error: 'Network error. Please try again.'
      })
      toast.error('Network error. Please try again.')
    }
  }

  const copyClaimUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Claim URL copied to clipboard!')
  }

  // Check if claim button should be enabled
  const isClaimButtonEnabled = () => {
    if (!connected || !campaign?.isActive || claimState.status === 'loading') {
      return false
    }
    
    // If campaign requires secret code
    if (campaign.secretCode) {
      // Allow if code is valid or validation is unknown (will be checked server-side)
      return codeValidation.status === 'valid' || codeValidation.status === 'unknown'
    }
    
    return true
  }

  const getCodeValidationIcon = () => {
    switch (codeValidation.status) {
      case 'validating':
        return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      case 'valid':
        return <Check className="h-4 w-4 text-green-500" />
      case 'invalid':
        return <X className="h-4 w-4 text-red-500" />
      case 'unknown':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getCodeInputBorderColor = () => {
    switch (codeValidation.status) {
      case 'valid':
        return 'border-green-500 focus:border-green-500 focus:ring-green-500'
      case 'invalid':
        return 'border-red-500 focus:border-red-500 focus:ring-red-500'
      case 'unknown':
        return 'border-blue-500 focus:border-blue-500 focus:ring-blue-500'
      default:
        return ''
    }
  }

  const getValidationMessage = () => {
    if (!campaign?.secretCode) return null
    
    switch (codeValidation.status) {
      case 'invalid':
        return (
          <p className="text-xs text-red-600">
            {codeValidation.message}
          </p>
        )
      case 'valid':
        return (
          <p className="text-xs text-green-600">
            {codeValidation.message}
          </p>
        )
      case 'unknown':
        return (
          <p className="text-xs text-blue-600">
            {codeValidation.message}
          </p>
        )
      default:
        return (
          <p className="text-xs text-gray-500">
            This code was provided by the event organizer
          </p>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    )
  }

  if (claimState.status === 'error' && !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <CardTitle>Campaign Not Found</CardTitle>
            <CardDescription>
              The POAP campaign you're looking for doesn't exist or is no longer active.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              {claimState.error}
            </p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!campaign) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-indigo-600" />
            <span className="text-xl font-bold text-white">POAP Claim</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={copyClaimUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Link
            </Button>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Campaign Info */}
          <Card className="mb-8">
            <CardHeader className="text-center">
              {campaign.imageUrl && (
                <div className="mx-auto mb-4">
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                </div>
              )}
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              {campaign.description && (
                <CardDescription className="text-base mt-2">
                  {campaign.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                  <span>{formatDate(campaign.eventDate)}</span>
                </div>
                {campaign.location && (
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    <span>{campaign.location}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                  <span>
                    {formatNumber(campaign._count?.claims || 0)} claimed
                    {campaign.maxClaims && ` / ${formatNumber(campaign.maxClaims)}`}
                  </span>
                </div>
                <div className="flex items-center">
                  <Badge variant={campaign.isActive ? "success" : "secondary"}>
                    {campaign.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {campaign.externalUrl && (
                <>
                  <Separator className="my-4" />
                  <div className="text-center">
                    <a
                      href={campaign.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-500"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Event Website
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Claim Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Claim Your POAP</CardTitle>
              <CardDescription className="text-center">
                Connect your wallet and claim your Proof of Attendance NFT
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Wallet Connection */}
              {!connected ? (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Connect your Solana wallet to claim your POAP
                  </p>
                  <WalletMultiButton />
                </div>
              ) : (
                <>
                  {/* Success State */}
                  {claimState.status === 'success' && claimState.result && (
                    <Alert variant="default" className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <div className="space-y-2">
                          <p className="font-medium">{claimState.result.message}</p>
                          <div className="space-y-1 text-sm">
                            <p>
                              <strong>NFT Mint:</strong>{' '}
                              <code className="bg-green-100 px-2 py-1 rounded">
                                {claimState.result.nft.mint}
                              </code>
                            </p>
                            <p>
                              <a
                                href={claimState.result.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-green-700 hover:text-green-600"
                              >
                                <ExternalLink className="mr-1 h-3 w-3" />
                                View on Solana Explorer
                              </a>
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Error State */}
                  {claimState.status === 'error' && claimState.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{claimState.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Claim Form */}
                  {claimState.status !== 'success' && (
                    <>
                      <div className="space-y-4">
                        <div>
                          <Label>Connected Wallet</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <code className="text-sm">{publicKey?.toString()}</code>
                          </div>
                        </div>

                        {campaign.secretCode && (
                          <div>
                            <Label htmlFor="secretCode">Secret Code</Label>
                            <div className="relative">
                              <Input
                                id="secretCode"
                                type="text"
                                placeholder="Enter the event secret code"
                                value={secretCode}
                                onChange={(e) => setSecretCode(e.target.value)}
                                disabled={claimState.status === 'loading'}
                                className={`pr-10 ${getCodeInputBorderColor()}`}
                              />
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                {getCodeValidationIcon()}
                              </div>
                            </div>
                            <div className="mt-1">
                              {getValidationMessage()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-center">
                        <Button
                          onClick={handleClaim}
                          disabled={!isClaimButtonEnabled()}
                          size="lg"
                          className="w-full"
                        >
                          {claimState.status === 'loading' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Claiming POAP...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Claim POAP (Free)
                            </>
                          )}
                        </Button>
                        {!campaign.isActive && (
                          <p className="text-sm text-red-600 mt-2">
                            This campaign is no longer active
                          </p>
                        )}
                        {campaign.secretCode && codeValidation.status === 'invalid' && (
                          <p className="text-sm text-red-600 mt-2">
                            Please enter a valid secret code to enable claiming
                          </p>
                        )}
                        {campaign.secretCode && codeValidation.status === 'unknown' && secretCode && (
                          <p className="text-sm text-blue-600 mt-2">
                            Code validation will be performed during claim
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Info */}
              <div className="text-center text-sm text-gray-500 space-y-1">
                <p>🔒 This POAP is minted gaslessly - you pay no fees!</p>
                <p>⚡ Powered by Solana blockchain</p>
                {campaign.maxClaims && (
                  <p>
                    📊 {formatNumber(campaign.claimsRemaining || 0)} POAPs remaining
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}