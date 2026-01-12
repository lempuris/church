import { create } from 'zustand'
import type { User } from '@/types'
import { authService } from '@/services/auth'
import { setAccessToken } from '@/services/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      await authService.login({ email, password })
      const user = await authService.getCurrentUser()
      set({ user, isAuthenticated: true, isLoading: false })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authService.logout()
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  checkAuth: async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const tokens = await authService.refreshToken()
      if (tokens) {
        setAccessToken(tokens.access_token)
        const user = await authService.getCurrentUser()
        set({ user, isAuthenticated: true, isLoading: false })
      } else {
        set({ isLoading: false, isAuthenticated: false })
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false })
    }
  },

  clearError: () => set({ error: null }),
}))
