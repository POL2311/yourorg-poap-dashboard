import axios, { AxiosInstance, AxiosResponse } from 'axios'
import Cookies from 'js-cookie'
import { 
  AuthResponse, 
  ApiResponse, 
  PaginatedResponse,
  Organizer,
  Campaign,
  Claim,
  ApiKey,
  CampaignAnalytics,
  RelayerStats,
  LoginForm,
  RegisterForm,
  CampaignForm,
  ApiKeyForm
} from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('auth-token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth token on 401
          Cookies.remove('auth-token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // ===== AUTH ENDPOINTS =====

  async register(data: RegisterForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/register', data)
    return response.data
  }

  async login(data: LoginForm): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.client.post('/auth/login', data)
    return response.data
  }

  async getProfile(): Promise<ApiResponse<Organizer>> {
    const response: AxiosResponse<ApiResponse<Organizer>> = await this.client.get('/auth/profile')
    return response.data
  }

  // ===== CAMPAIGN ENDPOINTS =====

  async createCampaign(data: CampaignForm): Promise<ApiResponse<Campaign>> {
    const response: AxiosResponse<ApiResponse<Campaign>> = await this.client.post('/campaigns', data)
    return response.data
  }

  async getCampaigns(params?: {
    page?: number
    limit?: number
    search?: string
    isActive?: boolean
  }): Promise<PaginatedResponse<Campaign>> {
    const response: AxiosResponse<PaginatedResponse<Campaign>> = await this.client.get('/campaigns', { params })
    return response.data
  }

  async getCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response: AxiosResponse<ApiResponse<Campaign>> = await this.client.get(`/campaigns/${id}`)
    return response.data
  }

  async updateCampaign(id: string, data: Partial<CampaignForm>): Promise<ApiResponse<Campaign>> {
    const response: AxiosResponse<ApiResponse<Campaign>> = await this.client.put(`/campaigns/${id}`, data)
    return response.data
  }

  async deleteCampaign(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/campaigns/${id}`)
    return response.data
  }

  async getCampaignAnalytics(id: string): Promise<ApiResponse<CampaignAnalytics>> {
    const response: AxiosResponse<ApiResponse<CampaignAnalytics>> = await this.client.get(`/campaigns/${id}/analytics`)
    return response.data
  }

  async getCampaignClaims(id: string, params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Claim>> {
    const response: AxiosResponse<PaginatedResponse<Claim>> = await this.client.get(`/campaigns/${id}/claims`, { params })
    return response.data
  }

  // ===== API KEY ENDPOINTS =====

  async createApiKey(data: ApiKeyForm): Promise<ApiResponse<ApiKey>> {
    const response: AxiosResponse<ApiResponse<ApiKey>> = await this.client.post('/auth/api-keys', data)
    return response.data
  }

  async getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
    const response: AxiosResponse<ApiResponse<ApiKey[]>> = await this.client.get('/auth/api-keys')
    return response.data
  }

  async deactivateApiKey(id: string): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.delete(`/auth/api-keys/${id}`)
    return response.data
  }

  // ===== PUBLIC ENDPOINTS =====

  async getPublicCampaign(id: string): Promise<ApiResponse<Campaign>> {
    const response: AxiosResponse<ApiResponse<Campaign>> = await this.client.get(`/campaigns/${id}/public`)
    return response.data
  }

  async getUserPOAPs(userPublicKey: string, params?: {
    page?: number
    limit?: number
  }): Promise<PaginatedResponse<Claim>> {
    const response: AxiosResponse<PaginatedResponse<Claim>> = await this.client.get(`/poap/user/${userPublicKey}`, { params })
    return response.data
  }

  // ===== SYSTEM ENDPOINTS =====

  async getRelayerStats(): Promise<ApiResponse<RelayerStats>> {
    const response: AxiosResponse<ApiResponse<RelayerStats>> = await this.client.get('/relayer/stats')
    return response.data
  }

  async getHealth(): Promise<ApiResponse> {
    const response: AxiosResponse<ApiResponse> = await this.client.get('/health')
    return response.data
  }

  // ===== UTILITY METHODS =====

  setAuthToken(token: string) {
    Cookies.set('auth-token', token, { expires: 7 }) // 7 days
  }

  clearAuthToken() {
    Cookies.remove('auth-token')
  }

  getAuthToken(): string | undefined {
    return Cookies.get('auth-token')
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken()
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
export default apiClient