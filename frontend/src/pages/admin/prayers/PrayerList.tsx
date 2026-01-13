import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HandHeart,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Eye,
  EyeOff,
  Trash2,
  Filter,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prayerService } from '@/services'
import type { PrayerRequest, PrayerStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<
  PrayerStatus,
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
  answered: {
    label: 'Answered',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: CheckCircle,
  },
}

interface PrayerCardProps {
  prayer: PrayerRequest
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

function PrayerCard({ prayer, onApprove, onReject, onDelete, isLoading }: PrayerCardProps) {
  const status = statusConfig[prayer.status]
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{prayer.title}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2 mt-1 text-xs">
              {prayer.author?.first_name ? (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {prayer.author.first_name} {prayer.author.last_name}
                </span>
              ) : prayer.author_name ? (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {prayer.author_name}
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Anonymous
                </span>
              )}
              <span>•</span>
              <span>{formatDistanceToNow(parseISO(prayer.created_at), { addSuffix: true })}</span>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                status.color
              )}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full',
                prayer.is_public
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {prayer.is_public ? <Eye className="h-3 w-3 inline mr-1" /> : <EyeOff className="h-3 w-3 inline mr-1" />}
              {prayer.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3 mb-4">
          {prayer.description}
        </p>

        {prayer.answer_testimony && (
          <div className="bg-green-50 dark:bg-green-950/30 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
              Answer Testimony:
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
              {prayer.answer_testimony}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            <HandHeart className="h-4 w-4 inline mr-1" />
            {prayer.prayer_count} prayers
          </span>
          <div className="flex gap-2">
            {prayer.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(prayer.id)}
                  disabled={isLoading}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(prayer.id)}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(prayer.id)}
              disabled={isLoading}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PrayerList() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<PrayerStatus | ''>('')
  const queryClient = useQueryClient()

  const { data: prayersData, isLoading } = useQuery({
    queryKey: ['admin-prayers', page, statusFilter],
    queryFn: () =>
      prayerService.getPrayerRequests({
        page,
        page_size: 20,
        status: statusFilter || undefined,
      }),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['admin-prayers-pending-count'],
    queryFn: () => prayerService.getPendingRequests(1, 1),
  })

  const moderateMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      prayerService.moderatePrayerRequest(id, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prayers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-prayers-pending-count'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => prayerService.deletePrayerRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-prayers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-prayers-pending-count'] })
    },
  })

  const handleApprove = (id: string) => {
    moderateMutation.mutate({ id, action: 'approve' })
  }

  const handleReject = (id: string) => {
    if (window.confirm('Are you sure you want to reject this prayer request?')) {
      moderateMutation.mutate({ id, action: 'reject' })
    }
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this prayer request? This cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const pendingCount = pendingData?.total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prayer Requests</h1>
          <p className="text-muted-foreground">
            Moderate and manage prayer requests from the congregation
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
          All Requests
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
          variant={statusFilter === 'answered' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatusFilter('answered')
            setPage(1)
          }}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Answered
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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : prayersData?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HandHeart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No prayer requests found</h3>
            <p className="text-muted-foreground">
              {statusFilter
                ? `No ${statusFilter} prayer requests at this time.`
                : 'Prayer requests submitted by members will appear here.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {prayersData?.items.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={handleDelete}
              isLoading={moderateMutation.isPending || deleteMutation.isPending}
            />
          ))}

          {/* Pagination */}
          {prayersData && prayersData.total_pages > 1 && (
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
                Page {page} of {prayersData.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(prayersData.total_pages, p + 1))}
                disabled={page === prayersData.total_pages}
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
