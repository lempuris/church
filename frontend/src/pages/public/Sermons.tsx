import { BookOpen } from 'lucide-react'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export function Sermons() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Sermons</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Listen to past sermons and grow in your faith.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Coming Soon</CardTitle>
          <CardDescription className="text-center">
            Sermon archives will be available in a future update.
            Check back soon to listen to our messages!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
