/**
 * ARTIFACT RENDERER
 * 
 * Universal renderer for all artifact types.
 * Routes to specific layout components based on artifact type.
 * 
 * LAW VI: This is the Gold Standard for artifact rendering.
 * All artifact types use this single entry point.
 */

'use client'

import React from 'react'
import { Artifact, ArtifactRendererProps } from '@/types/artifacts'
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
              Show artifact schema
            </summary>
            <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-xs">
              {JSON.stringify(artifact.schema, null, 2)}
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
 */
export function ArtifactRenderer({
  artifact,
  editable = false,
  onUpdate
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

  // Normalize database format to expected format
  // Database uses: artifactType, artifactSchema, artifactData
  // Renderer expects: type, schema, data, metadata
  const artifactAny = artifact as any
  
  // Defensive normalization with fallbacks
  const normalizedArtifact: Artifact = {
    type: artifactAny?.artifactType || artifactAny?.type || 'unknown',
    schema: artifactAny?.artifactSchema || artifactAny?.schema || {},
    data: artifactAny?.artifactData || artifactAny?.data || {},
    metadata: artifactAny?.metadata || {
      version: artifactAny?.version || 1,
      lastUpdatedBy: artifactAny?.lastContributor || artifactAny?.widgetId || 'unknown',
      lastUpdatedAt: artifactAny?.updatedAt || artifactAny?.createdAt || Date.now(),
      editHistory: (Array.isArray(artifactAny?.userEdits) ? artifactAny.userEdits : []).map((edit: any) => ({
        timestamp: edit?.timestamp || Date.now(),
        widgetId: edit?.userId || 'unknown',
        changes: JSON.stringify(edit?.changes || {})
      }))
    }
  } as Artifact

  // Type-based routing to layout components
  switch (normalizedArtifact.type) {
    case 'structured_list':
      return (
        <StructuredListLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    case 'timeline':
      return (
        <TimelineLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    case 'tracker':
      return (
        <TrackerLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    case 'report':
      return (
        <ReportLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    case 'analysis':
      return (
        <AnalysisLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    case 'summary':
      return (
        <SummaryLayout
          artifact={normalizedArtifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      )
    
    default:
      return <UnsupportedArtifact artifact={normalizedArtifact} />
  }
}

