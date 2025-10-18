'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, LogOut, User } from 'lucide-react'

export default function UserProfilePage() {
  const { user, isAuthenticated, isLoading, logout, refreshProfile } = useAuth()
  const router = useRouter()

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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
        <Loader2 className="h-10 w-10 animate-spin mb-4" />
        <p>Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-800 text-white p-4">
      <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl text-center w-full max-w-md p-6 rounded-2xl">
        <CardHeader>
          <div className="flex flex-col items-center space-y-3">
            <User className="h-10 w-10 text-indigo-400" />
            <CardTitle className="text-2xl font-bold">
              Bienvenido, {user.name} 👋
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 text-gray-200">
          <p><strong>Correo:</strong> {user.email}</p>
          {user.company && <p><strong>Empresa:</strong> {user.company}</p>}
          <p><strong>Plan:</strong> {user.tier?.toUpperCase() || 'Free'}</p>
          <p><strong>Miembro desde:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>

          <div className="mt-6">
            <Button
              onClick={() => {
                logout()
                router.push('/login')
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
