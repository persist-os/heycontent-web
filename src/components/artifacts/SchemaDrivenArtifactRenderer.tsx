/**
 * SCHEMA-DRIVEN ARTIFACT RENDERER
 * 
 * Routes artifacts by data_model.layout instead of artifact.type
 * Enables auto-extending artifact support without code changes
 * 
 * LAW VI: This is the new Gold Standard for artifact rendering.
 * All artifact types use this single entry point based on schema layout.
 */

'use client'

import React from 'react'
import { Artifact, ArtifactRendererProps } from '@/types/artifacts'
import { TableLayoutRenderer } from './layouts/renderers/TableLayoutRenderer'
import { CardsLayoutRenderer } from './layouts/renderers/CardsLayoutRenderer'
import { TimelineLayoutRenderer } from './layouts/renderers/TimelineLayoutRenderer'
import { TrackerLayoutRenderer } from './layouts/renderers/TrackerLayoutRenderer'
import { MarkdownLayoutRenderer } from './layouts/renderers/MarkdownLayoutRenderer'
import { InsightsLayoutRenderer } from './layouts/renderers/InsightsLayoutRenderer'
import { CardLayoutRenderer } from './layouts/renderers/CardLayoutRenderer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Unsupported layout fallback
 * Shows artifact metadata for layouts not yet implemented
 */
function UnsupportedLayout({ artifact }: { artifact: Artifact }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Badge variant="outline">Unsupported Layout</Badge>
          <span className="text-muted-foreground">
            Layout: {artifact.data_model?.layout || 'unknown'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>This layout type is not yet supported.</p>
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
 * Schema-driven artifact renderer
 * Routes by data_model.layout instead of artifact.type
 */
export function SchemaDrivenArtifactRenderer({
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

  // Defensive: handle missing data_model
  if (!artifact.data_model || !artifact.data_model.layout) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Badge variant="outline">Invalid Schema</Badge>
            <span className="text-muted-foreground">
              Artifact Type: {artifact.type}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Artifact is missing data_model.layout. Cannot render.</p>
            <details className="mt-4">
              <summary className="cursor-pointer hover:text-foreground">
                Show artifact data
              </summary>
              <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-xs">
                {JSON.stringify(artifact, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Extract layout from data_model
  const layout = artifact.data_model.layout
  const artifactType = artifact.type

  // Route by layout (not type)
  switch (layout) {
    case 'table':
      return (
        <TableLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'cards':
      return (
        <CardsLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'timeline':
      return (
        <TimelineLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'tracker':
      return (
        <TrackerLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'markdown':
      return (
        <MarkdownLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'insights':
      return (
        <InsightsLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    case 'card':
      return (
        <CardLayoutRenderer
          data_model={artifact.data_model as any}
          data={artifact.data as any}
          editable={editable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={artifact.metadata}
          editButton={editButton}
        />
      )
    
    default:
      return <UnsupportedLayout artifact={artifact} />
  }
}

