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
import { ArtifactMetadata, Artifact } from '@/types/artifacts'
import { Card, CardContent } from '@/components/ui/card'
import { Pencil, BarChart3 } from 'lucide-react'
import { ArtifactCardHeader } from '../shared/ArtifactCardHeader'
import { ArtifactCardFooter } from '../shared/ArtifactCardFooter'
import { Id } from '@/convex/_generated/dataModel'

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
  artifactId?: Id<'artifacts'>
  selectedVersion?: number
  onVersionChange?: (version: number) => void
  artifact?: Artifact
}

export function CardLayoutRenderer({
  data_model,
  data,
  editable = false,
  onUpdate,
  artifactType,
  metadata,
  editButton,
  artifactId,
  selectedVersion,
  onVersionChange,
  artifact
}: CardLayoutRendererProps) {
  // 🔴 CRITICAL FIX (TASK 3.1): Defensive data extraction - check multiple possible field names
  // Handle common mismatches: data.keyMetrics OR data.metrics OR data.data.keyMetrics
  // Also check if data itself is the keyMetrics object
  const dataAny = data as any  // Type assertion for defensive property access
  const keyMetrics = data?.keyMetrics || dataAny?.metrics || dataAny?.data?.keyMetrics || 
                     (data && typeof data === 'object' && !Array.isArray(data) && !data.summaryText ? data : {})
  const summaryText = data?.summaryText || dataAny?.summary || dataAny?.data?.summaryText || dataAny?.text
  
  // Defensive: ensure all required properties exist
  const metrics = Array.isArray(data_model?.metrics) ? data_model.metrics : []
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }
  
  // Debug logging to help identify data structure issues
  if (process.env.NODE_ENV === 'development' && metrics.length > 0 && Object.keys(keyMetrics).length === 0) {
    console.warn('[CardLayoutRenderer] No keyMetrics found. Data structure:', {
      hasKeyMetrics: !!data?.keyMetrics,
      hasMetrics: !!dataAny?.metrics,
      hasDataKeyMetrics: !!dataAny?.data?.keyMetrics,
      dataKeys: data ? Object.keys(data) : [],
      metricsCount: metrics.length,
      metricKeys: metrics.map(m => m?.key || m?.label)
    })
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
  // Get artifact type display name
  const artifactTypeDisplay = artifactType || 'Summary'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-accent/20 hover:bg-card/80 transition-all duration-300">
      <ArtifactCardHeader
        artifactTypeDisplay={artifactTypeDisplay}
        editable={editable}
        editButton={editButton}
        artifactId={artifactId}
        selectedVersion={selectedVersion}
        onVersionChange={onVersionChange}
        metadata={artifactMetadata}
        icon={<BarChart3 className="w-4 h-4 text-accent" />}
        artifact={artifact}
      />

      <CardContent className="space-y-4">
        {/* Key metrics grid */}
        {metrics.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, metricIdx) => {
              const metricKey = metric?.key || ''  // Remove metric?.id since MetricDefinition doesn't have it
              const metricLabel = metric?.label || ''
              
              // ✅ ADD: Normalize key for comparison (handles camelCase, snake_case, etc.)
              const normalizeKey = (key: string): string => {
                if (!key) return ''
                // Remove all non-alphanumeric chars, convert to lowercase
                return key
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '')
              }
              
              // ✅ IMPROVE: findValue function with normalized matching
              const findValue = (obj: Record<string, any>, searchKey: string, searchLabel: string) => {
                if (!obj || typeof obj !== 'object') return undefined
                
                // Try exact matches first
                if (searchKey && obj[searchKey] !== undefined) return obj[searchKey]
                if (searchLabel && obj[searchLabel] !== undefined) return obj[searchLabel]
                
                // Try case-insensitive matches
                const lowerSearchKey = searchKey.toLowerCase()
                const lowerSearchLabel = searchLabel.toLowerCase()
                for (const [key, val] of Object.entries(obj)) {
                  if (key.toLowerCase() === lowerSearchKey || key.toLowerCase() === lowerSearchLabel) {
                    return val
                  }
                }
                
                // Try partial matches (e.g., "emotionalState" matches "Emotional State")
                const normalizedSearch = searchLabel.replace(/\s+/g, '').toLowerCase()
                for (const [key, val] of Object.entries(obj)) {
                  const normalizedKey = key.replace(/\s+/g, '').toLowerCase()
                  if (normalizedKey === normalizedSearch || normalizedKey.includes(normalizedSearch) || normalizedSearch.includes(normalizedKey)) {
                    return val
                  }
                }
                
                // ✅ NEW: Try normalized matching (handles camelCase vs snake_case)
                const fullyNormalizedSearch = normalizeKey(searchLabel || searchKey)
                if (fullyNormalizedSearch) {
                  for (const [key, val] of Object.entries(obj)) {
                    const normalizedKey = normalizeKey(key)
                    if (normalizedKey === fullyNormalizedSearch) {
                      return val
                    }
                  }
                }
                
                return undefined
              }
              
              const value = findValue(keyMetrics, metricKey, metricLabel)
              
              // Log rendering errors for debugging (only in development)
              if (value === undefined && metricKey && process.env.NODE_ENV === 'development') {
                console.warn(
                  `[CardLayoutRenderer] Metric value not found for key "${metricKey}" (label: "${metricLabel}"). ` +
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
                  <div className="text-2xl font-semibold text-foreground whitespace-pre-wrap break-words">
                    {value !== undefined && value !== null ? (
                      formatMetric(value, metric?.format, metric?.unit)
                    ) : (
                      <span className="text-muted-foreground italic text-sm">
                        No data for {metric?.label || metric?.key}
                      </span>
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

        <ArtifactCardFooter metadata={artifactMetadata} />
      </CardContent>
    </Card>
  )
}

