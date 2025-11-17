/**
 * WIDGET ID CARD COMPONENT
 * 
 * Displays the widget ID for reference
 */

'use client'

import React from 'react'
import { BaseCard } from '@/components/ui/base-card'

interface WidgetIdCardProps {
  widgetId: string
}

export function WidgetIdCard({ widgetId }: WidgetIdCardProps) {
  return (
    <BaseCard
      variant="widget-id"
      title="Widget ID"
    >
      <div className="bg-muted/30 rounded p-3 break-all">
        <code className="text-xs text-muted-foreground font-mono">
          {widgetId}
        </code>
      </div>
    </BaseCard>
  )
}

