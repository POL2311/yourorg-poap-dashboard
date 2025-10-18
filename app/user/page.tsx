'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useWalletConnection } from '@/hooks/use-wallet'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'
import { Loader2, LogOut, User, Trophy, Target, RefreshCw, Wallet, WalletCheck } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface ClaimStats {
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
  }>
  level: {
    level: number
    name: string
    color: string
  }
}

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const { 
    connected, 
    connecting, 
    userPublicKey, 
    connect, 
    disconnect, 
    walletName,
    isWalletAvailable 
  } = useWalletConnection()
  const router = useRouter()
  const [claimStats, setClaimStats] = useState<ClaimStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Redirigir si no hay sesión
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Refrescar perfil al montar
  useEffect(() => {
    if (isAuthenticated) refreshProfile()
  }, [isAuthenticated])

  // Cargar estadísticas de claims
  const loadClaimStats = async () => {
    if (!user?.id) return

    setStatsLoading(true)
    try {
      // Si hay wallet conectada, usar el endpoint público con la wallet
      if (connected && userPublicKey) {
        console.log('🔗 Using wallet for stats:', userPublicKey)
        const response = await apiClient.getUserClaimStatsByWallet(userPublicKey)
        if (response.success && response.data) {
          setClaimStats(response.data)
        }
      } else {
        // Si no hay wallet, usar el endpoint autenticado
        console.log('🔐 Using authenticated endpoint for stats')
        const response = await apiClient.getUserClaimStats()
        if (response.success && response.data) {
          setClaimStats(response.data)
        }
      }
    } catch (error) {
      console.error('Error loading claim stats:', error)
      toast.error('Error al cargar estadísticas de claims')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user) {
      // Cargar estadísticas solo en el cliente para evitar errores de hidratación
      const timer = setTimeout(() => {
        loadClaimStats()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, user])

  // Recargar estadísticas cuando cambie el estado de la wallet
  useEffect(() => {
    if (isAuthenticated && user) {
      loadClaimStats()
    }
  }, [connected, userPublicKey])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <Button
            onClick={() => {
              logout()
              router.push('/login')
            }}
            className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del Usuario */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex flex-col items-center space-y-3">
                <User className="h-12 w-12 text-indigo-400" />
                <CardTitle className="text-2xl font-bold text-center">
                  {user.name}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 text-gray-200">
              <div>
                <strong>Correo:</strong> {user.email}
              </div>
              {user.company && (
                <div>
                  <strong>Empresa:</strong> {user.company}
                </div>
              )}
              <div>
                <strong>Plan:</strong> {user.tier?.toUpperCase() || 'Free'}
              </div>
              <div>
                <strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>

          {/* Estado de Wallet */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connected ? (
                  <WalletCheck className="h-5 w-5 text-green-400" />
                ) : (
                  <Wallet className="h-5 w-5 text-gray-400" />
                )}
                Wallet Solana
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {connected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium">Conectada</span>
                  </div>
                  <div className="text-xs text-gray-300 break-all">
                    <strong>Wallet:</strong> {walletName}
                  </div>
                  <div className="text-xs text-gray-300 break-all">
                    <strong>Dirección:</strong> {userPublicKey?.slice(0, 8)}...{userPublicKey?.slice(-8)}
                  </div>
                  <Button
                    onClick={disconnect}
                    size="sm"
                    variant="outline"
                    className="w-full text-white border-white/20 hover:bg-white/10"
                  >
                    Desconectar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-sm font-medium">Desconectada</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Conecta tu wallet para ver estadísticas basadas en tu actividad en Solana
                  </p>
                  {isWalletAvailable ? (
                    <Button
                      onClick={connect}
                      disabled={connecting}
                      size="sm"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Conectar Wallet
                        </>
                      )}
                    </Button>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No hay wallets disponibles. Instala Phantom o Solflare.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas de Claims */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Estadísticas
                </CardTitle>
                <Button
                  onClick={loadClaimStats}
                  disabled={statsLoading}
                  size="sm"
                  variant="outline"
                  className="text-white border-white/20 hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {statsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : claimStats ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-400">
                      {claimStats.totalClaims}
                    </div>
                    <div className="text-sm text-gray-300">Claims Totales</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      Nivel {claimStats.level.level}
                    </div>
                    <div className="text-sm text-gray-300">{claimStats.level.name}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-400">
                      {claimStats.badges.filter(b => b.unlocked).length}
                    </div>
                    <div className="text-sm text-gray-300">Badges Desbloqueados</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-300">No hay estadísticas disponibles</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Reclama tu primer token para ver tus estadísticas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones Rápidas */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Acciones
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <Button
                onClick={loadClaimStats}
                disabled={statsLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
                Actualizar Estadísticas
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Ver Campañas
              </Button>
              
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Badges Section */}
        {claimStats && (
          <div className="mt-8">
            <BadgeDisplay
              badges={claimStats.badges}
              totalClaims={claimStats.totalClaims}
              level={claimStats.level}
            />
          </div>
        )}
      </div>
    </div>
  )
}
