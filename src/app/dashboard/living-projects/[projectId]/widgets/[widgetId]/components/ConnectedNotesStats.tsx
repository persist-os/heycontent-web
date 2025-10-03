/**
 * CONNECTED NOTES STATS CARD
 * 
 * Displays statistics about connected notes
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ConnectedNotesStatsProps {
  totalNotes: number
}

export function ConnectedNotesStats({ totalNotes }: ConnectedNotesStatsProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Connected Notes</h3>
          <Badge variant="outline" className="text-xs">{totalNotes}</Badge>
        </div>
        <div className="space-y-2">
          {totalNotes > 0 ? (
            <p className="text-sm text-muted-foreground">
              This widget has generated {totalNotes} note{totalNotes !== 1 ? 's' : ''}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No notes generated yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

