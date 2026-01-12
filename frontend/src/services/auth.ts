import api, { setAccessToken } from './api'
import type { AuthTokens, User, LoginCredentials, RegisterData } from '@/types'

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/login', credentials)
    const { access_token, refresh_token } = response.data

    setAccessToken(access_token)
    localStorage.setItem('refresh_token', refresh_token)

    return response.data
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/auth/register', data)
    return response.data
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken })
      } catch {
        // Ignore errors during logout
      }
    }
    setAccessToken(null)
    localStorage.removeItem('refresh_token')
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email })
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    })
  },

  async refreshToken(): Promise<AuthTokens | null> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return null

    try {
      const response = await api.post<AuthTokens>('/auth/refresh', {
        refresh_token: refreshToken,
      })

      const { access_token, refresh_token: newRefreshToken } = response.data
      setAccessToken(access_token)
      localStorage.setItem('refresh_token', newRefreshToken)

      return response.data
    } catch {
      setAccessToken(null)
      localStorage.removeItem('refresh_token')
      return null
    }
  },
}
