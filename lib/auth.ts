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

  /**
   * Carga sesión desde cookies/localStorage de manera segura.
   * Previene errores de JSON inválido ("undefined" o vacío).
   */
  private loadFromStorage() {
    if (typeof window === 'undefined') return

    const token = Cookies.get('auth-token')
    const organizerData = localStorage.getItem('organizer')

    if (token && organizerData && organizerData !== 'undefined') {
      try {
        const organizer = JSON.parse(organizerData)
        this.state = {
          isAuthenticated: true,
          organizer,
          token,
        }
      } catch (error) {
        console.error('❌ Error parsing organizer data:', error)
        this.clearAuth()
      }
    } else {
      // Limpieza preventiva si hay datos inválidos
      if (organizerData === 'undefined' || !organizerData) {
        this.clearAuth()
      }
    }
  }

  /**
   * Guarda sesión de usuario/organizador.
   */
  login(token: string, userData: any) {
    if (!token || !userData) {
      console.error('⚠️ Login llamado sin datos válidos')
      return
    }

    // Determinar si es un usuario normal o organizador
    const isUser = userData.role === 'USER' && userData.tier === 'user'
    const isOrganizer = userData.role === 'ORGANIZER' || userData.tier !== 'user'

    // Guarda estado interno
    this.state = {
      isAuthenticated: true,
      organizer: userData, // Siempre guardar como organizer para compatibilidad
      token,
    }

    // Persistencia
    Cookies.set('auth-token', token, { expires: 7 }) // 7 días
    localStorage.setItem('organizer', JSON.stringify(userData))

    console.log(`✅ Sesión guardada (${isUser ? 'usuario' : 'organizador'}):`, userData)
  }

  /**
   * Cierra sesión y limpia almacenamiento.
   */
  logout() {
    this.clearAuth()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  /**
   * Limpieza completa de sesión.
   */
  private clearAuth() {
    this.state = {
      isAuthenticated: false,
      organizer: null,
      token: null,
    }

    Cookies.remove('auth-token')
    localStorage.removeItem('organizer')
  }

  /**
   * Obtiene el estado actual.
   */
  getState(): AuthState {
    return { ...this.state }
  }

  /**
   * Verifica autenticación.
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated
  }

  /**
   * Devuelve el organizador/usuario autenticado.
   */
  getOrganizer(): Organizer | null {
    return this.state.organizer
  }

  /**
   * Obtiene token JWT.
   */
  getToken(): string | null {
    return this.state.token
  }

  /**
   * Actualiza los datos del organizador/usuario.
   */
  updateOrganizer(organizer: Organizer) {
    if (this.state.isAuthenticated) {
      this.state.organizer = organizer
      localStorage.setItem('organizer', JSON.stringify(organizer))
    }
  }

  // ===========================================================
  // Reglas de negocio basadas en el plan (tier)
  // ===========================================================

  canCreateCampaign(currentCampaigns: number): boolean {
    if (!this.state.organizer) return false

    const limits = {
      free: 3,
      pro: 50,
      enterprise: 500,
    }

    return currentCampaigns < (limits as any)[this.state.organizer.tier]
  }

  canCreateApiKey(currentKeys: number): boolean {
    if (!this.state.organizer) return false

    const limits = {
      free: 2,
      pro: 10,
      enterprise: 50,
    }

    return currentKeys < (limits as any)[this.state.organizer.tier]
  }

  getMonthlyClaimsLimit(): number {
    if (!this.state.organizer) return 0

    const limits = {
      free: 100,
      pro: 5000,
      enterprise: 50000,
    }

    return (limits as any)[this.state.organizer.tier] || 0
  }
}

// Exporta instancia única
export const authManager = AuthManager.getInstance()
