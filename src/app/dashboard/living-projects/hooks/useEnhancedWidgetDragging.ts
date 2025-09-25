'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

// Types for drag state and operations
export interface DragState {
  isDragging: boolean
  draggedWidget: WidgetConfig | null
  dragStartPosition: { x: number; y: number } | null
  currentPosition: { x: number; y: number } | null
  hoveredWidgetId: string | null
  snapPosition: { x: number; y: number } | null
  isValidDrop: boolean
  error: string | null
}

export interface DragConstraints {
  projectBounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
  snapGrid: number
  widgetSize: { width: number; height: number }
}

export interface DragCallbacks {
  onDragStart: (widget: WidgetConfig, startPosition: { x: number; y: number }) => void
  onDragMove: (position: { x: number; y: number }) => void
  onDragEnd: (position: { x: number; y: number }, targetWidgetId?: string) => void
  onCancel: () => void
  onError: (error: string) => void
}

export interface DragVisuals {
  floatingWidgetOpacity: number
  glowIntensity: number
  snapIndicatorVisible: boolean
  swapPreviewVisible: boolean
  errorAnimation: boolean
}

export interface UseEnhancedWidgetDraggingOptions {
  constraints: DragConstraints
  widgets: WidgetConfig[]
  transform: { x: number; y: number; scale: number }
  onUpdatePosition: (widgetId: string, offsetX: number, offsetY: number) => Promise<void>
  onSwapPositions: (widgetIdA: string, widgetIdB: string) => Promise<void>
}

export interface UseEnhancedWidgetDraggingReturn {
  // State
  dragState: DragState
  dragVisuals: DragVisuals
  
  // Actions
  startDrag: (widget: WidgetConfig, startPosition: { x: number; y: number }) => void
  updateDrag: (position: { x: number; y: number }) => void
  endDrag: (position: { x: number; y: number }) => void
  cancelDrag: () => void
  
  // Event handlers
  handleMouseDown: (widget: WidgetConfig, event: React.MouseEvent) => void
  handleMouseMove: (event: React.MouseEvent) => void
  handleMouseUp: (event: React.MouseEvent) => void
  
  // Utilities
  isWithinBounds: (position: { x: number; y: number }) => boolean
  getSnapPosition: (position: { x: number; y: number }) => { x: number; y: number }
  getHoveredWidget: (position: { x: number; y: number }) => string | null
}

/**
 * Enhanced widget dragging hook with visual effects, constraints, and smooth animations
 * Provides a complete dragging system for widgets within project boundaries
 */
