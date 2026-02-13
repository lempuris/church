import { Link } from 'react-router-dom'
import { Heart, Users, BookOpen, Globe, Target, Eye, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useThemeStore, type Theme } from '@/store/theme'

const values = [
  {
    icon: Heart,
    title: 'Ubuntu',
    description: 'We believe in the interconnectedness of all people. "I am because we are" guides everything we do.',
  },
  {
    icon: BookOpen,
    title: 'Biblical Truth',
    description: 'The Word of God is our foundation. We teach, preach, and live by Scripture.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'No one walks alone. We support each other through cell groups, mentorship, and fellowship.',
  },
  {
    icon: Globe,
    title: 'Inclusivity',
    description: 'All are welcome - regardless of language, background, or where you are in your faith journey.',
  },
]

const leaders = [
  {
    name: 'Bishop TK',
    role: 'Commissioned By',
    bio: 'Bishop TK commissioned Glory House Ministry, establishing our foundation in faith and purpose.',
  },
  {
    name: 'Apostle LadyD',
    role: 'Apostle',
    bio: 'Apostle LadyD brings apostolic leadership and vision to Glory House, guiding our spiritual direction.',
  },
  {
    name: 'Apostle Theletsane',
    role: 'Apostle',
    bio: 'Apostle Theletsane partners in apostolic ministry, helping to shape our community of believers.',
  },
  {
    name: 'Pastor Benie',
    role: 'Blessed By',
    bio: 'Pastor Benie provides spiritual blessing and oversight to the ministry of Glory House.',
  },
]

const ministryTeams = [
  { name: 'Media', description: 'Capturing and sharing our services through technology' },
  { name: 'Ushering', description: 'Welcoming and guiding our congregation' },
  { name: 'VIP Protocol', description: 'Honoring guests and special visitors' },
  { name: 'Security Protocol', description: 'Ensuring safety for all who attend' },
  { name: 'Events Management', description: 'Coordinating church events and celebrations' },
  { name: 'Transport Management', description: 'Helping members get to and from services' },
]

const wellnessDimensions = [
  'Physical', 'Emotional', 'Spiritual', 'Intellectual',
  'Social', 'Environmental', 'Occupational', 'Financial'
]

