import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Ban,
  Calendar,
  MapPin,
  Clock,
  Users,
  QrCode,
  Download,
  Loader2,
  CheckCircle,
  Globe,
  Lock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventService, attendanceService } from '@/services'
import type { EventType } from '@/types'
import { cn } from '@/lib/utils'

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  service: 'bg-blue-100 text-blue-800',
  cell_meeting: 'bg-green-100 text-green-800',
  conference: 'bg-purple-100 text-purple-800',
  special: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service: 'Service',
  cell_meeting: 'Cell Meeting',
  conference: 'Conference',
  special: 'Special',
  other: 'Other',
}

export function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showQR, setShowQR] = useState(false)

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id!),
    enabled: !!id,
  })

  const { data: attendance } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceService.getEventAttendance(id!),
    enabled: !!id,
  })

  const { data: qrCode } = useQuery({
    queryKey: ['qrCode', id],
    queryFn: () => eventService.getEventQRCode(id!),
    enabled: !!id && showQR,
  })

  const cancelMutation = useMutation({
    mutationFn: () => eventService.cancelEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => eventService.deleteEvent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/admin/events')
    },
  })

  const handleCancel = () => {
    if (window.confirm(`Cancel "${event?.title}"?`)) {
      cancelMutation.mutate()
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Delete "${event?.title}"? This cannot be undone.`)) {
      deleteMutation.mutate()
    }
  }

  const handleExport = async () => {
    try {
      const blob = await attendanceService.exportAttendanceCSV(id!)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${event?.title.replace(/\s+/g, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Event not found</h2>
        <Link to="/admin/events">
          <Button variant="outline">Back to Events</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <span className={cn('text-xs px-2 py-0.5 rounded-full', EVENT_TYPE_COLORS[event.event_type])}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </span>
              {event.is_cancelled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  Cancelled
                </span>
              )}
            </div>
            <p className="text-muted-foreground">{event.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/events/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          {!event.is_cancelled && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Event Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Event Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(event.start_datetime), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(parseISO(event.start_datetime), 'p')}
                  {event.end_datetime && ` - ${format(parseISO(event.end_datetime), 'p')}`}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.attendance_count} attendees
                  {event.capacity && ` / ${event.capacity} capacity`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {event.is_public ? (
                  <>
                    <Globe className="h-4 w-4 text-green-600" />
                    <span>Public event</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span>Private event</span>
                  </>
                )}
              </div>
              {event.allow_self_checkin && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Self check-in enabled</span>
                </div>
              )}
              {event.is_recurring && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>Recurring ({event.recurrence_rule})</span>
                </div>
              )}
            </div>

            {/* QR Code Section */}
            {event.allow_self_checkin && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowQR(!showQR)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  {showQR ? 'Hide QR Code' : 'Show QR Code'}
                </Button>
                {showQR && qrCode && (
                  <div className="mt-4 p-4 bg-muted rounded-md text-center">
                    <p className="text-xs text-muted-foreground mb-2">
                      Members scan this QR code to check in
                    </p>
                    <div className="bg-white p-4 rounded-md inline-block">
                      {/* QR Code placeholder - in production use a QR library */}
                      <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                        QR: {qrCode.qr_code_token.substring(0, 8)}...
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Token: {qrCode.qr_code_token}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Attendance ({attendance?.total ?? 0})
            </CardTitle>
            <div className="flex gap-2">
              <Link to={`/admin/events/${id}/attendance`}>
                <Button size="sm">
                  <Users className="mr-2 h-4 w-4" />
                  Check In
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!attendance || attendance.items.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No attendance recorded yet</p>
                <Link to={`/admin/events/${id}/attendance`}>
                  <Button className="mt-4" variant="outline">
                    Start Check-in
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-auto">
                {attendance.items.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3 first:pt-0"
                  >
                    <Link
                      to={`/admin/members/${record.member.id}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-medium text-sm">
                        {record.member.first_name.charAt(0)}
                        {record.member.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {record.member.first_name} {record.member.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(record.checked_in_at), 'p')} · {record.check_in_method}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
                {attendance.items.length > 10 && (
                  <div className="pt-3 text-center">
                    <Link to={`/admin/events/${id}/attendance`}>
                      <Button variant="link">
                        View all {attendance.total} attendees
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
