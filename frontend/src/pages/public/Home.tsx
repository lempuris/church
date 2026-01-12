import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Calendar, BookOpen, HandHeart, Users, MapPin, Clock, Heart, Sparkles } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { eventService } from '@/services'
import { useThemeStore, type Theme } from '@/store/theme'
import type { Event } from '@/types'

function UpcomingEventCard({ event, theme }: { event: Event; theme: Theme }) {
  const startDate = parseISO(event.start_datetime)
  
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex gap-4">
          <div 
            className="flex flex-col items-center justify-center min-w-[60px] rounded-xl p-3 text-white shadow-md group-hover:shadow-lg transition-shadow"
            style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              {format(startDate, 'MMM')}
            </span>
            <span className="text-2xl font-black">
              {format(startDate, 'd')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{event.title}</h4>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>{format(startDate, 'h:mm a')}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ServiceCard({ title, subtitle, time, subtime, location, theme, index }: { 
  title: string; 
  subtitle: string; 
  time: string; 
  subtime: string; 
  location: string;
  theme: Theme;
  index: number;
}) {
  // Use different parts of the gradient for each card
  const colors = [
    { from: theme.colors.gradientFrom, to: theme.colors.gradientVia },
    { from: theme.colors.gradientVia, to: theme.colors.gradientTo },
    { from: theme.colors.gradientTo, to: theme.colors.gradientFrom },
  ]
  const color = colors[index % colors.length]
  
  return (
    <Card className="text-center group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30 overflow-hidden">
      <div 
        className="h-2"
        style={{ background: `linear-gradient(to right, ${color.from}, ${color.to})` }}
      />
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-foreground">{title}</CardTitle>
        <CardDescription className="text-base">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-black text-primary">{time}</p>
        <p className="text-muted-foreground font-medium mt-1">{subtime}</p>
        <p className="text-sm text-muted-foreground/70 mt-3">{location}</p>
      </CardContent>
    </Card>
  )
}

function FeatureCard({ icon: Icon, title, description, href, theme, index }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  theme: Theme;
  index: number;
}) {
  const colors = [
    theme.colors.gradientFrom,
    theme.colors.gradientVia,
    theme.colors.gradientTo,
    theme.colors.primary,
  ]
  const color = colors[index % colors.length]
  
  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 border-t-4"
      style={{ borderTopColor: color }}
    >
      <CardHeader>
        <div 
          className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
          style={{ 
            backgroundColor: `${color}20`,
            color: color
          }}
        >
          <Icon className="h-7 w-7" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Link to={href}>
          <Button 
            variant="link" 
            className="p-0 font-semibold"
            style={{ color }}
          >
            {title === 'Events' ? 'View Events' : title === 'Cell Groups' ? 'Learn More' : title === 'Prayer Wall' ? 'Visit Prayer Wall' : 'Watch Sermons'} →
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export function Home() {
  const { data: upcomingEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['homepage-events'],
    queryFn: () => eventService.getUpcomingEvents(4, true),
  })
  const { getTheme } = useThemeStore()
  const theme = getTheme()

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Theme Gradient */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Gradient Background */}
        <div 
          className="absolute inset-0" 
          style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` }}
        />
        
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Acacia Tree Silhouette */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 opacity-20">
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <path d="M200,380 L200,250 Q180,200 120,180 Q100,170 80,175 Q60,180 50,170 Q40,160 45,145 Q50,130 70,125 Q90,120 110,130 Q130,140 145,135 Q160,130 170,115 Q180,100 175,80 Q170,60 185,50 Q200,40 215,50 Q230,60 225,80 Q220,100 230,115 Q240,130 255,135 Q270,140 290,130 Q310,120 330,125 Q350,130 355,145 Q360,160 350,170 Q340,180 320,175 Q300,170 280,180 Q220,200 200,250 Z" fill="currentColor"/>
          </svg>
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-white/80" />
              <span className="text-white/90 text-sm font-medium">Ubuntu - "I am because we are"</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 text-white drop-shadow-lg">
              Welcome to<br />
              <span className="text-white/80">Thembani Church</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/90 max-w-2xl leading-relaxed">
              Where faith meets community in the heart of South Africa. 
              Join us as we grow together, serve together, and worship together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <button 
                  className="w-full sm:w-auto font-bold text-lg px-8 py-4 rounded-lg shadow-xl transition-all hover:scale-105"
                  style={{ 
                    backgroundColor: 'white',
                    color: theme.colors.primary
                  }}
                >
                  Join Our Family
                </button>
              </Link>
              <Link to="/events">
                <button
                  className="w-full sm:w-auto font-bold text-lg px-8 py-4 rounded-lg border-2 border-white text-white hover:bg-white/20 transition-all"
                >
                  Upcoming Events
                </button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,64 C480,150 960,-20 1440,64 L1440,120 L0,120 Z" style={{ fill: theme.colors.secondary }}/>
          </svg>
        </div>
      </section>

      {/* Welcome Message */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Sawubona! <span className="text-primary">We See You.</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              At Thembani Church, we believe in the African philosophy of Ubuntu - that we are all connected. 
              Whether you're from Johannesburg, Pretoria, Cape Town, or anywhere in Mzansi, 
              you have a home here. Come as you are, leave transformed.
            </p>
          </div>
        </div>
      </section>

      {/* Service Times */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Join Us for Worship</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Experience powerful praise in multiple languages - English, isiZulu, Afrikaans, and Sesotho.
              All are welcome!
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            <ServiceCard 
              title="Sonto Service" 
              subtitle="Sunday Main Worship"
              time="9:00 AM"
              subtime="& 11:00 AM"
              location="Main Sanctuary - Sandton"
              theme={theme}
              index={0}
            />
            <ServiceCard 
              title="Midweek Revival" 
              subtitle="Wednesday Bible Study"
              time="7:00 PM"
              subtime="Deep Word Study"
              location="Fellowship Hall"
              theme={theme}
              index={1}
            />
            <ServiceCard 
              title="Intsha Night" 
              subtitle="Friday Youth Service"
              time="6:00 PM"
              subtime="Youth & Young Adults"
              location="Youth Center - Midrand"
              theme={theme}
              index={2}
            />
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section 
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${theme.colors.muted}, ${theme.colors.secondary}50)` }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">What's Happening</h2>
              <p className="text-muted-foreground text-lg">
                Don't miss out on fellowship and community events.
              </p>
            </div>
            <Link to="/events">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
                View All Events →
              </Button>
            </Link>
          </div>
          
          {eventsLoading && (
            <div className="flex justify-center py-12">
              <div 
                className="h-10 w-10 border-4 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: theme.colors.primary, borderTopColor: 'transparent' }}
              />
            </div>
          )}

          {!eventsLoading && upcomingEvents && upcomingEvents.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {upcomingEvents.map((event) => (
                <UpcomingEventCard key={event.id} event={event} theme={theme} />
              ))}
            </div>
          )}

          {!eventsLoading && (!upcomingEvents || upcomingEvents.length === 0) && (
            <Card className="max-w-md mx-auto border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-16 w-16 text-primary/50 mb-4" />
                <p className="text-muted-foreground text-center text-lg">
                  No upcoming events scheduled. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Get Involved */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Get Connected</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              There are many ways to be part of our church family and grow in your faith.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard 
              icon={Calendar}
              title="Events"
              description="From Heritage Day celebrations to community outreaches - there's always something happening."
              href="/events"
              theme={theme}
              index={0}
            />
            <FeatureCard 
              icon={Users}
              title="Cell Groups"
              description="Join a small group in your area - from Soweto to Sandton, we've got you covered."
              href="/about"
              theme={theme}
              index={1}
            />
            <FeatureCard 
              icon={HandHeart}
              title="Prayer Wall"
              description="Share your prayer requests and stand with others in faith. We believe in the power of prayer."
              href="/prayer-wall"
              theme={theme}
              index={2}
            />
            <FeatureCard 
              icon={BookOpen}
              title="Sermons"
              description="Catch up on past messages and grow in your understanding of God's Word."
              href="/sermons"
              theme={theme}
              index={3}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0" 
          style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` }}
        />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Heart className="h-12 w-12 text-white/70 mx-auto mb-6" />
          <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
            Ready to Find Your Family?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            We'd love to welcome you to Thembani Church. Create an account to stay connected and be part of our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <button 
                className="font-bold text-lg px-10 py-4 rounded-lg shadow-xl transition-all hover:scale-105"
                style={{ 
                  backgroundColor: 'white',
                  color: theme.colors.primary
                }}
              >
                Join Us Today
              </button>
            </Link>
            <Link to="/contact">
              <button className="font-bold text-lg px-10 py-4 rounded-lg border-2 border-white text-white hover:bg-white/20 transition-all">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