export function useEnhancedWidgetDragging({
  constraints,
  widgets,
  transform,
  onUpdatePosition,
  onSwapPositions
}: UseEnhancedWidgetDraggingOptions): UseEnhancedWidgetDraggingReturn {
  
  // Core drag state
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedWidget: null,
    dragStartPosition: null,
    currentPosition: null,
    hoveredWidgetId: null,
    snapPosition: null,
    isValidDrop: false,
    error: null
  })

  // Animation and visual state
  const [dragVisuals, setDragVisuals] = useState<DragVisuals>({
    floatingWidgetOpacity: 1,
    glowIntensity: 0,
    snapIndicatorVisible: false,
    swapPreviewVisible: false,
    errorAnimation: false
  })

  // Refs for performance optimization
  const animationFrameRef = useRef<number | null>(null)
  const dragStartTimeRef = useRef<number>(0)
  const lastUpdateTimeRef = useRef<number>(0)

  // Performance optimization: throttle updates to 60fps
  const throttledUpdate = useCallback((updateFn: () => void) => {
    const now = performance.now()
    if (now - lastUpdateTimeRef.current >= 16.67) { // ~60fps
      updateFn()
      lastUpdateTimeRef.current = now
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateFn()
        lastUpdateTimeRef.current = performance.now()
      })
    }
  }, [])

  // Boundary checking
  const isWithinBounds = useCallback((position: { x: number; y: number }): boolean => {
    const { projectBounds, widgetSize } = constraints
    const halfWidth = widgetSize.width / 2
    const halfHeight = widgetSize.height / 2
    
    return (
      position.x - halfWidth >= projectBounds.minX &&
      position.x + halfWidth <= projectBounds.maxX &&
      position.y - halfHeight >= projectBounds.minY &&
      position.y + halfHeight <= projectBounds.maxY
    )
  }, [constraints])

  // Snap to grid calculation
  const getSnapPosition = useCallback((position: { x: number; y: number }): { x: number; y: number } => {
    const { projectBounds, snapGrid } = constraints
    
    // Calculate snap position within bounds
    const snapX = Math.round((position.x - projectBounds.minX) / snapGrid) * snapGrid + projectBounds.minX
    const snapY = Math.round((position.y - projectBounds.minY) / snapGrid) * snapGrid + projectBounds.minY
    
    // Clamp to bounds
    const { widgetSize } = constraints
    const halfWidth = widgetSize.width / 2
    const halfHeight = widgetSize.height / 2
    
    return {
      x: Math.max(projectBounds.minX + halfWidth, Math.min(projectBounds.maxX - halfWidth, snapX)),
      y: Math.max(projectBounds.minY + halfHeight, Math.min(projectBounds.maxY - halfHeight, snapY))
    }
  }, [constraints])

  // Find hovered widget for swap operations
  const getHoveredWidget = useCallback((position: { x: number; y: number }): string | null => {
    if (!dragState.draggedWidget) return null
    
    const hoverRadius = 70 / transform.scale // Widget interaction radius
    
    for (const widget of widgets) {
      if (widget.widget_id === dragState.draggedWidget.widget_id) continue
      
      // Find widget position from layout (this would need to be passed in or calculated)
      // For now, we'll use a simple distance check
      const distance = Math.sqrt(
        Math.pow(position.x - widget.position_x || 0, 2) +
        Math.pow(position.y - widget.position_y || 0, 2)
      )
      
      if (distance < hoverRadius) {
        return widget.widget_id
      }
    }
    
    return null
  }, [dragState.draggedWidget, widgets, transform.scale])

  // Start drag operation
  const startDrag = useCallback((widget: WidgetConfig, startPosition: { x: number; y: number }) => {
    dragStartTimeRef.current = performance.now()
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedWidget: widget,
      dragStartPosition: startPosition,
      currentPosition: startPosition,
      hoveredWidgetId: null,
      snapPosition: getSnapPosition(startPosition),
      isValidDrop: isWithinBounds(startPosition),
      error: null
    }))

    // Animate visual effects
    setDragVisuals(prev => ({
      ...prev,
      floatingWidgetOpacity: 0.5,
      glowIntensity: 0.8,
      snapIndicatorVisible: true,
      swapPreviewVisible: false,
      errorAnimation: false
    }))

    // Add global event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
  }, [getSnapPosition, isWithinBounds])

  // Update drag position
  const updateDrag = useCallback((position: { x: number; y: number }) => {
    if (!dragState.isDragging) return

    throttledUpdate(() => {
      const snapPosition = getSnapPosition(position)
      const hoveredWidgetId = getHoveredWidget(position)
      const isValidDrop = isWithinBounds(position)

      setDragState(prev => ({
        ...prev,
        currentPosition: position,
        snapPosition,
        hoveredWidgetId,
        isValidDrop
      }))

      // Update visual effects based on state
      setDragVisuals(prev => ({
        ...prev,
        glowIntensity: isValidDrop ? 0.8 : 0.3,
        swapPreviewVisible: hoveredWidgetId !== null,
        snapIndicatorVisible: hoveredWidgetId === null
      }))
    })
  }, [dragState.isDragging, throttledUpdate, getSnapPosition, getHoveredWidget, isWithinBounds])

  // End drag operation
  const endDrag = useCallback(async (position: { x: number; y: number }) => {
    if (!dragState.isDragging || !dragState.draggedWidget) return

    const { draggedWidget, hoveredWidgetId, snapPosition } = dragState
    
    try {
      if (hoveredWidgetId) {
        // Swap with hovered widget
        await onSwapPositions(draggedWidget.widget_id, hoveredWidgetId)
      } else if (snapPosition && isWithinBounds(snapPosition)) {
        // Move to snap position
        const { projectBounds } = constraints
        const offsetX = (snapPosition.x - projectBounds.minX) / (projectBounds.maxX - projectBounds.minX)
        const offsetY = (snapPosition.y - projectBounds.minY) / (projectBounds.maxY - projectBounds.minY)
        
        await onUpdatePosition(draggedWidget.widget_id, offsetX, offsetY)
      } else {
        // Invalid drop - snap back
        throw new Error('Invalid drop position')
      }

      // Success animation
      setDragVisuals(prev => ({
        ...prev,
        floatingWidgetOpacity: 1,
        glowIntensity: 0,
        snapIndicatorVisible: false,
        swapPreviewVisible: false,
        errorAnimation: false
      }))

    } catch (error) {
      // Error handling with snap-back animation
      setDragState(prev => ({ ...prev, error: error instanceof Error ? error.message : 'Unknown error' }))
      setDragVisuals(prev => ({ ...prev, errorAnimation: true }))
      
      // Snap back animation
      setTimeout(() => {
        setDragVisuals(prev => ({
          ...prev,
          floatingWidgetOpacity: 1,
          glowIntensity: 0,
          snapIndicatorVisible: false,
          swapPreviewVisible: false,
          errorAnimation: false
        }))
      }, 500)
    }

    // Clean up drag state
    setDragState({
      isDragging: false,
      draggedWidget: null,
      dragStartPosition: null,
      currentPosition: null,
      hoveredWidgetId: null,
      snapPosition: null,
      isValidDrop: false,
      error: null
    })

    // Remove global event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [dragState, isWithinBounds, constraints, onUpdatePosition, onSwapPositions])

  // Cancel drag operation
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedWidget: null,
      dragStartPosition: null,
      currentPosition: null,
      hoveredWidgetId: null,
      snapPosition: null,
      isValidDrop: false,
      error: null
    })

    setDragVisuals({
      floatingWidgetOpacity: 1,
      glowIntensity: 0,
      snapIndicatorVisible: false,
      swapPreviewVisible: false,
      errorAnimation: false
    })

    // Remove global event listeners
    document.removeEventListener('mousemove', handleGlobalMouseMove)
    document.removeEventListener('mouseup', handleGlobalMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }, [])

  // Global mouse move handler
  const handleGlobalMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return

    const rect = document.querySelector('[data-canvas-container]')?.getBoundingClientRect()
    if (!rect) return

    const canvasX = (event.clientX - rect.left - transform.x) / transform.scale
    const canvasY = (event.clientY - rect.top - transform.y) / transform.scale

    updateDrag({ x: canvasX, y: canvasY })
  }, [dragState.isDragging, transform, updateDrag])

  // Global mouse up handler
  const handleGlobalMouseUp = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return

    const rect = document.querySelector('[data-canvas-container]')?.getBoundingClientRect()
    if (!rect) return

    const canvasX = (event.clientX - rect.left - transform.x) / transform.scale
    const canvasY = (event.clientY - rect.top - transform.y) / transform.scale

    endDrag({ x: canvasX, y: canvasY })
  }, [dragState.isDragging, transform, endDrag])

  // Mouse event handlers for widget components
  const handleMouseDown = useCallback((widget: WidgetConfig, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    const rect = event.currentTarget.getBoundingClientRect()
    const startPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    }

    startDrag(widget, startPosition)
  }, [startDrag])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return
    event.preventDefault()
    event.stopPropagation()
  }, [dragState.isDragging])

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return
    event.preventDefault()
    event.stopPropagation()
  }, [dragState.isDragging])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [handleGlobalMouseMove, handleGlobalMouseUp])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dragState.isDragging) {
        cancelDrag()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [dragState.isDragging, cancelDrag])

  return {
    // State
    dragState,
    dragVisuals,
    
    // Actions
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    
    // Event handlers
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    
    // Utilities
    isWithinBounds,
    getSnapPosition,
    getHoveredWidget
  }
}
