/**
 * WIDGET ARTIFACTS HOOK
 * 
 * Manages cross-widget artifact subscriptions.
 * Enables widgets to subscribe to and receive updates from other widgets' artifacts.
 * 
 * LAW IV: Real-time subscriptions via Convex queries
 */

'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useMemo } from 'react'
import type { Artifact } from '@/types/artifacts'

interface UseWidgetArtifactsProps {
  widgetId: string
  userId: string
  listenTo?: string[]  // Widget IDs to subscribe to
}

interface SubscribedArtifact {
  widgetId: string
  outputId: string
  artifact: Artifact
  timestamp: number
}

/**
 * Subscribe to artifacts from specified widgets
 * Provides real-time updates when artifacts change
 */
export function useWidgetArtifacts({
  widgetId,
  userId,
  listenTo = []
}: UseWidgetArtifactsProps) {
  // Query artifacts for subscribed widgets
  // Note: We query artifacts for each widget we're listening to
  // Since Convex doesn't support querying multiple widgetIds at once,
  // we'll need to query each widget separately or use queryArtifacts with userId
  // For now, we'll use queryArtifacts with userId and filter client-side
  const allArtifacts = useQuery(
    api.artifactQueries.queryArtifacts,
    listenTo.length > 0 && userId
      ? {
          userId,
          filters: {},  // No filters - get all user artifacts, filter client-side
          limit: 100,
          orderBy: 'desc'
        }
      : 'skip'
  )

  /**
   * Transform artifacts into subscribed artifacts
   * Filters to only include widgets we're listening to
   */
  const subscribedArtifacts = useMemo(() => {
    if (!allArtifacts || !Array.isArray(allArtifacts)) {
      return []
    }

    const artifacts: SubscribedArtifact[] = []

    for (const artifact of allArtifacts) {
      // Check if this artifact is from a widget we're listening to
      const artifactAny = artifact as any
      
      if (
        artifactAny.widgetId &&
        listenTo.includes(artifactAny.widgetId) &&
        artifactAny.type &&
        artifactAny.data
      ) {
        artifacts.push({
          widgetId: artifactAny.widgetId,
          outputId: artifactAny._id, // Use artifact ID as outputId for compatibility
          artifact: {
            type: artifactAny.type,
            schema: artifactAny.data_model,
            data: artifactAny.data,
            metadata: artifactAny.metadata || {
              version: 1,
              lastUpdatedBy: artifactAny.userId,
              lastUpdatedAt: artifactAny.createdAt
            }
          } as Artifact,
          timestamp: artifactAny.createdAt || artifactAny._creationTime
        })
      }
    }

    // Return most recent artifact per widget
    const latestByWidget = new Map<string, SubscribedArtifact>()
    
    for (const artifact of artifacts) {
      const existing = latestByWidget.get(artifact.widgetId)
      if (!existing || artifact.timestamp > existing.timestamp) {
        latestByWidget.set(artifact.widgetId, artifact)
      }
    }

    return Array.from(latestByWidget.values())
  }, [allArtifacts, listenTo])

  /**
   * Get artifact from a specific widget
   */
  const getArtifactFrom = (widgetId: string): SubscribedArtifact | undefined => {
    return subscribedArtifacts.find(a => a.widgetId === widgetId)
  }

  /**
   * Check if we have artifacts from all subscribed widgets
   */
  const hasAllArtifacts = useMemo(() => {
    if (listenTo.length === 0) return true
    return listenTo.every(wId => subscribedArtifacts.some(a => a.widgetId === wId))
  }, [listenTo, subscribedArtifacts])

  return {
    subscribedArtifacts,
    getArtifactFrom,
    hasAllArtifacts,
    isLoading: allArtifacts === undefined
  }
}

