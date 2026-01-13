import api from './api'
import type {
  MediaUploadComplete,
  MediaUploadRequest,
  MediaUploadResponse,
  PublicSermonListResponse,
  Sermon,
  SermonCreate,
  SermonDetail,
  SermonListResponse,
  SermonPublishRequest,
  SermonSeries,
  SermonSeriesCreate,
  SermonSeriesListResponse,
  SermonSeriesUpdate,
  SermonUpdate,
} from '@/types'

interface SermonListParams {
  page?: number
  page_size?: number
  search?: string
  series_id?: string
  speaker_id?: string
  start_date?: string
  end_date?: string
  is_published?: boolean
}

interface PublicSermonListParams {
  page?: number
  page_size?: number
  search?: string
  series_id?: string
  start_date?: string
  end_date?: string
}

export const sermonService = {
  // Series endpoints
  async getSeries(activeOnly: boolean = true): Promise<SermonSeriesListResponse> {
    const response = await api.get<SermonSeriesListResponse>('/sermons/series', {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  async getSeriesById(id: string): Promise<SermonSeries> {
    const response = await api.get<SermonSeries>(`/sermons/series/${id}`)
    return response.data
  },

  async createSeries(data: SermonSeriesCreate): Promise<SermonSeries> {
    const response = await api.post<SermonSeries>('/sermons/series', data)
    return response.data
  },

  async updateSeries(id: string, data: SermonSeriesUpdate): Promise<SermonSeries> {
    const response = await api.put<SermonSeries>(`/sermons/series/${id}`, data)
    return response.data
  },

  async deleteSeries(id: string): Promise<void> {
    await api.delete(`/sermons/series/${id}`)
  },

  async uploadSeriesThumbnail(
    id: string,
    file: File
  ): Promise<MediaUploadResponse> {
    const request: MediaUploadRequest = {
      media_type: 'thumbnail',
      file_name: file.name,
      content_type: file.type,
    }
    const response = await api.post<MediaUploadResponse>(
      `/sermons/series/${id}/thumbnail`,
      request
    )

    // Upload to S3
    await fetch(response.data.upload_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })

    return response.data
  },

  // Sermon endpoints
  async getSermons(params: SermonListParams = {}): Promise<SermonListResponse> {
    const response = await api.get<SermonListResponse>('/sermons', { params })
    return response.data
  },

  async getSermon(id: string): Promise<SermonDetail> {
    const response = await api.get<SermonDetail>(`/sermons/${id}`)
    return response.data
  },

  async getPublicSermons(params: PublicSermonListParams = {}): Promise<PublicSermonListResponse> {
    const response = await api.get<PublicSermonListResponse>('/sermons/public', { params })
    return response.data
  },

  async getPublicSermon(id: string): Promise<SermonDetail> {
    const response = await api.get<SermonDetail>(`/sermons/${id}/public`)
    return response.data
  },

  async createSermon(data: SermonCreate): Promise<Sermon> {
    const response = await api.post<Sermon>('/sermons', data)
    return response.data
  },

  async updateSermon(id: string, data: SermonUpdate): Promise<Sermon> {
    const response = await api.put<Sermon>(`/sermons/${id}`, data)
    return response.data
  },

  async deleteSermon(id: string): Promise<void> {
    await api.delete(`/sermons/${id}`)
  },

  async publishSermon(id: string, request: SermonPublishRequest = {}): Promise<Sermon> {
    const response = await api.put<Sermon>(`/sermons/${id}/publish`, request)
    return response.data
  },

  async unpublishSermon(id: string): Promise<Sermon> {
    const response = await api.put<Sermon>(`/sermons/${id}/unpublish`)
    return response.data
  },

  async getMediaUploadUrl(
    id: string,
    request: MediaUploadRequest
  ): Promise<MediaUploadResponse> {
    const response = await api.post<MediaUploadResponse>(
      `/sermons/${id}/upload`,
      request
    )
    return response.data
  },

  async completeMediaUpload(
    id: string,
    request: MediaUploadComplete
  ): Promise<Sermon> {
    const response = await api.post<Sermon>(
      `/sermons/${id}/upload/complete`,
      request
    )
    return response.data
  },

  async uploadMedia(
    id: string,
    file: File,
    mediaType: 'audio' | 'video' | 'thumbnail' | 'notes',
    onProgress?: (progress: number) => void
  ): Promise<Sermon> {
    // Get presigned URL
    const uploadResponse = await this.getMediaUploadUrl(id, {
      media_type: mediaType,
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
      media_type: mediaType,
      file_key: uploadResponse.file_key,
    })
  },
}
