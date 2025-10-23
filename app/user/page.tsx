'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { BadgeGallery } from '@/components/badges/BadgeGallery'
import { useAuth } from '@/hooks/use-auth'
import { useWalletConnection } from '@/hooks/use-wallet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import {
  Loader2, LogOut, Wallet, RefreshCw, Shield, Trophy, Sparkles,
  CheckCircle2, Stars, ArrowRight, Coins,
} from 'lucide-react'

// Tokens reclamados (SPL) vía RPC
import { useClaimedTokens } from '@/hooks/use-claimed-tokens'

// Galería redonda tipo badge para tokens reclamados
import ClaimedTokensGallery from '@/components/tokens/ClaimedTokensGallery'

type ClaimStats = {
  userId?: string
  userPublicKey?: string
  totalClaims: number
  monthlyStats: Array<{ month: string; count: number }>
  badges: Array<{
    id: string
    name: string
    description: string
    icon: string
    rarity: string
    unlocked: boolean
    progress?: number
    target?: number
    imageUrl?: string
  }>
  level: { level: number; name: string; color: string }
}

/* ---------- UI helpers ---------- */
function TierChip({ tier = 'FREE' }: { tier?: string }) {
  const map: Record<string, string> = {
    PRO: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
    ENTERPRISE: 'bg-yellow-500/20 text-yellow-200 border-yellow-400/30',
    FREE: 'bg-white/10 text-white/80 border-white/20',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${map[tier] ?? map.FREE}`}>
      {tier}
    </span>
  )
}
function StatPill({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 backdrop-blur">
      {icon}
      <span className="text-sm text-white/85">{label}</span>
      <span className="ml-1 text-sm font-semibold text-white">{value}</span>
    </div>
  )
}
function LevelBadge({ level, name }: { level: number; name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/15 px-3 py-1.5 text-sm text-purple-100">
      <Stars className="h-4 w-4" />
      <span className="font-semibold">Nivel {level}</span>
      <span className="opacity-80">· {name}</span>
    </div>
  )
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-sm text-white/70">{k}:</span>
      <div className="text-sm">{v}</div>
    </div>
  )
}
function Tile({ label, value, gradient }: { label: string; value: string | number; gradient: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-r ${gradient} p-4`}>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/80">{label}</div>
    </div>
  )
}

/* ---------- utils: throttle ---------- */
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let last = 0
  let timer: any
  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = ms - (now - last)
    if (remaining <= 0) {
      last = now
      fn(...args)
    } else {
      clearTimeout(timer)
      timer = setTimeout(() => {
        last = Date.now()
        fn(...args)
      }, remaining)
    }
  }
}

