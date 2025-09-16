import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'

interface LinkableContent {
  id: string
  title: string
  content: string
  type: string
  metadata: any
  originalDocument?: any
}

interface UseContentLinkingProps {
  currentTab?: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setCurrentInput: (value: string) => void
  isRecordingRef: React.MutableRefObject<boolean>
}

export const useContentLinking = ({
  currentTab = 'all',
  textareaRef,
  setCurrentInput,
  isRecordingRef
}: UseContentLinkingProps) => {
  // @ functionality state
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [contentSelectorPosition, setContentSelectorPosition] = useState({ top: 100, left: 100 })
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  
  // Queue for content insertion when voice recording is active
  const queuedContentRef = useRef<string | null>(null)
  
  // Get current user ID from API key
  const userId = getCurrentUserId()
  
  // Fetch unified content using platformRouter (same as UnifiedContentSelector)
  const allUnifiedContent = useQuery(
    api.platformRouter.getAllUnifiedContent,
    userId ? { 
      userId,
      platforms: currentTab !== 'all' ? [currentTab] : undefined,
      limit: 200 
    } : "skip"
  );

  // Transform unified content to the format expected by chat-input
  const allLinkableContent = useMemo(() => {
    if (!allUnifiedContent) return [];
    
    return allUnifiedContent.map(item => ({
      id: item.id, // Already in standardized format: platform:actualId
      title: item.title,
      content: item.content,
      type: item.platform, // 'youtube', 'instagram', 'gmail', 'notes', 'conversations', 'insights'
      metadata: item.metadata,
      originalDocument: item.originalDocument
    }));
  }, [allUnifiedContent]);

  const isContentLoading = !userId || allUnifiedContent === undefined;

  // Get cursor coordinates for content selector positioning
  const getCursorCoordinates = useCallback((textarea: HTMLTextAreaElement) => {
    const rect = textarea.getBoundingClientRect()
    const style = window.getComputedStyle(textarea)
    const lineHeight = parseInt(style.lineHeight) || 20
    const paddingTop = parseInt(style.paddingTop) || 0
    const paddingLeft = parseInt(style.paddingLeft) || 0
    
    const text = textarea.value.substring(0, textarea.selectionStart)
    const lines = text.split('\n')
    const currentLine = lines[lines.length - 1]
    const lineNumber = lines.length
    
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return { top: 0, left: 0 }
    
    context.font = style.font
    const textWidth = context.measureText(currentLine).width
    
    const cursorTop = rect.top + paddingTop + (lineNumber * lineHeight)
    const cursorLeft = rect.left + paddingLeft + textWidth
    
    // Check if there's enough space below the cursor
    const selectorHeight = 400 // Approximate height of the content selector
    const margin = 20
    const spaceBelow = window.innerHeight - cursorTop - margin
    const spaceAbove = cursorTop - margin
    
    // Position above cursor if there's not enough space below
    const finalTop = spaceBelow < selectorHeight && spaceAbove > selectorHeight 
      ? cursorTop - selectorHeight - 10 // Position above with 10px gap
      : cursorTop + 10 // Position below with 10px gap
    
    return {
      top: Math.max(margin, finalTop),
      left: Math.max(margin, Math.min(cursorLeft, window.innerWidth - 600 - margin)) // Ensure it doesn't go off-screen horizontally
    }
  }, [])

  // Internal function to actually insert content (used both immediately and from queue)
  const insertContentNow = useCallback((contentId: string) => {
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@')
    if (atSymbolIndex === -1) return
    
    const linkedContent = allLinkableContent?.find(item => item.id === contentId)
    if (!linkedContent) return
    
    // Get the title and create a truncated version for display with brackets
    const title = linkedContent.title || 'Untitled'
    const truncatedTitle = title.replace(/\n/g, ' ').substring(0, 20) + (title.length > 20 ? '...' : '')
    
    // Replace the @ symbol with the truncated title in brackets for better clarity
    const textAfterCursor = textarea.value.substring(cursorPos)
    const newText = textarea.value.substring(0, atSymbolIndex) + `@[${truncatedTitle}]` + textAfterCursor
    
    setCurrentInput(newText)
    
    // Position cursor after the inserted content
    const newCursorPos = atSymbolIndex + `@[${truncatedTitle}]`.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    
    setShowEnhancedContentSelector(false)
    setContentSearchTerm('')
  }, [textareaRef, allLinkableContent, setCurrentInput])

  // Effect to handle queued content insertion when voice recording stops
  useEffect(() => {
    if (!isRecordingRef.current && queuedContentRef.current) {
      const contentId = queuedContentRef.current
      queuedContentRef.current = null
      
      // Execute the queued content insertion
      insertContentNow(contentId)
    }
  }, [insertContentNow]) // Only update callbacks when functions actually change, not on every render

  // Handle linking content from the selector
  const handleLinkContent = useCallback((contentId: string) => {
    // Check if voice recording is active
    if (isRecordingRef.current) {
      // Queue the content insertion for after recording stops
      queuedContentRef.current = contentId
      setShowEnhancedContentSelector(false)
      setContentSearchTerm('')
      return
    }
    
    // Insert content immediately
    insertContentNow(contentId)
  }, [isRecordingRef, insertContentNow])

  // Open content selector
  const openContentSelector = useCallback(() => {
    if (textareaRef.current) {
      const coords = getCursorCoordinates(textareaRef.current)
      setContentSelectorPosition(coords)
      setShowEnhancedContentSelector(true)
      setContentSearchTerm('')
    }
  }, [getCursorCoordinates, textareaRef])

  // Close content selector
  const closeContentSelector = useCallback(() => {
    setShowEnhancedContentSelector(false)
  }, [])

  return {
    // State
    showEnhancedContentSelector,
    contentSelectorPosition,
    contentSearchTerm,
    setContentSearchTerm,
    allLinkableContent,
    isContentLoading,
    
    // Handlers
    handleLinkContent,
    openContentSelector,
    closeContentSelector
  }
}
