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
  
  console.log('[useGalleryItems] Hook called with:', { projectId, userId })
  
  // Fetch BOTH artifacts AND widgets
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    projectId ? { projectId: projectId as Id<'projects'> } : 'skip'
  )
  
  console.log('[useGalleryItems] Artifacts query result:', { 
    artifacts, 
    isLoading: artifacts === undefined,
    count: artifacts?.length 
  })
  
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    userId && projectId ? { 
      projectId: projectId as Id<'projects'>, 
      userId,
      includeArchived: true  // ✅ Show ALL widgets (active, pending, ready, etc.) not just "active"
    } : 'skip'
  )
  
  console.log('[useGalleryItems] Widgets query result:', { 
    widgets, 
    isLoading: widgets === undefined,
    count: widgets?.length,
    querySkipped: !userId || !projectId 
  })
  
  // Merge and normalize into unified list
  const allItems = useMemo(() => {
    // Debug logging
    console.log('[useGalleryItems] Artifacts:', artifacts?.length || 0, artifacts)
    console.log('[useGalleryItems] Widgets:', widgets?.length || 0, widgets)
    
    const artifactItems: GalleryItem[] = (artifacts || [])
      .filter((a: any) => a && a._id) // ✅ Ensure valid artifacts
      .map((a: any) => ({
        ...a,
        itemType: 'artifact' as const,
        // Format type for display (e.g., "structured_list" → "Structured List")
        title: a.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact',
        description: a.tags?.join(' • ') || `v${a.metadata?.version || 1}`,
        updatedAt: a.updatedAt || a._creationTime
      }))
    
    const widgetItems: GalleryItem[] = (widgets || [])
      .filter((w: any) => w && w._id && w.status !== 'deleted') // ✅ Ensure valid widgets, exclude deleted
      .map((w: any) => ({
        ...w,
        itemType: 'widget' as const,
        title: w.title || 'Untitled Widget',
        description: w.description || 'No description',
        updatedAt: w.updatedAt || w._creationTime
      }))
    
    console.log('[useGalleryItems] Artifact items:', artifactItems.length)
    console.log('[useGalleryItems] Widget items:', widgetItems.length)
    
    // Merge and sort by most recent first
    const merged = [...artifactItems, ...widgetItems].sort((a, b) => b.updatedAt - a.updatedAt)
    console.log('[useGalleryItems] Total merged items:', merged.length)
    
    return merged
  }, [artifacts, widgets])
  
  return {
    items: allItems,
    isLoading: artifacts === undefined || widgets === undefined,
    isEmpty: allItems.length === 0,
    error: null // Convex handles errors internally
  }
}

