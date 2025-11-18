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
import { T } from '@/components/translation/T'

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
    effectiveProjectId && userId ? { 
      projectId: effectiveProjectId as Id<"projects">,
      userId
    } : "skip"
  )

  // Priority mapping (1 = highest priority, appears first)
  // Based on workflow importance: plans first, then timelines, then action items
  const ARTIFACT_PRIORITY: Record<string, number> = {
    'report': 1,           // Plans and strategic documents (highest priority)
    'timeline': 2,         // Chronological milestones
    'structured_list': 3,  // Action items and tasks
    'tracker': 4,          // Progress tracking
    'summary': 5,          // Key metrics
    'analysis': 6,         // Data insights
    'email': 7            // Communication artifacts (lowest priority)
  }

  const getPriority = (artifactType: string): number => {
    return ARTIFACT_PRIORITY[artifactType] || 999 // Unknown types go to bottom
  }

  // Sort artifacts by priority first, then chronologically within same priority
  // Priority: reports → timelines → to-do lists → trackers → summaries → analysis → emails
  // Within same priority: oldest first (ascending createdAt)
  // MUST be called before any conditional returns to follow Rules of Hooks
  const sortedArtifacts = React.useMemo(() => {
    if (!artifacts || artifacts.length === 0) {
      return []
    }
    
    return [...artifacts].sort((a, b) => {
      // First: Sort by priority (ascending - lower number = higher priority)
      const priorityDiff = getPriority(a.type) - getPriority(b.type)
      if (priorityDiff !== 0) {
        return priorityDiff
      }
      
      // Second: Within same priority, sort by creation time (ascending - oldest first)
      return a.createdAt - b.createdAt
    })
  }, [artifacts])

  // Loading state: waiting for conversation or artifacts
  // Mobile optimization: Ensure readable text sizes
  if (conversationId && userId && conversation === undefined) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 md:h-6 md:w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-base md:text-sm">
            <T context="artifact.panel.loading">Loading artifacts...</T>
          </p>
        </div>
      </div>
    )
  }

  // Loading state: waiting for artifacts
  if (effectiveProjectId && artifacts === undefined) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 md:h-6 md:w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-base md:text-sm">
            <T context="artifact.panel.loading">Loading artifacts...</T>
          </p>
        </div>
      </div>
    )
  }

  // Empty state: no projectId/conversationId provided
  // Mobile optimization: Responsive typography
  if (!effectiveProjectId) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-xl md:text-lg">
            <T context="artifact.panel.empty.no.context.title">No project context</T>
          </p>
          <p className="text-base md:text-sm mt-2">
            <T context="artifact.panel.empty.no.context.description">Select a conversation or project to view artifacts</T>
          </p>
        </div>
      </div>
    )
  }

  // Empty state: no artifacts yet
  // Mobile optimization: Responsive typography
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-xl md:text-lg">
            <T context="artifact.panel.empty.no.artifacts.title">No artifacts yet</T>
          </p>
          <p className="text-base md:text-sm mt-2">
            <T context="artifact.panel.empty.no.artifacts.description">Artifacts will appear here as widgets work in the background</T>
          </p>
        </div>
      </div>
    )
  }

  // Display artifacts using existing ArtifactRenderer
  return (
    <div className={`h-full overflow-y-auto p-4 bg-background ${className}`}>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4">
          <h3 className="text-base md:text-lg font-semibold text-foreground">
            <T context="artifact.panel.title">Project Artifacts</T> ({artifacts.length})
          </h3>
          {effectiveProjectId && artifacts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Open assignment page
                router.push(`/dashboard/living-projects/${effectiveProjectId}/assignment`)
              }}
              className="min-h-[44px] min-w-[44px] w-full md:w-auto"
              aria-label="Open artifacts in assignment view"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              <T context="button.artifact.panel.open.gallery">Open in Assignment View</T>
            </Button>
          )}
        </div>
        {sortedArtifacts.map((artifact: Artifact) => (
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

