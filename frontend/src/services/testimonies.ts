import api from './api'
import type {
  PublicTestimony,
  PublicTestimonyListResponse,
  Testimony,
  TestimonyCategory,
  TestimonyCreate,
  TestimonyFeatureRequest,
  TestimonyFeatureResponse,
  TestimonyListResponse,
  TestimonyMediaComplete,
  TestimonyMediaUploadRequest,
  TestimonyMediaUploadResponse,
  TestimonyModerationRequest,
  TestimonyModerationResponse,
  TestimonyStatus,
  TestimonyUpdate,
} from '@/types'

interface TestimonyListParams {
  page?: number
  page_size?: number
  status?: TestimonyStatus
  category?: TestimonyCategory
  is_featured?: boolean
}

interface PublicTestimonyListParams {
  page?: number
  page_size?: number
  category?: TestimonyCategory
}

export const testimonyService = {
  // Admin endpoints
  async getTestimonies(params: TestimonyListParams = {}): Promise<TestimonyListResponse> {
    const response = await api.get<TestimonyListResponse>('/testimonies', { params })
    return response.data
  },

  async getPendingTestimonies(
    page: number = 1,
    pageSize: number = 20
  ): Promise<TestimonyListResponse> {
    const response = await api.get<TestimonyListResponse>('/testimonies/pending', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },

  async getTestimony(id: string): Promise<Testimony> {
    const response = await api.get<Testimony>(`/testimonies/${id}`)
    return response.data
  },

  async moderateTestimony(
    id: string,
    request: TestimonyModerationRequest
  ): Promise<TestimonyModerationResponse> {
    const response = await api.put<TestimonyModerationResponse>(
      `/testimonies/${id}/approve`,
      request
    )
    return response.data
  },

  async setFeatured(
    id: string,
    request: TestimonyFeatureRequest
  ): Promise<TestimonyFeatureResponse> {
    const response = await api.put<TestimonyFeatureResponse>(
      `/testimonies/${id}/feature`,
      request
    )
    return response.data
  },

  // Public endpoints
  async getPublicTestimonies(
    params: PublicTestimonyListParams = {}
  ): Promise<PublicTestimonyListResponse> {
    const response = await api.get<PublicTestimonyListResponse>(
      '/testimonies/public',
      { params }
    )
    return response.data
  },

  async getFeaturedTestimonies(limit: number = 5): Promise<PublicTestimony[]> {
    const response = await api.get<PublicTestimony[]>('/testimonies/featured', {
      params: { limit },
    })
    return response.data
  },

  async getPublicTestimony(id: string): Promise<PublicTestimony> {
    const response = await api.get<PublicTestimony>(`/testimonies/${id}/public`)
    return response.data
  },

  async submitTestimony(data: TestimonyCreate): Promise<Testimony> {
    const response = await api.post<Testimony>('/testimonies', data)
    return response.data
  },

  async getMyTestimonies(
    page: number = 1,
    pageSize: number = 20
  ): Promise<TestimonyListResponse> {
    const response = await api.get<TestimonyListResponse>('/testimonies/my', {
      params: { page, page_size: pageSize },
    })
    return response.data
  },

  async updateTestimony(id: string, data: TestimonyUpdate): Promise<Testimony> {
    const response = await api.put<Testimony>(`/testimonies/${id}`, data)
    return response.data
  },

  async deleteTestimony(id: string): Promise<void> {
    await api.delete(`/testimonies/${id}`)
  },

  async getMediaUploadUrl(
    id: string,
    request: TestimonyMediaUploadRequest
  ): Promise<TestimonyMediaUploadResponse> {
    const response = await api.post<TestimonyMediaUploadResponse>(
      `/testimonies/${id}/upload`,
      request
    )
    return response.data
  },

  async completeMediaUpload(
    id: string,
    request: TestimonyMediaComplete
  ): Promise<Testimony> {
    const response = await api.post<Testimony>(
      `/testimonies/${id}/upload/complete`,
      request
    )
    return response.data
  },

  async uploadMedia(
    id: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Testimony> {
    // Get presigned URL
    const uploadResponse = await this.getMediaUploadUrl(id, {
      file_name: file.name,
      content_type: file.type,
    })

    // Upload to S3 with progress tracking
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadResponse.upload_url, true)
      xhr.setRequestHeader('Content-Type', file.type)

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            onProgress(progress)
          }
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error('Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(file)
    })

    // Complete the upload
    return this.completeMediaUpload(id, {
      file_key: uploadResponse.file_key,
    })
  },
}
