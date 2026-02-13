import { useQuery } from '@tanstack/react-query'
import { Calendar, MapPin, Clock, Users, Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { eventService } from '@/services'
import { useThemeStore, type Theme } from '@/store/theme'
import type { Event } from '@/types'

const eventTypeColors: Record<string, { bg: string; text: string; border: string }> = {
  service: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
  conference: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
  special: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-400' },
  cell_meeting: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
  other: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' },
}

function EventCard({ event, theme }: { event: Event; theme: Theme }) {
  const startDate = parseISO(event.start_datetime)
  const colors = eventTypeColors[event.event_type] || eventTypeColors.other
  
  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${colors.border}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text} uppercase tracking-wide`}>
                {event.event_type.replace('_', ' ')}
              </span>
              {event.is_recurring && (
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  Recurring
                </span>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">{event.title}</CardTitle>
            {event.description && (
              <CardDescription className="mt-2 line-clamp-2 text-base">
                {event.description}
              </CardDescription>
            )}
          </div>
          <div 
            className="flex flex-col items-center justify-center min-w-[70px] rounded-xl p-3 text-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all"
            style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-3xl font-black">
              {format(startDate, 'd')}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span>
              {format(startDate, 'EEEE, h:mm a')}
              {event.end_datetime && ` - ${format(parseISO(event.end_datetime), 'h:mm a')}`}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{event.location}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>{event.capacity} capacity</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function Events() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => eventService.getUpcomingEvents(20, true),
  })
  const { getTheme } = useThemeStore()
  const theme = getTheme()

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative py-20"
        style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-amber-200" />
            <span className="text-white/90 text-sm font-medium">Join us for worship and fellowship</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Upcoming <span className="text-amber-200">Events</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            From Sunday services to community outreaches, there's always something happening at Glory House.
            Come be part of the family!
          </p>
        </div>
      </section>

      {/* Events List */}
      <section 
        className="py-16"
        style={{ 
          background: `linear-gradient(to bottom right, ${theme.colors.muted}, ${theme.colors.background})` 
        }}
      >
        <div className="container mx-auto px-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div 
                className="h-12 w-12 border-4 border-t-transparent rounded-full animate-spin mb-4" 
                style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}
              />
              <p style={{ color: theme.colors.mutedForeground }}>Loading events...</p>
            </div>
          )}

          {error && (
            <Card className="max-w-2xl mx-auto border-destructive/50">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 text-destructive/70 mb-4" />
                <CardTitle className="mb-2 text-destructive">Unable to Load Events</CardTitle>
                <CardDescription className="text-center mb-4">
                  We couldn't load the events at this time. Please try again later.
                </CardDescription>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="text-white hover:opacity-90"
                  style={{ backgroundColor: theme.colors.primary }}
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && events && events.length === 0 && (
            <Card 
              className="max-w-2xl mx-auto"
              style={{ borderColor: `${theme.colors.primary}40` }}
            >
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Calendar className="h-16 w-16 mb-4" style={{ color: theme.colors.primary }} />
                <CardTitle className="mb-2" style={{ color: theme.colors.foreground }}>No Upcoming Events</CardTitle>
                <CardDescription className="text-center text-base">
                  There are no scheduled events at the moment. Check back soon for 
                  upcoming church events and activities!
                </CardDescription>
              </CardContent>
            </Card>
          )}

          {!isLoading && !error && events && events.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-8">
                <p className="text-muted-foreground">
                  Showing <span className="font-bold text-primary">{events.length}</span> upcoming events
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} theme={theme} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-16 border-t"
        style={{ 
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border 
        }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: theme.colors.foreground }}
          >
            Want to stay updated?
          </h2>
          <p 
            className="mb-6 max-w-xl mx-auto"
            style={{ color: theme.colors.mutedForeground }}
          >
            Create an account to receive event notifications and updates straight to your inbox.
          </p>
          <Button 
            size="lg" 
            className="font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.colors.primary }}
            onClick={() => window.location.href = '/register'}
          >
            Join Our Community
          </Button>
        </div>
      </section>
    </div>
  )
}
