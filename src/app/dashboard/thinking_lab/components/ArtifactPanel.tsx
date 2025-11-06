/**
 * Artifact Panel Component
 * 
 * Displays project artifacts in a scrollable panel.
 * Uses the clean artifacts table (not legacy widget_outputs).
 * 
 * CRITICAL: Uses api.artifactQueries.getProjectArtifacts (correct query)
 */

'use client'

import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { Artifact } from '@/types/artifacts'

interface ArtifactPanelProps {
  projectId?: string
  className?: string
}

/**
 * Artifact Panel - Clean separation from LabCompositions
 * 
 * Queries the clean artifacts table and renders using existing ArtifactRenderer.
 * Handles loading, empty, and error states.
 */
export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ 
  projectId, 
  className = '' 
}) => {
  // Query artifacts from clean artifacts table
  // CRITICAL: Uses artifactQueries.getProjectArtifacts (NOT widgetOutputsQueries)
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    projectId ? { projectId: projectId as Id<"projects"> } : "skip"
  )

  // Empty state - no artifacts yet (or still loading)
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No artifacts yet</p>
          <p className="text-sm mt-2">Artifacts will appear here as widgets work in the background</p>
        </div>
      </div>
    )
  }

  // Display artifacts using existing ArtifactRenderer
  return (
    <div className={`h-full overflow-y-auto p-4 bg-background ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Project Artifacts ({artifacts.length})
        </h3>
        {artifacts.map((artifact: Artifact) => (
          <ArtifactRenderer 
            key={artifact._id}
            artifact={artifact}
            editable={true}
            onUpdate={async (updated: any) => {
              // TODO: Wire up artifact updates through API
              console.log('Artifact update:', updated)
            }}
          />
        ))}
      </div>
    </div>
  )
}

