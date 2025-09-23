/**
 * Simplified Text Selection Hook
 * 
 * Streamlined version focusing on core quote functionality.
 * Preserves essential features while reducing complexity from 515 lines to ~150 lines.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

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
}

export interface UseTextSelectionHandlers {
  clearSelection: () => void
  handleQuoteText: () => void
}

export interface UseTextSelectionOptions {
  messageId: string
  messageContent: string
  onQuoteToNotepad?: (text: string) => void
  onInputPopulate?: (text: string) => void
  notepadOpen?: boolean
}

/**
 * Simplified text selection hook focused on essential quote functionality
 */
export function useTextSelectionSimplified(options: UseTextSelectionOptions) {
  const {
    messageId,
    messageContent,
    onQuoteToNotepad,
    onInputPopulate,
    notepadOpen
  } = options

  // Core state
  const [showQuoteButton, setShowQuoteButton] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null)
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([])

  // Refs for cleanup
  const rangeRef = useRef<Range | null>(null)

  const clearSelection = useCallback(() => {
    setShowQuoteButton(false)
    setSelectedText('')
    setSelectionRect(null)
    setHighlightRects([])
    rangeRef.current = null
    
    // Clear browser selection
    try {
      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
      }
    } catch (error) {
      console.warn('Failed to clear browser selection:', error)
    }
  }, [])

  const handleQuoteText = useCallback(() => {
    if (!selectedText) return

    // Get the rendered message text for comparison
    const messageElement = document.getElementById(`message-${messageId}`)
    let renderedText = ''
    if (messageElement) {
      renderedText = messageElement.innerText.trim()
    }
    
    const selected = selectedText.trim()
    
    // If selection matches entire message, use markdown source
    let quoteToInsert: string
    if (renderedText && selected === renderedText) {
      quoteToInsert = messageContent
    } else {
      // Format as markdown blockquote
      quoteToInsert = selected
        .split('\n')
        .map(line => line ? `> ${line}` : '>')
        .join('\n')
    }
    
    // Route to appropriate destination
    if (notepadOpen && onQuoteToNotepad) {
      onQuoteToNotepad(quoteToInsert)
    } else if (onInputPopulate) {
      onInputPopulate(quoteToInsert)
    }
    
    // Clear selection after use
    clearSelection()
  }, [selectedText, messageId, messageContent, notepadOpen, onQuoteToNotepad, onInputPopulate, clearSelection])

  const handleSelection = useCallback(() => {
    try {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      if (range.collapsed) return

      const text = range.toString().trim()
      if (!text || text.length === 0) return

      // Validate selection is within this message
      const messageElement = document.getElementById(`message-${messageId}`)
      if (!messageElement) return

      const isInMessage = messageElement.contains(range.startContainer) && 
                         messageElement.contains(range.endContainer)
      if (!isInMessage) return

      // Store selection data
      rangeRef.current = range.cloneRange()
      setSelectedText(text)
      setShowQuoteButton(true)

      // Get position for quote button
      const rect = range.getBoundingClientRect()
      setSelectionRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        viewportTop: rect.top,
        viewportLeft: rect.left
      })

      // Get highlight rectangles
      const rects = Array.from(range.getClientRects())
      setHighlightRects(rects)

    } catch (error) {
      console.warn('Text selection failed:', error)
      clearSelection()
    }
  }, [messageId, clearSelection])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (!showQuoteButton) return
    
    const target = event.target as Element
    
    // Don't clear if clicking on quote button or selection UI
    if (target?.closest && (
      target.closest('[data-quote-button]') ||
      target.closest('[data-selection-ui]') ||
      target.closest('.quote-overlay')
    )) {
      return
    }

    // Don't clear if clicking within the message
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement && messageElement.contains(target)) {
      return
    }

    clearSelection()
  }, [showQuoteButton, messageId, clearSelection])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && showQuoteButton) {
      clearSelection()
    }
  }, [showQuoteButton, clearSelection])

  // Set up event listeners
  useEffect(() => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (!messageElement) return

    messageElement.addEventListener('mouseup', handleSelection)
    messageElement.addEventListener('touchend', handleSelection)
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      messageElement.removeEventListener('mouseup', handleSelection)
      messageElement.removeEventListener('touchend', handleSelection)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [messageId, handleSelection, handleClickOutside, handleKeyDown])

  const state: UseTextSelectionState = {
    showQuoteButton,
    selectedText,
    selectionRect,
    highlightRects
  }

  const handlers: UseTextSelectionHandlers = {
    clearSelection,
    handleQuoteText
  }

  return { state, handlers }
}
