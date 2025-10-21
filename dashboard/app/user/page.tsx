'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useWalletConnection } from '@/hooks/use-wallet'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  LogOut,
  Trophy,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Shield,
  Stars,
  Sparkles,
  Database,
} from 'lucide-react'
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'
import { apiClient } from '@/lib/api'
import { toast } from 'react-hot-toast'

// 🔗 HOOK de cNFTs (tú lo pusiste en dashboard/hooks/)
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

/* ---------- pequeñas utilidades de UI ---------- */
function TierChip({ tier = 'FREE' }: { tier?: string }) {
  const map: Record<string, string> = {
    PRO: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    ENTERPRISE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    FREE: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${map[tier] ?? map.FREE}`}>
      {tier}
    </span>
  )
}

function StatPill({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur">
      {icon}
      <span className="text-sm text-white/80">{label}</span>
      <span className="ml-1 text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

function LevelBadge({ level, name }: { level: number; name: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-pink-600/20 px-3 py-1.5 text-sm text-purple-100">
      <Stars className="h-4 w-4" />
      <span className="font-semibold">Nivel {level}</span>
      <span className="opacity-80">· {name}</span>
    </div>
  )
}

/* ---------- página ---------- */
export default function UserProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const {
    connected,
    connecting,
    userPublicKey,
    connect,
    disconnect,
    walletName,
    isWalletAvailable,
  } = useWalletConnection()

  // ====== Claim stats (lo que ya tenías)
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // ====== cNFT badges (Helius)
  const { data: cnftData, loading: cnftLoading, error: cnftError } = useNftBadges(
    connected ? userPublicKey || undefined : undefined
  )

  // auth gate + refresh profile
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

  useEffect(() => {
    if (isAuthenticated) refreshProfile()
  }, [isAuthenticated, refreshProfile])

  const loadClaimStats = async () => {
    if (!user?.id) return
    setStatsLoading(true)
    try {
      if (connected && userPublicKey) {
        const r = await apiClient.getUserClaimStatsByWallet(userPublicKey)
        if (r.success && r.data) setClaimStats(r.data)
      } else {
        const r = await apiClient.getUserClaimStats()
        if (r.success && r.data) setClaimStats(r.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar estadísticas de claims')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      const t = setTimeout(() => loadClaimStats(), 120)
      return () => clearTimeout(t)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user) loadClaimStats()
  }, [connected, userPublicKey])

  // memo de contadores
  const unlocked = claimStats?.badges.filter(b => b.unlocked).length ?? 0
  const total = claimStats?.badges.length ?? 0

  if (isLoading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-black text-white">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando perfil…
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          'radial-gradient(1200px 400px at 20% -10%, rgba(16,185,129,0.10), transparent), radial-gradient(900px 300px at 90% 0%, rgba(168,85,247,0.12), transparent), #07090c',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Top bar actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">Mi Perfil</h1>
            <TierChip tier={(user.tier || 'FREE').toUpperCase()} />
          </div>
          <Button
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className="rounded-full border border-red-500/30 bg-red-600/20 px-4 text-white hover:bg-red-600/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>

        {/* Banner + avatar */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-slate-700/10 to-fuchsia-500/10 shadow-lg">
          <div
            className="h-36 w-full"
            style={{
              background:
                'linear-gradient(90deg, rgba(16,185,129,0.18), rgba(147,51,234,0.18))',
            }}
          />
          <div className="px-6 pb-6 -mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[#07090c] bg-white/10 backdrop-blur">
                  <span className="text-3xl font-bold">
                    {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-[#07090c] bg-emerald-500 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold">{user.name}</h2>
                  {claimStats && (
                    <LevelBadge level={claimStats.level.level} name={claimStats.level.name} />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatPill
                    label="Claims"
                    value={claimStats ? claimStats.totalClaims : 0}
                    icon={<Trophy className="h-4 w-4 text-yellow-300" />}
                  />
                  <StatPill
                    label="Insignias"
                    value={`${unlocked}/${total}`}
                    icon={<Shield className="h-4 w-4 text-emerald-300" />}
                  />
                  <StatPill
                    label="Plan"
                    value={(user.tier || 'Free').toUpperCase()}
                    icon={<Sparkles className="h-4 w-4 text-fuchsia-300" />}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={loadClaimStats}
                disabled={statsLoading}
                className="rounded-full border border-white/15 bg-white/10 hover:bg-white/15"
              >
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
                <Button
                  onClick={connect}
                  className="rounded-full border border-white/15 bg-white/10 hover:bg-white/15"
                >
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
          {/* Perfil/Meta */}
          <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white/80">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-[15px]">
              <Row k="Correo" v={<span className="text-emerald-200">{user.email}</span>} />
              {user.company && <Row k="Empresa" v={<span className="text-fuchsia-200">{user.company}</span>} />}
              <Row k="Plan" v={<TierChip tier={(user.tier || 'FREE').toUpperCase()} />} />
              <Row
                k="Miembro desde"
                v={<span className="text-emerald-200">{new Date(user.createdAt).toLocaleDateString()}</span>}
              />
            </CardContent>
          </Card>

          {/* Wallet */}
          <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white/80">Wallet Solana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connected ? (
                <>
                  <Row k="Estado" v={<span className="text-emerald-300">Conectada</span>} />
                  <Row k="Wallet" v={<span className="text-white/80">{walletName}</span>} />
                  <Row
                    k="Dirección"
                    v={
                      <code className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/70">
                        {userPublicKey?.slice(0, 8)}…{userPublicKey?.slice(-8)}
                      </code>
                    }
                  />
                  <Button
                    onClick={disconnect}
                    variant="outline"
                    className="mt-1 w-full rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Desconectar
                  </Button>
                </>
              ) : (
                <>
                  <Row k="Estado" v={<span className="text-white/60">Desconectada</span>} />
                  <p className="text-sm text-white/60">
                    Conecta tu wallet para ver estadísticas on-chain.
                  </p>
                  {isWalletAvailable && (
                    <Button
                      onClick={connect}
                      disabled={connecting}
                      className="w-full rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Conectando…
                        </>
                      ) : (
                        <>
                          <Wallet className="mr-2 h-4 w-4" /> Conectar
                        </>
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Stats tiles */}
          <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-white/80">Estadísticas</CardTitle>
              <Button
                onClick={loadClaimStats}
                variant="outline"
                size="sm"
                className="rounded-full border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
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
                  <Tile
                    label="Claims Totales"
                    value={claimStats.totalClaims}
                    gradient="from-emerald-500/20 to-emerald-600/20"
                  />
                  <Tile
                    label={`Nivel · ${claimStats.level.name}`}
                    value={claimStats.level.level}
                    gradient="from-fuchsia-500/20 to-purple-600/20"
                  />
                  <Tile
                    label="Badges Desbloqueados"
                    value={`${unlocked}/${total}`}
                    gradient="from-sky-500/20 to-cyan-600/20"
                  />
                </div>
              ) : (
                <div className="py-8 text-center text-white/70">Sin datos aún</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white/80">Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Button
              onClick={loadClaimStats}
              disabled={statsLoading}
              className="rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
              Actualizar estadísticas
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 text-white hover:bg-emerald-500/25"
            >
              Ver campañas
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/15 text-white hover:bg-fuchsia-500/25"
            >
              Dashboard
            </Button>
          </CardContent>
        </Card>

        {/* Claim badges (backend propio) */}
        {claimStats && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mis Insignias</h2>
              <span className="text-sm text-white/70">
                {unlocked} de {total} desbloqueadas
              </span>
            </div>
            <BadgeDisplay
              badges={claimStats.badges}
              totalClaims={claimStats.totalClaims}
              level={claimStats.level}
            />
          </section>
        )}

        {/* cNFT badges (Helius) */}
        {connected && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Database className="h-5 w-5 text-emerald-300" />
                Mis cNFTs
              </h2>
              {cnftLoading ? (
                <span className="text-sm text-white/70">Cargando…</span>
              ) : cnftError ? (
                <span className="text-sm text-red-300">Error: {cnftError}</span>
              ) : cnftData ? (
                <span className="text-sm text-white/70">
                  {cnftData.badges.filter((b: any) => b.unlocked).length} de {cnftData.badges.length} desbloqueadas
                </span>
              ) : null}
            </div>

            {cnftLoading ? (
              <div className="grid place-items-center rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : cnftData ? (
              <BadgeDisplay
                badges={cnftData.badges}
                totalClaims={cnftData.totalClaims}
                level={cnftData.level}
              />
            ) : (
              <div className="text-sm text-white/60">
                Conecta tu wallet para ver tus cNFTs como badges.
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

/* ---------- subcomponentes internos ---------- */
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-sm text-white/60">{k}:</span>
      <div className="text-sm">{v}</div>
    </div>
  )
}

function Tile({
  label,
  value,
  gradient,
}: {
  label: string
  value: string | number
  gradient: string
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-r ${gradient} p-4`}>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/70">{label}</div>
    </div>
  )
}
