import api from './api'
import type { UserDetail, UserListResponse, UserUpdate, UserStats } from '@/types'

interface UserListParams {
  page?: number
  page_size?: number
  role?: string
  is_active?: boolean
  search?: string
}

export const userService = {
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/admin/users', { params })
    return response.data
  },

  async getUser(id: string): Promise<UserDetail> {
    const response = await api.get<UserDetail>(`/admin/users/${id}`)
    return response.data
  },

  async updateUser(id: string, data: UserUpdate): Promise<UserDetail> {
    const response = await api.put<UserDetail>(`/admin/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`)
  },

  async promoteToAdmin(id: string): Promise<UserDetail> {
    const response = await api.post<UserDetail>(`/admin/users/${id}/promote`)
    return response.data
  },

  async demoteToMember(id: string): Promise<UserDetail> {
    const response = await api.post<UserDetail>(`/admin/users/${id}/demote`)
    return response.data
  },

  async getStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/admin/users/stats')
    return response.data
  },
}
