import api from './api'
import type {
  CalendarEvent,
  Event,
  EventCreate,
  EventListResponse,
  EventUpdate,
  QRCodeResponse,
  EventType,
} from '@/types'

interface EventListParams {
  page?: number
  page_size?: number
  event_type?: EventType
  start_date?: string
  end_date?: string
  include_cancelled?: boolean
}

interface CalendarParams {
  start_date: string
  end_date: string
  event_type?: EventType
}

export const eventService = {
  async getEvents(params: EventListParams = {}): Promise<EventListResponse> {
    const response = await api.get<EventListResponse>('/events', { params })
    return response.data
  },

  async getEvent(id: string): Promise<Event> {
    const response = await api.get<Event>(`/events/${id}`)
    return response.data
  },

  async getUpcomingEvents(limit: number = 10, publicOnly: boolean = true): Promise<Event[]> {
    const response = await api.get<Event[]>('/events/upcoming', {
      params: { limit, public_only: publicOnly },
    })
    return response.data
  },

  async getCalendarEvents(params: CalendarParams): Promise<CalendarEvent[]> {
    const response = await api.get<CalendarEvent[]>('/events/calendar', { params })
    return response.data
  },

  async createEvent(data: EventCreate): Promise<Event> {
    const response = await api.post<Event>('/events', data)
    return response.data
  },

  async updateEvent(id: string, data: EventUpdate, updateAll: boolean = false): Promise<Event> {
    const response = await api.put<Event>(`/events/${id}`, data, {
      params: { update_all: updateAll },
    })
    return response.data
  },

  async cancelEvent(id: string, cancelAll: boolean = false): Promise<Event> {
    const response = await api.post<Event>(`/events/${id}/cancel`, null, {
      params: { cancel_all: cancelAll },
    })
    return response.data
  },

  async deleteEvent(id: string, deleteAll: boolean = false): Promise<void> {
    await api.delete(`/events/${id}`, {
      params: { delete_all: deleteAll },
    })
  },

  async getEventQRCode(id: string): Promise<QRCodeResponse> {
    const response = await api.get<QRCodeResponse>(`/events/${id}/qr-code`)
    return response.data
  },
}