/* ---------- página ---------- */
export default function UserProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const {
    connected, connecting, userPublicKey, connect, disconnect, walletName, isWalletAvailable,
  } = useWalletConnection()

  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // (opcional) filtrar por mints de tus campañas
  const campaignMints: string[] | undefined = undefined
  const {
    data: claimsData,
    loading: claimsLoading,
    error: claimsError,
  } = useClaimedTokens(connected ? userPublicKey || undefined : undefined, campaignMints)

  /* ---------- guard de login (una vez) ---------- */
  useEffect(() => {
    if (isLoading) return
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('jwt')
        : null
    if (!isAuthenticated && !token) router.replace('/login')
  }, [isLoading, isAuthenticated, router])

  /* ---------- fetchers con abort ---------- */
  const abortRef = useRef<AbortController | null>(null)
  const loadClaimStats = async () => {
    if (!user?.id) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setStatsLoading(true)
    try {
      const r = connected && userPublicKey
        ? await apiClient.getUserClaimStatsByWallet(userPublicKey, { signal: abortRef.current.signal as any })
        : await apiClient.getUserClaimStats({ signal: abortRef.current.signal as any })
      if (r.success && r.data) setClaimStats(r.data)
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error(e)
        toast.error('Error al cargar estadísticas de claims')
      }
    } finally {
      setStatsLoading(false)
    }
  }

  /* ---------- inicialización protegida (evita StrictMode doble) ---------- */
  const didInit = useRef(false)
  useEffect(() => {
    if (!isAuthenticated || didInit.current) return
    didInit.current = true
    ;(async () => {
      try {
        await refreshProfile()   // solo al montar
      } catch {}
      await loadClaimStats()     // solo al montar
    })()
    return () => abortRef.current?.abort()
  }, [isAuthenticated])

  /* ---------- cambios de wallet con throttle ---------- */
  const throttledReload = useRef(throttle(loadClaimStats, 800)).current
  useEffect(() => {
    if (!isAuthenticated) return
    if (!connected) return
    throttledReload()
  }, [connected, userPublicKey, isAuthenticated, throttledReload])

  // =========================
  // FUSIÓN DE PROGRESO (badges)
  // =========================
  const claimedCount = Number(claimsData?.totalUiAmount ?? 0)

  const mergedBadges = useMemo(() => {
    if (!claimStats?.badges) return []
    const isCollector = (b: any) =>
      (b.id && ['collector', 'coleccionista'].includes(String(b.id).toLowerCase())) ||
      (b.name && /coleccionista/i.test(b.name))
    const isEnthusiast = (b: any) =>
      (b.id && ['enthusiast', 'entusiasta'].includes(String(b.id).toLowerCase())) ||
      (b.name && /entusias/i.test(b.name))

    return claimStats.badges.map((b) => {
      let next = { ...b }
      if (isCollector(b)) {
        const target = b.target ?? 5
        const progress = Math.min(claimedCount, target)
        next = { ...next, target, progress, unlocked: progress >= target }
      }
      if (isEnthusiast(b)) {
        const target = b.target ?? 10
        const progress = Math.min(claimedCount, target)
        next = { ...next, target, progress, unlocked: progress >= target }
      }
      return next
    })
  }, [claimStats?.badges, claimedCount])

  const unlocked = mergedBadges.filter(b => b.unlocked).length ?? 0
  const total = mergedBadges.length ?? 0

  if (isLoading || !user) {
    return (
      <div className="grid place-items-center h-[60vh]">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando perfil…
        </div>
      </div>
    )
  }

  // --- mapear tokens reclamados -> items para la galería redonda
  const tokenItems = (claimsData?.claims ?? []).map((c: any) => {
    const accounts = Number(c.accounts ?? c.count ?? 1)
    const claimsTotal =
      typeof c.totalUi === 'number' ? c.totalUi : Number(c.totalUi || 0)

    // pequeña regla visual de rareza (ajústala si quieres)
    const rarity =
      accounts >= 10 ? 'legendary'
      : accounts >= 5 ? 'epic'
      : accounts >= 3 ? 'rare'
      : accounts >= 2 ? 'uncommon'
      : 'common'

    return { mint: c.mint as string, accounts, claimsTotal, rarity } as const
  })

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Mi Perfil</h1>
          <TierChip tier={(user.tier || 'FREE').toUpperCase()} />
        </div>
        <Button
          onClick={() => { logout(); router.push('/') }}
          className="rounded-full border border-red-500/30 bg-red-600/20 px-4 text-white hover:bg-red-600/30"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>

      {/* Banner líquido */}
      <div className="liquid-panel overflow-hidden p-0">
        <div className="h-40 w-full bg-gradient-to-r from-emerald-400/20 via-slate-400/10 to-fuchsia-400/20" />
        <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-black/20 bg-white/10 backdrop-blur-xl shadow-xl">
                <span className="text-3xl font-bold">{user.name?.charAt(0)?.toUpperCase() ?? 'U'}</span>
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-black/20 bg-emerald-500 text-white">
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>

            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold">{user.name}</h2>
                {claimStats && <LevelBadge level={claimStats.level.level} name={claimStats.level.name} />}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatPill label="Claims" value={claimStats ? claimStats.totalClaims : 0} icon={<Trophy className="h-4 w-4 text-yellow-300" />} />
                <StatPill label="Insignias" value={`${unlocked}/${total}`} icon={<Shield className="h-4 w-4 text-emerald-300" />} />
                <StatPill label="Plan" value={(user.tier || 'Free').toUpperCase()} icon={<Sparkles className="h-4 w-4 text-fuchsia-300" />} />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadClaimStats} disabled={statsLoading} className="rounded-full border border-white/15 bg-white/10 hover:bg-white/15">
              <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            {connected ? (
              <Button
                onClick={disconnect}
                variant="outline"
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {walletName} conectado
              </Button>
            ) : isWalletAvailable ? (
              <Button onClick={connect} className="rounded-full border border-white/15 bg-white/10 hover:bg-white/15">
                <Wallet className="mr-2 h-4 w-4" />
                Conectar wallet
              </Button>
            ) : (
              <div className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
                Instala Phantom / Solflare
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Información */}
        <Card className="rounded-2xl border-white/15 bg-white/10 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white/90">Información</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-[15px]">
            <Row k="Correo" v={<span className="text-emerald-200">{user.email}</span>} />
            {user.company && <Row k="Empresa" v={<span className="text-fuchsia-200">{user.company}</span>} />}
            <Row k="Plan" v={<TierChip tier={(user.tier || 'FREE').toUpperCase()} />} />
            <Row k="Miembro desde" v={<span className="text-emerald-200">{new Date(user.createdAt).toLocaleDateString()}</span>} />
          </CardContent>
        </Card>

        {/* Wallet */}
        <Card className="rounded-2xl border-white/15 bg-white/10 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-white/90">Wallet Solana</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {connected ? (
              <>
                <Row k="Estado" v={<span className="text-emerald-300">Conectada</span>} />
                <Row k="Wallet" v={<span className="text-white/85">{walletName}</span>} />
                <Row
                  k="Dirección"
                  v={<code className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/70">
                    {userPublicKey?.slice(0, 8)}…{userPublicKey?.slice(-8)}
                  </code>}
                />
                <Button onClick={disconnect} variant="outline" className="mt-1 w-full rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10">
                  Desconectar
                </Button>
              </>
            ) : (
              <>
                <Row k="Estado" v={<span className="text-white/70">Desconectada</span>} />
                <p className="text-sm text-white/75">Conecta tu wallet para ver tus tokens reclamados.</p>
                {isWalletAvailable && (
                  <Button onClick={connect} disabled={connecting} className="w-full rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15">
                    {connecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                    {connecting ? 'Conectando…' : 'Conectar'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="rounded-2xl border-white/15 bg-white/10 backdrop-blur-xl">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-white/90">Estadísticas</CardTitle>
            <Button onClick={loadClaimStats} variant="outline" size="sm" className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="grid place-items-center py-10">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : claimStats ? (
              <div className="grid gap-3">
                <Tile label="Claims Totales" value={claimStats.totalClaims} gradient="from-emerald-500/20 to-emerald-600/20" />
                <Tile label={`Nivel · ${claimStats.level.name}`} value={claimStats.level.level} gradient="from-fuchsia-500/20 to-purple-600/20" />
                <Tile label="Badges Desbloqueados" value={`${unlocked}/${total}`} gradient="from-sky-500/20 to-cyan-600/20" />
              </div>
            ) : (
              <div className="py-8 text-center text-white/75">Sin datos aún</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones / CTA */}
      <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Sigue construyendo</h3>
            <p className="text-white/75 text-sm">Crea una campaña o explora colecciones activas.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 hover:bg-white/15">Ver campañas</Link>
            <Link href="/dashboard" className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 hover:bg-white/15 flex items-center gap-2">
              Ir al Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Badges (backend + progreso on-chain) */}
      {claimStats && (
        <section className="space-y-3">
          <BadgeGallery
            badges={mergedBadges as any}            
            totalClaims={claimStats.totalClaims}
            level={claimStats.level}
          />
        </section>
      )}

      {/* Tokens Reclamados (SPL vía RPC) */}
      {connected && (
        <section className="space-y-3">
          {claimsLoading ? (
            <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : claimsError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
              No pudimos cargar tus tokens. Intenta de nuevo.
            </div>
          ) : claimsData && tokenItems.length > 0 ? (
            <ClaimedTokensGallery
              title={
                <span className="inline-flex items-center gap-2">
                  <Coins className="h-5 w-5 text-emerald-300" />
                  Mis Tokens Reclamados
                </span> as unknown as string
              }
              items={tokenItems as any}
              totalCampaigns={claimsData.totalDistinctMints}
              totalMints={claimsData.totalDistinctMints}
              className="mt-1"
            />
          ) : (
            <div className="text-sm text-white/75">Sin tokens reclamados todavía.</div>
          )}
        </section>
      )}
    </div>
  )
}
