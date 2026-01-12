import { Link } from 'react-router-dom'
import { Heart, BookOpen, Users, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function About() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Our Church</h1>
            <p className="text-xl opacity-90">
              Learn more about our history, mission, and the values that guide everything we do.
            </p>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-4">
                Grace Church was founded with a simple mission: to create a welcoming community
                where people from all walks of life can experience God's love and grow in their faith.
              </p>
              <p className="mb-4">
                What started as a small gathering has grown into a vibrant community of believers
                committed to worship, service, and spiritual growth. Through the years, we've
                remained dedicated to our founding principles while adapting to serve our
                community's evolving needs.
              </p>
              <p>
                Today, we continue to be a place where everyone is welcome, questions are
                encouraged, and lives are transformed through the power of faith and community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Mission & Vision</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To love God, love people, and make disciples who transform their communities
                  through faith, hope, and love.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  To be a church where everyone can find hope, healing, and a home—a community
                  that reflects God's unconditional love to the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These values shape who we are and guide everything we do as a church community.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Love</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We believe love is the foundation of all we do, reflecting God's love for us.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Truth</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We are committed to teaching and living by God's Word with integrity.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We believe in the power of authentic relationships and doing life together.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">Service</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We are called to serve others and make a positive impact in our world.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Come Visit Us</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            We'd love to meet you and welcome you to our church family. Join us this Sunday!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" variant="secondary">
                Contact Us
              </Button>
            </Link>
            <Link to="/events">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                View Events
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
