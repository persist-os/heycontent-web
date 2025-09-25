import { useState, useRef, useCallback, useEffect } from 'react'

export type ViewMode = 'overview' | 'project-detail'
export type TransformState = { x: number; y: number; scale: number }

interface PanZoomBounds {
  minX?: number
  maxX?: number
  minY?: number
  maxY?: number
}

interface SharedPanZoomOptions {
  canvasWidth: number
  canvasHeight: number
  viewportWidth: number
  viewportHeight: number
  mode: ViewMode
  bounds?: PanZoomBounds
  zoomThresholds?: {
    min: number
    max: number
    zoomOutToOverviewThreshold?: number
  }
  interactionsDisabled?: boolean
  onTransformChange?: (transform: TransformState) => void
  onModeChange?: (mode: ViewMode) => void
}

export function useSharedPanZoom({
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  mode,
  bounds,
  zoomThresholds = {
    min: 0.1,
    max: 0.8,
    zoomOutToOverviewThreshold: 0.1
  },
  interactionsDisabled = false,
  onTransformChange,
  onModeChange
}: SharedPanZoomOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 0.1 })
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [dragStart, setDragStart] = useState({ 
    x: 0, 
    y: 0, 
    transform: { x: 0, y: 0, scale: 1 }, 
    distance: undefined as number | undefined 
  })
  const [lastMousePosition, setLastMousePosition] = useState<{ x: number; y: number } | null>(null)

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
      onTransformChange?.(newTransform)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        animationRef.current = null
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [transform, onTransformChange])

  // Apply boundary constraints to transform
  const applyBounds = useCallback((transform: TransformState): TransformState => {
    if (!bounds || mode !== 'project-detail') {
      return transform
    }

    let { x, y, scale } = transform

    // Apply zoom bounds
    scale = Math.max(zoomThresholds.min, Math.min(zoomThresholds.max, scale))

    // Apply position bounds
    if (bounds.minX !== undefined) {
      x = Math.max(bounds.minX, x)
    }
    if (bounds.maxX !== undefined) {
      x = Math.min(bounds.maxX, x)
    }
    if (bounds.minY !== undefined) {
      y = Math.max(bounds.minY, y)
    }
    if (bounds.maxY !== undefined) {
      y = Math.min(bounds.maxY, y)
    }

    return { x, y, scale }
  }, [bounds, mode, zoomThresholds])

  // Check if we should switch modes based on zoom level
  const shouldSwitchToOverview = transform.scale <= zoomThresholds.zoomOutToOverviewThreshold
  const shouldSwitchToProjectDetail = transform.scale >= zoomThresholds.max * 0.8

  // Handle mode transitions
  useEffect(() => {
    if (mode === 'project-detail' && shouldSwitchToOverview) {
      onModeChange?.('overview')
    } else if (mode === 'overview' && shouldSwitchToProjectDetail) {
      onModeChange?.('project-detail')
    }
  }, [transform.scale, mode, shouldSwitchToOverview, shouldSwitchToProjectDetail, onModeChange])

  // Handle wheel events for zooming (Figma-style cursor-centric)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    if (!containerRef.current || isAnimating || interactionsDisabled) return

    const rect = containerRef.current.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Store mouse position in canvas coordinates for auto-focus
    const canvasX = (mouseX - transform.x) / transform.scale
    const canvasY = (mouseY - transform.y) / transform.scale
    setLastMousePosition({ x: canvasX, y: canvasY })

    // Calculate zoom direction and amount (50% faster scaling)
    const zoomFactor = e.deltaY > 0 ? 0.85 : 1.15
    const newScale = Math.max(zoomThresholds.min, Math.min(zoomThresholds.max, transform.scale * zoomFactor))

    // Calculate the point in canvas coordinates before zoom
    const canvasXBeforeZoom = (mouseX - transform.x) / transform.scale
    const canvasYBeforeZoom = (mouseY - transform.y) / transform.scale

    // Calculate new transform to keep the mouse point stationary
    const newX = mouseX - canvasXBeforeZoom * newScale
    const newY = mouseY - canvasYBeforeZoom * newScale

    const targetTransform = applyBounds({ x: newX, y: newY, scale: newScale })
    
    // Use smooth animation for zoom transitions
    animateToTransform(targetTransform, 100)
  }, [transform, isAnimating, animateToTransform, zoomThresholds, applyBounds])

  // Handle touch events for pinch-to-zoom
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && !interactionsDisabled) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left
      const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top
      
      // Store center position in canvas coordinates
      const canvasX = (centerX - transform.x) / transform.scale
      const canvasY = (centerY - transform.y) / transform.scale
      setLastMousePosition({ x: canvasX, y: canvasY })
    }
  }, [transform])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && !interactionsDisabled) {
      e.preventDefault()
      
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const centerX = (touch1.clientX + touch2.clientX) / 2 - rect.left
      const centerY = (touch1.clientY + touch2.clientY) / 2 - rect.top
      
      // Calculate distance between touches for zoom
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // Store initial distance on first touch
      if (!dragStart.distance) {
        setDragStart(prev => ({ ...prev, distance }))
        return
      }
      
      const scaleChange = distance / dragStart.distance
      const newScale = Math.max(zoomThresholds.min, Math.min(zoomThresholds.max, transform.scale * scaleChange))
      
      // Calculate new transform to keep the center point stationary
      const canvasX = (centerX - transform.x) / transform.scale
      const canvasY = (centerY - transform.y) / transform.scale
      
      const newX = centerX - canvasX * newScale
      const newY = centerY - canvasY * newScale
      
      const targetTransform = applyBounds({ x: newX, y: newY, scale: newScale })
      setTransform(targetTransform)
      onTransformChange?.(targetTransform)
    }
  }, [transform, dragStart.distance, zoomThresholds, applyBounds, onTransformChange])

  const handleTouchEnd = useCallback(() => {
    setDragStart(prev => ({ ...prev, distance: undefined }))
  }, [])

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || interactionsDisabled) return // Only left mouse button, and not disabled
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      transform: { ...transform },
      distance: undefined
    })
  }, [transform])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const newTransform = applyBounds({
      x: dragStart.transform.x + deltaX,
      y: dragStart.transform.y + deltaY,
      scale: dragStart.transform.scale
    })

    setTransform(newTransform)
    onTransformChange?.(newTransform)
  }, [isDragging, dragStart, applyBounds, onTransformChange])

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
    const newScale = Math.min(zoomThresholds.max, transform.scale * zoomFactor)

    const canvasX = (centerX - transform.x) / transform.scale
    const canvasY = (centerY - transform.y) / transform.scale

    const targetTransform = applyBounds({
      x: centerX - canvasX * newScale,
      y: centerY - canvasY * newScale,
      scale: newScale
    })
    
    animateToTransform(targetTransform, 150)
  }, [transform, viewportWidth, viewportHeight, isAnimating, animateToTransform, zoomThresholds, applyBounds])

  const zoomOut = useCallback(() => {
    if (isAnimating) return
    
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const zoomFactor = 0.57
    const newScale = Math.max(zoomThresholds.min, transform.scale * zoomFactor)

    const canvasX = (centerX - transform.x) / transform.scale
    const canvasY = (centerY - transform.y) / transform.scale

    const targetTransform = applyBounds({
      x: centerX - canvasX * newScale,
      y: centerY - canvasY * newScale,
      scale: newScale
    })
    
    animateToTransform(targetTransform, 150)
  }, [transform, viewportWidth, viewportHeight, isAnimating, animateToTransform, zoomThresholds, applyBounds])

  const resetView = useCallback(() => {
    // Always center the canvas at minimum zoom
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    const canvasCenterX = canvasWidth / 2
    const canvasCenterY = canvasHeight / 2
    
    const targetTransform = applyBounds({
      x: centerX - canvasCenterX * zoomThresholds.min, 
      y: centerY - canvasCenterY * zoomThresholds.min, 
      scale: zoomThresholds.min 
    })
    
    // Use smooth animation for reset
    animateToTransform(targetTransform, 300)
  }, [viewportWidth, viewportHeight, canvasWidth, canvasHeight, animateToTransform, zoomThresholds, applyBounds])

  // Focus on a specific point in canvas coordinates
  const focusOnPoint = useCallback((x: number, y: number) => {
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2

    const targetTransform = applyBounds({
      x: centerX - x * transform.scale,
      y: centerY - y * transform.scale,
      scale: transform.scale
    })

    setTransform(targetTransform)
    onTransformChange?.(targetTransform)
  }, [transform.scale, viewportWidth, viewportHeight, applyBounds, onTransformChange])

  // Focus on a specific area with custom zoom level
  const focusOnArea = useCallback((x: number, y: number, zoomLevel: number) => {
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2

    const targetTransform = applyBounds({
      x: centerX - x * zoomLevel,
      y: centerY - y * zoomLevel,
      scale: zoomLevel
    })
    
    animateToTransform(targetTransform, 250)
  }, [viewportWidth, viewportHeight, applyBounds, animateToTransform])

  // Check if a point is in viewport
  const isPointInViewport = useCallback((x: number, y: number, radius: number = 0) => {
    const viewportLeft = -transform.x / transform.scale
    const viewportTop = -transform.y / transform.scale
    const viewportRight = viewportLeft + viewportWidth / transform.scale
    const viewportBottom = viewportTop + viewportHeight / transform.scale

    const pointLeft = x - radius
    const pointRight = x + radius
    const pointTop = y - radius
    const pointBottom = y + radius

    return !(pointRight < viewportLeft || pointLeft > viewportRight || 
             pointBottom < viewportTop || pointTop > viewportBottom)
  }, [transform, viewportWidth, viewportHeight])

  // Check if an area covers a percentage of the viewport
  const isAreaInFocus = useCallback((x: number, y: number, radius: number, threshold: number = 0.8) => {
    const viewportLeft = -transform.x / transform.scale
    const viewportTop = -transform.y / transform.scale
    const viewportRight = viewportLeft + viewportWidth / transform.scale
    const viewportBottom = viewportTop + viewportHeight / transform.scale

    const areaLeft = x - radius
    const areaRight = x + radius
    const areaTop = y - radius
    const areaBottom = y + radius

    // Check if area covers threshold percentage of viewport
    const viewportArea = (viewportRight - viewportLeft) * (viewportBottom - viewportTop)
    const areaArea = (areaRight - areaLeft) * (areaBottom - areaTop)
    
    return areaArea / viewportArea >= threshold
  }, [transform, viewportWidth, viewportHeight])

  return {
    containerRef,
    transform,
    isDragging,
    isAnimating,
    lastMousePosition,
    // Animation and interaction
    animateToTransform,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint,
    focusOnArea,
    isPointInViewport,
    isAreaInFocus,
    // Utility functions
    applyBounds
  }
}
