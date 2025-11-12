/**
 * ARTIFACT RENDERER
 * 
 * Universal renderer for all artifact types.
 * Routes by data_model.layout (schema-driven) with fallback to artifact.type (legacy).
 * 
 * LAW VI: This is the Gold Standard for artifact rendering.
 * All artifact types use this single entry point based on schema layout.
 */

'use client'

import React from 'react'
import { Artifact, ArtifactRendererProps } from '@/types/artifacts'
import { SchemaDrivenArtifactRenderer } from './SchemaDrivenArtifactRenderer'
import { StructuredListLayout } from './layouts/StructuredListLayout'
import { TimelineLayout } from './layouts/TimelineLayout'
import { TrackerLayout } from './layouts/TrackerLayout'
import { ReportLayout } from './layouts/ReportLayout'
import { AnalysisLayout } from './layouts/AnalysisLayout'
import { SummaryLayout } from './layouts/SummaryLayout'
import { EmailLayout } from './layouts/EmailLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Validate artifact data structure matches expected schema
 * 🔴 CRITICAL FIX (TASK 3.2): Frontend validation before rendering
 */
function validateArtifactStructure(artifact: Artifact): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const layout = artifact.data_model?.layout
  const data = artifact.data
  
  if (!layout) {
    // Legacy artifacts without layout - skip validation
    return { valid: true, errors: [] }
  }
  
  // Validate required fields per layout
  // Use type assertions for defensive checks
  const dataAny = data as any
  
  if (layout === 'card') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('card layout: data must be an object')
    } else if (!dataAny.keyMetrics && !dataAny.metrics) {
      errors.push('card layout: data.keyMetrics is required')
    } else if (dataAny.keyMetrics && typeof dataAny.keyMetrics !== 'object') {
      errors.push('card layout: data.keyMetrics must be an object')
    }
    if (!Array.isArray(artifact.data_model?.metrics)) {
      errors.push('card layout: data_model.metrics must be an array')
    }
  } else if (layout === 'tracker') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('tracker layout: data must be an object')
    } else if (!Array.isArray(dataAny.entries) && !Array.isArray(dataAny.trackingEntries)) {
      errors.push('tracker layout: data.entries is required (array)')
    }
    if (!Array.isArray(artifact.data_model?.trackers)) {
      errors.push('tracker layout: data_model.trackers must be an array')
    }
  } else if (layout === 'timeline') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('timeline layout: data must be an object')
    } else if (!Array.isArray(dataAny.events) && !Array.isArray(dataAny.timelineEvents)) {
      errors.push('timeline layout: data.events is required (array)')
    }
    if (!Array.isArray(artifact.data_model?.eventTypes)) {
      errors.push('timeline layout: data_model.eventTypes must be an array')
    }
  } else if (layout === 'insights') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('insights layout: data must be an object')
    } else {
      // Allow missing insights - renderer handles empty state gracefully
      // Check multiple possible field locations (match renderer's defensive checks)
      const hasInsights = Array.isArray(dataAny.insights) || Array.isArray(dataAny?.data?.insights)
      if (!hasInsights) {
        // Don't error - just log a warning. The renderer will handle empty state
        console.warn('[ArtifactRenderer] Insights artifact missing insights array - will render empty state')
      }
    }
  } else if (layout === 'markdown') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      errors.push('markdown layout: data must be an object')
    } else {
      // Allow empty markdown/sections - initialize if missing rather than failing
      // This handles edge cases where artifacts were created before normalization
      const hasMarkdown = dataAny.markdown !== undefined && dataAny.markdown !== null
      const hasSections = dataAny.sections !== undefined && dataAny.sections !== null
      if (!hasMarkdown && !hasSections) {
        // Don't error - just log a warning. The renderer will handle empty state
        console.warn('[ArtifactRenderer] Markdown artifact missing both markdown and sections - will render empty state')
      }
    }
  } else if (layout === 'table' || layout === 'cards') {
    if (!Array.isArray(data)) {
      errors.push(`${layout} layout: data must be an array`)
    }
    if (!Array.isArray(artifact.data_model?.fields)) {
      errors.push(`${layout} layout: data_model.fields must be an array`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Unsupported artifact fallback
 * Shows artifact metadata for types not yet implemented
 */
function UnsupportedArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <Card className="bg-card/50 backdrop-bl-sm border border-border/40">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline">Unsupported</Badge>
          <span className="text-muted-foreground">
            Artifact Type: {artifact.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>This artifact type is not yet supported.</p>
          <details className="mt-4">
            <summary className="cursor-pointer hover:text-foreground">
              Show artifact data model
            </summary>
            <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-xs">
              {JSON.stringify(artifact.data_model, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Invalid artifact structure fallback
 * Shows validation errors and JSON fallback
 */
function InvalidArtifactStructure({ artifact, errors }: { artifact: Artifact; errors: string[] }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-yellow-500/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
            Invalid Structure
          </Badge>
          <span className="text-muted-foreground">
            Artifact Type: {artifact.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-2">
              Invalid artifact structure detected
            </p>
            <ul className="list-disc list-inside text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
          
          <details className="mt-4">
            <summary className="cursor-pointer hover:text-foreground text-sm font-medium">
              View Raw JSON Data
            </summary>
            <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-xs max-h-[400px]">
              {JSON.stringify(artifact, null, 2)}
            </pre>
          </details>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Universal artifact renderer
 * Single entry point for all artifact display
 * 
 * ROUTING STRATEGY:
 * 1. If data_model.layout exists → Use schema-driven routing (new system)
 * 2. If data_model.layout missing → Fallback to type-based routing (legacy compatibility)
 */
export function ArtifactRenderer({
  artifact,
  editable = false,
  onUpdate,
  editButton,
}: ArtifactRendererProps) {
  // Defensive: handle null/undefined artifact
  if (!artifact) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No artifact data available
        </CardContent>
      </Card>
    )
  }

  // 🔴 CRITICAL FIX (TASK 3.2): Validate artifact structure before rendering
  const validation = validateArtifactStructure(artifact)
  if (!validation.valid) {
    // Log validation failures for debugging
    const artifactId = (artifact as any)._id || (artifact as any).id;
    console.error(
      `[ArtifactRenderer] Validation failed for artifact ${artifactId || 'unknown'}:`,
      validation.errors
    )
    return <InvalidArtifactStructure artifact={artifact} errors={validation.errors} />
  }

  // PRIORITY 1: Schema-driven routing (if data_model.layout exists)
  if (artifact.data_model && artifact.data_model.layout) {
    return (
      <SchemaDrivenArtifactRenderer
        artifact={artifact}
        editable={editable}
        onUpdate={onUpdate}
        editButton={editButton}
      />
    )
  }

  // PRIORITY 2: Type-based routing fallback (for legacy artifacts without data_model.layout)
  // This ensures backward compatibility with existing artifacts
  switch (artifact.type) {
    case 'structured_list':
      return (
        <StructuredListLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'timeline':
      return (
        <TimelineLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'tracker':
      return (
        <TrackerLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'report':
      return (
        <ReportLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'analysis':
      return (
        <AnalysisLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'summary':
      return (
        <SummaryLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    case 'email':
      return (
        <EmailLayout
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    default:
      return (
        <UnsupportedArtifact artifact={artifact} />
      )
  }
}

