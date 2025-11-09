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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Unsupported artifact fallback
 * Shows artifact metadata for types not yet implemented
 */
function UnsupportedArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
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
  editButton
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
    
    default:
      return <UnsupportedArtifact artifact={artifact} />
  }
}

