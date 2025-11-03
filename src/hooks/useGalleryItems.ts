/**
 * UNIFIED GALLERY ITEMS HOOK
 * 
 * Fetches BOTH artifacts AND widgets for a project, merges and sorts them.
 * No type parameter needed - returns all items together.
 * 
 * PATTERN COMPLIANCE:
 * - Uses artifactQueries.getProjectArtifacts for new artifacts table
 * - Uses widgetsQueries.getProjectWidgets for widgets
 * - Merges and sorts by most recent first
 * 
 * CRITICAL: Queries the NEW artifacts table (not widget_outputs)
 */

import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { GalleryItem } from '@/types/gallery'
import { getCurrentUserIdSync } from '@/app/lib/api-helpers'
import type { Id } from '@/convex/_generated/dataModel'

export function useGalleryItems(projectId: string) {
  const userId = getCurrentUserIdSync()
  
  // Fetch BOTH artifacts AND widgets
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    userId ? { projectId: projectId as Id<'projects'>, userId } : 'skip'
  )
  
  // Merge and normalize into unified list
  const allItems = useMemo(() => {
    const artifactItems: GalleryItem[] = (artifacts || []).map((a: any) => ({
      ...a,
      itemType: 'artifact' as const,
      // Format type for display (e.g., "structured_list" → "Structured List")
      title: a.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact',
      description: a.tags?.join(' • ') || `v${a.metadata?.version || 1}`,
      updatedAt: a.updatedAt || a._creationTime
    }))
    
    const widgetItems: GalleryItem[] = (widgets || []).map((w: any) => ({
      ...w,
      itemType: 'widget' as const,
      title: w.title || 'Untitled Widget',
      description: w.description || 'No description',
      updatedAt: w.updatedAt || w._creationTime
    }))
    
    // Merge and sort by most recent first
    return [...artifactItems, ...widgetItems].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [artifacts, widgets])
  
  return {
    items: allItems,
    isLoading: artifacts === undefined || widgets === undefined,
    isEmpty: allItems.length === 0,
    error: null // Convex handles errors internally
  }
}

