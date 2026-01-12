import { Calendar } from 'lucide-react'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export function Events() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Upcoming Events</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Stay connected with what's happening at Grace Church.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Coming Soon</CardTitle>
          <CardDescription className="text-center">
            Event management will be available in a future update.
            Check back soon for upcoming church events!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
