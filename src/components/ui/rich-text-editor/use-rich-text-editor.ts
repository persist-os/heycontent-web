'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { 
  RichTextEditorProps, 
  PalettePosition, 
  PaletteMode 
} from './rich-text-editor.types'
import { 
  extractPrefixedIds, 
  getDisplayContent, 
  getStorageContent 
} from './content-utils'
import { 
  formatText, 
  insertBulletList, 
  insertNumberedList, 
  insertHeading, 
  insertLink, 
  insertLinkEmbed, 
  insertTable,
  getCursorCoordinates
} from './formatting-utils'
import { AIHandlers, createAIHandlers } from './ai-utils'

type UseRichTextEditorProps = Pick<RichTextEditorProps, 
  'content' | 'onContentChange' | 'showPreview' | 'onShowPreviewChange' | 
  'onAskAI' | 'onRequestAnalysis' | 'onRequestIdeas' | 'noteId' | 'noteType' |
  'availableNotes' | 'onLinkNote' | 'onLinkContent' | 'allLinkableContent' |
  'userId' | 'containerRef'
>

export const useRichTextEditor = (props: UseRichTextEditorProps) => {
  const {
    content,
    onContentChange,
    showPreview,
    onShowPreviewChange,
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas,
    noteId,
    noteType = 'idea_bank',
    availableNotes = [],
    onLinkNote,
    onLinkContent,
    allLinkableContent,
    userId,
    containerRef
  } = props

  // State
  const [localShowPreview, setLocalShowPreview] = useState(true)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [palettePosition, setPalettePosition] = useState<PalettePosition>({ top: 100, left: 100 })
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('commands')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  const [fetchedContentTitles, setFetchedContentTitles] = useState<Record<string, string>>({})
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Extract prefixed IDs from content
  const prefixedIds = extractPrefixedIds(content, userId)

  // Fetch content titles using the batch query
  const contentTitles = useQuery(
    api.notes.getContentTitlesByPrefixedIds,
    prefixedIds.length > 0 && userId 
      ? { prefixedIds, userId }
      : 'skip'
  )

  // Update fetched titles when content titles change
  useEffect(() => {
    if (contentTitles && typeof contentTitles === 'object') {
      setFetchedContentTitles(prev => ({ ...prev, ...contentTitles }))
    }
  }, [contentTitles])

  // Sync preview state - default to showing rich text
  const currentShowPreview = onShowPreviewChange ? showPreview : localShowPreview
  const setCurrentShowPreview = onShowPreviewChange || setLocalShowPreview

  // Content conversion functions
  const getDisplayContentMemo = useCallback((rawContent: string) => {
    return getDisplayContent(rawContent, availableNotes, fetchedContentTitles, allLinkableContent)
  }, [availableNotes, fetchedContentTitles, allLinkableContent])

  const getStorageContentMemo = useCallback((displayContent: string) => {
    return getStorageContent(displayContent, availableNotes, fetchedContentTitles, allLinkableContent)
  }, [availableNotes, fetchedContentTitles, allLinkableContent])

  // Create AI handlers
  const aiHandlers: AIHandlers = {
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas
  }

  const { handleAskAI, handleRequestAnalysis, handleRequestIdeas, handleGenerateTableFromContent } = createAIHandlers(
    { content, textAreaRef, onContentChange },
    aiHandlers
  )

  // Formatting handlers
  const handleInsertBulletList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertBulletList(params)
  }, [content, onContentChange])

  const handleInsertNumberedList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertNumberedList(params)
  }, [content, onContentChange])

  const handleInsertHeading = useCallback((level: number) => {
    const params = { content, textAreaRef, onContentChange }
    insertHeading(params, level)
  }, [content, onContentChange])

  const handleInsertLink = useCallback((url: string, text: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLink(params, url, text)
  }, [content, onContentChange])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLinkEmbed(params, url)
  }, [content, onContentChange])

  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    const params = { content, textAreaRef, onContentChange }
    insertTable(params, rows, cols)
  }, [content, onContentChange])

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    if (!textAreaRef.current) {
      return
    }

    const selectedNote = availableNotes.find(note => String(note._id) === noteId)
    if (!selectedNote) {
      return
    }

    // Close the palette immediately
    setShowCommandPalette(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContentMemo(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        break
      }
    }
    
    const linkText = `@[note:${selectedNote._id}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with note link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + afterCursor
      const newCursorPos = atPosition + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    } else {
      // No @ found, just insert the note link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + afterCursor
      const newCursorPos = cursorPos + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }
  }, [content, onContentChange, availableNotes, getDisplayContentMemo, getStorageContentMemo])

  // Handle content linking
  const handleLinkContent = useCallback((prefixedId: string) => {
    if (!textAreaRef.current) {
      return
    }

    // Close the selector immediately
    setShowEnhancedContentSelector(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContentMemo(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        break
      }
    }
    
    const linkText = `@[${prefixedId}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with content link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + afterCursor
      const newCursorPos = atPosition + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    } else {
      // No @ found, just insert the content link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + afterCursor
      const newCursorPos = cursorPos + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }
  }, [content, onContentChange, getDisplayContentMemo, getStorageContentMemo])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + K to open inline command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopPropagation()
      // Small delay to ensure textarea is focused and cursor position is accurate
      setTimeout(() => {
        const coords = getCursorCoordinates(textAreaRef, containerRef)
        setPalettePosition(coords)
        setPaletteMode('commands')
        setShowCommandPalette(true)
      }, 0)
      return
    }

    // Traditional formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '**', '**')
          return
        case 'i':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '*', '*')
          return
        case 'u':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '<u>', '</u>')
          return
      }
    }

    // '/' at the start of a line to open command palette
    if (e.key === '/') {
      const textarea = textAreaRef.current
      if (!textarea) return
      
      const start = textarea.selectionStart
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const lineContent = content.substring(lineStart, start)
      
      if (lineContent.trim() === '') {
        e.preventDefault()
        e.stopPropagation()
        setTimeout(() => {
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setPaletteMode('commands')
          setShowCommandPalette(true)
        }, 0)
        return
      }
    }

    // '@' to open note linking palette
    if (e.key === '@') {
      // Let the @ be typed first, then open palette
      setTimeout(() => {
        if (textAreaRef.current) {
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setShowEnhancedContentSelector(true)
          setShowCommandPalette(false)
        }
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }

    // Handle ESC to close command palette
    if (e.key === 'Escape' && showCommandPalette) {
      e.preventDefault()
      e.stopPropagation()
      setShowCommandPalette(false)
      return
    }
  }, [content, showCommandPalette, onContentChange, containerRef])

  // Handle content changes from typing
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const displayContent = e.target.value
    const newCursorPosition = e.target.selectionStart
    
    // Only convert if the content actually contains link patterns
    if (displayContent.includes('@[')) {
      // Convert display content (with titles) back to storage format (with IDs)
      const storageContent = getStorageContentMemo(displayContent)
      
      // Prevent saving "Missing Note" - if conversion resulted in missing notes, keep original
      if (storageContent.includes('@[Missing Note]@') && !displayContent.includes('@[Missing Note]@')) {
        onContentChange(displayContent)
      } else {
        onContentChange(storageContent)
      }
    } else {
      // No links, just pass through the content
      onContentChange(displayContent)
    }
    
    setCursorPosition(newCursorPosition)
  }, [onContentChange, getStorageContentMemo])

  const togglePreview = useCallback(() => {
    setCurrentShowPreview(!currentShowPreview)
  }, [currentShowPreview, setCurrentShowPreview])

  return {
    // State
    currentShowPreview,
    showCommandPalette,
    showEnhancedContentSelector,
    palettePosition,
    paletteMode,
    contentSearchTerm,
    textAreaRef,
    
    // Content functions
    getDisplayContent: getDisplayContentMemo,
    
    // Handlers
    handleKeyDown,
    handleContentChange,
    togglePreview,
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleGenerateTableFromContent,
    handleInsertBulletList,
    handleInsertNumberedList,
    handleInsertHeading,
    handleInsertLink,
    handleInsertLinkEmbed,
    handleInsertTable,
    handleLinkNote,
    handleLinkContent,
    
    // Setters
    setShowCommandPalette,
    setShowEnhancedContentSelector,
    setContentSearchTerm,
    
    // Props pass-through
    noteType,
    availableNotes,
    noteId
  }
} 