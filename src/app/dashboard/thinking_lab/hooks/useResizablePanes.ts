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
  const [splitRatio, setSplitRatio] = useState(initialRatio)
  const [isDragging, setIsDragging] = useState(false)
  const [isSnapping, setIsSnapping] = useState(false)
  const dragStartX = useRef<number>(0)
  const dragStartRatio = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const preferredRatio = useRef<number>(initialRatio)

  // Snap functions
  const snapToLeft = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(1.0) // Full left panel (100% width)
    setTimeout(() => setIsSnapping(false), 300)
  }, [])

  const snapToSplit = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(preferredRatio.current) // Use preferred ratio instead of 50/50
    setTimeout(() => setIsSnapping(false), 300)
  }, [])

  const snapToRight = useCallback(() => {
    setIsSnapping(true)
    setSplitRatio(0.0) // Full right panel (100% width)
    setTimeout(() => setIsSnapping(false), 300)
  }, [])

  // Set preferred ratio function
  const setPreferredRatio = useCallback((ratio: number) => {
    preferredRatio.current = ratio
  }, [])

  // Drag handling
  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartRatio.current = splitRatio
    
    // Add global mouse move/up listeners
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', endDrag)
  }, [splitRatio])

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
    preferredRatio.current = splitRatio
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', endDrag)
  }, [handleDrag, splitRatio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', endDrag)
    }
  }, [handleDrag, endDrag])

  // Calculate panel styles
  const leftPanelStyle = {
    width: `${splitRatio * 100}%`,
    minWidth: splitRatio === 0 ? '0' : '200px',
    display: splitRatio === 0 ? 'none' : 'flex',
    transition: isSnapping ? 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
  }

  const rightPanelStyle = {
    width: `${(1 - splitRatio) * 100}%`,
    minWidth: splitRatio === 1 ? '0' : '200px',
    display: splitRatio === 1 ? 'none' : 'block',
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