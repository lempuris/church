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
    name: 'Pastor Thabo Mokoena',
    role: 'Senior Pastor',
    bio: 'Pastor Thabo has led Thembani Church for over 15 years. His passion for community transformation and biblical teaching has shaped our church family.',
  },
  {
    name: 'Pastor Nomvula Dlamini',
    role: 'Associate Pastor',
    bio: 'Pastor Nomvula oversees our women\'s ministry and counseling services. Her heart for discipleship has helped many grow in their faith.',
  },
  {
    name: 'Elder Sipho Nkosi',
    role: 'Elder & Worship Director',
    bio: 'Elder Sipho leads our multilingual worship team, bringing together diverse voices in praise and celebration.',
  },
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
            About <span className="text-white/80">Thembani Church</span>
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Rooted in faith, growing in community, serving South Africa and beyond.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Our Story</h2>
            </div>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="text-lg leading-relaxed mb-6">
                Thembani Church was founded in 2005 in Soweto, born from a vision to create a church that truly reflects 
                the rainbow nation of South Africa. Our name, "Thembani," means "have faith" in isiZulu - a reminder 
                that through all circumstances, our trust is in God.
              </p>
              <p className="text-lg leading-relaxed mb-6">
                What started as a small gathering of 20 people in a community hall has grown into a vibrant family 
                of believers across Gauteng. Today, we have our main campus in Sandton and cell groups stretching 
                from Pretoria to Soweto, from Midrand to Centurion.
              </p>
              <p className="text-lg leading-relaxed">
                We're proud to be a multilingual church where you'll hear prayers in isiZulu, worship in Afrikaans, 
                and teaching in English. We believe this diversity is our strength - because in Christ, we are one.
              </p>
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
                  To be a transformative community of faith that reflects God's love, brings healing to our nation, 
                  and raises leaders who will impact South Africa and the world for Christ.
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
                  To make disciples of Jesus Christ through authentic worship, biblical teaching, meaningful 
                  fellowship, and compassionate service to our communities across Mzansi.
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
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {leaders.map((leader) => (
              <Card key={leader.name} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div 
                    className="h-24 w-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
                  >
                    {leader.name.split(' ').slice(1).map(n => n[0]).join('')}
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

      {/* Cell Groups */}
      <section 
        className="py-20 text-white"
        style={{ background: `linear-gradient(135deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})` }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Users className="h-12 w-12 mx-auto mb-6 text-white/70" />
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join a Cell Group</h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Our cell groups meet weekly across Gauteng. Whether you're in Soweto, Sandton, Pretoria, or 
              anywhere in between, there's a group for you. Experience authentic community, Bible study, 
              and friendship in a smaller setting.
            </p>
            <div className="grid gap-4 md:grid-cols-3 mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-bold text-2xl text-white/90">7</p>
                <p className="text-white/70">Active Cell Groups</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-bold text-2xl text-white/90">50+</p>
                <p className="text-white/70">Cell Members</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="font-bold text-2xl text-white/90">5</p>
                <p className="text-white/70">Locations Across Gauteng</p>
              </div>
            </div>
            <Link to="/contact">
              <button 
                className="font-bold px-8 py-3 rounded-lg shadow-lg transition-all hover:scale-105"
                style={{ backgroundColor: 'white', color: theme.colors.primary }}
              >
                Find a Cell Group Near You
              </button>
            </Link>
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
            there's a place for you at Thembani Church.
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
