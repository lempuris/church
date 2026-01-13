import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  BookOpen,
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  Image,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { sermonService } from '@/services'
import type { SermonSeries, SermonSeriesCreate, SermonSeriesUpdate } from '@/types'
import { cn } from '@/lib/utils'

export function SermonSeriesList() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<SermonSeries | null>(null)
  const queryClient = useQueryClient()

  const { data: seriesData, isLoading } = useQuery({
    queryKey: ['sermon-series-all'],
    queryFn: () => sermonService.getSeries(false),
  })

  const createMutation = useMutation({
    mutationFn: (data: SermonSeriesCreate) => sermonService.createSeries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermon-series'] })
      queryClient.invalidateQueries({ queryKey: ['sermon-series-all'] })
      setIsFormOpen(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SermonSeriesUpdate }) =>
      sermonService.updateSeries(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermon-series'] })
      queryClient.invalidateQueries({ queryKey: ['sermon-series-all'] })
      setEditingSeries(null)
      setIsFormOpen(false)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sermonService.deleteSeries(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermon-series'] })
      queryClient.invalidateQueries({ queryKey: ['sermon-series-all'] })
    },
  })

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartDate('')
    setEndDate('')
  }

  const handleEdit = (series: SermonSeries) => {
    setEditingSeries(series)
    setTitle(series.title)
    setDescription(series.description || '')
    setStartDate(series.start_date ? format(parseISO(series.start_date), 'yyyy-MM-dd') : '')
    setEndDate(series.end_date ? format(parseISO(series.end_date), 'yyyy-MM-dd') : '')
    setIsFormOpen(true)
  }

  const handleDelete = (series: SermonSeries) => {
    if (series.sermon_count > 0) {
      alert(`Cannot delete "${series.title}" because it has ${series.sermon_count} sermon(s). Remove the sermons from this series first.`)
      return
    }
    if (window.confirm(`Delete "${series.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(series.id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: SermonSeriesCreate = {
      title,
    }
    if (description) data.description = description
    if (startDate) data.start_date = new Date(startDate).toISOString()
    if (endDate) data.end_date = new Date(endDate).toISOString()

    if (editingSeries) {
      updateMutation.mutate({ id: editingSeries.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleCancel = () => {
    setIsFormOpen(false)
    setEditingSeries(null)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/sermons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Sermon Series</h1>
            <p className="text-muted-foreground">Organize sermons into thematic series</p>
          </div>
        </div>
        {!isFormOpen && (
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Series
          </Button>
        )}
      </div>

      {/* Create/Edit Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingSeries ? 'Edit Series' : 'Create Series'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Faith Foundations"
                    required
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A brief description of this sermon series..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSeries ? 'Update Series' : 'Create Series'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Series List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : seriesData?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No sermon series</h3>
            <p className="text-muted-foreground mb-4">
              Create a series to organize your sermons
            </p>
            {!isFormOpen && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Series
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {seriesData?.items.map((series) => (
            <Card
              key={series.id}
              className={cn(
                'overflow-hidden',
                !series.is_active && 'opacity-60'
              )}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-muted relative">
                {series.thumbnail_url ? (
                  <img
                    src={series.thumbnail_url}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {!series.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                      Inactive
                    </span>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{series.title}</h3>

                  {series.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {series.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {series.sermon_count} sermon{series.sermon_count !== 1 ? 's' : ''}
                    </span>
                    {series.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(series.start_date), 'MMM yyyy')}
                        {series.end_date && ` - ${format(parseISO(series.end_date), 'MMM yyyy')}`}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-1 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(series)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(series)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
