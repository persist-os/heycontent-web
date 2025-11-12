import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface SelectionRect {
  top: number
  left: number
  width: number
  height: number
  viewportTop: number
  viewportLeft: number
}

export interface UseTextSelectionState {
  showQuoteButton: boolean
  selectedText: string
  selectionRect: SelectionRect | null
  highlightRects: DOMRect[]
  hasError: boolean
  errorMessage?: string
}

export interface UseTextSelectionHandlers {
  setShowQuoteButton: (show: boolean) => void
  setSelectedText: (text: string) => void
  setSelectionRect: (rect: SelectionRect | null) => void
  setHighlightRects: (rects: DOMRect[]) => void
  clearSelection: () => void
  resetError: () => void
  announceToScreenReader: (message: string) => void
}

export interface UseTextSelectionOptions {
  messageId: string
  selectionId: string
  addActiveSelection: (id: string) => void
  removeActiveSelection: (id: string) => void
  debouncedUpdatePositions: (callback: () => void, timer: { current: NodeJS.Timeout | null }) => void
  isRangeValid: (range: Range | null) => boolean
  enableAccessibilityAnnouncements?: boolean
}

/**
 * Custom hook for managing text selection within message bubbles
 * Handles mouse/touch selection, highlighting, positioning, and cleanup
 */
