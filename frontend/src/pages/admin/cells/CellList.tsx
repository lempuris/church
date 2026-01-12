import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users2, MapPin, Clock, Trash2, Edit } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cellService } from '@/services'
import type { Cell } from '@/types'

const DAYS_DISPLAY: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

export function CellList() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['cells', page, search],
    queryFn: () => cellService.getCells({ page, page_size: 20, search: search || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cellService.deleteCell(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cells'] })
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const handleDelete = async (cell: Cell) => {
    if (window.confirm(`Are you sure you want to delete "${cell.name}"?`)) {
      deleteMutation.mutate(cell.id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cell Groups</h1>
          <p className="text-muted-foreground">Manage church cell groups and members</p>
        </div>
        <Link to="/admin/cells/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Cell
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cells..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {/* Cell Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">No cell groups found</h3>
            <p className="text-muted-foreground mb-4">
              {search ? 'Try a different search term' : 'Get started by creating a cell group'}
            </p>
            {!search && (
              <Link to="/admin/cells/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Cell
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.items.map((cell) => (
            <Card key={cell.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    <Link
                      to={`/admin/cells/${cell.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {cell.name}
                    </Link>
                  </CardTitle>
                  <div className="flex gap-1">
                    <Link to={`/admin/cells/${cell.id}/edit`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cell)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {cell.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{cell.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users2 className="h-4 w-4" />
                    <span>{cell.member_count} members</span>
                  </div>
                </div>

                {cell.leader && (
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                      {cell.leader.first_name.charAt(0)}
                      {cell.leader.last_name.charAt(0)}
                    </div>
                    <span className="text-sm">
                      {cell.leader.first_name} {cell.leader.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">(Leader)</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {cell.meeting_day && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{DAYS_DISPLAY[cell.meeting_day]}</span>
                      {cell.meeting_time && <span>at {cell.meeting_time}</span>}
                    </div>
                  )}
                  {cell.meeting_location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate max-w-[150px]">{cell.meeting_location}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
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
            Page {page} of {data.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
            disabled={page === data.total_pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
