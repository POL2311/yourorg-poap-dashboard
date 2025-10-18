import Cookies from 'js-cookie'
import { Organizer } from './types'

export interface AuthState {
  isAuthenticated: boolean
  organizer: Organizer | null
  token: string | null
}

export class AuthManager {
  private static instance: AuthManager
  private state: AuthState = {
    isAuthenticated: false,
    organizer: null,
    token: null,
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const token = Cookies.get('auth-token')
      const organizerData = localStorage.getItem('organizer')
      
      if (token && organizerData) {
        try {
          const organizer = JSON.parse(organizerData)
          this.state = {
            isAuthenticated: true,
            organizer,
            token,
          }
        } catch (error) {
          console.error('Error parsing organizer data:', error)
          this.clearAuth()
        }
      }
    }
  }

  login(token: string, organizer: Organizer) {
    this.state = {
      isAuthenticated: true,
      organizer,
      token,
    }
    
    // Store in cookies and localStorage
    Cookies.set('auth-token', token, { expires: 7 }) // 7 days
    localStorage.setItem('organizer', JSON.stringify(organizer))
  }

  logout() {
    this.clearAuth()
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  private clearAuth() {
    this.state = {
      isAuthenticated: false,
      organizer: null,
      token: null,
    }
    
    // Clear storage
    Cookies.remove('auth-token')
    localStorage.removeItem('organizer')
  }

  getState(): AuthState {
    return { ...this.state }
  }

  isAuthenticated(): boolean {
    return this.state.isAuthenticated
  }

  getOrganizer(): Organizer | null {
    return this.state.organizer
  }

  getToken(): string | null {
    return this.state.token
  }

  updateOrganizer(organizer: Organizer) {
    if (this.state.isAuthenticated) {
      this.state.organizer = organizer
      localStorage.setItem('organizer', JSON.stringify(organizer))
    }
  }

  // Check if user has permission for certain actions based on tier
  canCreateCampaign(currentCampaigns: number): boolean {
    if (!this.state.organizer) return false
    
    const limits = {
      free: 3,
      pro: 50,
      enterprise: 500,
    }
    
    return currentCampaigns < limits[this.state.organizer.tier]
  }

  canCreateApiKey(currentKeys: number): boolean {
    if (!this.state.organizer) return false
    
    const limits = {
      free: 2,
      pro: 10,
      enterprise: 50,
    }
    
    return currentKeys < limits[this.state.organizer.tier]
  }

  getMonthlyClaimsLimit(): number {
    if (!this.state.organizer) return 0
    
    const limits = {
      free: 100,
      pro: 5000,
      enterprise: 50000,
    }
    
    return limits[this.state.organizer.tier]
  }
}

export const authManager = AuthManager.getInstance()