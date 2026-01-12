import { useQuery } from '@tanstack/react-query'
import { Users, UserPlus, Users2, Calendar, ArrowRight, MapPin, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dashboardService } from '@/services/dashboard'
import { cellService, eventService } from '@/services'
import { useAuthStore } from '@/store/auth'

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string
  value: number
  description: string
  icon: React.ElementType
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { user } = useAuthStore()
  
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
  })

  const { data: recentMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['dashboard', 'recent-members'],
    queryFn: () => dashboardService.getRecentMembers(10),
  })

  const { data: myCell, isLoading: cellLoading } = useQuery({
    queryKey: ['dashboard', 'my-cell'],
    queryFn: () => cellService.getMyCell(),
    enabled: user?.role === 'leader' || user?.role === 'pastor' || user?.role === 'admin',
  })

  const { data: upcomingEvents } = useQuery({
    queryKey: ['dashboard', 'upcoming-events'],
    queryFn: () => eventService.getUpcomingEvents(5, false),
  })

  const isLeader = user?.role === 'leader' || user?.role === 'pastor' || user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the Church Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats?.total_members ?? 0}
          description="Active church members"
          icon={Users}
        />
        <StatCard
          title="New This Month"
          value={stats?.new_members_this_month ?? 0}
          description="Members joined this month"
          icon={UserPlus}
        />
        <StatCard
          title="Active Cells"
          value={stats?.active_cells ?? 0}
          description="Small group meetings"
          icon={Users2}
        />
        <StatCard
          title="Upcoming Events"
          value={stats?.upcoming_events ?? 0}
          description="Events this week"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cell Leader View */}
        {isLeader && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users2 className="h-5 w-5" />
                  My Cell Group
                </CardTitle>
                <CardDescription>Your assigned cell group</CardDescription>
              </div>
              {myCell && (
                <Link to={`/admin/cells/${myCell.id}`}>
                  <Button variant="ghost" size="sm">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {cellLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-6 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ) : myCell ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{myCell.name}</h3>
                    {myCell.description && (
                      <p className="text-sm text-muted-foreground">{myCell.description}</p>
                    )}
                  </div>
                  
                  <div className="grid gap-2 text-sm">
                    {myCell.meeting_day && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="capitalize">{myCell.meeting_day}s</span>
                        {myCell.meeting_time && <span>at {myCell.meeting_time}</span>}
                      </div>
                    )}
                    {myCell.meeting_location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{myCell.meeting_location}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">
                      Members ({myCell.members?.length || 0})
                    </p>
                    {myCell.members && myCell.members.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {myCell.members.slice(0, 6).map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1"
                          >
                            {member.photo_url ? (
                              <img
                                src={member.photo_url}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="h-5 w-5 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                                {member.first_name.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm">{member.first_name}</span>
                          </div>
                        ))}
                        {myCell.members.length > 6 && (
                          <span className="text-sm text-muted-foreground px-2 py-1">
                            +{myCell.members.length - 6} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No members assigned yet</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  You are not assigned to any cell group yet.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
              <CardDescription>Events happening soon</CardDescription>
            </div>
            <Link to="/admin/events">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents && upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const eventDate = new Date(event.start_datetime)
                  return (
                    <Link
                      key={event.id}
                      to={`/admin/events/${event.id}`}
                      className="flex items-start gap-3 p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center min-w-[40px] rounded bg-primary/10 px-2 py-1">
                        <span className="text-xs font-medium text-primary uppercase">
                          {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          {eventDate.getDate()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          {event.location && ` • ${event.location}`}
                        </p>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted capitalize">
                        {event.event_type.replace('_', ' ')}
                      </span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No upcoming events scheduled.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Newly registered church members</CardDescription>
          </div>
          <Link to="/admin/members">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentMembers && recentMembers.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/admin/members/${member.id}`}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                      {member.first_name.charAt(0)}
                      {member.last_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No members yet. Start by adding your first member.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
