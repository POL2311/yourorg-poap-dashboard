'use client'

import { WidgetGenerator } from '@/components/widgets/WidgetGenerator'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function WidgetsPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget Generator (Test)</CardTitle>
        </CardHeader>
        <CardContent>
          <WidgetGenerator campaigns={[]} />
        </CardContent>
      </Card>
    </div>
  )
}
