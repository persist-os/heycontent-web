import { useState, useRef, useCallback, useEffect } from 'react'

export type ViewMode = 'overview' | 'project-detail'
export type TransformState = { x: number; y: number; scale: number }

interface MultiLevelPanZoomOptions {
  canvasWidth: number
  canvasHeight: number
  viewportWidth: number
  viewportHeight: number
  onViewModeChange?: (mode: ViewMode) => void
  onProjectFocus?: (projectId: string | null) => void
  onReset?: () => void
}

export function useMultiLevelPanZoom({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  onViewModeChange,
  onProjectFocus,
  onReset
}: MultiLevelPanZoomOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 0.2 })
  const [viewMode, setViewMode] = useState<ViewMode>('overview')
  const [focusedProjectId, setFocusedProjectId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, transform: { x: 0, y: 0, scale: 1 } })

  // Progressive disclosure thresholds (Warframe-style)
  const ZOOM_THRESHOLD_PROJECT_DOTS = 0.3      // < 30%: Projects as simple dots
  const ZOOM_THRESHOLD_PROJECT_CARDS = 0.5     // 30-50%: Projects as cards with boundaries
  const ZOOM_THRESHOLD_WIDGET_VISIBILITY = 0.7 // 50-70%: Widget dots appear
  const ZOOM_THRESHOLD_WIDGET_DETAIL = 1.2     // 70-120%: Full widget cards
  const ZOOM_THRESHOLD_PROJECT_FOCUS = 0.8     // 80%: Auto-focus on project

  // Check if we should switch to project detail mode
  const shouldShowProjectDetail = transform.scale >= ZOOM_THRESHOLD_PROJECT_FOCUS

  // Smooth animation function (Warframe-style easing)
  const animateToTransform = useCallback((targetTransform: TransformState, duration: number = 200) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const startTransform = { ...transform }
    const startTime = performance.now()
    setIsAnimating(true)

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease-out cubic)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      const newTransform = {
        x: startTransform.x + (targetTransform.x - startTransform.x) * easedProgress,
        y: startTransform.y + (targetTransform.y - startTransform.y) * easedProgress,
        scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * easedProgress
      }
      
      setTransform(newTransform)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        animationRef.current = null
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [transform])

  // Update view mode when zoom threshold is crossed
  useEffect(() => {
    const newMode: ViewMode = shouldShowProjectDetail ? 'project-detail' : 'overview'
    if (newMode !== viewMode) {
      setViewMode(newMode)
      onViewModeChange?.(newMode)
    }
  }, [shouldShowProjectDetail, viewMode, onViewModeChange])

  // Handle wheel events for zooming (Figma-style cursor-centric)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    if (!containerRef.current || isAnimating) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Calculate zoom direction and amount (50% faster scaling)
    const zoomFactor = e.deltaY > 0 ? 0.85 : 1.15
    const newScale = Math.max(0.1, Math.min(3, transform.scale * zoomFactor))

    // Calculate the point in canvas coordinates before zoom
    const canvasX = (mouseX - transform.x) / transform.scale
    const canvasY = (mouseY - transform.y) / transform.scale

    // Calculate new transform to keep the mouse point stationary
    const newX = mouseX - canvasX * newScale
    const newY = mouseY - canvasY * newScale

    const targetTransform = { x: newX, y: newY, scale: newScale }
    
    // Use smooth animation for zoom transitions
    animateToTransform(targetTransform, 100)
  }, [transform, isAnimating, animateToTransform])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left mouse button
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      transform: { ...transform }
    })
  }, [transform])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    setTransform({
      x: dragStart.transform.x + deltaX,
      y: dragStart.transform.y + deltaY,
      scale: dragStart.transform.scale
    })
  }, [isDragging, dragStart])

  // Handle mouse up for dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Set up mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Zoom functions with smooth animation
  const zoomIn = useCallback(() => {
    if (isAnimating) return
    
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const zoomFactor = 1.75
    const newScale = Math.min(3, transform.scale * zoomFactor)

    const canvasX = (centerX - transform.x) / transform.scale
    const canvasY = (centerY - transform.y) / transform.scale

    const targetTransform = {
      x: centerX - canvasX * newScale,
      y: centerY - canvasY * newScale,
      scale: newScale
    }
    
    animateToTransform(targetTransform, 150)
  }, [transform, viewportWidth, viewportHeight, isAnimating, animateToTransform])

  const zoomOut = useCallback(() => {
    if (isAnimating) return
    
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const zoomFactor = 0.57
    const newScale = Math.max(0.1, transform.scale * zoomFactor)

    const canvasX = (centerX - transform.x) / transform.scale
    const canvasY = (centerY - transform.y) / transform.scale

    const targetTransform = {
      x: centerX - canvasX * newScale,
      y: centerY - canvasY * newScale,
      scale: newScale
    }
    
    animateToTransform(targetTransform, 150)
  }, [transform, viewportWidth, viewportHeight, isAnimating, animateToTransform])

  const resetView = useCallback(() => {
    // Always center the canvas at 20% zoom
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const canvasCenterX = canvasWidth / 2
    const canvasCenterY = canvasHeight / 2
    
    const targetTransform = {
      x: centerX - canvasCenterX * 0.2, 
      y: centerY - canvasCenterY * 0.2, 
      scale: 0.2 
    }
    
    // Use smooth animation for reset
    animateToTransform(targetTransform, 300)
    
    // Update state immediately for UI consistency
    setViewMode('overview')
    setFocusedProjectId(null)
    onProjectFocus?.(null)
    
    // Call the reset callback to handle URL navigation
    onReset?.()
  }, [onProjectFocus, onReset, viewportWidth, viewportHeight, canvasWidth, canvasHeight, animateToTransform])

  // Focus on a specific point in canvas coordinates
  const focusOnPoint = useCallback((x: number, y: number) => {
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2

    setTransform({
      x: centerX - x * transform.scale,
      y: centerY - y * transform.scale,
      scale: transform.scale
    })
  }, [transform.scale, viewportWidth, viewportHeight])

  // Focus on a project (zoom into its space with smooth animation)
  const focusOnProject = useCallback((projectId: string, projectX: number, projectY: number, spaceRadius: number) => {
    setFocusedProjectId(projectId)
    onProjectFocus?.(projectId)

    // Calculate zoom level to fit project space in 80% of viewport
    const targetZoom = Math.min(
      (viewportWidth * 0.8) / (spaceRadius * 2),
      (viewportHeight * 0.8) / (spaceRadius * 2),
      2.5 // Max zoom
    )

    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2

    const targetTransform = {
      x: centerX - projectX * targetZoom,
      y: centerY - projectY * targetZoom,
      scale: targetZoom
    }
    
    animateToTransform(targetTransform, 300)
  }, [viewportWidth, viewportHeight, onProjectFocus, animateToTransform])

  // Check if a project is in focus (80% viewport threshold)
  const isProjectInFocus = useCallback((projectX: number, projectY: number, spaceRadius: number) => {
    const viewportLeft = -transform.x / transform.scale
    const viewportTop = -transform.y / transform.scale
    const viewportRight = viewportLeft + viewportWidth / transform.scale
    const viewportBottom = viewportTop + viewportHeight / transform.scale

    const projectLeft = projectX - spaceRadius
    const projectRight = projectX + spaceRadius
    const projectTop = projectY - spaceRadius
    const projectBottom = projectY + spaceRadius

    // Check if project space covers 80% of viewport
    const viewportArea = (viewportRight - viewportLeft) * (viewportBottom - viewportTop)
    const projectArea = (projectRight - projectLeft) * (projectBottom - projectTop)
    
    return projectArea / viewportArea >= 0.8
  }, [transform, viewportWidth, viewportHeight])

  return {
    containerRef,
    transform,
    viewMode,
    focusedProjectId,
    isDragging,
    isAnimating,
    shouldShowProjectDetail,
    // Progressive disclosure thresholds
    ZOOM_THRESHOLD_PROJECT_DOTS,
    ZOOM_THRESHOLD_PROJECT_CARDS,
    ZOOM_THRESHOLD_WIDGET_VISIBILITY,
    ZOOM_THRESHOLD_WIDGET_DETAIL,
    ZOOM_THRESHOLD_PROJECT_FOCUS,
    // Animation and interaction
    animateToTransform,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint,
    focusOnProject,
    isProjectInFocus
  }
}
