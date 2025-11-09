/**
 * TRACKER LAYOUT RENDERER
 * 
 * Generic tracker renderer for artifacts with layout: 'tracker'
 * Works with ANY artifact type that uses tracker layout
 * 
 * Design Spec: border-muted/40, bg-muted/10 (neutral)
 */

'use client'

import React from 'react'
import { ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus, Pencil } from 'lucide-react'

interface TrackerDefinition {
  key: string
  label: string
  target?: number
  unit?: string
  format?: 'number' | 'percentage' | 'currency' | 'text'
}

interface TrackerEntry {
  id: string
  timestamp: number
  values: Record<string, number | string>
  note?: string
}

interface TrackerLayoutRendererProps {
  data_model: {
    layout: 'tracker'
    trackers: Array<TrackerDefinition>
  }
  data: {
    entries: Array<TrackerEntry>
  }
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
}

export function TrackerLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata
}: TrackerLayoutRendererProps) {
  // Defensive: ensure all required properties exist
  const trackers = Array.isArray(data_model?.trackers) ? data_model.trackers : []
  const entries = Array.isArray(data?.entries) ? data.entries : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }
  
  // Sort entries by timestamp (newest first)
  const sortedEntries = [...entries].sort((a, b) => (b?.timestamp || 0) - (a?.timestamp || 0))
  
  // Get current values (from most recent entry)
  const currentValues = sortedEntries.length > 0 ? sortedEntries[0].values : {}
  
  // Calculate trend for each tracker
  const getTrend = (key: string) => {
    if (sortedEntries.length < 2) return null
    const current = sortedEntries[0].values[key]
    const previous = sortedEntries[1].values[key]
    
    if (typeof current === 'number' && typeof previous === 'number') {
      if (current > previous) return 'up'
      if (current < previous) return 'down'
      return 'stable'
    }
    return null
  }
  
  // Format value based on tracker format
  const formatValue = (key: string, value: number | string) => {
    const tracker = trackers.find(t => t.key === key)
    if (!tracker) return value
    
    if (typeof value === 'number') {
      switch (tracker.format) {
        case 'currency':
          return `$${value.toLocaleString()}`
        case 'percentage':
          return `${value}%`
        case 'number':
          return value.toLocaleString()
        default:
          return tracker.unit ? `${value} ${tracker.unit}` : value
      }
    }
    return value
  }

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Tracker'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-muted/40 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && (
              <Pencil className="w-3 h-3 text-muted-foreground/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{artifactMetadata.version}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current values */}
        {trackers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackers.map((tracker, trackerIdx) => {
              const value = currentValues[tracker.key]
              const trend = getTrend(tracker.key)
              
              return (
                <div
                  key={tracker?.key || `tracker-${trackerIdx}`}
                  className="bg-muted/20 hover:bg-muted/30 rounded-lg p-4 border border-border/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {tracker?.label || tracker?.key || 'Tracker'}
                    </span>
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  <div className="text-2xl font-semibold text-foreground">
                    {formatValue(tracker.key, value ?? 'N/A')}
                  </div>
                  {tracker.target && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Target: {formatValue(tracker.key, tracker.target)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Timeline of entries */}
        {sortedEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Progress Timeline</h3>
            <div className="space-y-2">
              {sortedEntries.slice(0, 10).map((entry, entryIdx) => (
                <div
                  key={entry.id || `entry-${entryIdx}`}
                  className="bg-muted/10 hover:bg-muted/20 rounded-lg p-3 border border-border/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {trackers.map((tracker) => (
                      <div key={tracker.key} className="text-sm">
                        <span className="text-muted-foreground text-xs">
                          {tracker.label}:
                        </span>{' '}
                        <span className="text-foreground font-medium">
                          {formatValue(tracker.key, entry.values[tracker.key] ?? 'N/A')}
                        </span>
                      </div>
                    ))}
                  </div>
                  {entry.note && (
                    <div className="text-xs text-muted-foreground mt-2 italic">
                      {entry.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {trackers.length === 0 && sortedEntries.length === 0 && (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No tracker data available</p>
          </div>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <span>{sortedEntries.length} entries</span>
          <span>•</span>
          <span>Updated {new Date(artifactMetadata.lastUpdatedAt).toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

