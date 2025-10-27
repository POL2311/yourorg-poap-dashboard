'use client'

import { useState, useEffect } from 'react'
import { authManager, AuthState } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import { LoginForm, RegisterForm } from '@/lib/types'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState())
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Mantén sincronizado el estado con el authManager
  useEffect(() => {
    setAuthState(authManager.getState())
  }, [])

  // Helpers de persistencia
  function persistSession(token: string, organizer: any, role: string) {
    // Asegura la misma key que usa Axios
    localStorage.setItem('auth-token', token)
    // Opcionales útiles
    localStorage.setItem('auth-role', role || '')
    localStorage.setItem('auth-user', JSON.stringify(organizer || {}))
  }

  // ==============================
  // 🧠 LOGIN
  // ==============================
  const login = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(data)
      console.log('🔐 LOGIN response:', response)

      if (response.success && response.data) {
        const { token, redirect } = response.data
        const organizer = response.data.organizer || response.data

        const role =
          response.data.role ||
          organizer.role ||
          organizer.tier ||
          'USER'

        if (!token || !organizer) {
          console.warn('⚠️ Login sin datos válidos')
          toast.error('Invalid login data')
          return { success: false, error: 'Invalid login data' }
        }

        // ✅ Guardar sesión en tu manager + LocalStorage
        authManager.login(token, organizer)
        persistSession(token, organizer, role)
        setAuthState(authManager.getState())

        toast.success('Login successful!')

        // Redirección según rol / backend
        let redirectPath = '/user'
        if (redirect) redirectPath = redirect
        else if (role === 'ORGANIZER' || role === 'ADMIN') redirectPath = '/dashboard'
        else redirectPath = '/user'

        console.log(`➡️ Redirigiendo a ${redirectPath} (rol: ${role})`)
        // Usa router.replace para evitar full reload
        setTimeout(() => router.replace(redirectPath), 400)

        return { success: true, role, redirect: redirectPath }
      } else {
        const errorMsg = response.error || 'Login failed'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Login failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  // ==============================
  // 🧩 REGISTER
  // ==============================
  const register = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.register(data)
      console.log('🆕 REGISTER response:', response)

      if (response.success && response.data) {
        const { token, redirect } = response.data
        const organizer = response.data.organizer || response.data
        const role = response.data.role || organizer.role || 'USER'

        if (!token || !organizer) {
          console.warn('⚠️ Register sin datos válidos')
          toast.error('Invalid registration data')
          return { success: false, error: 'Invalid registration data' }
        }

        authManager.login(token, organizer)
        persistSession(token, organizer, role)
        setAuthState(authManager.getState())

        toast.success('Registration successful! 🎉')

        let redirectPath = '/user'
        if (redirect) redirectPath = redirect
        else if (role === 'ORGANIZER' || role === 'ADMIN') redirectPath = '/dashboard'
        else redirectPath = '/user'

        console.log(`➡️ Redirigiendo a ${redirectPath} (rol: ${role})`)
        setTimeout(() => router.replace(redirectPath), 400)

        return { success: true, role, redirect: redirectPath }
      } else {
        const errorMsg = response.error || 'Registration failed'
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Registration failed'
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
    // Limpia también las keys que agregamos
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-role')
    localStorage.removeItem('auth-user')

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
        // Persistimos espejo local
        localStorage.setItem('auth-user', JSON.stringify(response.data))
        setAuthState(authManager.getState())
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error)
    }
  }

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
