import api from './api'
import type {
  MarkAnsweredRequest,
  MarkAnsweredResponse,
  PrayerModerationRequest,
  PrayerModerationResponse,
  PrayerRequest,
  PrayerRequestCreate,
  PrayerRequestListResponse,
  PrayerRequestUpdate,
  PrayerStatus,
  PrayResponse,
  PublicPrayerListResponse,
} from '@/types'

interface PrayerListParams {
  page?: number
  page_size?: number
  status?: PrayerStatus
}

interface PrayerWallParams {
  page?: number
  page_size?: number
  status?: 'approved' | 'answered'
}

export const prayerService = {
  // Admin endpoints
  async getPrayerRequests(params: PrayerListParams = {}): Promise<PrayerRequestListResponse> {
    const response = await api.get<PrayerRequestListResponse>('/prayer-requests', {
      params,
    })
    return response.data
  },

  async getPendingRequests(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PrayerRequestListResponse> {
    const response = await api.get<PrayerRequestListResponse>(
      '/prayer-requests/pending',
      { params: { page, page_size: pageSize } }
    )
    return response.data
  },

  async getPrayerRequest(id: string): Promise<PrayerRequest> {
    const response = await api.get<PrayerRequest>(`/prayer-requests/${id}`)
    return response.data
  },

  async moderatePrayerRequest(
    id: string,
    request: PrayerModerationRequest
  ): Promise<PrayerModerationResponse> {
    const response = await api.put<PrayerModerationResponse>(
      `/prayer-requests/${id}/moderate`,
      request
    )
    return response.data
  },

  // Public endpoints
  async getPrayerWall(params: PrayerWallParams = {}): Promise<PublicPrayerListResponse> {
    const response = await api.get<PublicPrayerListResponse>('/prayer-requests/wall', {
      params,
    })
    return response.data
  },

  async submitPrayerRequest(data: PrayerRequestCreate): Promise<PrayerRequest> {
    const response = await api.post<PrayerRequest>('/prayer-requests', data)
    return response.data
  },

  async getMyPrayerRequests(
    page: number = 1,
    pageSize: number = 20
  ): Promise<PrayerRequestListResponse> {
    const response = await api.get<PrayerRequestListResponse>('/prayer-requests/my', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },

  async updatePrayerRequest(
    id: string,
    data: PrayerRequestUpdate
  ): Promise<PrayerRequest> {
    const response = await api.put<PrayerRequest>(`/prayer-requests/${id}`, data)
    return response.data
  },

  async deletePrayerRequest(id: string): Promise<void> {
    await api.delete(`/prayer-requests/${id}`)
  },

  async prayForRequest(id: string): Promise<PrayResponse> {
    const response = await api.post<PrayResponse>(`/prayer-requests/${id}/pray`)
    return response.data
  },

  async markAsAnswered(
    id: string,
    request: MarkAnsweredRequest = {}
  ): Promise<MarkAnsweredResponse> {
    const response = await api.put<MarkAnsweredResponse>(
      `/prayer-requests/${id}/answered`,
      request
    )
    return response.data
  },
}
