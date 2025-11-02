/**
 * ARTIFACT TYPE DEFINITIONS
 * 
 * Universal artifact system for schema-driven widget output rendering.
 * Eliminates the need for specialized components per artifact type.
 */

import { WidgetOutputArtifactType } from '@/convex/types/widgets'

/**
 * Base artifact metadata
 * Tracks version history and source information
 */
export interface ArtifactMetadata {
  version: number
  lastUpdatedBy: string  // widgetId
  lastUpdatedAt: number
  editHistory?: Array<{
    timestamp: number
    widgetId: string
    changes: string
  }>
}

/**
 * Field definition for structured lists
 */
export interface FieldDefinition {
  key: string
  type: 'text' | 'select' | 'badge' | 'number'
  label?: string
  editable: boolean
  options?: string[]  // For select type
}

/**
 * Event type definition for timelines
 */
export interface EventTypeDefinition {
  type: string
  icon: string
  color: string
  label: string
}

/**
 * STRUCTURED LIST ARTIFACT
 * 
 * Table-like data with editable fields
 * Supports both table and card layouts
 */
export interface StructuredListArtifact {
  type: 'structured_list'
  schema: {
    layout: 'table' | 'cards'
    fields: FieldDefinition[]
    groupBy?: string
    sortBy?: string
  }
  data: Array<Record<string, any>>
  metadata: ArtifactMetadata
}

/**
 * TIMELINE ARTIFACT
 * 
 * User-facing timeline (projects, milestones, tasks)
 * NOT execution tracking (use TrackerArtifact for that)
 */
export interface TimelineArtifact {
  type: 'timeline'
  schema: {
    layout: 'timeline'
    eventTypes: EventTypeDefinition[]
    groupBy?: 'date' | 'type'
  }
  data: {
    events: Array<{
      id: string
      timestamp: number
      type: string
      title: string
      description?: string
      metadata?: Record<string, any>
    }>
  }
  metadata: ArtifactMetadata
}

/**
 * TRACKER ARTIFACT
 * 
 * Widget execution history and cross-widget activity tracking
 * Compact format for activity logs
 */
export interface TrackerArtifact {
  type: 'tracker'
  schema: {
    layout: 'tracker'
    eventTypes: EventTypeDefinition[]
  }
  data: {
    events: Array<{
      id: string
      timestamp: number
      type: 'execution' | 'update' | 'error' | 'success'
      widgetId: string
      widgetName?: string
      message: string
      status?: 'idle' | 'running' | 'success' | 'failed'
      details?: string
    }>
  }
  metadata: ArtifactMetadata
}

/**
 * REPORT ARTIFACT
 * 
 * Markdown-based report with structured sections
 * Ideal for comprehensive analysis, documentation, summaries
 */
export interface ReportArtifact {
  type: 'report'
  schema: {
    layout: 'markdown'
    sections?: Array<{
      id: string
      title: string
      order: number
    }>
  }
  data: {
    markdown: string
    sections?: Array<{
      id: string
      title: string
      content: string
    }>
  }
  metadata: ArtifactMetadata
}

/**
 * ANALYSIS ARTIFACT
 * 
 * Data insights with optional visualizations
 * Focuses on key findings and patterns
 */
export interface AnalysisArtifact {
  type: 'analysis'
  schema: {
    layout: 'insights'
    showCharts?: boolean
    chartType?: 'bar' | 'line' | 'pie'
  }
  data: {
    insights: Array<{
      id?: string
      title: string
      description: string
      impact: 'high' | 'medium' | 'low'
      metric?: string
      value?: string
      category?: string
    }>
    chartData?: Record<string, any>
  }
  metadata: ArtifactMetadata
}

/**
 * SUMMARY ARTIFACT
 * 
 * Key metrics and highlights
 * Compact overview with actionable metrics
 */
export interface SummaryArtifact {
  type: 'summary'
  schema: {
    layout: 'card'
    metrics: Array<{
      key: string
      label: string
      format?: 'number' | 'currency' | 'percentage' | 'text'
      unit?: string
    }>
  }
  data: {
    keyMetrics: Record<string, any>
    summaryText?: string
  }
  metadata: ArtifactMetadata
}

/**
 * Union type for all artifacts
 * Add new artifact types here as they're implemented
 */
export type Artifact = 
  | StructuredListArtifact 
  | TimelineArtifact 
  | TrackerArtifact
  | ReportArtifact
  | AnalysisArtifact
  | SummaryArtifact

/**
 * Props for artifact renderer
 */
export interface ArtifactRendererProps {
  artifact: Artifact
  editable?: boolean
  onUpdate?: (data: any) => void
}

/**
 * Props for layout components
 */
export interface LayoutProps<T extends Artifact = Artifact> {
  artifact: T
  editable?: boolean
  onUpdate?: (data: any) => void
}

