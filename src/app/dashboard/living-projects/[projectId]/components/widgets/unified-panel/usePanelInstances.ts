/**
 * PANEL INSTANCES MANAGER HOOK
 * 
 * Manages multiple open panel instances - supports opening multiple panels,
 * pinning, expanding/collapsing, and positioning.
 */

'use client'

import { useState, useCallback } from 'react'
import { PanelInstance, DetailItemType } from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'
import { DEFAULT_SIZES } from './panelConfig'

export interface UsePanelInstancesReturn {
  instances: PanelInstance[]
  openPanel: (item: any, itemType: DetailItemType, position?: { x: number; y: number }) => void
  updateInstance: (id: string, updates: Partial<PanelInstance>) => void
  closeInstance: (id: string) => void
  toggleExpanded: (id: string) => void
  togglePinned: (id: string) => void
  closeAllUnpinned: () => void
}

/**
 * Hook for managing multiple panel instances
 * Allows opening multiple panels simultaneously with independent state
 */
export function usePanelInstances(): UsePanelInstancesReturn {
  const [instances, setInstances] = useState<PanelInstance[]>([])

  /**
   * Open a new panel instance
   * If a panel for this item already exists, focus it instead
   */
  const openPanel = useCallback((
    item: any,
    itemType: DetailItemType,
    position?: { x: number; y: number }
  ) => {
    // Check if panel already exists for this item
    const existingId = `${itemType}-${item._id}`
    const existing = instances.find(inst => inst.id === existingId)
    
    if (existing) {
      // Panel already open - ensure it's expanded and bring to front
      setInstances(prev => prev.map(inst =>
        inst.id === existingId
          ? { ...inst, isExpanded: true, size: DEFAULT_SIZES.expanded }
          : inst
      ))
      return
    }

    // Calculate position if not provided (center of viewport)
    const defaultPosition = position || {
      x: window.innerWidth / 2 - DEFAULT_SIZES.expanded.width / 2,
      y: window.innerHeight / 2 - DEFAULT_SIZES.expanded.height / 2
    }

    // Create new panel instance - expanded by default
    const newInstance: PanelInstance = {
      id: existingId,
      item,
      itemType,
      position: defaultPosition,
      isPinned: false,
      isExpanded: true, // ✅ Open expanded by default
      size: DEFAULT_SIZES.expanded // ✅ Use expanded size
    }

    setInstances(prev => [...prev, newInstance])
  }, [instances])

  /**
   * Update a panel instance with partial updates
   */
  const updateInstance = useCallback((id: string, updates: Partial<PanelInstance>) => {
    setInstances(prev => prev.map(inst =>
      inst.id === id ? { ...inst, ...updates } : inst
    ))
  }, [])

  /**
   * Close a panel instance
   */
  const closeInstance = useCallback((id: string) => {
    setInstances(prev => prev.filter(inst => inst.id !== id))
  }, [])

  /**
   * Toggle expanded/collapsed state
   */
  const toggleExpanded = useCallback((id: string) => {
    setInstances(prev => prev.map(inst => {
      if (inst.id !== id) return inst
      
      const isExpanding = !inst.isExpanded
      return {
        ...inst,
        isExpanded: isExpanding,
        size: isExpanding ? DEFAULT_SIZES.expanded : DEFAULT_SIZES.collapsed
      }
    }))
  }, [])

  /**
   * Toggle pinned state
   */
  const togglePinned = useCallback((id: string) => {
    setInstances(prev => prev.map(inst =>
      inst.id === id ? { ...inst, isPinned: !inst.isPinned } : inst
    ))
  }, [])

  /**
   * Close all unpinned panels
   */
  const closeAllUnpinned = useCallback(() => {
    setInstances(prev => prev.filter(inst => inst.isPinned))
  }, [])

  return {
    instances,
    openPanel,
    updateInstance,
    closeInstance,
    toggleExpanded,
    togglePinned,
    closeAllUnpinned
  }
}

