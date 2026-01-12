import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Clock,
  Trash2,
  Edit,
  Ban,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
  CalendarRange,
} from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventService } from '@/services'
import type { Event, EventType, CalendarEvent } from '@/types'
import { cn } from '@/lib/utils'

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  service: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cell_meeting: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  conference: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  special: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  service: 'Service',
  cell_meeting: 'Cell Meeting',
  conference: 'Conference',
  special: 'Special',
  other: 'Other',
}

type ViewMode = 'list' | 'calendar' | 'week'

export function EventList() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [page, setPage] = useState(1)
  const [eventTypeFilter, setEventTypeFilter] = useState<EventType | ''>('')
  const queryClient = useQueryClient()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 })

  // List view query
  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['events', page, eventTypeFilter],
    queryFn: () =>
      eventService.getEvents({
        page,
        page_size: 20,
        event_type: eventTypeFilter || undefined,
      }),
    enabled: viewMode === 'list',
  })

  // Calendar view query (monthly)
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['events', 'calendar', format(monthStart, 'yyyy-MM'), eventTypeFilter],
    queryFn: () =>
      eventService.getCalendarEvents({
        start_date: monthStart.toISOString(),
        end_date: monthEnd.toISOString(),
        event_type: eventTypeFilter || undefined,
      }),
    enabled: viewMode === 'calendar',
  })

  // Week view query
  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['events', 'week', format(weekStart, 'yyyy-MM-dd'), eventTypeFilter],
    queryFn: () =>
      eventService.getCalendarEvents({
        start_date: weekStart.toISOString(),
        end_date: weekEnd.toISOString(),
        event_type: eventTypeFilter || undefined,
      }),
    enabled: viewMode === 'week',
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => eventService.cancelEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })

  const handleCancel = (event: Event) => {
    if (window.confirm(`Cancel "${event.title}"?`)) {
      cancelMutation.mutate(event.id)
    }
  }

  const handleDelete = (event: Event) => {
    if (window.confirm(`Delete "${event.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(event.id)
    }
  }

  const isLoading = 
    viewMode === 'list' ? listLoading : 
    viewMode === 'calendar' ? calendarLoading : 
    weekLoading

  // Get events for a specific day (week view)
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    if (!weekData) return []
    return weekData.filter((event) => isSameDay(parseISO(event.start_datetime), day))
  }

  // Days of the current week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage church events and services</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value as EventType | '')}
          >
            <option value="">All Types</option>
            <option value="service">Service</option>
            <option value="cell_meeting">Cell Meeting</option>
            <option value="conference">Conference</option>
            <option value="special">Special</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('week')}
            title="Week View"
          >
            <CalendarRange className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            title="Month View"
          >
            <CalendarDays className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
      {viewMode === 'calendar' && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Week Navigation */}
      {viewMode === 'week' && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <h2 className="text-lg font-semibold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setCurrentWeek(new Date())}
            >
              Today
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        listData?.items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No events found</h3>
              <p className="text-muted-foreground mb-4">Get started by creating an event</p>
              <Link to="/admin/events/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listData?.items.map((event) => (
              <Card
                key={event.id}
                className={cn(
                  'hover:shadow-md transition-shadow',
                  event.is_cancelled && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/events/${event.id}`}
                          className="text-lg font-medium hover:text-primary"
                        >
                          {event.title}
                        </Link>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            EVENT_TYPE_COLORS[event.event_type]
                          )}
                        >
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </span>
                        {event.is_cancelled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                            Cancelled
                          </span>
                        )}
                        {event.is_recurring && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            Recurring
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(parseISO(event.start_datetime), 'PPp')}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event.attendance_count} attendees
                          {event.capacity && ` / ${event.capacity}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Link to={`/admin/events/${event.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {!event.is_cancelled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(event)}
                          disabled={cancelMutation.isPending}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(event)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {listData && listData.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {listData.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(listData.total_pages, p + 1))}
                  disabled={page === listData.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )
      ) : viewMode === 'week' ? (
        /* Week View */
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day)
            const isToday = isSameDay(day, new Date())
            
            return (
              <div key={day.toISOString()} className="min-h-[200px]">
                <div
                  className={cn(
                    'text-center py-2 border-b mb-2',
                    isToday && 'bg-primary/10 rounded-t-md'
                  )}
                >
                  <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                  <div
                    className={cn(
                      'text-lg font-semibold',
                      isToday && 'text-primary'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No events</p>
                  ) : (
                    dayEvents.map((event) => (
                      <Link
                        key={event.id}
                        to={`/admin/events/${event.id}`}
                        className={cn(
                          'block p-2 rounded text-xs hover:opacity-80 transition-opacity',
                          EVENT_TYPE_COLORS[event.event_type],
                          event.is_cancelled && 'opacity-50 line-through'
                        )}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="opacity-75">
                          {format(parseISO(event.start_datetime), 'h:mm a')}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Monthly Calendar View */
        <Card>
          <CardHeader>
            <CardTitle>Events in {format(currentMonth, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {calendarData?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No events this month</p>
            ) : (
              <div className="space-y-2">
                {calendarData?.map((event) => (
                  <Link
                    key={event.id}
                    to={`/admin/events/${event.id}`}
                    className={cn(
                      'block p-3 border rounded-md hover:bg-muted transition-colors',
                      event.is_cancelled && 'opacity-60'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px]">
                        <div className="text-2xl font-bold">
                          {format(parseISO(event.start_datetime), 'd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(event.start_datetime), 'EEE')}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{event.title}</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              EVENT_TYPE_COLORS[event.event_type]
                            )}
                          >
                            {EVENT_TYPE_LABELS[event.event_type]}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(event.start_datetime), 'p')}
                          {event.end_datetime &&
                            ` - ${format(parseISO(event.end_datetime), 'p')}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
