/**
 * TRACKER LAYOUT
 * 
 * Renders tracker artifacts (widget execution history).
 * Compact format for activity logs.
 * Design Spec: border-muted/40, bg-muted/10 (neutral)
 */

'use client'

import React from 'react'
import { TrackerArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, RefreshCw, AlertCircle, CheckCircle, Pencil } from 'lucide-react'

// Icon mapping for event types
const eventIcons = {
  execution: Play,
  update: RefreshCw,
  error: AlertCircle,
  success: CheckCircle,
}

// Status badge variants
const statusVariants = {
  success: 'default' as const,
  running: 'secondary' as const,
  failed: 'destructive' as const,
  idle: 'outline' as const,
}

export function TrackerLayout({ 
  artifact,
  editable = false 
}: LayoutProps<TrackerArtifact>) {
  const { data, metadata } = artifact
  
  // Note: Tracker is typically read-only (system-generated logs)
  // editable prop included for consistency but not actively used

  // Sort events by timestamp (newest first)
  // Defensive check: ensure events is an array before spreading
  const events = Array.isArray(data.events) ? data.events : []
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp)

  // Relative time formatter
  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Execution Tracker</span>
            {editable && (
              <Pencil className="w-3 h-3 text-muted-foreground/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-0">
          {sortedEvents.map((event) => {
            const Icon = eventIcons[event.type] || Play
            
            return (
              <div
                key={event.id}
                className="py-3 border-b border-border/20 last:border-0 flex items-start gap-3"
              >
                <div className="mt-0.5">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {getRelativeTime(event.timestamp)}
                    </span>
                    {event.status && (
                      <Badge variant={statusVariants[event.status] as any} className="text-xs">
                        {event.status}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground">
                    {event.widgetName || `Widget ${event.widgetId.slice(-4)}`} {event.message}
                  </p>
                  
                  {event.details && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.details}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Metadata Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <span>{sortedEvents.length} events</span>
          <span>•</span>
          <span>Updated {new Date(metadata.lastUpdatedAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

