/**
 * ARTIFACT TYPE DEFINITIONS
 * 
 * CRITICAL: Matches convex/types/artifact.ts EXACTLY
 * 
 * Universal artifact system for schema-driven widget output rendering.
 * Eliminates the need for specialized components per artifact type.
 */

import { WidgetOutputArtifactType } from '@/convex/types/widgets'
import { Id } from '@/convex/_generated/dataModel'
import React from 'react'

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
 * Action definition for interactive artifacts
 * Actions render as clickable buttons (semantic colors, 44px touch targets)
 */
export interface ArtifactAction {
  type: 'get_directions' | 'call' | 'email' | 'open_url' | 'copy_to_clipboard'
  url: string  // URL for action (Google Maps directions, tel:, mailto:, etc.)
  label?: string  // Optional button label (defaults to action type)
}

/**
 * Link definition for interactive artifacts
 * Links render as clickable links (semantic colors)
 */
export interface ArtifactLink {
  type: 'website' | 'phone' | 'email' | 'directions' | 'menu'
  url: string  // URL for link
  label: string  // Link text
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
  data_model: {
    layout: 'table' | 'cards'
    fields: FieldDefinition[]
    groupBy?: string
    sortBy?: string
  }
  data: Array<Record<string, any> & {
    // Interactive artifact support (optional, backward compatible)
    actions?: ArtifactAction[]  // Actions render as buttons
    links?: ArtifactLink[]      // Links render as clickable links
  }>
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * TIMELINE ARTIFACT
 * 
 * User-facing timeline (projects, milestones, tasks)
 * NOT execution tracking (use TrackerArtifact for that)
 */
export interface TimelineArtifact {
  type: 'timeline'
  data_model: {
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
      actions?: ArtifactAction[]  // Optional actions per event
      links?: ArtifactLink[]      // Optional links per event
    }>
    // Optional artifact-level actions/links
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * TRACKER ARTIFACT
 * 
 * Progress tracking for goals, tasks, metrics, and milestones
 * Tracks progress over time with status updates
 */
export interface TrackerArtifact {
  type: 'tracker'
  data_model: {
    layout: 'tracker'
    trackers: Array<{
      key: string
      label: string
      target?: number  // Optional target value
      unit?: string    // Unit of measurement (e.g., "%", "items", "hours")
      format?: 'number' | 'percentage' | 'currency' | 'text'
    }>
  }
  data: {
    entries: Array<{
      id: string
      timestamp: number
      values: Record<string, number | string>  // Key-value pairs matching tracker keys
      note?: string  // Optional note about this update
      actions?: ArtifactAction[]  // Optional actions per entry
      links?: ArtifactLink[]      // Optional links per entry
    }>
    // Optional artifact-level actions/links
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * REPORT ARTIFACT
 * 
 * Markdown-based report with structured sections
 * Ideal for comprehensive analysis, documentation, summaries
 */
export interface ReportArtifact {
  type: 'report'
  data_model: {
    layout: 'markdown'
    sections?: Array<{
      id: string
      title: string
      order: number
    }>
  }
  data: {
    markdown?: string  // Optional: matches Python Optional[str]
    sections?: Array<{
      id: string
      title: string
      content: string
      actions?: ArtifactAction[]  // Optional actions per section
      links?: ArtifactLink[]      // Optional links per section
    }>
    // Optional artifact-level actions/links
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * ANALYSIS ARTIFACT
 * 
 * Data insights with optional visualizations
 * Focuses on key findings and patterns
 */
export interface AnalysisArtifact {
  type: 'analysis'
  data_model: {
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
      actions?: ArtifactAction[]  // Optional actions per insight
      links?: ArtifactLink[]      // Optional links per insight
    }>
    chartData?: Record<string, any>
    // Optional artifact-level actions/links
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * SUMMARY ARTIFACT
 * 
 * Key metrics and highlights
 * Compact overview with actionable metrics
 */
export interface SummaryArtifact {
  type: 'summary'
  data_model: {
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
    // Optional artifact-level actions/links
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
}

/**
 * EMAIL ARTIFACT
 * 
 * Email composition and sending artifacts
 * Supports draft, scheduled, and sent statuses
 * Allows multiple sends with full history tracking
 */
export interface EmailArtifact {
  type: 'email'
  data_model: {
    layout: 'compose'
    fields?: string[]  // Optional: ['to', 'subject', 'body', 'scheduledAt', 'status']
  }
  data: {
    to: string
    subject: string
    body: string  // HTML or plain text content
    is_html?: boolean  // Explicit flag indicating if body is HTML (defaults to true for backward compatibility)
    scheduledAt?: number  // Timestamp for scheduled emails (used for scheduling, not stored status)
    replies?: Array<{
      messageId: string
      from: string
      body: string
      timestamp: number
      snippet?: string
    }>
    // Optional artifact-level actions/links (e.g., send email, forward, reply)
    actions?: ArtifactAction[]
    links?: ArtifactLink[]
    // NOTE: Status, sendHistory, and scheduledSends are now tracked in actions table
    // Query actions table for send history and computed status
  }
  metadata: ArtifactMetadata
  tags?: string[]
  // Convex IDs
  _id: Id<"artifacts">
  projectId: Id<"projects">
  widgetId?: Id<"widgets">
  userId: string
  createdAt: number
  updatedAt: number
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
  | EmailArtifact

/**
 * Props for artifact renderer
 */
export interface ArtifactRendererProps {
  artifact: Artifact
  editable?: boolean
  onUpdate?: (data: any) => void
  editButton?: React.ReactNode  // Edit button to render in CardHeader
}

/**
 * Props for layout components
 */
export interface LayoutProps<T extends Artifact = Artifact> {
  artifact: T
  editable?: boolean
  onUpdate?: (data: any) => void
  editButton?: React.ReactNode  // Edit button to render in CardHeader
}

