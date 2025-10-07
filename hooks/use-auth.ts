'use client'

import { useState, useEffect } from 'react'
import { authManager, AuthState } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import { Organizer, LoginForm, RegisterForm } from '@/lib/types'
import { toast } from 'react-hot-toast'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authManager.getState())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Update state when auth changes
    const updateAuthState = () => {
      setAuthState(authManager.getState())
    }

    // Check auth state on mount
    updateAuthState()

    // You could add an event listener here if you implement auth state events
    return () => {
      // Cleanup
    }
  }, [])

  const login = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.login(data)
      
      if (response.success && response.data) {
        authManager.login(response.data.token, response.data.organizer)
        setAuthState(authManager.getState())
        toast.success('Login successful!')
        return { success: true }
      } else {
        toast.error(response.error || 'Login failed')
        return { success: false, error: response.error }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await apiClient.register(data)
      
      if (response.success && response.data) {
        authManager.login(response.data.token, response.data.organizer)
        setAuthState(authManager.getState())
        toast.success('Registration successful!')
        return { success: true }
      } else {
        toast.error(response.error || 'Registration failed')
        return { success: false, error: response.error }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authManager.logout()
    setAuthState(authManager.getState())
    toast.success('Logged out successfully')
  }

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

  return {
    ...authState,
    isLoading,
    login,
    register,
    logout,
    refreshProfile,
    // Helper methods
    canCreateCampaign: (currentCampaigns: number) => 
      authManager.canCreateCampaign(currentCampaigns),
    canCreateApiKey: (currentKeys: number) => 
      authManager.canCreateApiKey(currentKeys),
    getMonthlyClaimsLimit: () => 
      authManager.getMonthlyClaimsLimit(),
  }
}