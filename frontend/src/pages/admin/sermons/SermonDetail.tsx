import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  BookOpen,
  Download,
  Video,
  Mic,
  FileText,
  Image,
  Clock,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sermonService } from '@/services'

function formatDuration(seconds: number | null): string {
  if (!seconds) return 'Unknown'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export function SermonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: sermon, isLoading } = useQuery({
    queryKey: ['sermon', id],
    queryFn: () => sermonService.getSermon(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => sermonService.deleteSermon(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      navigate('/admin/sermons')
    },
  })

  const publishMutation = useMutation({
    mutationFn: () => sermonService.publishSermon(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      queryClient.invalidateQueries({ queryKey: ['sermon', id] })
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: () => sermonService.unpublishSermon(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sermons'] })
      queryClient.invalidateQueries({ queryKey: ['sermon', id] })
    },
  })

  const handleDelete = () => {
    if (window.confirm('Delete this sermon? This cannot be undone.')) {
      deleteMutation.mutate()
    }
  }

  const handleTogglePublish = () => {
    if (sermon?.is_published) {
      unpublishMutation.mutate()
    } else {
      publishMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!sermon) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Sermon not found</h2>
        <Link to="/admin/sermons">
          <Button variant="outline">Back to Sermons</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/sermons">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{sermon.title}</h1>
              {sermon.is_published ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Published
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  Draft
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {format(parseISO(sermon.sermon_date), 'MMMM d, yyyy')}
              {sermon.speaker_name && ` • ${sermon.speaker_name}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={publishMutation.isPending || unpublishMutation.isPending}
          >
            {sermon.is_published ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
          <Link to={`/admin/sermons/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video/Audio Player */}
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
            </CardHeader>
            <CardContent>
              {sermon.video_url ? (
                <video
                  src={sermon.video_url}
                  controls
                  className="w-full rounded-lg bg-black aspect-video"
                  poster={sermon.thumbnail_url || undefined}
                >
                  Your browser does not support the video element.
                </video>
              ) : sermon.audio_url ? (
                <div className="bg-muted rounded-lg p-8 flex flex-col items-center">
                  {sermon.thumbnail_url ? (
                    <img
                      src={sermon.thumbnail_url}
                      alt={sermon.title}
                      className="w-48 h-48 rounded-lg object-cover mb-4"
                    />
                  ) : (
                    <Mic className="h-16 w-16 text-primary mb-4" />
                  )}
                  <audio src={sermon.audio_url} controls className="w-full max-w-md">
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No media uploaded yet</p>
                  <Link to={`/admin/sermons/${id}/edit`}>
                    <Button variant="outline" className="mt-4">
                      Upload Media
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {sermon.description && (
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{sermon.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Related Sermons */}
          {sermon.related_sermons && sermon.related_sermons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Related Sermons</CardTitle>
                <CardDescription>Other sermons from this series</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sermon.related_sermons.map((related) => (
                    <Link
                      key={related.id}
                      to={`/admin/sermons/${related.id}`}
                      className="flex items-center gap-4 p-3 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="w-16 h-10 bg-muted rounded overflow-hidden flex-shrink-0">
                        {related.thumbnail_url ? (
                          <img
                            src={related.thumbnail_url}
                            alt={related.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{related.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(related.sermon_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(sermon.sermon_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {sermon.speaker_name && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Speaker</p>
                    <p className="text-sm text-muted-foreground">{sermon.speaker_name}</p>
                  </div>
                </div>
              )}

              {sermon.series_title && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Series</p>
                    <p className="text-sm text-muted-foreground">{sermon.series_title}</p>
                  </div>
                </div>
              )}

              {sermon.scripture_reference && (
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Scripture</p>
                    <p className="text-sm text-muted-foreground">{sermon.scripture_reference}</p>
                  </div>
                </div>
              )}

              {sermon.duration_seconds && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(sermon.duration_seconds)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Views</p>
                  <p className="text-sm text-muted-foreground">{sermon.view_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Files */}
          <Card>
            <CardHeader>
              <CardTitle>Media Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MediaFileRow
                icon={<Video className="h-4 w-4" />}
                label="Video"
                url={sermon.video_url}
              />
              <MediaFileRow
                icon={<Mic className="h-4 w-4" />}
                label="Audio"
                url={sermon.audio_url}
              />
              <MediaFileRow
                icon={<Image className="h-4 w-4" />}
                label="Thumbnail"
                url={sermon.thumbnail_url}
              />
              <MediaFileRow
                icon={<FileText className="h-4 w-4" />}
                label="Notes"
                url={sermon.notes_url}
              />
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(parseISO(sermon.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{format(parseISO(sermon.updated_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              {sermon.published_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Published</span>
                  <span>{format(parseISO(sermon.published_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface MediaFileRowProps {
  icon: React.ReactNode
  label: string
  url: string | null | undefined
}

function MediaFileRow({ icon, label, url }: MediaFileRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Not uploaded</span>
      )}
    </div>
  )
}