function ValueCard({ value, theme, index }: { 
  value: typeof values[0]; 
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
  const Icon = value.icon
  
  return (
    <Card className="text-center group hover:shadow-xl transition-all duration-300">
      <CardHeader>
        <div 
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"
          style={{ backgroundColor: `${color}20`, color }}
        >
          <Icon className="h-8 w-8" />
        </div>
        <CardTitle className="text-xl">{value.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base">{value.description}</CardDescription>
      </CardContent>
    </Card>
  )
}

export function About() {
  const { getTheme } = useThemeStore()
  const theme = getTheme()
  
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative py-24"
        style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientVia}, ${theme.colors.gradientTo})` }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            About <span className="text-white/80">Glory House</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto mb-4">
            "Christ in you, the hope of glory" — Colossians 1:27
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            56 President Park Ext 10, 1 Swart Drive, Corner Dale Road, Midrand
          </p>
        </div>
      </section>

      {/* Foundation Scripture */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Foundation</h2>
              <p className="text-lg text-primary font-semibold">Colossians 1:27</p>
            </div>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <blockquote className="text-xl leading-relaxed mb-8 text-center italic border-l-4 border-primary pl-6">
                "To them God has chosen to make known among the Gentiles the glorious riches of this mystery,
                which is Christ in you, the hope of glory."
              </blockquote>
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div className="p-4 rounded-lg bg-background">
                  <p className="font-semibold text-foreground mb-2">God's Purpose</p>
                  <p className="text-sm">God has a purpose and plan to reveal a truth to all people</p>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <p className="font-semibold text-foreground mb-2">The Mystery</p>
                  <p className="text-sm">Christ in you, bringing with Him the hope of all glorious things to come</p>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <p className="font-semibold text-foreground mb-2">Hope of Glory</p>
                  <p className="text-sm">The fulfillment of God's promise to restore us and all creation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 md:grid-cols-2 max-w-6xl mx-auto">
            <Card 
              className="shadow-lg border-t-4"
              style={{ borderTopColor: theme.colors.gradientFrom }}
            >
              <CardHeader className="text-center pb-2">
                <div 
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.colors.gradientFrom}20`, color: theme.colors.gradientFrom }}
                >
                  <Eye className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-lg leading-relaxed">
                  Glory House Ministry is driven by a clear Vision rooted in Purpose -
                  to reveal Christ in every believer, bringing the hope of glory to our community and beyond.
                </p>
              </CardContent>
            </Card>

            <Card
              className="shadow-lg border-t-4"
              style={{ borderTopColor: theme.colors.gradientVia }}
            >
              <CardHeader className="text-center pb-2">
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${theme.colors.gradientVia}20`, color: theme.colors.gradientVia }}
                >
                  <Target className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center text-lg leading-relaxed">
                  To create a worship culture where every person encounters the Holy Spirit and the presence of God,
                  underpinned by the Foundations of the Gospel of Faith.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section 
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${theme.colors.muted}, ${theme.colors.secondary}50)` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              These core values shape who we are and guide everything we do.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <ValueCard key={value.title} value={value} theme={theme} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Leadership</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Meet the team called to shepherd our church family.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {leaders.map((leader) => (
              <Card key={leader.name} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div
                    className="h-24 w-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
                  >
                    {leader.name.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                  </div>
                  <CardTitle className="text-xl">{leader.name}</CardTitle>
                  <CardDescription
                    className="font-medium"
                    style={{ color: theme.colors.primary }}
                  >
                    {leader.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{leader.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ministry Teams */}
      <section
        className="py-20"
        style={{ background: `linear-gradient(135deg, ${theme.colors.muted}, ${theme.colors.secondary}50)` }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Ministry Teams</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Glory House operates through dedicated ministry teams serving our congregation.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {ministryTeams.map((ministry, index) => {
              const colors = [
                theme.colors.gradientFrom,
                theme.colors.gradientVia,
                theme.colors.gradientTo,
                theme.colors.primary,
              ]
              const color = colors[index % colors.length]
              return (
                <Card
                  key={ministry.name}
                  className="hover:shadow-lg transition-shadow border-l-4"
                  style={{ borderLeftColor: color }}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{ministry.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">{ministry.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* 8 Dimensions of Wellness */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">8 Dimensions of Wellness</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              An interconnected framework for holistic spiritual growth and wellness focus.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {wellnessDimensions.map((dimension, index) => {
                const colors = [
                  theme.colors.gradientFrom,
                  theme.colors.gradientVia,
                  theme.colors.gradientTo,
                  theme.colors.primary,
                ]
                const color = colors[index % colors.length]
                return (
                  <div
                    key={dimension}
                    className="text-center p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    style={{ backgroundColor: `${color}10`, borderColor: color, borderWidth: 1 }}
                  >
                    <p className="font-semibold" style={{ color }}>{dimension}</p>
                  </div>
                )
              })}
            </div>
            <p className="text-center text-muted-foreground">
              The 8 dimensions provide a solid framework for us to understand wellness and make meaningful changes
              to improve our health, happiness, and quality of life. Without focus, we can end up investing time
              in wellness activities that don't impact the areas we are trying to improve.
            </p>
          </div>
        </div>
      </section>

      {/* Praise & Worship Team */}
      <section
        className="py-20 text-white"
        style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Users className="h-12 w-12 mx-auto mb-6 text-white/70" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Praise & Worship Team</h2>
              <p className="text-xl text-white/90 leading-relaxed">
                A group of musicians and vocalists, led by a worship leader, who lead our congregation
                in singing and expressing praise and worship to God during religious services.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Our Commitment</h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  To create a worship culture where every person encounters the Holy Spirit
                  and the presence of God. We value leading people into the presence of God
                  as our primary focus.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Schedule</h3>
                <ul className="text-white/90 text-sm space-y-2">
                  <li>• Thursday Rehearsals: 7:00 - 9:00 PM (mandatory)</li>
                  <li>• Sunday Sound Check: 7:30 AM</li>
                  <li>• Sunday Prayer: 8:45 AM</li>
                  <li>• Services: 9:00 AM & 10:00 AM</li>
                </ul>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">How to Join the Team</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="text-center">
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                  <p className="text-white/90">Attend church for at least 6 months</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                  <p className="text-white/90">Fill out application form from church website</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                  <p className="text-white/90">Go through church screening process</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/20 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2 font-bold">4</div>
                  <p className="text-white/90">Connect with Worship Pastor for placement</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link to="/contact">
                <button
                  className="font-bold px-8 py-3 rounded-lg shadow-lg transition-all hover:scale-105"
                  style={{ backgroundColor: 'white', color: theme.colors.primary }}
                >
                  Contact Us to Get Involved
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            We'd Love to Meet You
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're new to faith or have walked with Christ for years,
            there's a place for you at Glory House.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events">
              <Button size="lg" className="font-bold">
                See Upcoming Services
              </Button>
            </Link>
            <Link to="/contact">
              <Button size="lg" variant="outline" className="font-bold">
                Get In Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
