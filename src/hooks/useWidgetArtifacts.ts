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
  // Query widget outputs for subscribed widgets
  // Note: This will work once backend creates outputs with artifact data
  const outputs = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    listenTo.length > 0 && userId
      ? {
          userId,
          filters: {},  // Will be enhanced to filter by widgetId array
          limit: 100,
          orderBy: 'desc'
        }
      : 'skip'
  )

  /**
   * Transform outputs into subscribed artifacts
   * Filters to only include widgets we're listening to
   */
  const subscribedArtifacts = useMemo(() => {
    if (!outputs || !Array.isArray(outputs)) {
      return []
    }

    const artifacts: SubscribedArtifact[] = []

    for (const output of outputs) {
      // Check if this output is from a widget we're listening to
      const outputAny = output as any
      
      if (
        listenTo.includes(outputAny.widgetId) &&
        outputAny.artifactType &&
        outputAny.artifactData
      ) {
        artifacts.push({
          widgetId: outputAny.widgetId,
          outputId: outputAny.outputId,
          artifact: {
            type: outputAny.artifactType,
            schema: outputAny.artifactSchema,
            data: outputAny.artifactData,
            metadata: {
              version: 1,
              lastUpdatedBy: outputAny.widgetId,
              lastUpdatedAt: outputAny.createdAt
            }
          } as Artifact,
          timestamp: outputAny.createdAt
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
  }, [outputs, listenTo])

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
    isLoading: outputs === undefined
  }
}

