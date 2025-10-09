import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  company?: string
  walletAddress: string
  tier: 'free' | 'pro' | 'enterprise'
  monthlyPOAPLimit: number
  usedPOAPsThisMonth: number
  apiKey: string
  customBranding?: {
    logo?: string
    primaryColor?: string
    secondaryColor?: string
    customDomain?: string
  }
  createdAt: string
  lastLoginAt: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (walletAddress: string) => Promise<void>
  logout: () => void
  updateUser: (updates: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { publicKey, connected } = useWallet()

  const isAuthenticated = !!user && connected

  // Auto-login when wallet connects
  useEffect(() => {
    if (connected && publicKey && !user) {
      login(publicKey.toString())
    } else if (!connected && user) {
      logout()
    }
  }, [connected, publicKey])

  const login = async (walletAddress: string) => {
    setIsLoading(true)
    try {
      // For demo purposes, create a mock user
      // In production, this would call your backend API
      const mockUser: User = {
        id: `user_${walletAddress.slice(0, 8)}`,
        name: `Organizer ${walletAddress.slice(0, 8)}`,
        email: `organizer@${walletAddress.slice(0, 8)}.com`,
        company: 'Demo Events Co.',
        walletAddress,
        tier: 'pro',
        monthlyPOAPLimit: 1000,
        usedPOAPsThisMonth: 247,
        apiKey: `pk_${walletAddress.slice(0, 16)}...${walletAddress.slice(-8)}`,
        customBranding: {
          logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=' + walletAddress.slice(0, 8),
          primaryColor: '#6366f1',
          secondaryColor: '#8b5cf6',
        },
        createdAt: '2024-01-15T10:30:00Z',
        lastLoginAt: new Date().toISOString(),
      }

      setUser(mockUser)
      toast.success(`Welcome back, ${mockUser.name}!`)
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    toast.success('Logged out successfully')
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return

    try {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Update user error:', error)
      toast.error('Failed to update profile')
    }
  }

  const refreshUser = async () => {
    if (!user) return

    try {
      // In production, fetch fresh user data from API
      // For now, just update lastLoginAt
      setUser(prev => prev ? { ...prev, lastLoginAt: new Date().toISOString() } : null)
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(false)
    }
    initAuth()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshUser,
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