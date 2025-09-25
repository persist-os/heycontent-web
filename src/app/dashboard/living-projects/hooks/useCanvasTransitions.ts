import { useState, useRef, useCallback, useEffect } from 'react'
import { ViewMode, TransformState } from './useSharedPanZoom'

export type TransitionState = 'idle' | 'transitioning' | 'completing'
export type TransitionType = 'zoom-to-overview' | 'zoom-to-project' | 'focus-project' | 'reset-view'

interface TransitionConfig {
  duration: number
  easing: (t: number) => number
  onStart?: () => void
  onComplete?: () => void
  onProgress?: (progress: number) => void
}

interface ZoomOutAttempt {
  timestamp: number
  scale: number
  attempts: number
}

interface CanvasTransitionOptions {
  // Thresholds
  zoomOutToOverviewThreshold: number
  maxZoomOutAttempts: number
  zoomOutAttemptWindow: number // milliseconds
  
  // Animation settings
  transitionDuration: number
  resetTransitionDuration: number
  
  // Callbacks
  onModeChange?: (mode: ViewMode) => void
  onTransitionStart?: (type: TransitionType) => void
  onTransitionComplete?: (type: TransitionType) => void
  onZoomOutAttempt?: (attempts: number, remaining: number) => void
}

const DEFAULT_CONFIG: CanvasTransitionOptions = {
  zoomOutToOverviewThreshold: 0.1,
  maxZoomOutAttempts: 3,
  zoomOutAttemptWindow: 2000, // 2 seconds
  transitionDuration: 300,
  resetTransitionDuration: 500,
}

// Easing functions
const easingFunctions = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
}

