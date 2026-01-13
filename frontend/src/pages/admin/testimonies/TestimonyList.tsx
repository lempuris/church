import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Star,
  StarOff,
  Trash2,
  Filter,
  Image,
  Video,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { testimonyService } from '@/services'
import type { Testimony, TestimonyCategory, TestimonyStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  TestimonyStatus,
  { label: string; color: string; icon: typeof CheckCircle }
> = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XCircle,
  },
}

const categoryLabels: Record<TestimonyCategory, string> = {
  healing: 'Healing',
  provision: 'Provision',
  salvation: 'Salvation',
  deliverance: 'Deliverance',
  family: 'Family',
  career: 'Career',
  other: 'Other',
}

interface TestimonyCardProps {
  testimony: Testimony
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onToggleFeatured: (id: string, featured: boolean) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function TestimonyCard({
  testimony,
  onApprove,
  onReject,
  onToggleFeatured,
  onDelete,
  isLoading,
}: TestimonyCardProps) {
  const status = statusConfig[testimony.status]
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{testimony.title}</CardTitle>
              {testimony.is_featured && (
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
            </div>
            <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
              {testimony.author?.first_name ? (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {testimony.author.first_name} {testimony.author.last_name}
                </span>
              ) : testimony.author_name ? (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {testimony.author_name}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Anonymous
                </span>
              )}
              <span>•</span>
              <span>{formatDistanceToNow(parseISO(testimony.created_at), { addSuffix: true })}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {testimony.category && (
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                {categoryLabels[testimony.category]}
              </span>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                status.color
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-4">
          {testimony.content}
        </p>

        {testimony.media_url && (
          <div className="mb-4">
            {testimony.media_url.includes('video') ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>Video attached</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Image className="h-4 w-4" />
                <span>Image attached</span>
              </div>
            )}
          </div>
        )}

        {testimony.rejection_reason && (
          <div className="bg-red-50 dark:bg-red-950/30 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
              Rejection Reason:
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {testimony.rejection_reason}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          {testimony.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onApprove(testimony.id)}
                disabled={isLoading}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(testimony.id)}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {testimony.status === 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleFeatured(testimony.id, !testimony.is_featured)}
              disabled={isLoading}
            >
              {testimony.is_featured ? (
                <>
                  <StarOff className="mr-1 h-4 w-4" />
                  Unfeature
                </>
              ) : (
                <>
                  <Star className="mr-1 h-4 w-4" />
                  Feature
                </>
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(testimony.id)}
            disabled={isLoading}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function TestimonyList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<TestimonyStatus | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<TestimonyCategory | ''>('')
  const queryClient = useQueryClient()

  const { data: testimoniesData, isLoading } = useQuery({
    queryKey: ['admin-testimonies', page, statusFilter, categoryFilter],
    queryFn: () =>
      testimonyService.getTestimonies({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
      }),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['admin-testimonies-pending-count'],
    queryFn: () => testimonyService.getPendingTestimonies(1, 1),
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      testimonyService.moderateTestimony(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-testimonies-pending-count'] })
    },
  })

  const featureMutation = useMutation({
    mutationFn: ({ id, is_featured }: { id: string; is_featured: boolean }) =>
      testimonyService.setFeatured(id, { is_featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonies'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testimonyService.deleteTestimony(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonies'] })
      queryClient.invalidateQueries({ queryKey: ['admin-testimonies-pending-count'] })
    },
  })

  const handleApprove = (id: string) => {
    moderateMutation.mutate({ id, action: 'approve' })
  }

  const handleReject = (id: string) => {
    if (window.confirm('Are you sure you want to reject this testimony?')) {
      moderateMutation.mutate({ id, action: 'reject' })
    }
  }

  const handleToggleFeatured = (id: string, featured: boolean) => {
    featureMutation.mutate({ id, is_featured: featured })
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this testimony? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const pendingCount = pendingData?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Testimonies</h1>
          <p className="text-muted-foreground">
            Review and manage testimonies shared by the congregation
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg">
            <Clock className="h-5 w-5" />
            <span className="font-medium">{pendingCount} pending review</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('')
              setPage(1)
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('pending')
              setPage(1)
            }}
          >
            <Clock className="mr-2 h-4 w-4" />
            Pending
            {pendingCount > 0 && (
              <span className="ml-1 bg-yellow-500 text-white text-xs px-1.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('approved')
              setPage(1)
            }}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approved
          </Button>
          <Button
            variant={statusFilter === 'rejected' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('rejected')
              setPage(1)
            }}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Rejected
          </Button>
        </div>

        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as TestimonyCategory | '')
            setPage(1)
          }}
        >
          <option value="">All Categories</option>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : testimoniesData?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No testimonies found</h3>
            <p className="text-muted-foreground">
              {statusFilter || categoryFilter
                ? 'No testimonies match your filters.'
                : 'Testimonies submitted by members will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {testimoniesData?.items.map((testimony) => (
            <TestimonyCard
              key={testimony.id}
              testimony={testimony}
              onApprove={handleApprove}
              onReject={handleReject}
              onToggleFeatured={handleToggleFeatured}
              onDelete={handleDelete}
              isLoading={
                moderateMutation.isPending ||
                featureMutation.isPending ||
                deleteMutation.isPending
              }
            />
          ))}

          {/* Pagination */}
          {testimoniesData && testimoniesData.total_pages > 1 && (
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
                Page {page} of {testimoniesData.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(testimoniesData.total_pages, p + 1))}
                disabled={page === testimoniesData.total_pages}
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
