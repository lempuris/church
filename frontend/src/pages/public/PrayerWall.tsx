import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HandHeart, Heart, User, Clock, CheckCircle, Plus, X } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { prayerService } from '@/services'
import type { PublicPrayerRequest, PrayerRequestCreate } from '@/types'
import { cn } from '@/lib/utils'

interface PrayerCardProps {
  prayer: PublicPrayerRequest
  onPray: (id: string) => void
  isPraying: boolean
}

function PrayerCard({ prayer, onPray, isPraying }: PrayerCardProps) {
  const isAnswered = prayer.status === 'answered'

  return (
    <Card className={cn('relative overflow-hidden', isAnswered && 'border-green-500 bg-green-50 dark:bg-green-950/20')}>
      {isAnswered && (
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3" />
            Answered
          </span>
        </div>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{prayer.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-xs">
          {!prayer.is_anonymous && prayer.author_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {prayer.author_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(parseISO(prayer.created_at), { addSuffix: true })}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
          {prayer.description}
        </p>

        {prayer.answer_testimony && (
          <div className="bg-green-100 dark:bg-green-900/30 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Praise Report:
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">{prayer.answer_testimony}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            <Heart className="h-4 w-4 inline mr-1" />
            {prayer.prayer_count} {prayer.prayer_count === 1 ? 'person' : 'people'} prayed
          </span>
          {!isAnswered && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPray(prayer.id)}
              disabled={isPraying}
            >
              <HandHeart className="mr-2 h-4 w-4" />
              I Prayed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface SubmitFormProps {
  onClose: () => void
}

function SubmitPrayerForm({ onClose }: SubmitFormProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: (data: PrayerRequestCreate) => prayerService.submitPrayerRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-wall'] })
      setSubmitted(true)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate({
      title,
      description,
      author_name: isAnonymous ? undefined : authorName || undefined,
      author_email: authorEmail || undefined,
      is_anonymous: isAnonymous,
      is_public: isPublic,
    })
  }

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <CardTitle className="mb-2">Prayer Request Submitted</CardTitle>
          <CardDescription className="text-center mb-4">
            Thank you for sharing your prayer request. It will be reviewed and posted to the prayer wall shortly.
          </CardDescription>
          <Button onClick={onClose}>Close</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Share Your Prayer Request</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Your request will be reviewed before being posted to the prayer wall.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Prayer Request Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Healing for my mother"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Details *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share the details of your prayer request..."
              rows={4}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author_name">Your Name</Label>
              <Input
                id="author_name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Optional"
                disabled={isAnonymous}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_email">Email (for updates)</Label>
              <Input
                id="author_email"
                type="email"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_anonymous" className="text-sm font-normal">
                Submit anonymously
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="is_public" className="text-sm font-normal">
                Share on the public prayer wall
              </Label>
            </div>
            {!isPublic && (
              <p className="text-xs text-muted-foreground ml-6">
                Your request will only be visible to church leaders
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function PrayerWall() {
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'approved' | 'answered' | ''>('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: prayersData, isLoading } = useQuery({
    queryKey: ['prayer-wall', page, statusFilter],
    queryFn: () =>
      prayerService.getPrayerWall({
        page,
        page_size: 12,
        status: statusFilter || undefined,
      }),
  })

  const prayMutation = useMutation({
    mutationFn: (id: string) => prayerService.prayForRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-wall'] })
    },
  })

  const handlePray = (id: string) => {
    prayMutation.mutate(id)
  }

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-12">
        <SubmitPrayerForm onClose={() => setShowForm(false)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Prayer Wall</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Share your prayer requests and join others in prayer. We believe in the power of
          community intercession.
        </p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Share Prayer Request
        </Button>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-2 mb-8">
        <Button
          variant={statusFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('')
            setPage(1)
          }}
        >
          All Requests
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('approved')
            setPage(1)
          }}
        >
          Active Prayers
        </Button>
        <Button
          variant={statusFilter === 'answered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('answered')
            setPage(1)
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Answered Prayers
        </Button>
      </div>

      {/* Prayer Wall */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prayersData?.items.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HandHeart className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Prayer Requests</CardTitle>
            <CardDescription className="text-center mb-4">
              {statusFilter === 'answered'
                ? 'No answered prayers yet. Keep praying!'
                : 'Be the first to share a prayer request with our community.'}
            </CardDescription>
            {statusFilter !== 'answered' && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Share Prayer Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {prayersData?.items.map((prayer) => (
              <PrayerCard
                key={prayer.id}
                prayer={prayer}
                onPray={handlePray}
                isPraying={prayMutation.isPending}
              />
            ))}
          </div>

          {/* Pagination */}
          {prayersData && prayersData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {prayersData.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(prayersData.total_pages, p + 1))}
                disabled={page === prayersData.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
