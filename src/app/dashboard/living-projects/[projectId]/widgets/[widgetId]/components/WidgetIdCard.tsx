/**
 * WIDGET ID CARD COMPONENT
 * 
 * Displays the widget ID for reference
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface WidgetIdCardProps {
  widgetId: string
}

export function WidgetIdCard({ widgetId }: WidgetIdCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6 space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Widget ID</h3>
        <div className="bg-muted/30 rounded p-3 break-all">
          <code className="text-xs text-muted-foreground font-mono">
            {widgetId}
          </code>
        </div>
      </CardContent>
    </Card>
  )
}

