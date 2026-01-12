import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ArrowLeft, Search, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cellService, memberService } from '@/services'
import type { CellCreate, CellUpdate, Member, CellDetail } from '@/types'

const cellSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
  leader_id: z.string().optional().or(z.literal('')),
  assistant_leader_id: z.string().optional().or(z.literal('')),
  meeting_day: z
    .enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', ''])
    .optional(),
  meeting_time: z.string().optional().or(z.literal('')),
  meeting_location: z.string().optional().or(z.literal('')),
})

type CellFormData = z.infer<typeof cellSchema>

function cleanFormData(data: CellFormData): CellCreate {
  const cleaned: Record<string, unknown> = { name: data.name }
  for (const [key, value] of Object.entries(data)) {
    if (value !== '' && value !== undefined && key !== 'name') {
      cleaned[key] = value
    }
  }
  return cleaned as unknown as CellCreate
}

// Helper to extract member info from cell data
function getMemberFromCell(cell: CellDetail | undefined, type: 'leader' | 'assistant'): Member | null {
  if (!cell) return null
  const info = type === 'leader' ? cell.leader : cell.assistant_leader
  if (!info) return null
  return {
    id: info.id,
    first_name: info.first_name,
    last_name: info.last_name,
    photo_url: info.photo_url,
  } as Member
}

interface MemberSearchProps {
  label: string
  selectedMember: Member | null
  onSelect: (member: Member | null) => void
  excludeIds?: string[]
}

function MemberSearch({ label, selectedMember, onSelect, excludeIds = [] }: MemberSearchProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: members } = useQuery({
    queryKey: ['members', 'search', search],
    queryFn: () => memberService.getMembers({ search, page_size: 10 }),
    enabled: search.length >= 2,
  })

  const filteredMembers = members?.items.filter((m) => !excludeIds.includes(m.id)) ?? []

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {selectedMember ? (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {selectedMember.first_name} {selectedMember.last_name}
            </p>
            {selectedMember.email && (
              <p className="text-xs text-muted-foreground">{selectedMember.email}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-9"
          />
          {isOpen && search.length >= 2 && filteredMembers.length > 0 && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                    onClick={() => {
                      onSelect(member)
                      setSearch('')
                      setIsOpen(false)
                    }}
                  >
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.email && (
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Inner form component that receives cell data as prop
function CellFormInner({ cell }: { cell?: CellDetail }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  // Initialize leader/assistant from cell data
  const [leader, setLeader] = useState<Member | null>(() => getMemberFromCell(cell, 'leader'))
  const [assistantLeader, setAssistantLeader] = useState<Member | null>(() => getMemberFromCell(cell, 'assistant'))

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CellFormData>({
    resolver: zodResolver(cellSchema),
    defaultValues: cell ? {
      name: cell.name,
      description: cell.description || '',
      leader_id: cell.leader_id || '',
      assistant_leader_id: cell.assistant_leader_id || '',
      meeting_day: cell.meeting_day || '',
      meeting_time: cell.meeting_time || '',
      meeting_location: cell.meeting_location || '',
    } : {},
  })

  // Update form values when leader/assistant changes
  const handleLeaderChange = useCallback((member: Member | null) => {
    setLeader(member)
    setValue('leader_id', member?.id || '')
  }, [setValue])

  const handleAssistantChange = useCallback((member: Member | null) => {
    setAssistantLeader(member)
    setValue('assistant_leader_id', member?.id || '')
  }, [setValue])

  const createMutation = useMutation({
    mutationFn: (data: CellCreate) => cellService.createCell(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] })
      navigate('/admin/cells')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ cellId, data }: { cellId: string; data: CellUpdate }) =>
      cellService.updateCell(cellId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] })
      queryClient.invalidateQueries({ queryKey: ['cell', id] })
      navigate(`/admin/cells/${id}`)
    },
  })

  const onSubmit = async (data: CellFormData) => {
    const cleanData = cleanFormData(data)
    if (isEditing) {
      await updateMutation.mutateAsync({ cellId: id!, data: cleanData })
    } else {
      await createMutation.mutateAsync(cleanData)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={isEditing ? `/admin/cells/${id}` : '/admin/cells'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Cell' : 'Create Cell Group'}</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update cell group information' : 'Create a new cell group'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Cell group details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" {...register('name')} placeholder="e.g., Youth Cell" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of this cell group..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Leadership */}
          <Card>
            <CardHeader>
              <CardTitle>Leadership</CardTitle>
              <CardDescription>Assign cell leaders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="hidden" {...register('leader_id')} />
              <input type="hidden" {...register('assistant_leader_id')} />

              <MemberSearch
                label="Cell Leader"
                selectedMember={leader}
                onSelect={handleLeaderChange}
                excludeIds={assistantLeader ? [assistantLeader.id] : []}
              />

              <MemberSearch
                label="Assistant Leader"
                selectedMember={assistantLeader}
                onSelect={handleAssistantChange}
                excludeIds={leader ? [leader.id] : []}
              />
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <CardDescription>When and where the cell meets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meeting_day">Meeting Day</Label>
                  <select
                    id="meeting_day"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register('meeting_day')}
                  >
                    <option value="">Select day...</option>
                    <option value="monday">Monday</option>
                    <option value="tuesday">Tuesday</option>
                    <option value="wednesday">Wednesday</option>
                    <option value="thursday">Thursday</option>
                    <option value="friday">Friday</option>
                    <option value="saturday">Saturday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meeting_time">Meeting Time</Label>
                  <Input id="meeting_time" type="time" {...register('meeting_time')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting_location">Meeting Location</Label>
                <Input
                  id="meeting_location"
                  {...register('meeting_location')}
                  placeholder="e.g., Church Hall, Member's Home"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link to={isEditing ? `/admin/cells/${id}` : '/admin/cells'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Cell' : 'Create Cell'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function CellForm() {
  const { id } = useParams()
  const isEditing = !!id

  const { data: cell, isLoading: cellLoading } = useQuery({
    queryKey: ['cell', id],
    queryFn: () => cellService.getCell(id!),
    enabled: isEditing,
  })

  if (isEditing && cellLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Key forces remount when cell data changes
  return <CellFormInner key={cell?.id ?? 'new'} cell={cell} />
}
