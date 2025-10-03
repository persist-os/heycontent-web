/**
 * WIDGET STATUS CARD COMPONENT
 * 
 * Displays current widget status and run information
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WidgetStatusCardProps {
  status: string
  lastRun: string
  totalOutputs: number
}

export function WidgetStatusCard({ status, lastRun, totalOutputs }: WidgetStatusCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current State</span>
            <Badge variant={status === 'success' ? 'default' : 'outline'}>
              {status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last Run</span>
            <span className="text-sm text-foreground">{lastRun}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Outputs</span>
            <span className="text-sm font-medium text-foreground">{totalOutputs}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

