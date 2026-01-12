import { Link } from 'react-router-dom'
import { Calendar, BookOpen, HandHeart, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/90 to-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Welcome to Grace Church
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              A place where faith, community, and love come together.
              Join us on a journey of spiritual growth and discovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Join Our Community
                </Button>
              </Link>
              <Link to="/events">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                >
                  View Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10" />
      </section>

      {/* Service Times */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join Us for Worship</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We gather together to worship, learn, and grow in our faith.
              Everyone is welcome!
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Sunday Service</CardTitle>
                <CardDescription>Main Worship</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">9:00 AM</p>
                <p className="text-muted-foreground">& 11:00 AM</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Wednesday</CardTitle>
                <CardDescription>Midweek Service</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">7:00 PM</p>
                <p className="text-muted-foreground">Bible Study</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Friday</CardTitle>
                <CardDescription>Youth Service</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">6:00 PM</p>
                <p className="text-muted-foreground">Youth & Young Adults</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Get Involved</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              There are many ways to connect and grow with our church community.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Calendar className="h-6 w-6" />
                </div>
                <CardTitle>Events</CardTitle>
                <CardDescription>
                  Stay updated with church events, conferences, and special gatherings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/events">
                  <Button variant="link" className="p-0">
                    View Events →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <BookOpen className="h-6 w-6" />
                </div>
                <CardTitle>Sermons</CardTitle>
                <CardDescription>
                  Listen to past sermons and grow in your understanding of God's Word.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/sermons">
                  <Button variant="link" className="p-0">
                    Watch Sermons →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <HandHeart className="h-6 w-6" />
                </div>
                <CardTitle>Prayer Wall</CardTitle>
                <CardDescription>
                  Share your prayer requests and join others in prayer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/prayer-wall">
                  <Button variant="link" className="p-0">
                    Visit Prayer Wall →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <CardTitle>Small Groups</CardTitle>
                <CardDescription>
                  Connect with others in a smaller setting for fellowship and growth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="p-0">
                  Coming Soon →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            We'd love to welcome you to our church family. Create an account to stay connected.
          </p>
          <Link to="/register">
            <Button size="lg" variant="secondary">
              Create an Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
