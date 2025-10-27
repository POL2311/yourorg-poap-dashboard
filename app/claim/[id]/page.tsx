'use client'
import MarketNavbar from '@/components/ui/MarketNavbar' // special market navbar

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast } from 'react-hot-toast'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import {
  CalendarDays,
  MapPin,
  Users,
  ExternalLink,
  Copy,
  Wallet as WalletIcon,
  Loader2,
  Zap,
  QrCode,
} from 'lucide-react'

import { useWalletConnection } from '@/hooks/use-wallet'

/* -------------------- Types -------------------- */
type PublicCampaign = {
  id: string
  name: string
  description?: string | null
  imageUrl?: string | null
  externalUrl?: string | null
  eventDate?: string | null
  location?: string | null
  isActive: boolean
  maxClaims?: number | null
  totalClaims?: number
  claimsRemaining?: number | null
  organizer?: { id: string; name: string; company?: string | null } | null
  requiresSecret?: boolean | null
}

/* -------------------- Page -------------------- */
export default function PublicCampaignPage({ params }: { params: { id: string } }) {
  const pathname = usePathname()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = `${origin}${pathname}`

  const {
    connected,
    connecting,
    isWalletAvailable,
    connect,
    disconnect,
    userPublicKey,
  } = useWalletConnection()

  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)

  const [secretCode, setSecretCode] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const r = await fetch(`/api/campaigns/${params.id}/public`, { signal: ac.signal })
        if (!r.ok) {
          setErr(r.status === 404 ? 'Campaign not found' : `Error ${r.status}`)
          return
        }
        const json = await r.json()
        setCampaign(json?.data ?? json)
      } catch (e: any) {
        if (e.name !== 'AbortError') setErr('We couldn’t load the campaign.')
      } finally {
        setLoading(false)
      }
    })()
    return () => ac.abort()
  }, [params.id])

  const remaining = useMemo(() => {
    if (typeof campaign?.claimsRemaining === 'number') return Math.max(0, campaign.claimsRemaining!)
    if (!campaign?.maxClaims) return null
    const total = Number(campaign?.totalClaims || 0)
    return Math.max(0, campaign.maxClaims - total)
  }, [campaign])

  const progressPct = useMemo(() => {
    if (!campaign?.maxClaims) return 0
    const total = Number(campaign.totalClaims || 0)
    return Math.min(100, (total / campaign.maxClaims) * 100)
  }, [campaign])

  const statusText = useMemo(() => {
    if (!campaign) return ''
    if (!campaign.isActive) return 'Inactive'
    if (remaining !== null && remaining <= 0) return 'Sold out'
    return 'Active'
  }, [campaign, remaining])

  const canClaim = useMemo(() => {
    if (!campaign) return false
    if (!campaign.isActive) return false
    if (remaining !== null && remaining <= 0) return false
    return true
  }, [campaign, remaining])

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Couldn’t copy')
    }
  }

  const onClaim = async () => {
    if (!campaign) return
    if (!connected || !userPublicKey) { toast.error('Connect your wallet first'); return }
    if (campaign.requiresSecret && !secretCode.trim()) {
      toast.error('This campaign requires a secret code'); return
    }
    try {
      setClaiming(true)
      const res = await fetch('/api/poap/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPublicKey, campaignId: campaign.id, secretCode: secretCode || undefined }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.success === false) throw new Error(json?.message || 'It couldn’t be claimed or you already claimed it.')
      toast.success('!POAP claimed!')
    } catch (e: any) {
      toast.error(e?.message || 'Error claiming')
    } finally {
      setClaiming(false)
    }
  }

  /* -------------------- UI -------------------- */
  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="grid place-items-center h-72 rounded-3xl border border-white/10 bg-white/5 text-white/80">
          <Loader2 className="h-6 w-6 animate-spin" /> 
        </div>
      </div>
    )
  }

  if (err || !campaign) {
    return (
      <div className="mx-auto max-w-6xl p-6 text-white">
        <div className="rounded-3xl border border-white/15 bg-white/10 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">We couldn’t display the campaign</h2>
          <p className="text-white/70">{err ?? 'Campaign not found.'}</p>
          <div className="mt-6"><Link href="/market" className="underline">Back to market</Link></div>
        </div>
      </div>
    )
  }

  return (
    
    <div className="mx-auto max-w-6xl p-6 text-white">
      {/* top actions */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <Button onClick={copyShare} variant="outline" className="rounded-full border-white/15 bg-white/10 text-white hover:bg-white/15">
          <Copy className="mr-2 h-4 w-4" /> Copy link
        </Button>
        {connected && (
          <div className="rounded-xl bg-[#6d4aff] px-4 py-2 text-sm font-semibold">
            {shortPk(userPublicKey)}
          </div>
        )}
      </div>

      {/* Header card */}
      <div className="rounded-[28px] border border-white/12 bg-white/[0.06] p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border border-white/12 bg-white/10">
              {campaign.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.imageUrl} alt={campaign.name} className="h-full w-full object-cover" />
              ) : (
                <QrCode className="h-8 w-8 text-white/70" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{campaign.name}</h1>
                <Badge variant={campaign.isActive ? 'success' : 'secondary'}>{statusText}</Badge>
              </div>
              {campaign.description && (
                <p className="mt-1 text-white/80">{campaign.description}</p>
              )}
              <div className="mt-3">
                {campaign.externalUrl && (
                  <a
                    href={campaign.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                  >
                    <span>Visit event site</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:w-[520px]">
            <Chip icon={<CalendarDays className="h-4 w-4" />} text={safeDate(campaign.eventDate)} />
            <Chip icon={<MapPin className="h-4 w-4" />} text={campaign.location || '—'} />
            <Chip
              icon={<Users className="h-4 w-4" />}
              text={
                campaign.maxClaims
                  ? `${Number(campaign.totalClaims || 0)} / ${campaign.maxClaims} · remaining ${remaining ?? '∞'}`
                  : `${Number(campaign.totalClaims || 0)} claims`
              }
            />
          </div>
        </div>
      </div>

      {/* Claim card */}
      <div className="mt-6 rounded-[28px] border border-white/12 bg-white/[0.06] p-6 backdrop-blur-xl">
        <h3 className="text-center text-xl font-semibold">Claim your POAP</h3>
        <p className="mt-1 text-center text-white/70 text-sm">
          Connect your wallet and claim your proof of attendance (free)
        </p>

        <div className="mx-auto mt-6 max-w-3xl space-y-4">
          {!connected ? (
            <>
              {isWalletAvailable ? (
                <Button
                  onClick={connect}
                  disabled={connecting}
                  className="w-full rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WalletIcon className="mr-2 h-4 w-4" />}
                  {connecting ? 'Connecting…' : 'Connect wallet'}
                </Button>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a href="https://phantom.app/download" target="_blank" rel="noreferrer"
                     className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm hover:bg-white/15">
                    Install Phantom
                  </a>
                  <a href="https://solflare.com/download" target="_blank" rel="noreferrer"
                     className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center text-sm hover:bg-white/15">
                    Install Solflare
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Wallet */}
              <label className="block text-sm text-white/70">Connected wallet</label>
              <div className="rounded-xl border border-white/12 bg-white/10 px-4 py-3 font-mono">
                {userPublicKey}
              </div>

              {/* Secret code */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm text-white/70">
                    Secret Code
                    {campaign.requiresSecret ? <span className="ml-1 text-rose-300">*</span> : <span className="ml-1 opacity-60">(optional)</span>}
                  </label>
                </div>
                <input
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder={campaign.requiresSecret ? 'Enter this campaign’s code' : 'Optional'}
                  className="mt-1 w-full rounded-xl border border-white/12 bg-white/10 px-4 py-2.5 outline-none"
                />
              </div>

              {/* Claim button */}
              <Button
                onClick={onClaim}
                disabled={!canClaim || claiming}
                className="mt-1 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
              >
                {claiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                {claiming ? 'Claiming…' : '⚡ Claim POAP (Free)'}
              </Button>

              {/* legend */}
              <div className="mt-2 text-center text-sm text-white/70">
                <span className="inline-flex items-center gap-1">
                  <span className="inline-block h-3.5 w-3.5 rounded-sm border border-white/20" /> Gasless mint on Solana
                </span>
              </div>

              {/* progress */}
              {campaign.maxClaims ? (
                <>
                  <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-600/70"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="mt-2 text-center text-sm text-white/70">
                    {remaining ?? '∞'} POAP(s) left
                  </div>
                </>
              ) : null}

              {/* Disconnect */}
              <Button
                onClick={disconnect}
                variant="outline"
                className="mt-3 w-full rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Disconnect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------- UI Helpers -------------------- */
function Chip({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-2 text-sm">
      {icon}
      <span className="truncate">{text}</span>
    </div>
  )
}

function shortPk(pk?: string | null) {
  if (!pk) return ''
  return `${pk.slice(0, 3)}…${pk.slice(-3)}`
}

function safeDate(d?: string | null) {
  if (!d) return '—'
  const date = new Date(d)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}
