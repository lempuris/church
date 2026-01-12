import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ArrowLeft } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { eventService } from '@/services'
import type { EventCreate, EventUpdate } from '@/types'

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().or(z.literal('')),
  event_type: z.enum(['service', 'cell_meeting', 'conference', 'special', 'other']),
  start_datetime: z.string().min(1, 'Start date/time is required'),
  end_datetime: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  capacity: z.string().optional().or(z.literal('')),
  is_public: z.boolean(),
  allow_self_checkin: z.boolean(),
  is_recurring: z.boolean(),
  recurrence_rule: z.enum(['weekly', 'biweekly', 'monthly', '']).optional(),
})

type EventFormData = z.infer<typeof eventSchema>

function cleanFormData(data: EventFormData): EventCreate {
  const cleaned: Record<string, unknown> = {
    title: data.title,
    event_type: data.event_type,
    start_datetime: new Date(data.start_datetime).toISOString(),
    is_public: data.is_public,
    allow_self_checkin: data.allow_self_checkin,
    is_recurring: data.is_recurring,
  }

  if (data.description) cleaned.description = data.description
  if (data.end_datetime) cleaned.end_datetime = new Date(data.end_datetime).toISOString()
  if (data.location) cleaned.location = data.location
  if (data.capacity) cleaned.capacity = parseInt(data.capacity, 10)
  if (data.is_recurring && data.recurrence_rule) {
    cleaned.recurrence_rule = data.recurrence_rule
  }

  return cleaned as unknown as EventCreate
}

export function EventForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEvent(id!),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: 'service',
      is_public: true,
      allow_self_checkin: false,
      is_recurring: false,
    },
  })

  const isRecurring = watch('is_recurring')

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        start_datetime: format(parseISO(event.start_datetime), "yyyy-MM-dd'T'HH:mm"),
        end_datetime: event.end_datetime
          ? format(parseISO(event.end_datetime), "yyyy-MM-dd'T'HH:mm")
          : '',
        location: event.location || '',
        capacity: event.capacity?.toString() || '',
        is_public: event.is_public,
        allow_self_checkin: event.allow_self_checkin,
        is_recurring: event.is_recurring,
        recurrence_rule: (event.recurrence_rule as 'weekly' | 'biweekly' | 'monthly' | '') || '',
      })
    }
  }, [event, reset])

  const createMutation = useMutation({
    mutationFn: (data: EventCreate) => eventService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate('/admin/events')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EventUpdate }) =>
      eventService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      navigate(`/admin/events/${id}`)
    },
  })

  const onSubmit = async (data: EventFormData) => {
    const cleanData = cleanFormData(data)
    if (isEditing) {
      // For updates, remove recurring fields (eslint-disable for destructuring unused vars)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { is_recurring, recurrence_rule, ...updateData } = cleanData as EventCreate & {
        is_recurring?: boolean
        recurrence_rule?: string
      }
      await updateMutation.mutateAsync({ id: id!, data: updateData as EventUpdate })
    } else {
      await createMutation.mutateAsync(cleanData)
    }
  }

  if (isEditing && eventLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={isEditing ? `/admin/events/${id}` : '/admin/events'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Event' : 'Create Event'}</h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update event details' : 'Schedule a new church event'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
              <CardDescription>Basic event information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} placeholder="e.g., Sunday Service" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Event details..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type *</Label>
                <select
                  id="event_type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('event_type')}
                >
                  <option value="service">Service</option>
                  <option value="cell_meeting">Cell Meeting</option>
                  <option value="conference">Conference</option>
                  <option value="special">Special</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="e.g., Main Sanctuary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (optional)</Label>
                <Input
                  id="capacity"
                  type="number"
                  {...register('capacity')}
                  placeholder="Maximum attendees"
                />
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
              <CardDescription>When the event takes place</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start_datetime">Start Date & Time *</Label>
                <Input id="start_datetime" type="datetime-local" {...register('start_datetime')} />
                {errors.start_datetime && (
                  <p className="text-sm text-destructive">{errors.start_datetime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_datetime">End Date & Time</Label>
                <Input id="end_datetime" type="datetime-local" {...register('end_datetime')} />
              </div>

              {!isEditing && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="is_recurring"
                      {...register('is_recurring')}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="is_recurring" className="text-sm font-normal">
                      This is a recurring event
                    </Label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_rule">Recurrence Pattern</Label>
                      <select
                        id="recurrence_rule"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...register('recurrence_rule')}
                      >
                        <option value="">Select pattern...</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Biweekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Options */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Options</CardTitle>
              <CardDescription>Visibility and check-in settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  {...register('is_public')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="is_public" className="text-sm font-normal">
                  Public event (visible on website)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allow_self_checkin"
                  {...register('allow_self_checkin')}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="allow_self_checkin" className="text-sm font-normal">
                  Allow self check-in (members can check themselves in)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link to={isEditing ? `/admin/events/${id}` : '/admin/events'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  )
}
