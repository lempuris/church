import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Plus, ChevronLeft, ChevronRight, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { memberService } from '@/services/members'
import { cn } from '@/lib/utils'

export function MemberList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || undefined
  const status = (searchParams.get('status') as 'active' | 'inactive' | 'visitor') || undefined

  const { data, isLoading } = useQuery({
    queryKey: ['members', { page, search, status }],
    queryFn: () => memberService.getMembers({ page, search, status, page_size: 20 }),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (searchTerm) {
      params.set('search', searchTerm)
    } else {
      params.delete('search')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handleStatusFilter = (newStatus: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (newStatus) {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage church members and their profiles</p>
        </div>
        <Link to="/admin/members/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <div className="flex gap-2">
              <Button
                variant={!status ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={status === 'active' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={status === 'visitor' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('visitor')}
              >
                Visitors
              </Button>
              <Button
                variant={status === 'inactive' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => handleStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Member List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 bg-muted rounded" />
                    <div className="h-3 w-32 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="divide-y">
                {data.items.map((member) => (
                  <Link
                    key={member.id}
                    to={`/admin/members/${member.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-lg">
                        {member.first_name.charAt(0)}
                        {member.last_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {member.email || member.phone || 'No contact info'}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <span
                        className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          member.member_status === 'active' && 'bg-green-100 text-green-800',
                          member.member_status === 'visitor' && 'bg-blue-100 text-blue-800',
                          member.member_status === 'inactive' && 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {member.member_status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{' '}
                    {data.total} members
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.total_pages}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {search ? 'Try adjusting your search terms.' : 'Get started by adding your first member.'}
              </p>
              <Link to="/admin/members/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
