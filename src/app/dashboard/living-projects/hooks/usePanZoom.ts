'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface PanZoomState {
  x: number
  y: number
  scale: number
}

interface UsePanZoomReturn {
  transform: PanZoomState
  containerRef: React.RefObject<HTMLDivElement>
  handleWheel: (e: React.WheelEvent) => void
  handleMouseDown: (e: React.MouseEvent) => void
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  focusOnPoint: (x: number, y: number) => void
}

const MIN_SCALE = 0.2
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.1
const MOMENTUM_DECAY = 0.92
const MOMENTUM_THRESHOLD = 0.3

export function usePanZoom(
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number = window.innerWidth,
  viewportHeight: number = window.innerHeight
): UsePanZoomReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [transform, setTransform] = useState<PanZoomState>({
    x: 0,
    y: 0,
    scale: 1 // Will be set properly on initialization
  })

  // Initialize view to center the constellation
  useEffect(() => {
    if (!isInitialized && canvasWidth > 0 && canvasHeight > 0) {
      const targetScale = Math.min(
        (viewportWidth * 0.8) / canvasWidth,
        (viewportHeight * 0.8) / canvasHeight
      )
      const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale))
      
      // Center the canvas in the viewport
      const offsetX = (viewportWidth - canvasWidth * clampedScale) / 2
      const offsetY = (viewportHeight - canvasHeight * clampedScale) / 2
      
      setTransform({
        x: offsetX,
        y: offsetY,
        scale: clampedScale
      })
      setIsInitialized(true)
    }
  }, [canvasWidth, canvasHeight, viewportWidth, viewportHeight, isInitialized])

  // Animation frame refs for momentum
  const momentumRef = useRef<number>()
  const velocityRef = useRef({ x: 0, y: 0 })
  const lastPanRef = useRef({ x: 0, y: 0, time: 0 })
  const isDraggingRef = useRef(false)

  // Clamp transform values to valid bounds (Google Maps style)
  const clampTransform = useCallback((newTransform: PanZoomState): PanZoomState => {
    const { x, y, scale } = newTransform
    
    // Clamp scale first
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    
    // Calculate the scaled canvas dimensions
    const scaledCanvasWidth = canvasWidth * clampedScale
    const scaledCanvasHeight = canvasHeight * clampedScale
    
    // Calculate bounds - allow panning beyond edges like Google Maps
    // But prevent going too far out
    const maxPanX = scaledCanvasWidth * 0.5 + viewportWidth * 0.5
    const maxPanY = scaledCanvasHeight * 0.5 + viewportHeight * 0.5
    const minPanX = -maxPanX
    const minPanY = -maxPanY
    
    return {
      x: Math.max(minPanX, Math.min(maxPanX, x)),
      y: Math.max(minPanY, Math.min(maxPanY, y)),
      scale: clampedScale
    }
  }, [canvasWidth, canvasHeight, viewportWidth, viewportHeight])

  // Apply momentum animation
  const applyMomentum = useCallback(() => {
    if (isDraggingRef.current) return

    const velocity = velocityRef.current
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y)
    
    if (speed < MOMENTUM_THRESHOLD) {
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current)
        momentumRef.current = undefined
      }
      return
    }

    setTransform(prev => {
      const newTransform = clampTransform({
        ...prev,
        x: prev.x + velocity.x,
        y: prev.y + velocity.y
      })
      return newTransform
    })

    // Apply decay
    velocity.x *= MOMENTUM_DECAY
    velocity.y *= MOMENTUM_DECAY

    momentumRef.current = requestAnimationFrame(applyMomentum)
  }, [clampTransform])

  // Handle wheel zoom (Google Maps style)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    setTransform(prev => {
      // Calculate the point in the canvas coordinate system that the mouse is over
      const pointX = (mouseX - prev.x) / prev.scale
      const pointY = (mouseY - prev.y) / prev.scale

      // Calculate zoom factor - more sensitive and smooth like Google Maps
      const zoomDirection = e.deltaY > 0 ? -1 : 1
      const zoomIntensity = 0.1
      const scaleFactor = 1 + (zoomDirection * zoomIntensity)
      
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * scaleFactor))
      
      // If scale didn't change (hit limits), don't update position
      if (newScale === prev.scale) {
        return prev
      }

      // Calculate new position so that the point under the mouse stays in the same place
      const newX = mouseX - pointX * newScale
      const newY = mouseY - pointY * newScale

      return clampTransform({
        x: newX,
        y: newY,
        scale: newScale
      })
    })
  }, [clampTransform])

  // Handle mouse down for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDraggingRef.current = true
    
    // Stop momentum
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current)
      momentumRef.current = undefined
    }
    
    velocityRef.current = { x: 0, y: 0 }
    lastPanRef.current = { x: e.clientX, y: e.clientY, time: Date.now() }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - lastPanRef.current.x
      const deltaY = moveEvent.clientY - lastPanRef.current.y
      const deltaTime = Date.now() - lastPanRef.current.time

      // Update velocity for momentum
      if (deltaTime > 0) {
        velocityRef.current = {
          x: deltaX / deltaTime * 16, // Convert to per-frame velocity
          y: deltaY / deltaTime * 16
        }
      }

      setTransform(prev => clampTransform({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))

      lastPanRef.current = { 
        x: moveEvent.clientX, 
        y: moveEvent.clientY, 
        time: Date.now() 
      }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      
      // Start momentum if velocity is significant
      const speed = Math.sqrt(
        velocityRef.current.x * velocityRef.current.x + 
        velocityRef.current.y * velocityRef.current.y
      )
      
      if (speed > MOMENTUM_THRESHOLD) {
        applyMomentum()
      }

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [clampTransform, applyMomentum])

  // Zoom controls - centered on viewport
  const zoomIn = useCallback(() => {
    setTransform(prev => {
      const centerX = viewportWidth / 2
      const centerY = viewportHeight / 2
      
      // Calculate zoom center relative to current transform
      const zoomCenterX = (centerX - prev.x) / prev.scale
      const zoomCenterY = (centerY - prev.y) / prev.scale
      
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (1 + ZOOM_STEP)))
      
      // Calculate new position to keep center fixed
      const newX = centerX - zoomCenterX * newScale
      const newY = centerY - zoomCenterY * newScale
      
      return clampTransform({
        x: newX,
        y: newY,
        scale: newScale
      })
    })
  }, [clampTransform, viewportWidth, viewportHeight])

  const zoomOut = useCallback(() => {
    setTransform(prev => {
      const centerX = viewportWidth / 2
      const centerY = viewportHeight / 2
      
      // Calculate zoom center relative to current transform
      const zoomCenterX = (centerX - prev.x) / prev.scale
      const zoomCenterY = (centerY - prev.y) / prev.scale
      
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * (1 - ZOOM_STEP)))
      
      // Calculate new position to keep center fixed
      const newX = centerX - zoomCenterX * newScale
      const newY = centerY - zoomCenterY * newScale
      
      return clampTransform({
        x: newX,
        y: newY,
        scale: newScale
      })
    })
  }, [clampTransform, viewportWidth, viewportHeight])

  // Reset view to show entire constellation centered
  const resetView = useCallback(() => {
    const targetScale = Math.min(
      (viewportWidth * 0.8) / canvasWidth,
      (viewportHeight * 0.8) / canvasHeight
    )
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale))
    
    // Center the canvas in the viewport
    const offsetX = (viewportWidth - canvasWidth * clampedScale) / 2
    const offsetY = (viewportHeight - canvasHeight * clampedScale) / 2

    setTransform({
      x: offsetX,
      y: offsetY,
      scale: clampedScale
    })
  }, [canvasWidth, canvasHeight, viewportWidth, viewportHeight])

  // Focus on a specific point
  const focusOnPoint = useCallback((x: number, y: number) => {
    const targetScale = Math.min(1.5, MAX_SCALE)
    const newX = viewportWidth / 2 - x * targetScale
    const newY = viewportHeight / 2 - y * targetScale

    setTransform(clampTransform({
      x: newX,
      y: newY,
      scale: targetScale
    }))
  }, [viewportWidth, viewportHeight, clampTransform])

  // Handle touch events for mobile
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let lastTouchDistance = 0
    let lastTouchCenter = { x: 0, y: 0 }

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      
      if (e.touches.length === 2) {
        // Pinch zoom start
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        
        lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        lastTouchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        }
      } else if (e.touches.length === 1) {
        // Single touch pan
        const touch = e.touches[0]
        isDraggingRef.current = true
        lastPanRef.current = { 
          x: touch.clientX, 
          y: touch.clientY, 
          time: Date.now() 
        }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      
      if (e.touches.length === 2) {
        // Pinch zoom
        const touch1 = e.touches[0]
        const touch2 = e.touches[1]
        
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        )
        
        const currentCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        }
        
        if (lastTouchDistance > 0) {
          const zoomFactor = currentDistance / lastTouchDistance
          const rect = container.getBoundingClientRect()
          
          setTransform(prev => {
            const zoomCenterX = (currentCenter.x - rect.left - prev.x) / prev.scale
            const zoomCenterY = (currentCenter.y - rect.top - prev.y) / prev.scale
            
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * zoomFactor))
            const newX = currentCenter.x - rect.left - zoomCenterX * newScale
            const newY = currentCenter.y - rect.top - zoomCenterY * newScale
            
            return clampTransform({
              x: newX,
              y: newY,
              scale: newScale
            })
          })
        }
        
        lastTouchDistance = currentDistance
        lastTouchCenter = currentCenter
      } else if (e.touches.length === 1 && isDraggingRef.current) {
        // Single touch pan
        const touch = e.touches[0]
        const deltaX = touch.clientX - lastPanRef.current.x
        const deltaY = touch.clientY - lastPanRef.current.y
        
        setTransform(prev => clampTransform({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }))
        
        lastPanRef.current = { 
          x: touch.clientX, 
          y: touch.clientY, 
          time: Date.now() 
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isDraggingRef.current = false
        lastTouchDistance = 0
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [clampTransform])

  // Cleanup momentum on unmount
  useEffect(() => {
    return () => {
      if (momentumRef.current) {
        cancelAnimationFrame(momentumRef.current)
      }
    }
  }, [])

  return {
    transform,
    containerRef,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint
  }
}
