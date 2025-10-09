import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useProfile, useLogin } from './useApi'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  company?: string
  tier: 'free' | 'pro' | 'enterprise'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth-token'))
  const { connected } = useWallet()
  
  const { data: user, isLoading: profileLoading } = useProfile()
  const loginMutation = useLogin()

  const isAuthenticated = !!token && !!user
  const isLoading = profileLoading || loginMutation.isPending

  const login = async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password })
      setToken(result.data.token)
    } catch (error) {
      // Error is handled in the mutation
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth-token')
    setToken(null)
    toast.success('Logged out successfully')
  }

  // Update token state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('auth-token'))
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}