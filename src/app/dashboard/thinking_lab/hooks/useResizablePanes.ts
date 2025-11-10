import { useState, useCallback, useEffect, useRef } from 'react'

interface UseResizablePanesResult {
  state: {
    splitRatio: number
    isDragging: boolean 
    isSnapping: boolean
  }
  actions: {
    snapToLeft: () => void
    snapToSplit: () => void
    snapToRight: () => void
    startDrag: (e: React.MouseEvent) => void
    setSplitRatio: (ratio: number) => void
    setPreferredRatio: (ratio: number) => void
  }
  styles: {
    leftPanelStyle: React.CSSProperties
    rightPanelStyle: React.CSSProperties
    dividerStyle: React.CSSProperties
  }
  containerRef: React.RefObject<HTMLDivElement>
}

export function useResizablePanes(initialRatio = 0.5): UseResizablePanesResult {
  // Start with initialRatio to avoid hydration mismatch, then hydrate from localStorage
  const [splitRatio, setSplitRatio] = useState(initialRatio)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const dragStartX = useRef<number>(0)
  const dragStartRatio = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const preferredRatio = useRef<number>(initialRatio)
  const hasHydrated = useRef(false)

  // Hydrate from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (hasHydrated.current) return
    hasHydrated.current = true
    
    try {
      const stored = localStorage.getItem('thinking-lab-split-ratio')
      if (stored) {
        const storedRatio = parseFloat(stored)
        // Only use stored ratio if it's valid and not hiding the notepad
        // Ensure notepad is always visible by default (splitRatio < 1.0)
        if (!isNaN(storedRatio) && storedRatio >= 0 && storedRatio < 1.0) {
          setSplitRatio(storedRatio)
          preferredRatio.current = storedRatio
        } else {
          // If stored ratio would hide notepad, use initialRatio instead
          setSplitRatio(initialRatio)
          preferredRatio.current = initialRatio
          // Clear the problematic stored value
          try {
            localStorage.removeItem('thinking-lab-split-ratio')
          } catch {
            // Ignore localStorage errors
          }
        }
      }
    } catch {
      // Ignore localStorage errors, keep initialRatio
    }
  }, [initialRatio])

  // Helper function to persist ratio
  const persistRatio = useCallback((ratio: number) => {
    try {
      localStorage.setItem('thinking-lab-split-ratio', ratio.toString())
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Snap functions
  const snapToLeft = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(1.0) // Full left panel (100% width)
    persistRatio(1.0)
    setTimeout(() => setIsSnapping(false), 300)
  }, [persistRatio])

  const snapToSplit = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(preferredRatio.current) // Use preferred ratio instead of 50/50
    persistRatio(preferredRatio.current)
    setTimeout(() => setIsSnapping(false), 300)
  }, [persistRatio])

  const snapToRight = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(0.0) // Full right panel (100% width)
    persistRatio(0.0)
    setTimeout(() => setIsSnapping(false), 300)
  }, [persistRatio])

  // Set preferred ratio function
  const setPreferredRatio = useCallback((ratio: number) => {
    preferredRatio.current = ratio
  }, [])

  // Drag handling - use refs to avoid stale closures
  const handleDragRef = useRef<(e: MouseEvent) => void>()
  const endDragRef = useRef<() => void>()

  const handleDrag = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const deltaX = e.clientX - dragStartX.current
    const deltaRatio = deltaX / containerRect.width
    
    let newRatio = dragStartRatio.current + deltaRatio
    newRatio = Math.max(0.0, Math.min(1.0, newRatio)) // Allow full range 0% to 100%
    
    setSplitRatio(newRatio)
  }, [])

  const endDrag = useCallback(() => {
    setIsDragging(false)
    // Save the current ratio as preferred when user finishes dragging
    const currentRatio = dragStartRatio.current + 
      (typeof window !== 'undefined' ? 
        ((window.event as MouseEvent)?.clientX - dragStartX.current) / 
        (containerRef.current?.getBoundingClientRect().width || 1) 
        : 0)
    const finalRatio = Math.max(0.0, Math.min(1.0, currentRatio))
    preferredRatio.current = finalRatio
    // Persist ratio to localStorage for chat reopen functionality
    persistRatio(finalRatio)
    document.removeEventListener('mousemove', handleDragRef.current!)
    document.removeEventListener('mouseup', endDragRef.current!)
  }, [persistRatio])

  // Update refs when functions change
  useEffect(() => {
    handleDragRef.current = handleDrag
    endDragRef.current = endDrag
  }, [handleDrag, endDrag])

  // Drag handling
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartRatio.current = splitRatio
    
    // Add global mouse move/up listeners using refs
    document.addEventListener('mousemove', handleDragRef.current!)
    document.addEventListener('mouseup', endDragRef.current!)
  }, [splitRatio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (handleDragRef.current) {
        document.removeEventListener('mousemove', handleDragRef.current)
      }
      if (endDragRef.current) {
        document.removeEventListener('mouseup', endDragRef.current)
      }
    }
  }, [])

  // Calculate panel styles
  const leftPanelStyle = {
    width: splitRatio === 1 ? 'calc(100% - 200px)' : `${splitRatio * 100}%`, // Account for right panel minWidth when full screen
    minWidth: splitRatio === 0 ? '0' : '200px',
    display: splitRatio === 0 ? 'none' : 'flex',
    transition: isSnapping ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
  }

  const rightPanelStyle = {
    width: splitRatio === 1 ? '200px' : `${(1 - splitRatio) * 100}%`, // Fixed 200px when chat is full screen
    minWidth: '200px', // Always minimum 200px to show tabs
    display: 'flex', // Always visible, never hidden
    transition: isSnapping ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
  }

  // Subtle divider - visible but not prominent
  const dividerStyle = {
    cursor: 'col-resize',
    backgroundColor: isDragging ? 'hsl(var(--border))' : 'transparent'
  }

  return {
    state: { splitRatio, isDragging, isSnapping },
    actions: { snapToLeft, snapToSplit, snapToRight, startDrag, setSplitRatio, setPreferredRatio },
    styles: { leftPanelStyle, rightPanelStyle, dividerStyle },
    containerRef
  }
}