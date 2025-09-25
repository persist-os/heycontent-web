import { useState, useCallback } from 'react'
import { useSharedPanZoom, ViewMode } from './useSharedPanZoom'

interface MultiLevelPanZoomOptions {
  canvasWidth: number
  canvasHeight: number
  viewportWidth: number
  viewportHeight: number
  onViewModeChange?: (mode: ViewMode) => void
  onProjectFocus?: (projectId: string | null) => void
  onReset?: () => void
  interactionsDisabled?: boolean
}

export function useMultiLevelPanZoom({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  onViewModeChange,
  onProjectFocus,
  onReset,
  interactionsDisabled = false
}: MultiLevelPanZoomOptions) {
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null)

  // Progressive disclosure thresholds
  const ZOOM_THRESHOLD_PROJECT_DOTS = 0.1      // < 10%: Projects as simple dots
  const ZOOM_THRESHOLD_PROJECT_CARDS = 0.1     // Always show project boundaries
  const ZOOM_THRESHOLD_WIDGET_VISIBILITY = 0.3 // 30%: Widget stars appear
  const ZOOM_THRESHOLD_WIDGET_DETAIL = 0.8     // 80%: Full widget cards
  const ZOOM_THRESHOLD_PROJECT_FOCUS = 0.8     // 80%: Auto-focus on project
  const ZOOM_THRESHOLD_HYSTERESIS = 0.5        // 50%: Clear selection when dropping below

  // Use the shared pan/zoom hook with mode management
  const sharedPanZoom = useSharedPanZoom({
    canvasWidth,
    canvasHeight,
    viewportWidth,
    viewportHeight,
    mode: 'overview', // Start in overview mode
    zoomThresholds: {
      min: ZOOM_THRESHOLD_PROJECT_DOTS,
      max: ZOOM_THRESHOLD_WIDGET_DETAIL,
      zoomOutToOverviewThreshold: ZOOM_THRESHOLD_PROJECT_DOTS
    },
    interactionsDisabled,
    onModeChange: (newMode) => {
      onViewModeChange?.(newMode)
    }
  })

  // Determine current view mode based on zoom level
  const viewMode: ViewMode = sharedPanZoom.transform.scale >= ZOOM_THRESHOLD_PROJECT_FOCUS ? 'project-detail' : 'overview'
  const shouldShowProjectDetail = viewMode === 'project-detail'

  // Focus on a project with smooth animation
  const focusOnProject = useCallback((projectId: string, projectX: number, projectY: number, spaceRadius: number) => {
    setFocusedProjectId(projectId)
    onProjectFocus?.(projectId)
    sharedPanZoom.focusOnArea(projectX, projectY, ZOOM_THRESHOLD_PROJECT_FOCUS)
  }, [onProjectFocus, sharedPanZoom])

  // Check if a project is in focus
  const isProjectInFocus = useCallback((projectX: number, projectY: number, spaceRadius: number) => {
    const visualRadius = spaceRadius * 4
    return sharedPanZoom.isAreaInFocus(projectX, projectY, visualRadius, 0.8)
  }, [sharedPanZoom])

  // Enhanced reset view that handles project state
  const resetView = useCallback(() => {
    sharedPanZoom.resetView()
    setFocusedProjectId(null)
    onProjectFocus?.(null)
    onReset?.()
  }, [sharedPanZoom, onProjectFocus, onReset])

  return {
    // Delegate all pan/zoom functionality to shared hook
    ...sharedPanZoom,
    // Multi-level specific state
    viewMode,
    focusedProjectId,
    shouldShowProjectDetail,
    // Progressive disclosure thresholds
    ZOOM_THRESHOLD_PROJECT_DOTS,
    ZOOM_THRESHOLD_PROJECT_CARDS,
    ZOOM_THRESHOLD_WIDGET_VISIBILITY,
    ZOOM_THRESHOLD_WIDGET_DETAIL,
    ZOOM_THRESHOLD_PROJECT_FOCUS,
    ZOOM_THRESHOLD_HYSTERESIS,
    // Multi-level specific functions
    focusOnProject,
    isProjectInFocus,
    resetView
  }
}
