import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import {
  BarChart3,
  Calendar,
  Users,
  TrendingUp,
  Download,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { attendanceService } from '@/services'
import type { EventAttendanceSummary } from '@/types'

// Simple bar chart component
function SimpleBarChart({ data, maxValue }: { data: EventAttendanceSummary[]; maxValue: number }) {
  if (data.length === 0) return null
  
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map((event) => {
        const percentage = maxValue > 0 ? (event.attendance_count / maxValue) * 100 : 0
        return (
          <div key={event.event_id} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate max-w-[200px]" title={event.event_title}>
                {event.event_title}
              </span>
              <span className="font-medium">{event.attendance_count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Stat card for summary
function SummaryStatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}

export function AttendanceReports() {
  const today = new Date()
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'))

  const { data: summaryReport, isLoading, refetch } = useQuery({
    queryKey: ['attendance-summary', startDate, endDate],
    queryFn: () => attendanceService.getAttendanceSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })

  const handleQuickRange = (days: number) => {
    const end = new Date()
    const start = subDays(end, days)
    setStartDate(format(start, 'yyyy-MM-dd'))
    setEndDate(format(end, 'yyyy-MM-dd'))
  }

  const handleThisMonth = () => {
    setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'))
    setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'))
  }

  const maxAttendance = summaryReport?.events
    ? Math.max(...summaryReport.events.map((e) => e.attendance_count), 1)
    : 1

  // Group events by type
  const eventsByType = summaryReport?.events?.reduce(
    (acc, event) => {
      const type = event.event_type
      if (!acc[type]) {
        acc[type] = { count: 0, totalAttendance: 0 }
      }
      acc[type].count++
      acc[type].totalAttendance += event.attendance_count
      return acc
    },
    {} as Record<string, { count: number; totalAttendance: number }>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Reports</h1>
        <p className="text-muted-foreground">
          View attendance statistics and trends across events
        </p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range</CardTitle>
          <CardDescription>Select a date range to view attendance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={() => refetch()} disabled={isLoading}>
              Apply
            </Button>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickRange(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={handleThisMonth}>
                This Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && summaryReport && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryStatCard
              title="Total Events"
              value={summaryReport.total_events}
              icon={Calendar}
              description={`From ${format(new Date(summaryReport.period_start), 'MMM d')} to ${format(new Date(summaryReport.period_end), 'MMM d, yyyy')}`}
            />
            <SummaryStatCard
              title="Total Attendance"
              value={summaryReport.total_attendance}
              icon={Users}
              description="People checked in"
            />
            <SummaryStatCard
              title="Average Attendance"
              value={Math.round(summaryReport.average_attendance)}
              icon={TrendingUp}
              description="Per event"
            />
            <SummaryStatCard
              title="Event Types"
              value={eventsByType ? Object.keys(eventsByType).length : 0}
              icon={BarChart3}
              description="Different event categories"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Attendance by Event */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendance by Event</CardTitle>
                  <CardDescription>Top events by attendance count</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {summaryReport.events && summaryReport.events.length > 0 ? (
                  <SimpleBarChart data={summaryReport.events} maxValue={maxAttendance} />
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No events with attendance in this period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Attendance by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Event Type</CardTitle>
                <CardDescription>Breakdown by event category</CardDescription>
              </CardHeader>
              <CardContent>
                {eventsByType && Object.keys(eventsByType).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(eventsByType).map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{type.replace('_', ' ')}</p>
                          <p className="text-sm text-muted-foreground">
                            {data.count} event{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{data.totalAttendance}</p>
                          <p className="text-sm text-muted-foreground">
                            Avg: {Math.round(data.totalAttendance / data.count)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No attendance data available
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Event Details Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>All events with attendance in the selected period</CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              {summaryReport.events && summaryReport.events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 font-medium">Event</th>
                        <th className="text-left py-3 px-2 font-medium">Type</th>
                        <th className="text-left py-3 px-2 font-medium">Date</th>
                        <th className="text-right py-3 px-2 font-medium">Attendance</th>
                        <th className="text-right py-3 px-2 font-medium">Capacity</th>
                        <th className="text-right py-3 px-2 font-medium">Fill Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryReport.events.map((event) => {
                        const fillRate = event.capacity
                          ? Math.round((event.attendance_count / event.capacity) * 100)
                          : null
                        return (
                          <tr key={event.event_id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2">{event.event_title}</td>
                            <td className="py-3 px-2 capitalize">{event.event_type.replace('_', ' ')}</td>
                            <td className="py-3 px-2">
                              {format(new Date(event.event_date), 'MMM d, yyyy')}
                            </td>
                            <td className="py-3 px-2 text-right font-medium">
                              {event.attendance_count}
                            </td>
                            <td className="py-3 px-2 text-right text-muted-foreground">
                              {event.capacity || '—'}
                            </td>
                            <td className="py-3 px-2 text-right">
                              {fillRate !== null ? (
                                <span
                                  className={
                                    fillRate >= 80
                                      ? 'text-green-600'
                                      : fillRate >= 50
                                        ? 'text-yellow-600'
                                        : 'text-muted-foreground'
                                  }
                                >
                                  {fillRate}%
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No events found in this date range
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
