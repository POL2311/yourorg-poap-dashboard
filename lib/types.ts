// ==============================
// Tipos base / roles
// ==============================
export type Role = 'USER' | 'ORGANIZER' | 'ADMIN'

// ==============================
// Entidades principales
// ==============================
export interface Organizer {
  id: string
  email: string
  name: string
  company?: string | null
  tier: 'free' | 'pro' | 'enterprise'
  isActive: boolean
  createdAt: string
  updatedAt: string
  /** Rol del actor autenticado. En organizers suele ser 'ORGANIZER' o 'ADMIN'. */
  role?: Role
}

/** Perfil para usuarios finales (no organizers) */
export interface UserProfile {
  id: string
  email: string
  name: string
  createdAt: string
  updatedAt?: string
  role: 'USER'
  company?: string | null
}

export interface Campaign {
  id: string
  name: string
  description?: string
  eventDate: string
  location?: string
  imageUrl?: string
  externalUrl?: string
  secretCode?: string
  maxClaims?: number
  isActive: boolean
  organizerId: string
  createdAt: string
  updatedAt: string
  organizer?: {
    name: string
    email: string
    company?: string
  }
  _count?: {
    claims: number
  }
  metadata?: Record<string, any>
}

export interface Claim {
  id: string
  campaignId: string
  userPublicKey: string
  mintAddress?: string
  tokenAccount?: string
  transactionHash?: string
  gasCost?: number
  claimedAt: string
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, any>
  campaign?: Campaign
}

export interface ApiKey {
  id: string
  key: string
  name: string
  organizerId: string
  isActive: boolean
  lastUsedAt?: string
  createdAt: string
}

export interface Usage {
  id: string
  organizerId: string
  date: string
  claims: number
  gasCost: number
}

// ==============================
// Respuestas API
// ==============================
export interface AuthResponse {
  success: boolean
  data?: {
    organizer: Organizer
    token: string
    message: string
    /** Opcional: útil para redirecciones inmediatas en el front */
    role?: Role
    redirect?: string
  }
  error?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: any
}

export interface PublicCampaign extends Omit<
  Campaign,
  'organizerId' | 'createdAt' | 'updatedAt' | 'organizer'
> {
  isActive: boolean
  _count?: { claims: number }
  claimsRemaining: number | null
}

export interface PaginatedResponse<T> {
  success: boolean
  data?: {
    items?: T[]
    campaigns?: T[]
    claims?: T[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  error?: string
}

export interface CampaignAnalytics {
  campaign: {
    id: string
    name: string
    maxClaims?: number
  }
  claims: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
    remaining: number | null
  }
  gas: {
    totalCost: number
    averageCost: number
    totalCostSOL: number
  }
  dailyClaims: Array<{
    date: string
    claims: number
  }>
}

export interface RelayerStats {
  relayerPublicKey: string
  balance: number
  balanceLamports: number
  totalClaims: number
  totalGasCost: number
  totalGasCostSOL: number
  network: string
  rpcUrl: string
  timestamp: string
}

// ==============================
// Formularios
// ==============================
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  email: string
  name: string
  company?: string
  password: string
  /** Si en algún momento soportas registro de usuario final: 'user' | 'organizer' */
  type?: 'user' | 'organizer'
}

export interface CampaignForm {
  name: string
  description?: string
  eventDate: string
  location?: string
  imageUrl?: string
  externalUrl?: string
  secretCode?: string
  maxClaims?: number
  metadata?: Record<string, any>
}

export interface ApiKeyForm {
  name: string
}

// ==============================
// Límites por plan
// ==============================
export interface TierLimits {
  campaigns: number
  monthlyClaims: number
  apiKeys: number
}

export const TIER_LIMITS: Record<'free' | 'pro' | 'enterprise', TierLimits> = {
  free: {
    campaigns: 3,
    monthlyClaims: 100,
    apiKeys: 2,
  },
  pro: {
    campaigns: 50,
    monthlyClaims: 5000,
    apiKeys: 10,
  },
  enterprise: {
    campaigns: 500,
    monthlyClaims: 50000,
    apiKeys: 50,
  },
}
