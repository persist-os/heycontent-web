/**
 * Artifact Panel Component
 * 
 * Displays project artifacts in a scrollable panel.
 * Uses the clean artifacts table (not legacy widget_outputs).
 * 
 * CRITICAL: Uses api.artifactQueries.getProjectArtifacts (correct query)
 * 
 * Pattern 17: Accepts both projectId AND conversationId since all conversations have projects.
 * If conversationId is provided, fetches conversation to get projectId, then queries artifacts.
 */

'use client'

import React from 'react'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'
import { Artifact } from '@/types/artifacts'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

interface ArtifactPanelProps {
  projectId?: string
  conversationId?: string
  userId?: string
  className?: string
}

/**
 * Artifact Panel - Clean separation from LabCompositions
 * 
 * Queries the clean artifacts table and renders using existing ArtifactRenderer.
 * Handles loading, empty, and error states.
 * 
 * Supports querying by conversation OR project:
 * - If conversationId provided: fetches conversation to get projectId, then queries artifacts
 * - If projectId provided directly: uses that projectId to query artifacts
 * - If both provided: prefers conversationId (more specific context)
 */
export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ 
  projectId,
  conversationId,
  userId,
  className = '' 
}) => {
  const router = useRouter()
  
  // Step 1: If conversationId provided, fetch conversation to get projectId
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId 
      ? { conversationId: conversationId as Id<"conversations">, userId }
      : "skip"
  )

  // Step 2: Determine effective projectId (from conversation or direct prop)
  const effectiveProjectId = conversation?.projectId || projectId

  // Step 3: Query artifacts from clean artifacts table using effective projectId
  // CRITICAL: Uses artifactQueries.getProjectArtifacts (NOT widgetOutputsQueries)
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    effectiveProjectId ? { projectId: effectiveProjectId as Id<"projects"> } : "skip"
  )

  // Loading state: waiting for conversation or artifacts
  if (conversationId && userId && conversation === undefined) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Loading artifacts...</p>
        </div>
      </div>
    )
  }

  // Loading state: waiting for artifacts
  if (effectiveProjectId && artifacts === undefined) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm">Loading artifacts...</p>
        </div>
      </div>
    )
  }

  // Empty state: no projectId/conversationId provided
  if (!effectiveProjectId) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No project context</p>
          <p className="text-sm mt-2">Select a conversation or project to view artifacts</p>
        </div>
      </div>
    )
  }

  // Empty state: no artifacts yet
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Project Artifacts ({artifacts.length})
          </h3>
          {effectiveProjectId && artifacts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open gallery with first artifact, or just open gallery if no artifacts
                const firstArtifactId = artifacts[0]?._id
                if (firstArtifactId) {
                  router.push(`/dashboard/living-projects/${effectiveProjectId}/gallery?id=${firstArtifactId}`)
                } else {
                  router.push(`/dashboard/living-projects/${effectiveProjectId}/gallery`)
                }
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Unified View
            </Button>
          )}
        </div>
        {artifacts.map((artifact: Artifact) => (
          <EditableArtifactRenderer 
            key={artifact._id}
            artifact={artifact}
            userId={userId}
          />
        ))}
      </div>
    </div>
  )
}

