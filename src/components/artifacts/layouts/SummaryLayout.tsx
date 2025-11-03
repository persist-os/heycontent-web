/**
 * SUMMARY LAYOUT
 * 
 * Renders summary artifacts with key metrics.
 * Design Spec: Compact card layout with metric emphasis
 */

'use client'

import React from 'react'
import { SummaryArtifact, LayoutProps } from '@/types/artifacts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil, BarChart3 } from 'lucide-react'

export function SummaryLayout({ 
  artifact,
  editable = false
}: LayoutProps<SummaryArtifact>) {
  // Defensive: ensure all required properties exist
  const data_model = artifact?.data_model || { layout: 'card' as const, metrics: [] }
  const metrics = Array.isArray(data_model?.metrics) ? data_model.metrics : []
  const data = artifact?.data || { keyMetrics: {} }
  const metadata = artifact?.metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  // Format metric value based on format type
  const formatMetric = (value: any, format?: string, unit?: string) => {
    if (value === null || value === undefined) return 'N/A'
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value
      case 'percentage':
        return typeof value === 'number' ? `${value}%` : value
      default:
        return unit ? `${value} ${unit}` : value
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

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Summary</span>
            {editable && (
              <Pencil className="w-3 h-3 text-accent/60" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, metricIdx) => {
            const value = data?.keyMetrics?.[metric?.key || '']
            return (
              <div
                key={metric?.key || `metric-${metricIdx}`}
                className="bg-muted/20 hover:bg-muted/30 rounded-lg p-4 border border-border/20 transition-all duration-200"
              >
                <div className="text-xs text-muted-foreground mb-1">
                  {metric?.label || metric?.key || 'Metric'}
                </div>
                <div className="text-2xl font-semibold text-foreground">
                  {formatMetric(value, metric?.format, metric?.unit)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary text if provided */}
        {data?.summaryText && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {data.summaryText}
            </p>
          </div>
        )}

        {/* Metadata footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
          <Badge variant="outline" className="text-xs">
            v{metadata.version}
          </Badge>
          <span>•</span>
          <span>Updated {formatDate(metadata.lastUpdatedAt)}</span>
          <span>•</span>
          <span>Source: {metadata.lastUpdatedBy}</span>
        </div>
      </CardContent>
    </Card>
  )
}

