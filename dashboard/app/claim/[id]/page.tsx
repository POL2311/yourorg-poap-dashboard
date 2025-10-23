// app/claim/[id]/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  Zap, Copy, Calendar, MapPin, Users, Globe, CheckCircle2,
  Lock, Check, QrCode, ExternalLink, Loader2,
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import type { PublicCampaign } from '@/lib/types'
import GlassSidebar from '@/components/layout/GlassSidebar'
import { Button } from '@/components/ui/button'

/* ---------- helpers UI ---------- */
function StatPill({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur">
      <span className="opacity-90">{icon}</span>
      <span>{label}</span>
    </span>
  )
}

function KChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  )
}

function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-emerald-400/80" style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ---------- tipos ---------- */
interface PageProps { params: { id: string } }
type ClaimState =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; mint: string; explorerUrl: string; message: string }
  | { status: 'error'; error: string }

/* ---------- página ---------- */
export default function ClaimPage({ params }: PageProps) {
  const { publicKey, connected } = useWallet()
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [secret, setSecret] = useState('')
  const [state, setState] = useState<ClaimState>({ status: 'idle' })

  useEffect(() => {
    (async () => {
      try {
        const r = await apiClient.getPublicCampaign(params.id)
        if (r.success && r.data) setCampaign(r.data)
        else setState({ status: 'error', error: 'Campaña no encontrada o inactiva.' })
      } catch {
        setState({ status: 'error', error: 'No se pudo cargar la campaña.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [params.id])

  const totalClaims = campaign?._count?.claims ?? 0
  const maxClaims = campaign?.maxClaims ?? 0
  const remaining = useMemo(() => {
    return Math.max(0, (campaign?.maxClaims ?? 0) - (campaign?._count?.claims ?? 0))
  }, [campaign])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Enlace copiado')
  }

  const claim = async () => {
    if (!connected || !publicKey) {
      toast.error('Conecta tu wallet')
      return
    }
    if (campaign?.secretCode && !secret.trim()) {
      toast.error('Ingresa el código secreto')
      return
    }
    setState({ status: 'loading' })
    try {
      const res = await fetch(`/api/claim/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPublicKey: publicKey.toString(), secretCode: secret || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setState({
          status: 'success',
          mint: data.data.nft.mint,
          message: data.data.message,
          explorerUrl: data.data.explorerUrl,
        })
        toast.success('¡POAP reclamado!')
      } else {
        setState({ status: 'error', error: data.error || 'Error al reclamar' })
        toast.error(data.error || 'Error al reclamar')
      }
    } catch {
      setState({ status: 'error', error: 'Error de red. Intenta de nuevo.' })
      toast.error('Error de red. Intenta de nuevo.')
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-slate-950">
        <div className="flex items-center gap-3 text-white/80">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando campaña…
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-slate-950">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/80">
          No encontramos esta campaña.
          <div className="mt-4">
            <Link href="/" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white">
      {/* glow de fondo */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_0%_0%,#6ee7b7_0%,transparent_60%),radial-gradient(900px_600px_at_100%_20%,#a78bfa_0%,transparent_55%)] opacity-[0.18]" />
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
        {/* Sidebar igual al dashboard */}
        <GlassSidebar />

        {/* Main */}
        <main className="flex-1 space-y-6">
          {/* Botones superiores a la derecha */}
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/90 hover:bg-white/15"
              >
                <Copy className="mr-2 inline h-4 w-4" />
                Copiar enlace
              </button>
              <WalletMultiButton />
            </div>
          </div>

          {/* ===== HERO NUEVO ===== */}
          <section className="rounded-3xl border border-white/10 bg-white/10/opacity-5 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex flex-col items-start gap-6 md:flex-row">
              {/* Imagen */}
              <div className="flex-shrink-0">
                {campaign.imageUrl ? (
                  <img
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    className="h-28 w-28 rounded-2xl border border-white/15 object-cover shadow-lg shadow-black/20"
                  />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-2xl border border-white/15 bg-white/10">
                    <QrCode className="h-7 w-7" />
                  </div>
                )}
              </div>

              {/* Título + descripción + link */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold leading-tight">{campaign.name}</h1>
                  <KChip>
                    {campaign.isActive ? (
                      <>
                        <Check className="h-3 w-3" /> Activa
                      </>
                    ) : (
                      <>
                        <Lock className="h-3 w-3" /> Inactiva
                      </>
                    )}
                  </KChip>
                </div>

                {campaign.description && (
                  <p className="max-w-3xl text-sm text-white/75">{campaign.description}</p>
                )}

                {campaign.externalUrl && (
                  <a
                    href={campaign.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm transition hover:bg-white/12"
                  >
                    <Globe className="h-4 w-4" />
                    Visitar sitio del evento
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                )}
              </div>
            </div>

            {/* Stats debajo del hero */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StatPill
                icon={<Calendar className="h-4 w-4" />}
                label={new Date(campaign.eventDate).toLocaleDateString()}
              />
              <StatPill icon={<MapPin className="h-4 w-4" />} label={campaign.location || '—'} />

              {maxClaims > 0 ? (
                <StatPill
                  icon={<Users className="h-4 w-4" />}
                  label={
                    <>
                      {totalClaims} / {maxClaims} · <span className="opacity-80">restan</span>{' '}
                      <span className="font-semibold">{remaining}</span>
                    </>
                  }
                />
              ) : (
                <StatPill icon={<Users className="h-4 w-4" />} label={`${totalClaims} claims`} />
              )}
            </div>
          </section>
          {/* ===== FIN HERO ===== */}

          {/* Tarjeta de claim */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl shadow-[0_10px_40px_-20px_rgba(0,0,0,.6)]">
            <h2 className="text-center text-lg font-semibold">Reclama tu POAP</h2>
            <p className="mt-1 text-center text-sm text-white/70">
              Conecta tu wallet y reclama tu prueba de asistencia (costo 0)
            </p>

            <div className="mx-auto mt-6 max-w-2xl space-y-4">
              {/* estado */}
              {state.status === 'success' && (
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5" />
                    <div className="text-sm">
                      <p className="font-medium">{state.message}</p>
                      <div className="mt-2 grid gap-1">
                        <div>
                          <span className="text-emerald-200/80">NFT Mint:</span>{' '}
                          <code className="rounded bg-emerald-400/15 px-2 py-0.5">{state.mint}</code>
                        </div>
                        <a
                          href={state.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-100/90 underline-offset-2 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Ver en Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {state.status === 'error' && (
                <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">
                  {state.error}
                </div>
              )}

              {/* wallet */}
              <div>
                <div className="text-xs text-white/60">Wallet conectada</div>
                <div className="mt-1 rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-sm text-white/80">
                  {connected ? publicKey?.toString() : '— no conectada —'}
                </div>
              </div>

              {/* código secreto (si aplica) */}
              {campaign.secretCode && state.status !== 'success' && (
                <div>
                  <label className="text-xs text-white/60">Código secreto</label>
                  <input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Ingresa el código del evento"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/30 focus:border-white/20"
                  />
                </div>
              )}

              {/* botón claim */}
              {state.status !== 'success' && (
                <Button
                  disabled={!campaign.isActive || state.status === 'loading' || !connected}
                  onClick={claim}
                  className="flex w-full items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 py-3 text-emerald-100 hover:bg-emerald-500/25"
                >
                  {state.status === 'loading' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reclamando…
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" /> Claim POAP (Free)
                    </>
                  )}
                </Button>
              )}

              {/* nota + progreso */}
              <div className="space-y-2 text-center text-xs text-white/60">
                <div>🔒 Gasless mint en Solana</div>
                {campaign.maxClaims ? (
                  <div className="mx-auto max-w-md space-y-1">
                    <Progress value={totalClaims} max={campaign.maxClaims} />
                    <div>
                      Quedan <span className="font-medium text-white">{remaining}</span> POAP(s)
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
