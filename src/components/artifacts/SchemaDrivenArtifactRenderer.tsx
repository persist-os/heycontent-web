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
import { EmailLayout } from './layouts/EmailLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { useArtifactVersionSelection } from '@/hooks/useArtifactVersionSelection'

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
        <div className="space-y-2 text-base md:text-sm text-muted-foreground">
          <p>This layout type is not yet supported.</p>
          <details className="mt-4">
            <summary 
              className="cursor-pointer hover:text-foreground min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 -mx-2"
              aria-label="Toggle artifact data model display"
            >
              Show artifact data model
            </summary>
            <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-sm md:text-xs">
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
  // CRITICAL: All hooks must be called before any early returns
  // Version selection via URL state (source of truth)
  const artifactId = artifact ? ((artifact as any)._id || (artifact as any).id) : null;
  const currentArtifactVersion = artifact?.metadata?.version || 1;
  const { selectedVersion, selectVersion } = useArtifactVersionSelection(
    artifactId,
    currentArtifactVersion
  );

  // Simple query: fetch version if different from current
  const versionData = useQuery(
    api.artifactVersionQueries.getVersionByNumber,
    selectedVersion !== currentArtifactVersion && artifactId
      ? {
          artifactId: artifactId as Id<'artifacts'>,
          versionNumber: selectedVersion,
        }
      : "skip"
  );

  // Defensive: handle null/undefined artifact
  if (!artifact) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
        <CardContent className="py-8 text-center text-base md:text-sm text-muted-foreground">
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
          <div className="space-y-2 text-base md:text-sm text-muted-foreground">
            <p>Artifact is missing data_model.layout. Cannot render.</p>
            <details className="mt-4">
              <summary 
                className="cursor-pointer hover:text-foreground min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm px-2 -mx-2"
                aria-label="Toggle artifact data display"
              >
                Show artifact data
              </summary>
              <pre className="mt-2 p-4 bg-muted/10 rounded-lg overflow-auto text-sm md:text-xs">
                {JSON.stringify(artifact, null, 2)}
              </pre>
            </details>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Use version data if available, otherwise use artifact
  const displayArtifact = versionData
    ? {
        ...artifact,
        data: versionData.data,
        data_model: versionData.dataModel,
        tags: versionData.tags,
        metadata: {
          ...artifact.metadata,
          version: versionData.versionNumber,
        },
      }
    : artifact;

  // Determine if we're viewing a historical version
  const isHistoricalVersion = selectedVersion !== currentArtifactVersion;
  const isEditable = editable && !isHistoricalVersion;

  // Extract layout from data_model
  const layout = displayArtifact.data_model?.layout
  const artifactType = displayArtifact.type

  // Route by layout (not type)
  switch (layout) {
    case 'table':
      return (
        <TableLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'cards':
      return (
        <CardsLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'timeline':
      return (
        <TimelineLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'tracker':
      return (
        <TrackerLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'markdown':
      return (
        <MarkdownLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'insights':
      return (
        <InsightsLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'card':
      return (
        <CardLayoutRenderer
          data_model={displayArtifact.data_model as any}
          data={displayArtifact.data as any}
          editable={isEditable}
          onUpdate={onUpdate}
          artifactType={artifactType}
          metadata={displayArtifact.metadata}
          editButton={editButton}
          artifactId={artifactId as Id<'artifacts'> | undefined}
          selectedVersion={selectedVersion}
          onVersionChange={selectVersion}
        />
      )
    
    case 'compose':
      return (
        <EmailLayout
          artifact={displayArtifact as any}
          editable={isEditable}
          onUpdate={onUpdate}
          editButton={editButton}
        />
      )
    
    default:
      return <UnsupportedLayout artifact={displayArtifact} />
  }
}

