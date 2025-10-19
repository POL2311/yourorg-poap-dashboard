'use client'

import { useState, useEffect } from 'react'
import { authManager, AuthState } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import { LoginForm, RegisterForm } from '@/lib/types'
import { toast } from 'react-hot-toast'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState())
  const [isLoading, setIsLoading] = useState(false)

  // 🔁 Mantiene sincronizado el estado con el authManager
  useEffect(() => {
    setAuthState(authManager.getState())
  }, [])

  // ==============================
  // 🧠 LOGIN (corregido)
  // ==============================
  const login = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(data)
      console.log('🔐 LOGIN response:', response)

      if (response.success && response.data) {
        const { token, redirect } = response.data
        const organizer = response.data.organizer || response.data

        // Detectar el rol correctamente
        const role =
          response.data.role ||
          organizer.role ||
          organizer.tier ||
          'USER'

        if (!token || !organizer) {
          console.warn('⚠️ Login sin datos válidos')
          return { success: false, error: 'Invalid login data' }
        }

        // ✅ Guardar sesión
        authManager.login(token, organizer)
        setAuthState(authManager.getState())

        toast.success('Login successful!')

        // Redirigir según el rol
        let redirectPath = '/user'
        if (redirect) redirectPath = redirect
        else if (role === 'ORGANIZER' || role === 'ADMIN') redirectPath = '/dashboard'
        else if (role === 'USER') redirectPath = '/user'

        console.log(`➡️ Redirigiendo a ${redirectPath} (rol: ${role})`)

        setTimeout(() => {
          window.location.href = redirectPath
        }, 800)

        return { success: true, role, redirect: redirectPath }
      } else {
        const errorMsg = response.error || 'Login failed'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // ==============================
  // 🧩 REGISTER (sincronizado)
  // ==============================
  const register = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.register(data)
      console.log('🆕 REGISTER response:', response)

      if (response.success && response.data) {
        const { token, redirect } = response.data
        const organizer = response.data.organizer || response.data

        const role =
          response.data.role ||
          organizer.role ||
          'USER'

        if (!token || !organizer) {
          console.warn('⚠️ Register sin datos válidos')
          return { success: false, error: 'Invalid registration data' }
        }

        authManager.login(token, organizer)
        setAuthState(authManager.getState())

        toast.success('Registration successful! 🎉')

        // Determinar la ruta de redirección basada en el rol
        let redirectPath = '/user' // Por defecto para usuarios normales
        if (redirect) {
          redirectPath = redirect
        } else if (role === 'ORGANIZER' || role === 'ADMIN') {
          redirectPath = '/dashboard'
        } else if (role === 'USER') {
          redirectPath = '/user'
        }

        console.log(`➡️ Redirigiendo a ${redirectPath} (rol: ${role})`)

        setTimeout(() => {
          window.location.href = redirectPath
        }, 800)

        return { success: true, role, redirect: redirectPath }
      } else {
        const errorMsg = response.error || 'Registration failed'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // ==============================
  // 🚪 LOGOUT
  // ==============================
  const logout = () => {
    authManager.logout()
    setAuthState(authManager.getState())
    toast.success('Logged out successfully')
  }

  // ==============================
  // 🔄 REFRESH PROFILE
  // ==============================
  const refreshProfile = async () => {
    if (!authState.isAuthenticated) return

    try {
      const response = await apiClient.getProfile()
      if (response.success && response.data) {
        authManager.updateOrganizer(response.data)
        setAuthState(authManager.getState())
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

  // ==============================
  // 🔁 RETORNO
  // ==============================
  return {
    ...authState,
    user: authState.organizer,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
    canCreateCampaign: (currentCampaigns: number) =>
      authManager.canCreateCampaign(currentCampaigns),
    canCreateApiKey: (currentKeys: number) =>
      authManager.canCreateApiKey(currentKeys),
    getMonthlyClaimsLimit: () =>
      authManager.getMonthlyClaimsLimit(),
  }
}
