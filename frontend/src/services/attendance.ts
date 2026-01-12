import api from './api'
import type {
  Attendance,
  AttendanceBulkCreate,
  AttendanceCreate,
  AttendanceListResponse,
  AttendanceSummaryReport,
  CellAttendanceComparison,
  MemberAttendanceReport,
  QRVerifyRequest,
  QRVerifyResponse,
  SelfCheckInResponse,
} from '@/types'

export const attendanceService = {
  // Event attendance
  async checkInMember(eventId: string, data: AttendanceCreate): Promise<Attendance> {
    const response = await api.post<Attendance>(`/events/${eventId}/attendance`, data)
    return response.data
  },

  async bulkCheckIn(eventId: string, data: AttendanceBulkCreate): Promise<Attendance[]> {
    const response = await api.post<Attendance[]>(`/events/${eventId}/attendance/bulk`, data)
    return response.data
  },

  async getEventAttendance(eventId: string): Promise<AttendanceListResponse> {
    const response = await api.get<AttendanceListResponse>(`/events/${eventId}/attendance`)
    return response.data
  },

  async removeAttendance(eventId: string, memberId: string): Promise<void> {
    await api.delete(`/events/${eventId}/attendance/${memberId}`)
  },

  // Self check-in
  async selfCheckIn(eventId: string): Promise<SelfCheckInResponse> {
    const response = await api.post<SelfCheckInResponse>(`/events/${eventId}/self-checkin`)
    return response.data
  },

  // QR check-in
  async verifyQRCheckIn(data: QRVerifyRequest): Promise<QRVerifyResponse> {
    const response = await api.post<QRVerifyResponse>('/attendance/verify-qr', data)
    return response.data
  },

  // Export
  async exportAttendanceCSV(eventId: string): Promise<Blob> {
    const response = await api.get(`/attendance/export/${eventId}`, {
      responseType: 'blob',
    })
    return response.data
  },

  // Reports
  async getMemberAttendanceReport(
    memberId: string,
    startDate?: string,
    endDate?: string
  ): Promise<MemberAttendanceReport> {
    const response = await api.get<MemberAttendanceReport>(
      `/attendance/reports/member/${memberId}`,
      {
        params: { start_date: startDate, end_date: endDate },
      }
    )
    return response.data
  },

  async getAttendanceSummary(
    startDate: string,
    endDate: string,
    eventType?: string
  ): Promise<AttendanceSummaryReport> {
    const response = await api.get<AttendanceSummaryReport>('/attendance/reports/summary', {
      params: { start_date: startDate, end_date: endDate, event_type: eventType },
    })
    return response.data
  },

  async getCellAttendanceComparison(
    startDate: string,
    endDate: string
  ): Promise<CellAttendanceComparison[]> {
    const response = await api.get<CellAttendanceComparison[]>('/attendance/reports/cells', {
      params: { start_date: startDate, end_date: endDate },
    })
    return response.data
  },
}
