/**
 * UNIFIED ACTIONS HOOK
 * 
 * Centralized action handlers for all item types (widgets, notes, conversations, crystals, shards).
 * Routes actions to appropriate APIs and handles loading/error states.
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { DetailItemType } from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'
import { launchThinkingLabWithOutput } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'
import { toast } from 'sonner'
import { getCurrentUserId } from '@/app/lib/api-helpers'

export interface UnifiedActionsReturn {
  handleRun: (item: any, itemType: DetailItemType) => Promise<void>
  handleEdit: (item: any, itemType: DetailItemType, updates: any) => Promise<void>
  handleDelete: (item: any, itemType: DetailItemType) => Promise<void>
  handleOpenFull: (item: any, itemType: DetailItemType) => void
  handleLaunchLab: (item: any, itemType: DetailItemType) => void
  isRunning: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  lastResult: any | null
}

/**
 * Unified actions hook for all item types
 * Consolidates action handlers from WidgetDetailsPanel and ContentDetailsPanel
 */
export function useUnifiedActions(projectId: string): UnifiedActionsReturn {
  const router = useRouter()
  const [isRunning] = useState(false) // Widget execution moved to project-level
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult] = useState<any | null>(null) // Widget execution moved to project-level

  // Convex mutations
  const updateWidget = useMutation(api.projectWidgetsMutations.updateWidget)
  const deleteWidget = useMutation(api.projectWidgetsMutations.deleteWidget)
  // TODO: Add other mutations for notes, conversations as needed

  /**
   * Handle run action (now project-level only)
   * Widget execution has been moved to project-level "Start Project" button
   */
  const handleRun = useCallback(async (item: any, itemType: DetailItemType) => {
    try {
      setError(null)
      
      if (itemType === 'widget') {
        toast.info('Widget execution is now project-level', {
          description: 'Use the "Start Project" button to run all widgets'
        })
      } else {
        toast.error('Run action not supported for this item type')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      setError(errorMessage)
      toast.error('Action failed', { description: errorMessage })
      throw err
    }
  }, [projectId])

  /**
   * Handle edit action for any item type
   */
  const handleEdit = useCallback(async (item: any, itemType: DetailItemType, updates: any) => {
    try {
      setIsUpdating(true)
      setError(null)
      
      const userId = await getCurrentUserId()

      switch (itemType) {
        case 'widget':
          await updateWidget({
            projectId: projectId as any,
            userId,
            widgetId: item._id as any,
            updates
          })
          toast.success('Widget updated successfully!')
          break
          
        case 'note':
          // TODO: Implement note update mutation
          toast.info('Note editing coming soon')
          break
          
        case 'conversation':
          // TODO: Implement conversation update mutation
          toast.info('Conversation editing coming soon')
          break
          
        default:
          toast.error('Edit not supported for this item type')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Update failed'
      setError(errorMessage)
      toast.error('Update failed', { description: errorMessage })
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [updateWidget, projectId])

  /**
   * Handle delete action for any item type
   */
  const handleDelete = useCallback(async (item: any, itemType: DetailItemType) => {
    try {
      setIsDeleting(true)
      setError(null)
      
      const userId = await getCurrentUserId()

      switch (itemType) {
        case 'widget':
          await deleteWidget({
            projectId: projectId as any,
            userId,
            widgetId: item._id as any
          })
          toast.success('Widget deleted successfully!')
          break
          
        case 'note':
          // TODO: Implement note delete mutation
          toast.info('Note deletion coming soon')
          break
          
        case 'conversation':
          // TODO: Implement conversation delete mutation
          toast.info('Conversation deletion coming soon')
          break
          
        default:
          toast.error('Delete not supported for this item type')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed'
      setError(errorMessage)
      toast.error('Delete failed', { description: errorMessage })
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [deleteWidget, projectId])

  /**
   * Handle open full view for any item type
   * Routes widgets and artifacts to unified gallery (simpler URL now!)
   */
  const handleOpenFull = useCallback((item: any, itemType: DetailItemType) => {
    try {
      // Widgets and artifacts go to unified gallery
      if (itemType === 'widget' || itemType === 'artifact') {
        router.push(`/dashboard/living-projects/${projectId}/gallery?id=${item._id}`)
      } else {
        // Keep existing routes for non-gallery types
        switch (itemType) {
          case 'note':
            router.push(`/dashboard/thinking_lab?noteId=${item._id}`)
            break
            
          case 'conversation':
            router.push(`/dashboard/thinking_lab?conversationId=${item._id}`)
            break
            
          case 'crystal':
            router.push(`/dashboard/crystals?crystalId=${item.crystal_id || item._id}`)
            break
            
          case 'shard':
            router.push(`/dashboard/crystals?shardId=${item._id}`)
            break
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Navigation failed'
      setError(errorMessage)
      toast.error('Navigation failed', { description: errorMessage })
    }
  }, [router, projectId])

  /**
   * Handle launch thinking lab (for widgets with outputs)
   */
  const handleLaunchLab = useCallback((item: any, itemType: DetailItemType) => {
    try {
      if (itemType === 'widget' && item.latestOutput?.noteId) {
        launchThinkingLabWithOutput(router, item.latestOutput, projectId, item._id)
      } else {
        toast.error('No thinking lab output available')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Launch failed'
      setError(errorMessage)
      toast.error('Launch failed', { description: errorMessage })
    }
  }, [router, projectId])

  return {
    handleRun,
    handleEdit,
    handleDelete,
    handleOpenFull,
    handleLaunchLab,
    isRunning,
    isUpdating,
    isDeleting,
    error,
    lastResult
  }
}

