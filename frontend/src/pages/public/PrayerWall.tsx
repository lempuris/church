import { HandHeart } from 'lucide-react'

import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export function PrayerWall() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Prayer Wall</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Share your prayer requests and join others in prayer.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HandHeart className="h-16 w-16 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Coming Soon</CardTitle>
          <CardDescription className="text-center">
            The prayer wall will be available in a future update.
            Check back soon to share and support prayer requests!
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}
