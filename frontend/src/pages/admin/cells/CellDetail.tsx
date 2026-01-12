import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users2,
  MapPin,
  Clock,
  Plus,
  X,
  Search,
  Loader2,
  Mail,
  Phone,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cellService, memberService } from '@/services'
import type { Member } from '@/types'

const DAYS_DISPLAY: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function CellDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  const { data: cell, isLoading } = useQuery({
    queryKey: ['cell', id],
    queryFn: () => cellService.getCell(id!),
    enabled: !!id,
  })

  const { data: searchResults } = useQuery({
    queryKey: ['members', 'search', memberSearch],
    queryFn: () => memberService.getMembers({ search: memberSearch, page_size: 10 }),
    enabled: memberSearch.length >= 2,
  })

  const deleteMutation = useMutation({
    mutationFn: () => cellService.deleteCell(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] })
      navigate('/admin/cells')
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: (memberId: string) => cellService.addCellMember(id!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cell', id] })
      setMemberSearch('')
      setShowAddMember(false)
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => cellService.removeCellMember(id!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cell', id] })
    },
  })

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${cell?.name}"?`)) {
      deleteMutation.mutate()
    }
  }

  const handleAddMember = (member: Member) => {
    addMemberMutation.mutate(member.id)
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (window.confirm(`Remove ${memberName} from this cell?`)) {
      removeMemberMutation.mutate(memberId)
    }
  }

  // Filter out members already in the cell
  const availableMembers =
    searchResults?.items.filter(
      (m) => !cell?.members.some((cm) => cm.id === m.id)
    ) ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!cell) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Cell not found</h2>
        <Link to="/admin/cells">
          <Button variant="outline">Back to Cells</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/cells">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{cell.name}</h1>
            <p className="text-muted-foreground">{cell.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/cells/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
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
        {/* Cell Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Cell Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Meeting Details */}
            <div className="space-y-2">
              {cell.meeting_day && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {DAYS_DISPLAY[cell.meeting_day]}
                    {cell.meeting_time && ` at ${cell.meeting_time}`}
                  </span>
                </div>
              )}
              {cell.meeting_location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{cell.meeting_location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span>{cell.member_count} members</span>
              </div>
            </div>

            {/* Leadership */}
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Leadership</h4>
              {cell.leader ? (
                <Link
                  to={`/admin/members/${cell.leader.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                    {cell.leader.first_name.charAt(0)}
                    {cell.leader.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {cell.leader.first_name} {cell.leader.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Cell Leader</p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">No leader assigned</p>
              )}

              {cell.assistant_leader && (
                <Link
                  to={`/admin/members/${cell.assistant_leader.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors mt-2"
                >
                  <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-medium">
                    {cell.assistant_leader.first_name.charAt(0)}
                    {cell.assistant_leader.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {cell.assistant_leader.first_name} {cell.assistant_leader.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">Assistant Leader</p>
                  </div>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Members ({cell.members.length})</CardTitle>
            <Button size="sm" onClick={() => setShowAddMember(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </CardHeader>
          <CardContent>
            {/* Add Member Search */}
            {showAddMember && (
              <div className="mb-4 p-4 border rounded-md bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Add Member</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => {
                      setShowAddMember(false)
                      setMemberSearch('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                {memberSearch.length >= 2 && availableMembers.length > 0 && (
                  <div className="mt-2 border rounded-md divide-y max-h-48 overflow-auto">
                    {availableMembers.map((member) => (
                      <button
                        key={member.id}
                        className="w-full text-left px-3 py-2 hover:bg-muted flex items-center justify-between"
                        onClick={() => handleAddMember(member)}
                        disabled={addMemberMutation.isPending}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {member.first_name} {member.last_name}
                          </p>
                          {member.email && (
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          )}
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                {memberSearch.length >= 2 && availableMembers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">No members found</p>
                )}
              </div>
            )}

            {/* Members List */}
            {cell.members.length === 0 ? (
              <div className="text-center py-8">
                <Users2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No members in this cell yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {cell.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-3 first:pt-0"
                  >
                    <Link
                      to={`/admin/members/${member.id}`}
                      className="flex items-center gap-3 hover:opacity-80"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-medium text-sm">
                        {member.first_name.charAt(0)}
                        {member.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {member.first_name} {member.last_name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {member.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        handleRemoveMember(member.id, `${member.first_name} ${member.last_name}`)
                      }
                      disabled={removeMemberMutation.isPending}
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
