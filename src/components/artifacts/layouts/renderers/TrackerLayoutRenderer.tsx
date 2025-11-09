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
  key?: string  // Legacy format
  id?: string   // Actual Convex format
  label?: string  // Legacy format
  title?: string   // Actual Convex format
  description?: string  // Actual Convex format
  metrics?: string[]  // Actual Convex format
  status?: string  // Actual Convex format
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
  
  // Get current values (from most recent entry) - defensive check
  const currentValues = sortedEntries.length > 0 && sortedEntries[0]?.values 
    ? sortedEntries[0].values 
    : {}
  
  // Calculate trend for each tracker
  const getTrend = (trackerId: string) => {
    if (sortedEntries.length < 2) return null
    const currentEntry = sortedEntries[0]
    const previousEntry = sortedEntries[1]
    if (!currentEntry?.values || !previousEntry?.values) return null
    
    const current = currentEntry.values[trackerId]
    const previous = previousEntry.values[trackerId]
    
    if (typeof current === 'number' && typeof previous === 'number') {
      if (current > previous) return 'up'
      if (current < previous) return 'down'
      return 'stable'
    }
    return null
  }
  
  // Helper to get tracker identifier (supports both 'id' and 'key')
  const getTrackerId = (tracker: TrackerDefinition) => {
    return tracker?.id || tracker?.key || ''
  }

  // Helper to get tracker display label (supports both 'title' and 'label')
  const getTrackerLabel = (tracker: TrackerDefinition) => {
    return tracker?.title || tracker?.label || tracker?.id || tracker?.key || 'Tracker'
  }

  // Format value based on tracker format
  const formatValue = (trackerId: string, value: number | string) => {
    const tracker = trackers.find(t => getTrackerId(t) === trackerId)
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
              const trackerId = getTrackerId(tracker)
              const value = currentValues?.[trackerId]
              const trend = getTrend(trackerId)
              
              return (
                <div
                  key={trackerId || `tracker-${trackerIdx}`}
                  className="bg-muted/20 hover:bg-muted/30 rounded-lg p-4 border border-border/20 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {getTrackerLabel(tracker)}
                    </span>
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                        {trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  <div className={value !== undefined && value !== null ? "text-2xl font-semibold text-foreground" : "text-sm font-medium text-muted-foreground"}>
                    {value !== undefined && value !== null ? formatValue(trackerId, value) : 'N/A'}
                  </div>
                  {(tracker as any)?.status && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {(tracker as any).status}
                    </div>
                  )}
                  {tracker.target && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Target: {formatValue(trackerId, tracker.target)}
                    </div>
                  )}
                  {(tracker as any)?.description && (
                    <div className="text-xs text-muted-foreground/70 mt-2 italic">
                      {(tracker as any).description}
                    </div>
                  )}
                  {(tracker as any)?.metrics && Array.isArray((tracker as any).metrics) && (tracker as any).metrics.length > 0 && (
                    <div className="text-xs text-muted-foreground/70 mt-2">
                      <div className="font-medium mb-1">Metrics:</div>
                      <ul className="list-disc list-inside space-y-0.5">
                        {((tracker as any).metrics as string[]).map((metric, idx) => (
                          <li key={idx}>{metric}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Timeline of entries */}
        {sortedEntries.length > 0 ? (
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
                    {trackers.map((tracker) => {
                      const trackerId = getTrackerId(tracker)
                      const entryValue = entry?.values?.[trackerId]
                      return (
                        <div key={trackerId} className="text-sm">
                          <span className="text-muted-foreground text-xs">
                            {getTrackerLabel(tracker)}:
                          </span>{' '}
                          <span className="text-foreground font-medium">
                            {formatValue(trackerId, entryValue ?? 'N/A')}
                          </span>
                        </div>
                      )
                    })}
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
        ) : trackers.length > 0 && (
          <div className="text-center py-6 text-sm text-muted-foreground border border-border/20 rounded-lg bg-muted/5">
            <p>No tracking entries yet</p>
            <p className="text-xs mt-1">Entries will appear here as progress is tracked</p>
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

