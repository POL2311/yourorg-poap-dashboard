'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/use-auth'
import { useWalletConnection } from '@/hooks/use-wallet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { apiClient } from '@/lib/api'
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'
import {
  Loader2, LogOut, Wallet, RefreshCw, Shield, Trophy, Sparkles,
  CheckCircle2, Stars, Database, ArrowRight
} from 'lucide-react'
import { useNftBadges } from '@/hooks/use-nft-badges'

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

/* ---------- página ---------- */
export default function UserProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const { connected, connecting, userPublicKey, connect, disconnect, walletName, isWalletAvailable } =
    useWalletConnection()

  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const { data: cnftData, loading: cnftLoading, error: cnftError } =
    useNftBadges(connected ? userPublicKey || undefined : undefined)

  useEffect(() => {
    if (isLoading) return
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('auth_token') ||
          localStorage.getItem('token') ||
          localStorage.getItem('jwt')
        : null
    if (!isAuthenticated && !token) router.replace('/login')
  }, [isAuthenticated, isLoading, router])

  useEffect(() => { if (isAuthenticated) refreshProfile() }, [isAuthenticated, refreshProfile])

  const loadClaimStats = async () => {
    if (!user?.id) return
    setStatsLoading(true)
    try {
      const r = connected && userPublicKey
        ? await apiClient.getUserClaimStatsByWallet(userPublicKey)
        : await apiClient.getUserClaimStats()
      if (r.success && r.data) setClaimStats(r.data)
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar estadísticas de claims')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      const t = setTimeout(loadClaimStats, 120)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user) loadClaimStats()
  }, [connected, userPublicKey])

  const unlocked = claimStats?.badges.filter(b => b.unlocked).length ?? 0
  const total = claimStats?.badges.length ?? 0

  if (isLoading || !user) {
    return (
      <div className="grid place-items-center h-[60vh]">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando perfil…
        </div>
      </div>
    )
  }

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
                <p className="text-sm text-white/75">Conecta tu wallet para ver estadísticas on-chain.</p>
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

      {/* Badges (backend) */}
      {claimStats && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mis Insignias</h2>
            <span className="text-sm text-white/75">{unlocked} de {total} desbloqueadas</span>
          </div>
          <BadgeDisplay badges={claimStats.badges} totalClaims={claimStats.totalClaims} level={claimStats.level} />
        </section>
      )}

      {/* cNFT badges (on-chain) */}
      {connected && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-emerald-300" />
              Mis cNFTs
            </h2>
            {cnftLoading
              ? <span className="text-sm text-white/75">Cargando…</span>
              : cnftError
              ? <span className="text-sm text-red-300">Error: {cnftError}</span>
              : cnftData
              ? <span className="text-sm text-white/75">
                  {cnftData.badges.filter((b: any) => b.unlocked).length} de {cnftData.badges.length} desbloqueadas
                </span>
              : null}
          </div>

          {cnftLoading ? (
            <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : cnftData ? (
            <BadgeDisplay badges={cnftData.badges} totalClaims={cnftData.totalClaims} level={cnftData.level} />
          ) : (
            <div className="text-sm text-white/75">
              Conecta tu wallet para ver tus cNFTs como badges.
            </div>
          )}
        </section>
      )}
    </div>
  )
}
