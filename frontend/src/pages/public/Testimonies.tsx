import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Star,
  User,
  Clock,
  Plus,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { testimonyService } from '@/services'
import type { PublicTestimony, TestimonyCategory, TestimonyCreate } from '@/types'
import { cn } from '@/lib/utils'

const categoryLabels: Record<TestimonyCategory, string> = {
  healing: 'Healing',
  provision: 'Provision',
  salvation: 'Salvation',
  deliverance: 'Deliverance',
  family: 'Family',
  career: 'Career',
  other: 'Other',
}

const categoryColors: Record<TestimonyCategory, string> = {
  healing: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  provision: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  salvation: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  deliverance: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  family: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  career: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

interface TestimonyCardProps {
  testimony: PublicTestimony
  onClick: () => void
}

function TestimonyCard({ testimony, onClick }: TestimonyCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1',
        testimony.is_featured && 'ring-2 ring-yellow-400 dark:ring-yellow-500'
      )}
      onClick={onClick}
    >
      {testimony.media_url && (
        <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
          {testimony.media_url.includes('video') ? (
            <div className="w-full h-full flex items-center justify-center bg-black/10">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={testimony.media_url}
              alt={testimony.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
      <CardHeader className={testimony.media_url ? 'pt-4' : ''}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg line-clamp-1">{testimony.title}</CardTitle>
              {testimony.is_featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <CardDescription className="flex items-center gap-2 text-xs">
              <User className="h-3 w-3" />
              <span>{testimony.author_name || 'Anonymous'}</span>
              <span>•</span>
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(parseISO(testimony.created_at), { addSuffix: true })}</span>
            </CardDescription>
          </div>
          {testimony.category && (
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full flex-shrink-0',
                categoryColors[testimony.category]
              )}
            >
              {categoryLabels[testimony.category]}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">{testimony.content}</p>
      </CardContent>
    </Card>
  )
}

interface TestimonyDetailModalProps {
  testimony: PublicTestimony
  onClose: () => void
}

function TestimonyDetailModal({ testimony, onClose }: TestimonyDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{testimony.title}</h2>
                {testimony.is_featured && (
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                {testimony.author_name || 'Anonymous'}
                <span>•</span>
                {formatDistanceToNow(parseISO(testimony.created_at), { addSuffix: true })}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {testimony.category && (
            <span
              className={cn(
                'inline-block text-sm px-3 py-1 rounded-full mb-4',
                categoryColors[testimony.category]
              )}
            >
              {categoryLabels[testimony.category]}
            </span>
          )}

          {testimony.media_url && (
            <div className="mb-6 rounded-lg overflow-hidden bg-muted">
              {testimony.media_url.includes('video') ? (
                <video
                  src={testimony.media_url}
                  controls
                  className="w-full"
                >
                  Your browser does not support the video element.
                </video>
              ) : (
                <img
                  src={testimony.media_url}
                  alt={testimony.title}
                  className="w-full"
                />
              )}
            </div>
          )}

          <p className="text-foreground whitespace-pre-wrap leading-relaxed">
            {testimony.content}
          </p>

          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SubmitFormProps {
  onClose: () => void
}

function SubmitTestimonyForm({ onClose }: SubmitFormProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [category, setCategory] = useState<TestimonyCategory | ''>('')
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: (data: TestimonyCreate) => testimonyService.submitTestimony(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-testimonies'] })
      setSubmitted(true)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMutation.mutate({
      title,
      content,
      author_name: authorName || undefined,
      category: category || undefined,
    })
  }

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <CardTitle className="mb-2">Testimony Submitted!</CardTitle>
          <CardDescription className="text-center mb-4">
            Thank you for sharing your testimony. It will be reviewed and published shortly to
            encourage others in their faith journey.
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
          <CardTitle>Share Your Testimony</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Share how God has worked in your life to encourage others. Your testimony will be
          reviewed before being published.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., God Healed My Marriage"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Your Testimony *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your story of how God has worked in your life..."
              rows={6}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="author_name">Your Name (Optional)</Label>
              <Input
                id="author_name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Leave empty for anonymous"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={category}
                onChange={(e) => setCategory(e.target.value as TestimonyCategory | '')}
              >
                <option value="">Select a category</option>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Submitting...' : 'Submit Testimony'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FeaturedCarousel({ testimonies }: { testimonies: PublicTestimony[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (testimonies.length === 0) return null

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonies.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === testimonies.length - 1 ? 0 : prev + 1))
  }

  const testimony = testimonies[currentIndex]

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
        <h2 className="text-2xl font-bold">Featured Testimonies</h2>
      </div>

      <div className="relative">
        <div className="flex items-start gap-6">
          {testimony.media_url && !testimony.media_url.includes('video') && (
            <div className="w-64 h-40 rounded-lg overflow-hidden flex-shrink-0 hidden md:block">
              <img
                src={testimony.media_url}
                alt={testimony.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{testimony.title}</h3>
            <p className="text-muted-foreground mb-4 line-clamp-4">{testimony.content}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {testimony.author_name || 'Anonymous'}
              </span>
              {testimony.category && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs',
                    categoryColors[testimony.category]
                  )}
                >
                  {categoryLabels[testimony.category]}
                </span>
              )}
            </div>
          </div>
        </div>

        {testimonies.length > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="icon" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              {testimonies.map((_, idx) => (
                <button
                  key={idx}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    idx === currentIndex ? 'bg-primary' : 'bg-primary/30'
                  )}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Testimonies() {
  const [showForm, setShowForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<TestimonyCategory | ''>('')
  const [selectedTestimony, setSelectedTestimony] = useState<PublicTestimony | null>(null)
  const [page, setPage] = useState(1)

  const { data: featuredData } = useQuery({
    queryKey: ['featured-testimonies'],
    queryFn: () => testimonyService.getFeaturedTestimonies(5),
  })

  const { data: testimoniesData, isLoading } = useQuery({
    queryKey: ['public-testimonies', page, categoryFilter],
    queryFn: () =>
      testimonyService.getPublicTestimonies({
        page,
        page_size: 12,
        category: categoryFilter || undefined,
      }),
  })

  if (showForm) {
    return (
      <div className="container mx-auto px-4 py-12">
        <SubmitTestimonyForm onClose={() => setShowForm(false)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Testimonies</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          Read inspiring stories of God's faithfulness and share your own testimony to encourage
          others in their walk with Christ.
        </p>
        <Button onClick={() => setShowForm(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Share Your Testimony
        </Button>
      </div>

      {/* Featured Testimonies Carousel */}
      {featuredData && featuredData.length > 0 && (
        <FeaturedCarousel testimonies={featuredData} />
      )}

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Button
          variant={categoryFilter === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setCategoryFilter('')
            setPage(1)
          }}
        >
          All Categories
        </Button>
        {Object.entries(categoryLabels).map(([value, label]) => (
          <Button
            key={value}
            variant={categoryFilter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setCategoryFilter(value as TestimonyCategory)
              setPage(1)
            }}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Testimonies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : testimoniesData?.items.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No Testimonies Yet</CardTitle>
            <CardDescription className="text-center mb-4">
              {categoryFilter
                ? `No testimonies in the ${categoryLabels[categoryFilter]} category yet.`
                : 'Be the first to share your testimony and inspire others!'}
            </CardDescription>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Share Your Testimony
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimoniesData?.items.map((testimony) => (
              <TestimonyCard
                key={testimony.id}
                testimony={testimony}
                onClick={() => setSelectedTestimony(testimony)}
              />
            ))}
          </div>

          {/* Pagination */}
          {testimoniesData && testimoniesData.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {testimoniesData.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(testimoniesData.total_pages, p + 1))}
                disabled={page === testimoniesData.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Testimony Detail Modal */}
      {selectedTestimony && (
        <TestimonyDetailModal
          testimony={selectedTestimony}
          onClose={() => setSelectedTestimony(null)}
        />
      )}
    </div>
  )
}
