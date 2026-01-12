import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  UserCog,
  Users,
  Crown,
  UserMinus,
  Check,
  X,
  MoreHorizontal,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { userService } from '@/services/users'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { UserDetail, UserRole } from '@/types'

interface DropdownPosition {
  top: number
  right: number
}

const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-500 text-white dark:bg-red-600',
  pastor: 'bg-purple-500 text-white dark:bg-purple-600',
  leader: 'bg-blue-500 text-white dark:bg-blue-600',
  member: 'bg-slate-500 text-white dark:bg-slate-600',
}

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: ShieldCheck,
  pastor: Shield,
  leader: UserCog,
  member: Users,
}

function RoleBadge({ role }: { role: UserRole }) {
  const Icon = roleIcons[role]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize',
        roleColors[role]
      )}
    >
      <Icon className="h-3 w-3" />
      {role}
    </span>
  )
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
        active
          ? 'bg-emerald-500 text-white dark:bg-emerald-600'
          : 'bg-rose-500 text-white dark:bg-rose-600'
      )}
    >
      {active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function UserList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition>({ top: 0, right: 0 })

  const queryClient = useQueryClient()
  const { user: currentUser } = useAuthStore()

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || undefined
  const role = searchParams.get('role') || undefined

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, search, role }],
    queryFn: () => userService.getUsers({ page, search, role, page_size: 20 }),
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: () => userService.getStats(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: UserRole; is_active?: boolean } }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
      setOpenDropdown(null)
    },
  })

  const promoteMutation = useMutation({
    mutationFn: (id: string) => userService.promoteToAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
      setOpenDropdown(null)
    },
  })

  const demoteMutation = useMutation({
    mutationFn: (id: string) => userService.demoteToMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
      setOpenDropdown(null)
    },
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

  const handleRoleFilter = (newRole: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (newRole) {
      params.set('role', newRole)
    } else {
      params.delete('role')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
  }

  const handleRoleChange = (user: UserDetail, newRole: UserRole) => {
    if (user.id === currentUser?.id) {
      alert('Cannot change your own role')
      return
    }
    updateMutation.mutate({ id: user.id, data: { role: newRole } })
  }

  const handleToggleActive = (user: UserDetail) => {
    if (user.id === currentUser?.id) {
      alert('Cannot deactivate your own account')
      return
    }
    updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and roles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-red-500" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.by_role?.admin ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCog className="h-4 w-4 text-blue-500" />
              Leaders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.by_role?.leader ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.by_role?.member ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={!role ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleFilter(null)}
              >
                All
              </Button>
              <Button
                variant={role === 'admin' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleFilter('admin')}
              >
                <ShieldCheck className="mr-1 h-4 w-4" />
                Admin
              </Button>
              <Button
                variant={role === 'leader' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleFilter('leader')}
              >
                <UserCog className="mr-1 h-4 w-4" />
                Leader
              </Button>
              <Button
                variant={role === 'member' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleRoleFilter('member')}
              >
                <Users className="mr-1 h-4 w-4" />
                Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No users found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Last Login</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.items.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.email}</span>
                          {user.id === currentUser?.id && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge active={user.is_active} />
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (openDropdown === user.id) {
                                setOpenDropdown(null)
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect()
                                setDropdownPos({
                                  top: rect.bottom + 4,
                                  right: window.innerWidth - rect.right,
                                })
                                setOpenDropdown(user.id)
                              }
                            }}
                            disabled={user.id === currentUser?.id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, data.total)} of{' '}
                {data.total} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Page {page} of {data.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === data.total_pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dropdown Menu - rendered outside table to avoid overflow clipping */}
      {openDropdown && (() => {
        const user = data?.items.find((u) => u.id === openDropdown)
        if (!user) return null
        return (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenDropdown(null)}
            />
            <div
              className="fixed w-48 bg-background border rounded-md shadow-lg z-50"
              style={{ top: dropdownPos.top, right: dropdownPos.right }}
            >
              <div className="py-1">
                {user.role !== 'admin' && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => promoteMutation.mutate(user.id)}
                  >
                    <Crown className="h-4 w-4 text-yellow-500" />
                    Promote to Admin
                  </button>
                )}
                {user.role !== 'member' && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                    onClick={() => demoteMutation.mutate(user.id)}
                  >
                    <UserMinus className="h-4 w-4 text-gray-500" />
                    Demote to Member
                  </button>
                )}
                <div className="border-t my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  onClick={() => handleRoleChange(user, 'leader')}
                >
                  <UserCog className="h-4 w-4 text-blue-500" />
                  Set as Leader
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                  onClick={() => handleRoleChange(user, 'pastor')}
                >
                  <Shield className="h-4 w-4 text-purple-500" />
                  Set as Pastor
                </button>
                <div className="border-t my-1" />
                <button
                  className={cn(
                    'w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2',
                    user.is_active ? 'text-red-600' : 'text-green-600'
                  )}
                  onClick={() => handleToggleActive(user)}
                >
                  {user.is_active ? (
                    <>
                      <ShieldOff className="h-4 w-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