export function useTextSelection(options: UseTextSelectionOptions) {
  const {
    messageId,
    selectionId,
    addActiveSelection,
    removeActiveSelection,
    debouncedUpdatePositions,
    isRangeValid,
    enableAccessibilityAnnouncements = true
  } = options

  // Stable refs for callback props to prevent unnecessary re-renders
  const addActiveSelectionRef = useRef(addActiveSelection)
  const removeActiveSelectionRef = useRef(removeActiveSelection)
  const debouncedUpdatePositionsRef = useRef(debouncedUpdatePositions)
  const isRangeValidRef = useRef(isRangeValid)

  // Update refs when props change
  useEffect(() => {
    addActiveSelectionRef.current = addActiveSelection
  }, [addActiveSelection])

  useEffect(() => {
    removeActiveSelectionRef.current = removeActiveSelection
  }, [removeActiveSelection])

  useEffect(() => {
    debouncedUpdatePositionsRef.current = debouncedUpdatePositions
  }, [debouncedUpdatePositions])

  useEffect(() => {
    isRangeValidRef.current = isRangeValid
  }, [isRangeValid])

  // State management
  const [showQuoteButton, setShowQuoteButton] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([])
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>()

  // Internal refs for persistent state
  const persistentRangeRef = useRef<Range | null>(null)
  const positionUpdateTimerRef = useRef<NodeJS.Timeout | null>(null)
  const clearSelectionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isCopyInProgressRef = useRef(false)
  const lastValidRectRef = useRef<DOMRect | null>(null)
  const lastValidRectsRef = useRef<DOMRect[]>([])
  
  // Accessibility helper: Create or update live region for screen reader announcements
  const announcementRef = useRef<HTMLDivElement | null>(null)
  
  const announceToScreenReader = useCallback((message: string) => {
    if (!enableAccessibilityAnnouncements) return
    
    if (!announcementRef.current) {
      // Create live region if it doesn't exist
      announcementRef.current = document.createElement('div')
      announcementRef.current.setAttribute('aria-live', 'polite')
      announcementRef.current.setAttribute('aria-atomic', 'true')
      announcementRef.current.setAttribute('class', 'sr-only')
      announcementRef.current.style.position = 'absolute'
      announcementRef.current.style.left = '-10000px'
      announcementRef.current.style.width = '1px'
      announcementRef.current.style.height = '1px'
      announcementRef.current.style.overflow = 'hidden'
      document.body.appendChild(announcementRef.current)
    }
    
    // Update announcement text
    announcementRef.current.textContent = message
    
    // Clear after announcement to allow re-announcements
    setTimeout(() => {
      if (announcementRef.current) {
        announcementRef.current.textContent = ''
      }
    }, 1000)
  }, [enableAccessibilityAnnouncements])
  
  // Cleanup live region on unmount
  useEffect(() => {
    return () => {
      // Defensive cleanup: check if node exists and is still a child before removal
      const node = announcementRef.current
      if (node && node.parentNode === document.body) {
        try {
          document.body.removeChild(node)
          // Clear ref after successful removal to prevent double-removal attempts
          announcementRef.current = null
        } catch (error) {
          // Silently handle removal errors (node may have been removed by another cleanup)
          // This prevents React Strict Mode double-unmount from causing errors
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useTextSelection] Cleanup warning:', error)
          }
          // Clear ref even if removal failed (node is gone)
          announcementRef.current = null
        }
      } else if (node) {
        // Node exists but isn't a child - clear ref anyway
        announcementRef.current = null
      }
    }
  }, [])

  // Error handling functions
  const handleError = useCallback((error: Error, context: string) => {
    console.warn(`Text selection error in ${context}:`, error)
    setHasError(true)
    setErrorMessage(`Text selection failed: ${error.message}`)
    
    // Clear any active selection state to prevent inconsistency
    setShowQuoteButton(false)
    setHighlightRects([])
    setSelectedText('')
    setSelectionRect(null)
    persistentRangeRef.current = null
    
    // Don't fail completely - just log and continue
    if (process.env.NODE_ENV === 'development') {
      console.error('Text Selection Error Details:', {
        context,
        error,
        messageId,
        selectionId,
        stack: error.stack
      })
    }
  }, [messageId, selectionId])

  const resetError = useCallback(() => {
    setHasError(false)
    setErrorMessage(undefined)
  }, [])

  const clearSelection = useCallback(() => {
    try {
      const wasShowingButton = showQuoteButton
      
      setShowQuoteButton(false)
      setHighlightRects([])
      setSelectedText('')
      setSelectionRect(null)
      persistentRangeRef.current = null
      removeActiveSelectionRef.current(selectionId)
      
      // Clear cached positions
      lastValidRectRef.current = null
      lastValidRectsRef.current = []
      
      if (positionUpdateTimerRef.current) {
        clearTimeout(positionUpdateTimerRef.current)
        positionUpdateTimerRef.current = null
      }
      
      // Announce clearance only if there was an active selection
      if (wasShowingButton && enableAccessibilityAnnouncements) {
        announceToScreenReader('Text selection cleared')
      }
    } catch (error) {
      handleError(error as Error, 'clearSelection')
    }
  }, [selectionId, showQuoteButton, enableAccessibilityAnnouncements, announceToScreenReader, handleError])

  const updateHighlightPositions = useCallback(() => {
    if (!showQuoteButton || hasError) return
    
    try {
      // Validate the range before proceeding
      if (!isRangeValidRef.current(persistentRangeRef.current)) {
        clearSelection()
        return
      }

      const rects = Array.from(persistentRangeRef.current!.getClientRects())
      if (rects.length === 0) {
        // Try to use cached rects if available and still reasonable
        if (lastValidRectsRef.current.length > 0 && lastValidRectRef.current) {
          // Only use cache if it's recent (avoid stale positions)
          setHighlightRects(lastValidRectsRef.current)
          setSelectionRect({
            top: lastValidRectRef.current.top,
            left: lastValidRectRef.current.left,
            width: lastValidRectRef.current.width,
            height: lastValidRectRef.current.height,
            viewportTop: lastValidRectRef.current.top,
            viewportLeft: lastValidRectRef.current.left
          })
        } else {
          // No valid cache, clear selection
          clearSelection()
        }
        return
      }
      
      const mainRect = rects[0]
      if (mainRect.width <= 0 || mainRect.height <= 0) {
        // Invalid dimensions, try cache or clear
        if (lastValidRectRef.current && lastValidRectRef.current.width > 0) {
          return // Keep using cache
        }
        clearSelection()
        return
      }

      // Cache valid rects for fallback
      lastValidRectRef.current = mainRect
      lastValidRectsRef.current = rects

      setSelectionRect({
        top: mainRect.top,
        left: mainRect.left,
        width: mainRect.width,
        height: mainRect.height,
        viewportTop: mainRect.top,
        viewportLeft: mainRect.left
      })
      setHighlightRects(rects)
    } catch (error) {
      handleError(error as Error, 'updateHighlightPositions')
    }
  }, [showQuoteButton, hasError, clearSelection, handleError])

  const handleSelectionEvent = useCallback((eventType: 'mouse' | 'touch' | 'selection') => {
    if (hasError) return // Don't process if in error state
    
    // Try immediately first, then with delay if that fails
    const processSelection = () => {
      try {
        const selection = window.getSelection()
        
        if (!selection || selection.rangeCount === 0) return
        
        const range = selection.getRangeAt(0)
        
        // Comprehensive validation of the selection
        if (!range || range.collapsed) return
        
        // Get text from the range directly, not from selection.toString() which can be unreliable
        let text: string
        try {
          text = range.toString().trim()
          
          // Fallback: if range.toString() fails, try cloning and extracting
          if (!text && range.startContainer && range.endContainer) {
            const clonedRange = range.cloneRange()
            const clonedContents = clonedRange.cloneContents()
            text = clonedContents.textContent?.trim() || ''
          }
          
          // Final fallback: try selection.toString()
          if (!text) {
            text = selection.toString().trim()
          }
        } catch (rangeError) {
          text = selection.toString().trim()
        }
        
        // Enhanced validation
        if (!text || text.length === 0 || text.length > 10000) return
        
        // Validate selection is within this message and makes sense
        const messageElement = document.getElementById(`message-${messageId}`)
        if (!messageElement) return
        
        const isInMessage = messageElement.contains(range.startContainer) && 
                           messageElement.contains(range.endContainer)
        
        if (!isInMessage) return
        
        // Check that the range is valid before proceeding
        if (!isRangeValidRef.current(range)) return

        // Clear any existing selection
        clearSelection()

        // Store the selection with validation
        try {
          persistentRangeRef.current = range.cloneRange()
          setSelectedText(text)
          setShowQuoteButton(true)
          addActiveSelectionRef.current(selectionId)
          updateHighlightPositions()
          
          // Announce selection to screen readers
          const wordCount = text.split(/\s+/).length
          announceToScreenReader(
            `Text selected: ${wordCount} word${wordCount !== 1 ? 's' : ''}. Quote button available. Press Tab to navigate to quote button, or press Escape to clear selection.`
          )

          // Schedule browser selection clearing, but allow cancellation for copy operations
          clearSelectionTimerRef.current = setTimeout(() => {
            if (!isCopyInProgressRef.current) {
              try {
                const currentSelection = window.getSelection()
                if (currentSelection && currentSelection.rangeCount > 0) {
                  currentSelection.removeAllRanges()
                }
              } catch (error) {
                // Ignore browser selection clearing errors - not critical
                console.warn('Browser selection clearing failed:', error)
              }
            }
          }, 100)
        } catch (error) {
          handleError(error as Error, `${eventType}SelectionCreation`)
        }
      } catch (error) {
        handleError(error as Error, `${eventType}SelectionHandler`)
      }
    }
    
    // Try immediately first
    processSelection()
    
    // If that didn't work, try again with delay (but not for selection events which are already delayed)
    if (eventType !== 'selection') {
      const delay = eventType === 'mouse' ? 50 : 100
      setTimeout(() => {
        if (!showQuoteButton) { // Only retry if we don't already have a selection
          processSelection()
        }
      }, delay)
    }
  }, [messageId, hasError, clearSelection, selectionId, updateHighlightPositions, handleError])

  const handleMouseUp = useCallback(() => {
    handleSelectionEvent('mouse')
  }, [handleSelectionEvent])

  const handleTouchEnd = useCallback(() => {
    handleSelectionEvent('touch')
  }, [handleSelectionEvent])

  // Add selection change handler for more reliable detection
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0)
      const messageElement = document.getElementById(`message-${messageId}`)
      
      // Only process if selection is within this message
      if (messageElement && messageElement.contains(range.startContainer) && messageElement.contains(range.endContainer)) {
        handleSelectionEvent('selection')
      }
    }
  }, [messageId, handleSelectionEvent])

  // Passive scroll handler with debouncing
  const handleScroll = useCallback(() => {
    if (persistentRangeRef.current && showQuoteButton) {
      debouncedUpdatePositionsRef.current(updateHighlightPositions, positionUpdateTimerRef)
    }
  }, [showQuoteButton, updateHighlightPositions])

  // Enhanced click outside detection with better target validation
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!showQuoteButton) return
    
    const target = event.target as Node
    const messageElement = document.getElementById(`message-${messageId}`)
    if (!target || !messageElement || !messageElement.contains(target)) {
      // Check if click is on quote button or any related UI
      const element = target as Element
      if (element?.closest && (
        element.closest('[data-quote-button]') ||
        element.closest('.quote-overlay') ||
        element.closest('[data-selection-ui]')
      )) {
        return
      }
      clearSelection()
    }
  }, [showQuoteButton, messageId, clearSelection])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && showQuoteButton) {
      clearSelection()
      announceToScreenReader('Text selection cleared')
      return
    }
    
    // Enhanced keyboard navigation support
    if (showQuoteButton && event.key === 'Tab') {
      // Let the browser handle Tab navigation to the quote button
      // The button is already focusable with tabIndex={0}
      return
    }
    
    // Copy detection and accessibility feedback
    if ((event.ctrlKey || event.metaKey) && event.key === 'c' && showQuoteButton) {
      isCopyInProgressRef.current = true
      announceToScreenReader('Selected text copied to clipboard')
      
      // Cancel any pending selection clearing
      if (clearSelectionTimerRef.current) {
        clearTimeout(clearSelectionTimerRef.current)
        clearSelectionTimerRef.current = null
      }
      // Reset copy flag after a brief delay
      setTimeout(() => {
        isCopyInProgressRef.current = false
      }, 200)
    }
    
    // Help shortcut for accessibility
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === '?') {
      if (showQuoteButton) {
        announceToScreenReader(
          'Text selection help: Press Escape to clear selection, Tab to navigate to quote button, Ctrl+C to copy, or click the quote button to quote the selected text.'
        )
      }
    }
  }, [showQuoteButton, clearSelection, announceToScreenReader])

  const handleCopy = useCallback(() => {
    isCopyInProgressRef.current = true
    // Cancel any pending selection clearing
    if (clearSelectionTimerRef.current) {
      clearTimeout(clearSelectionTimerRef.current)
      clearSelectionTimerRef.current = null
    }
    // Reset copy flag after a brief delay
    setTimeout(() => {
      isCopyInProgressRef.current = false
    }, 200)
  }, [])

  // Main effect for setting up text selection
  useEffect(() => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (!messageElement) return

    // Add event listeners with passive scroll for better performance
    messageElement.addEventListener('mouseup', handleMouseUp)
    messageElement.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('selectionchange', handleSelectionChange)
    
    return () => {
      messageElement.removeEventListener('mouseup', handleMouseUp)
      messageElement.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll, true)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('selectionchange', handleSelectionChange)
      if (positionUpdateTimerRef.current) clearTimeout(positionUpdateTimerRef.current)
      if (clearSelectionTimerRef.current) clearTimeout(clearSelectionTimerRef.current)
    }
  }, [messageId, handleMouseUp, handleTouchEnd, handleScroll, handleClickOutside, handleKeyDown, handleCopy, handleSelectionChange])

  // Cleanup effect when component unmounts or message changes
  useEffect(() => {
    return () => {
      removeActiveSelectionRef.current(selectionId)
    }
  }, [selectionId])

  const state: UseTextSelectionState = {
    showQuoteButton,
    selectedText,
    selectionRect,
    highlightRects,
    hasError,
    errorMessage
  }

  const handlers: UseTextSelectionHandlers = {
    setShowQuoteButton,
    setSelectedText,
    setSelectionRect,
    setHighlightRects,
    clearSelection,
    resetError,
    announceToScreenReader
  }

  return { state, handlers }
}
