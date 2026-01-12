import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Search,
  Users,
  Plus,
  X,
  Download,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventService, attendanceService, memberService } from '@/services'
import type { Member } from '@/types'

export function EventAttendance() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id!),
    enabled: !!id,
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => attendanceService.getEventAttendance(id!),
    enabled: !!id,
  })

  const { data: searchResults } = useQuery({
    queryKey: ['members', 'search', memberSearch],
    queryFn: () => memberService.getMembers({ search: memberSearch, page_size: 10 }),
    enabled: memberSearch.length >= 2,
  })

  const checkInMutation = useMutation({
    mutationFn: (memberId: string) => attendanceService.checkInMember(id!, { member_id: memberId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', id] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
  })

  const bulkCheckInMutation = useMutation({
    mutationFn: (memberIds: string[]) =>
      attendanceService.bulkCheckIn(id!, { member_ids: memberIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', id] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      setSelectedMembers([])
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => attendanceService.removeAttendance(id!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', id] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
  })

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

  // Filter out already checked-in members and selected members
  const checkedInIds = new Set(attendance?.items.map((a) => a.member.id) ?? [])
  const selectedIds = new Set(selectedMembers.map((m) => m.id))
  const availableMembers =
    searchResults?.items.filter(
      (m) => !checkedInIds.has(m.id) && !selectedIds.has(m.id)
    ) ?? []

  const addToSelection = (member: Member) => {
    setSelectedMembers((prev) => [...prev, member])
    setMemberSearch('')
  }

  const removeFromSelection = (memberId: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== memberId))
  }

  const handleCheckIn = (member: Member) => {
    checkInMutation.mutate(member.id)
  }

  const handleBulkCheckIn = () => {
    const memberIds = selectedMembers.map((m) => m.id)
    bulkCheckInMutation.mutate(memberIds)
  }

  const handleRemove = (memberId: string, memberName: string) => {
    if (window.confirm(`Remove ${memberName} from attendance?`)) {
      removeMutation.mutate(memberId)
    }
  }

  if (eventLoading) {
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
          <Link to={`/admin/events/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Attendance Check-in</h1>
            <p className="text-muted-foreground">
              {event.title} · {format(parseISO(event.start_datetime), 'PPp')}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Check-in Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Check In Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members to check in..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search Results */}
            {memberSearch.length >= 2 && availableMembers.length > 0 && (
              <div className="border rounded-md divide-y max-h-48 overflow-auto">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {member.first_name} {member.last_name}
                      </p>
                      {member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToSelection(member)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(member)}
                        disabled={checkInMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {memberSearch.length >= 2 && availableMembers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members found or all matching members are already checked in
              </p>
            )}

            {/* Selected for Bulk Check-in */}
            {selectedMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    Selected for check-in ({selectedMembers.length})
                  </h4>
                  <Button
                    size="sm"
                    onClick={handleBulkCheckIn}
                    disabled={bulkCheckInMutation.isPending}
                  >
                    {bulkCheckInMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Check In All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      <span>
                        {member.first_name} {member.last_name}
                      </span>
                      <button
                        onClick={() => removeFromSelection(member.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Checked In ({attendance?.total ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !attendance || attendance.items.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members checked in yet</p>
              </div>
            ) : (
              <div className="divide-y max-h-[500px] overflow-auto">
                {attendance.items.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between py-3 first:pt-0"
                  >
                    <Link
                      to={`/admin/members/${record.member.id}`}
                      className="flex items-center gap-3 hover:opacity-80 flex-1"
                    >
                      <div className="h-10 w-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-medium text-sm">
                        {record.member.first_name.charAt(0)}
                        {record.member.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {record.member.first_name} {record.member.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(parseISO(record.checked_in_at), 'p')}</span>
                          <span className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {record.check_in_method}
                          </span>
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        handleRemove(
                          record.member.id,
                          `${record.member.first_name} ${record.member.last_name}`
                        )
                      }
                      disabled={removeMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