export function useCanvasTransitions(options: Partial<CanvasTransitionOptions> = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  
  // Transition state
  const [transitionState, setTransitionState] = useState<TransitionState>('idle')
  const [currentTransition, setCurrentTransition] = useState<TransitionType | null>(null)
  const [transitionProgress, setTransitionProgress] = useState(0)
  
  // Zoom-out attempt tracking
  const zoomOutAttemptsRef = useRef<ZoomOutAttempt[]>([])
  const animationRef = useRef<number | null>(null)
  const transitionStartTimeRef = useRef<number>(0)
  
  // Clean up old zoom-out attempts
  const cleanOldAttempts = useCallback(() => {
    const now = Date.now()
    zoomOutAttemptsRef.current = zoomOutAttemptsRef.current.filter(
      attempt => now - attempt.timestamp < config.zoomOutAttemptWindow
    )
  }, [config.zoomOutAttemptWindow])
  
  // Track zoom-out attempts
  const trackZoomOutAttempt = useCallback((scale: number) => {
    cleanOldAttempts()
    
    const now = Date.now()
    const attempts = zoomOutAttemptsRef.current.length + 1
    
    zoomOutAttemptsRef.current.push({
      timestamp: now,
      scale,
      attempts
    })
    
    const remaining = config.maxZoomOutAttempts - attempts
    config.onZoomOutAttempt?.(attempts, remaining)
    
    return { attempts, remaining }
  }, [config, cleanOldAttempts])
  
  // Check if we should trigger zoom-out-to-overview transition
  const shouldTriggerZoomOutToOverview = useCallback((scale: number) => {
    if (scale > config.zoomOutToOverviewThreshold) return false
    
    const { attempts, remaining } = trackZoomOutAttempt(scale)
    return attempts >= config.maxZoomOutAttempts
  }, [config, trackZoomOutAttempt])
  
  // Smooth animation function with custom easing
  const animateTransition = useCallback((
    startTransform: TransformState,
    targetTransform: TransformState,
    transitionConfig: TransitionConfig
  ) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    setTransitionState('transitioning')
    setCurrentTransition('zoom-to-overview') // Default, will be overridden
    transitionStartTimeRef.current = performance.now()
    transitionConfig.onStart?.()
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - transitionStartTimeRef.current
      const progress = Math.min(elapsed / transitionConfig.duration, 1)
      
      // Apply easing function
      const easedProgress = transitionConfig.easing(progress)
      setTransitionProgress(easedProgress)
      transitionConfig.onProgress?.(easedProgress)
      
      // Interpolate transform values
      const newTransform = {
        x: startTransform.x + (targetTransform.x - startTransform.x) * easedProgress,
        y: startTransform.y + (targetTransform.y - startTransform.y) * easedProgress,
        scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * easedProgress
      }
      
      // Update transform (this would be passed to the pan/zoom hook)
      // The actual transform update will be handled by the parent component
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setTransitionState('completing')
        setTransitionProgress(1)
        transitionConfig.onComplete?.()
        
        // Complete transition after a brief delay
        setTimeout(() => {
          setTransitionState('idle')
          setCurrentTransition(null)
          setTransitionProgress(0)
          animationRef.current = null
        }, 50)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [])
  
  // Transition to overview mode with zoom-out animation
  const transitionToOverview = useCallback((
    startTransform: TransformState,
    targetTransform: TransformState,
    onTransformUpdate: (transform: TransformState) => void
  ) => {
    setCurrentTransition('zoom-to-overview')
    
    const transitionConfig: TransitionConfig = {
      duration: config.transitionDuration,
      easing: easingFunctions.easeOutCubic,
      onStart: () => {
        config.onTransitionStart?.('zoom-to-overview')
        config.onModeChange?.('overview')
      },
      onComplete: () => {
        config.onTransitionComplete?.('zoom-to-overview')
        // Clear zoom-out attempts after successful transition
        zoomOutAttemptsRef.current = []
      },
      onProgress: (progress) => {
        const newTransform = {
          x: startTransform.x + (targetTransform.x - startTransform.x) * progress,
          y: startTransform.y + (targetTransform.y - startTransform.y) * progress,
          scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * progress
        }
        onTransformUpdate(newTransform)
      }
    }
    
    animateTransition(startTransform, targetTransform, transitionConfig)
  }, [config, animateTransition])
  
  // Transition to project detail mode with zoom-in animation
  const transitionToProjectDetail = useCallback((
    startTransform: TransformState,
    targetTransform: TransformState,
    onTransformUpdate: (transform: TransformState) => void
  ) => {
    setCurrentTransition('zoom-to-project')
    
    const transitionConfig: TransitionConfig = {
      duration: config.transitionDuration,
      easing: easingFunctions.easeOutExpo,
      onStart: () => {
        config.onTransitionStart?.('zoom-to-project')
        config.onModeChange?.('project-detail')
      },
      onComplete: () => {
        config.onTransitionComplete?.('zoom-to-project')
      },
      onProgress: (progress) => {
        const newTransform = {
          x: startTransform.x + (targetTransform.x - startTransform.x) * progress,
          y: startTransform.y + (targetTransform.y - startTransform.y) * progress,
          scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * progress
        }
        onTransformUpdate(newTransform)
      }
    }
    
    animateTransition(startTransform, targetTransform, transitionConfig)
  }, [config, animateTransition])
  
  // Focus on project with smooth animation
  const focusOnProject = useCallback((
    startTransform: TransformState,
    targetTransform: TransformState,
    onTransformUpdate: (transform: TransformState) => void
  ) => {
    setCurrentTransition('focus-project')
    
    const transitionConfig: TransitionConfig = {
      duration: config.transitionDuration,
      easing: easingFunctions.easeInOutCubic,
      onStart: () => {
        config.onTransitionStart?.('focus-project')
      },
      onComplete: () => {
        config.onTransitionComplete?.('focus-project')
      },
      onProgress: (progress) => {
        const newTransform = {
          x: startTransform.x + (targetTransform.x - startTransform.x) * progress,
          y: startTransform.y + (targetTransform.y - startTransform.y) * progress,
          scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * progress
        }
        onTransformUpdate(newTransform)
      }
    }
    
    animateTransition(startTransform, targetTransform, transitionConfig)
  }, [config, animateTransition])
  
  // Reset view with smooth animation
  const resetView = useCallback((
    startTransform: TransformState,
    targetTransform: TransformState,
    onTransformUpdate: (transform: TransformState) => void
  ) => {
    setCurrentTransition('reset-view')
    
    const transitionConfig: TransitionConfig = {
      duration: config.resetTransitionDuration,
      easing: easingFunctions.easeOutQuart,
      onStart: () => {
        config.onTransitionStart?.('reset-view')
        config.onModeChange?.('overview')
        // Clear zoom-out attempts on reset
        zoomOutAttemptsRef.current = []
      },
      onComplete: () => {
        config.onTransitionComplete?.('reset-view')
      },
      onProgress: (progress) => {
        const newTransform = {
          x: startTransform.x + (targetTransform.x - startTransform.x) * progress,
          y: startTransform.y + (targetTransform.y - startTransform.y) * progress,
          scale: startTransform.scale + (targetTransform.scale - startTransform.scale) * progress
        }
        onTransformUpdate(newTransform)
      }
    }
    
    animateTransition(startTransform, targetTransform, transitionConfig)
  }, [config, animateTransition])
  
  // Cancel current transition
  const cancelTransition = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    
    setTransitionState('idle')
    setCurrentTransition(null)
    setTransitionProgress(0)
  }, [])
  
  // Check if transition is in progress
  const isTransitioning = transitionState !== 'idle'
  
  // Get current zoom-out attempt count
  const getZoomOutAttempts = useCallback(() => {
    cleanOldAttempts()
    return zoomOutAttemptsRef.current.length
  }, [cleanOldAttempts])
  
  // Get remaining zoom-out attempts
  const getRemainingZoomOutAttempts = useCallback(() => {
    const attempts = getZoomOutAttempts()
    return Math.max(0, config.maxZoomOutAttempts - attempts)
  }, [getZoomOutAttempts, config.maxZoomOutAttempts])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])
  
  return {
    // State
    transitionState,
    currentTransition,
    transitionProgress,
    isTransitioning,
    
    // Zoom-out tracking
    shouldTriggerZoomOutToOverview,
    getZoomOutAttempts,
    getRemainingZoomOutAttempts,
    
    // Transition functions
    transitionToOverview,
    transitionToProjectDetail,
    focusOnProject,
    resetView,
    cancelTransition,
    
    // Configuration
    config
  }
}
