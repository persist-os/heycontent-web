/**
 * CARD LAYOUT RENDERER
 * 
 * Generic card metrics renderer for artifacts with layout: 'card'
 * Works with ANY artifact type that uses card layout
 * 
 * Design Spec: Compact card layout with metric emphasis
 */

'use client'

import React from 'react'
import { ArtifactMetadata } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, BarChart3 } from 'lucide-react'

interface MetricDefinition {
  key: string
  label: string
  format?: 'number' | 'currency' | 'percentage' | 'text'
  unit?: string
}

interface CardLayoutRendererProps {
  data_model: {
    layout: 'card'
    metrics: Array<MetricDefinition>
  }
  data: {
    keyMetrics: Record<string, any>
    summaryText?: string
  }
  editable: boolean
  onUpdate?: (data: any) => void
  artifactType?: string
  metadata?: ArtifactMetadata
  editButton?: React.ReactNode
}

export function CardLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata,
  editButton
}: CardLayoutRendererProps) {
  // 🔴 CRITICAL FIX (TASK 3.1): Defensive data extraction - check multiple possible field names
  // Handle common mismatches: data.keyMetrics OR data.metrics OR data.data.keyMetrics
  const keyMetrics = data?.keyMetrics || data?.metrics || data?.data?.keyMetrics || {}
  const summaryText = data?.summaryText || data?.summary || data?.data?.summaryText
  
  // Defensive: ensure all required properties exist
  const metrics = Array.isArray(data_model?.metrics) ? data_model.metrics : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Format metric value based on format type
  const formatMetric = (value: any, format?: string, unit?: string) => {
    // 🔴 CRITICAL FIX (TASK 3.1): Improved error messages
    if (value === null || value === undefined) {
      return 'No data available'
    }
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : String(value)
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : String(value)
      case 'percentage':
        return typeof value === 'number' ? `${value}%` : String(value)
      default:
        return unit ? `${value} ${unit}` : String(value)
    }
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
  const artifactTypeDisplay = artifactType || 'Summary'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
            {editable && (
              <Pencil className="w-3 h-3 text-accent/60" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {editButton}
            <Badge variant="outline" className="text-xs">
              v{artifactMetadata.version}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        {metrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, metricIdx) => {
              const metricKey = metric?.key || metric?.id || ''
              // 🔴 CRITICAL FIX (TASK 3.1): Check multiple possible field names
              const value = keyMetrics[metricKey] !== undefined ? keyMetrics[metricKey] : 
                           keyMetrics[metric?.label] !== undefined ? keyMetrics[metric?.label] : 
                           undefined
              
              // Log rendering errors for debugging
              if (value === undefined && metricKey) {
                console.warn(
                  `[CardLayoutRenderer] Metric value not found for key "${metricKey}". ` +
                  `Available keys: ${Object.keys(keyMetrics).join(', ') || 'none'}`
                )
              }
              
              return (
                <div
                  key={metric?.key || `metric-${metricIdx}`}
                  className="bg-muted/20 hover:bg-muted/30 rounded-lg p-4 border border-border/20 transition-all duration-200"
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {metric?.label || metric?.key || 'Metric'}
                  </div>
                  <div className="text-2xl font-semibold text-foreground">
                    {value !== undefined && value !== null ? (
                      formatMetric(value, metric?.format, metric?.unit)
                    ) : (
                      <span className="text-muted-foreground italic">No data available</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-8 text-sm text-muted-foreground">
            <p>No metrics available</p>
          </div>
        )}

        {/* Summary text if provided */}
        {summaryText && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
              {summaryText}
            </p>
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <Badge variant="outline" className="text-xs">
            v{artifactMetadata.version}
          </Badge>
          <span>•</span>
          <span>Updated {formatDate(artifactMetadata.lastUpdatedAt)}</span>
          <span>•</span>
          <span>Source: {artifactMetadata.lastUpdatedBy}</span>
        </div>
      </CardContent>
    </Card>
  )
}

