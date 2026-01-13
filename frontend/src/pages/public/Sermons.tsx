import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Play, Search, Calendar, User, Download, Volume2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { sermonService } from '@/services'
import type { PublicSermon } from '@/types'

function formatDuration(seconds: number | null): string {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
}

interface SermonPlayerProps {
  sermon: PublicSermon
  onClose: () => void
}

function SermonPlayer({ sermon, onClose }: SermonPlayerProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{sermon.title}</h2>
              <p className="text-muted-foreground">
                {sermon.speaker_name} &middot; {format(parseISO(sermon.sermon_date), 'MMMM d, yyyy')}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              &times;
            </Button>
          </div>

          {sermon.video_url ? (
            <video
              src={sermon.video_url}
              controls
              autoPlay
              className="w-full rounded-lg bg-black aspect-video"
            >
              Your browser does not support the video element.
            </video>
          ) : sermon.audio_url ? (
            <div className="bg-muted rounded-lg p-8 flex flex-col items-center">
              <Volume2 className="h-16 w-16 text-primary mb-4" />
              <audio src={sermon.audio_url} controls autoPlay className="w-full max-w-md">
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-8 text-center">
              <p className="text-muted-foreground">No media available</p>
            </div>
          )}

          {sermon.description && (
            <p className="mt-4 text-muted-foreground">{sermon.description}</p>
          )}

          {sermon.scripture_reference && (
            <p className="mt-2 text-sm">
              <strong>Scripture:</strong> {sermon.scripture_reference}
            </p>
          )}

          {sermon.audio_url && (
            <div className="mt-4">
              <a href={sermon.audio_url} download>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Audio
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Sermons() {
  const [search, setSearch] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('')
  const [selectedSermon, setSelectedSermon] = useState<PublicSermon | null>(null)
  const [page, setPage] = useState(1)

  const { data: seriesData } = useQuery({
    queryKey: ['sermon-series-public'],
    queryFn: () => sermonService.getSeries(true),
  })

  const { data: sermonsData, isLoading } = useQuery({
    queryKey: ['public-sermons', page, search, selectedSeriesId],
    queryFn: () =>
      sermonService.getPublicSermons({
        page,
        page_size: 12,
        search: search || undefined,
        series_id: selectedSeriesId || undefined,
      }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Sermons</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Listen to past sermons and grow in your faith. Browse our collection of messages
          from Sunday services and special events.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="max-w-4xl mx-auto mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
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

        {seriesData && seriesData.items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedSeriesId === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setSelectedSeriesId('')
                setPage(1)
              }}
            >
              All Sermons
            </Button>
            {seriesData.items.map((series) => (
              <Button
                key={series.id}
                variant={selectedSeriesId === series.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSelectedSeriesId(series.id)
                  setPage(1)
                }}
              >
                {series.title}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Sermons Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sermonsData?.items.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Sermons Found</CardTitle>
            <CardDescription className="text-center">
              {search || selectedSeriesId
                ? 'Try adjusting your search or filter criteria.'
                : 'Check back soon for new messages!'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {sermonsData?.items.map((sermon) => (
              <Card
                key={sermon.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedSermon(sermon)}
              >
                <div className="aspect-video bg-muted relative">
                  {sermon.thumbnail_url ? (
                    <img
                      src={sermon.thumbnail_url}
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                  {sermon.duration_seconds && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(sermon.duration_seconds)}
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{sermon.title}</CardTitle>
                  <CardDescription>
                    <div className="flex flex-col gap-1 text-sm">
                      {sermon.speaker_name && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {sermon.speaker_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(sermon.sermon_date), 'MMMM d, yyyy')}
                      </span>
                      {sermon.series_title && (
                        <span className="text-primary text-xs">
                          {sermon.series_title}
                        </span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {sermonsData && sermonsData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
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
                onClick={() => setPage((p) => Math.min(sermonsData.total_pages, p + 1))}
                disabled={page === sermonsData.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Sermon Player Modal */}
      {selectedSermon && (
        <SermonPlayer sermon={selectedSermon} onClose={() => setSelectedSermon(null)} />
      )}
    </div>
  )
}
