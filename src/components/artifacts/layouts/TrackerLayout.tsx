/**
 * TRACKER LAYOUT
 * 
 * Renders tracker artifacts (progress tracking over time).
 * Shows progress metrics with timeline visualization.
 * Design Spec: border-muted/40, bg-muted/10 (neutral)
 */

'use client'

import React from 'react'
import { TrackerArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function TrackerLayout({ 
  artifact,
  editable = false,
  onUpdate,
  editButton
}: LayoutProps<TrackerArtifact>) {
  // Defensive: ensure all required properties exist
  const data = artifact?.data || { entries: [] }
  const dataModel = artifact?.data_model || { layout: 'tracker', trackers: [] }
  const metadata = artifact?.metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }
  
  const trackers = dataModel.trackers || []
  const entries = Array.isArray(data?.entries) ? data.entries : []
  
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
    if (!tracker) return String(value)
    
    const numValue = typeof value === 'number' ? value : parseFloat(String(value))
    if (isNaN(numValue)) return String(value)
    
    switch (tracker.format) {
      case 'percentage':
        return `${numValue}%`
      case 'currency':
        return `$${numValue.toLocaleString()}`
      case 'number':
        return numValue.toLocaleString()
      default:
        return String(value)
    }
  }
  
  // Relative time formatter
  const getRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Progress Tracker</CardTitle>
          <div className="flex items-center gap-2">
            {editButton}
            <Badge variant="outline" className="text-xs">
              v{metadata.version}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Current Values */}
        {trackers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {trackers.map((tracker) => {
              const value = currentValues[tracker.key]
              const trend = getTrend(tracker.key)
              const hasTarget = tracker.target !== undefined
              const progress = hasTarget && typeof value === 'number' 
                ? Math.min(100, (value / tracker.target!) * 100) 
                : null
              
              return (
                <div
                  key={tracker.key}
                  className="p-4 bg-muted/10 rounded-lg border border-border/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {tracker.label}
                    </span>
                    {trend && (
                      <div className="flex items-center gap-1">
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                        {trend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {value !== undefined ? formatValue(tracker.key, value) : '—'}
                    {tracker.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{tracker.unit}</span>}
                  </div>
                  
                  {hasTarget && progress !== null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span>Target: {tracker.target}{tracker.unit}</span>
                        <span>{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted/20 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* Timeline */}
        {sortedEntries.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground mb-3">History</h3>
            {sortedEntries.map((entry, idx) => (
              <div
                key={entry.id || `tracker-entry-${idx}`}
                className="py-3 border-b border-border/20 last:border-0"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {getRelativeTime(entry.timestamp)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {trackers.map((tracker) => {
                    const value = entry.values[tracker.key]
                    return value !== undefined ? (
                      <div key={tracker.key} className="text-sm">
                        <span className="text-muted-foreground">{tracker.label}: </span>
                        <span className="text-foreground font-medium">
                          {formatValue(tracker.key, value)}
                          {tracker.unit && <span className="text-muted-foreground ml-1">{tracker.unit}</span>}
                        </span>
                      </div>
                    ) : null
                  })}
                </div>
                
                {entry.note && (
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    {entry.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        {sortedEntries.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No tracking data yet
          </div>
        )}

        {/* Metadata Footer */}
        {sortedEntries.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
            <span>{sortedEntries.length} entries</span>
            <span>•</span>
            <span>Updated {new Date(metadata.lastUpdatedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
