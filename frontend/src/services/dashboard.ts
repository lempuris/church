import api from './api'
import type { DashboardStats, RecentMember } from '@/types'

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<DashboardStats>('/dashboard/stats')
    return response.data
  },

  async getRecentMembers(limit: number = 10): Promise<RecentMember[]> {
    const response = await api.get<{ members: RecentMember[] }>('/dashboard/recent-members', {
      params: { limit },
    })
    return response.data.members
  },
}
