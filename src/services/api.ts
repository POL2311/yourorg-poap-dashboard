// src/services/api.ts
import axios from 'axios'

// Usa variables públicas de Next.js
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000')
  .replace(/\/$/, '') // sin slash final

const api = axios.create({ baseURL: API_BASE_URL })

export default api
