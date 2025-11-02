/**
 * TIMELINE LAYOUT
 * 
 * Renders timeline artifacts (projects, milestones, tasks).
 * Vertical timeline with event dots and connecting lines.
 * Design Spec: border-accent/20, bg-accent/5 (purple tint)
 */

'use client'

import React from 'react'
import { TimelineArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Flag, Check, Circle, Star, Pencil } from 'lucide-react'

// Icon mapping for common event types
const defaultIcons: Record<string, any> = {
  milestone: Flag,
  task: Check,
  note: Circle,
  default: Star,
}

// Color mapping for event types
const eventColors: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
}

export function TimelineLayout({ 
  artifact,
  editable = false 
}: LayoutProps<TimelineArtifact>) {
  const { schema, data, metadata } = artifact
  
  // Note: Timeline editing would allow reordering events or editing descriptions
  // For Phase 2, we mark it as supporting editable prop but don't implement full editing yet

  // Sort events by timestamp (newest first)
  // Defensive check: ensure events is an array before spreading
  const events = Array.isArray(data.events) ? data.events : []
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp)

  // Get event type config
  const getEventTypeConfig = (eventType: string) => {
    return schema.eventTypes.find(t => t.type === eventType)
  }

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm font-medium text-foreground">Timeline</span>
            {editable && (
              <Pencil className="w-3 h-3 text-accent/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative space-y-6 pl-8">
          {/* Timeline spine */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border/40" />

          {sortedEvents.map((event, index) => {
            const typeConfig = getEventTypeConfig(event.type)
            const Icon = defaultIcons[event.type] || defaultIcons.default
            const dotColor = typeConfig 
              ? eventColors[typeConfig.color] || 'bg-primary'
              : 'bg-primary'
            const isLast = index === sortedEvents.length - 1

            return (
              <div key={event.id} className="relative">
                {/* Event dot */}
                <div 
                  className={`absolute -left-8 top-1 w-4 h-4 rounded-full ${dotColor} border-2 border-background flex items-center justify-center`}
                >
                  <Icon className="w-2 h-2 text-white" />
                </div>

                {/* Event content */}
                <div className={`pb-2 ${!isLast ? '' : ''}`}>
                  <div className="bg-muted/10 hover:bg-muted/20 rounded-lg p-4 border border-border/20 transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground mb-1">
                          {event.title}
                        </h4>
                        
                        {event.description && (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {typeConfig && (
                        <Badge variant="outline" className="text-xs">
                          {typeConfig.label}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>{formatDate(event.timestamp)}</span>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-muted-foreground/70">
                            {Object.keys(event.metadata).length} metadata
                          </span>
                        </>
                      )}
                    </div>
                  </div>
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

