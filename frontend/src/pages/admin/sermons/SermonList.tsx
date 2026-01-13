import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  BookOpen,
  Play,
  Calendar,
  User,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Upload,
  Mic,
  Video,
  Search,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { sermonService } from '@/services'
import type { Sermon } from '@/types'
import { cn } from '@/lib/utils'

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
}

export function SermonList() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [publishedFilter, setPublishedFilter] = useState<'' | 'true' | 'false'>('')
  const queryClient = useQueryClient()

  const { data: seriesData } = useQuery({
    queryKey: ['sermon-series'],
    queryFn: () => sermonService.getSeries(false),
  })

  const { data: sermonsData, isLoading } = useQuery({
    queryKey: ['sermons', page, search, selectedSeriesId, publishedFilter],
    queryFn: () =>
      sermonService.getSermons({
        page,
        page_size: 20,
        search: search || undefined,
        series_id: selectedSeriesId || undefined,
        is_published: publishedFilter ? publishedFilter === 'true' : undefined,
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sermonService.deleteSermon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => sermonService.publishSermon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: (id: string) => sermonService.unpublishSermon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
    },
  })

  const handleDelete = (sermon: Sermon) => {
    if (window.confirm(`Delete "${sermon.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(sermon.id)
    }
  }

  const handleTogglePublish = (sermon: Sermon) => {
    if (sermon.is_published) {
      unpublishMutation.mutate(sermon.id)
    } else {
      publishMutation.mutate(sermon.id)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sermons</h1>
          <p className="text-muted-foreground">Manage sermon recordings and series</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/sermons/series">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              Manage Series
            </Button>
          </Link>
          <Link to="/admin/sermons/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sermon
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, speaker, or scripture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="flex gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={selectedSeriesId}
            onChange={(e) => {
              setSelectedSeriesId(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Series</option>
            {seriesData?.items.map((series) => (
              <option key={series.id} value={series.id}>
                {series.title}
              </option>
            ))}
          </select>

          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={publishedFilter}
            onChange={(e) => {
              setPublishedFilter(e.target.value as '' | 'true' | 'false')
              setPage(1)
            }}
          >
            <option value="">All Status</option>
            <option value="true">Published</option>
            <option value="false">Unpublished</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sermonsData?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No sermons found</h3>
            <p className="text-muted-foreground mb-4">Get started by creating a sermon</p>
            <Link to="/admin/sermons/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Sermon
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sermonsData?.items.map((sermon) => (
            <Card
              key={sermon.id}
              className={cn('hover:shadow-md transition-shadow', !sermon.is_published && 'opacity-75')}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-20 bg-muted rounded-md flex-shrink-0 overflow-hidden">
                    {sermon.thumbnail_url ? (
                      <img
                        src={sermon.thumbnail_url}
                        alt={sermon.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link
                        to={`/admin/sermons/${sermon.id}`}
                        className="text-lg font-medium hover:text-primary truncate"
                      >
                        {sermon.title}
                      </Link>
                      {sermon.is_published ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Draft
                        </span>
                      )}
                      {sermon.series_title && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {sermon.series_title}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(sermon.sermon_date), 'MMM d, yyyy')}
                      </span>
                      {sermon.speaker_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {sermon.speaker_name}
                        </span>
                      )}
                      {sermon.duration_seconds && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {formatDuration(sermon.duration_seconds)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {sermon.view_count} views
                      </span>
                    </div>

                    {/* Media indicators */}
                    <div className="flex gap-2 mt-2">
                      {sermon.video_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Video className="h-3 w-3" /> Video
                        </span>
                      )}
                      {sermon.audio_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Mic className="h-3 w-3" /> Audio
                        </span>
                      )}
                      {!sermon.video_url && !sermon.audio_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                          <Upload className="h-3 w-3" /> No media uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublish(sermon)}
                      disabled={publishMutation.isPending || unpublishMutation.isPending}
                      title={sermon.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {sermon.is_published ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Link to={`/admin/sermons/${sermon.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(sermon)}
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
          {sermonsData && sermonsData.total_pages > 1 && (
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
                Page {page} of {sermonsData.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(sermonsData.total_pages, p + 1))}
                disabled={page === sermonsData.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
