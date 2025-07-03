'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, MessageSquare, Search, FileText, Brain } from 'lucide-react'
import { Message } from '@/app/types'
import { useTheme } from 'next-themes'
import { EnhancedContentSelector } from '@/app/dashboard/notes/components/EnhancedContentSelector'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
  hasContext?: boolean
  contextPlatform?: string
  hasAnalysis?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  useContextSearch?: boolean
  onToggleContextSearch?: (enabled: boolean) => void
  embeddingInfo?: { hasEmbeddings: boolean; count: number }
  notepadOpen?: boolean
  openNotepad?: () => void
  quotedForNotepad?: string
  onClearQuoted?: () => void
  disabled?: boolean
}

const placeholders = [
  "Ask about content strategy...",
  "Analyze audience growth...",
  "Get partnership recommendations...",
  "Optimize engagement...",
]

const contextPlaceholders = [
  "Ask about this content's analysis...",
  "What insights can you share?",
  "How can I improve this content?",
  "What trends do you see?",
]

export function ChatInput({
  onSend,
  isLoading,
  inputRef,
  maxLength = 5000,
  referencedMessage,
  onClearReference,
  autoFocus = true,
  hasContext = false,
  contextPlatform,
  hasAnalysis = false,
  inputValue,
  onInputChange,
  useContextSearch,
  onToggleContextSearch,
  embeddingInfo,
  notepadOpen = false,
  openNotepad,
  quotedForNotepad,
  onClearQuoted,
  disabled = false
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const [showFullReply, setShowFullReply] = useState(false)
  const [smartSearchHovered, setSmartSearchHovered] = useState(false)
  const [showSmartSearchText, setShowSmartSearchText] = useState(true)
  const internalInputRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef || internalInputRef
  const { theme } = useTheme()
  
  // @ functionality state
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [contentSelectorPosition, setContentSelectorPosition] = useState({ top: 100, left: 100 })
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  
  // Auth context for content fetching
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  
  // Fetch all linkable content
  const allLinkableContent = useQuery(api.notes.getAllLinkableContent, { 
    userId: userId || '' 
  })
  
  // Theme-aware accent colors
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'text-accent' : 'text-purple-600'
  const accentBg = isDark ? 'bg-accent' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-accent/90' : 'hover:bg-purple-700'
  const accentBgLight = isDark ? 'bg-accent/10' : 'bg-purple-600/10'
  const accentBorder = isDark ? 'border-accent' : 'border-purple-600'
  const accentFocusBorder = isDark ? 'focus-within:border-accent' : 'focus-within:border-purple-600'

  // Use external input value if provided, otherwise use internal state
  const currentInput = inputValue !== undefined ? inputValue : input
  const setCurrentInput = (value: string) => {
    if (inputValue !== undefined) {
      onInputChange?.(value)
    } else {
      setInput(value)
    }
  }

  // Shadow state for the actual message content (with @[1]@, @[2]@ format)
  const [shadowInput, setShadowInput] = useState('')
  
  // State to track links in order: [{index: 1, contentId: "note:123"}, {index: 2, contentId: "youtube:456"}]
  const [linkRegistry, setLinkRegistry] = useState<Array<{index: number, contentId: string}>>([])

  // Process display text to show titles using link registry
  const getDisplayText = useCallback((rawText: string) => {
    if (!allLinkableContent || linkRegistry.length === 0) return rawText
    
    return rawText.replace(/@\[(\d+)\]@/g, (match, indexStr) => {
      const index = parseInt(indexStr)
      const linkEntry = linkRegistry.find(link => link.index === index)
      
      if (!linkEntry) return match
      
      // Parse the content ID to find the content
      const contentId = linkEntry.contentId
      let actualContentId = contentId
      let contentType = 'note'
      
      // Check if it's a prefixed ID (note:, youtube:, etc.)
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      
      // Find the linked content
      let linkedContent
      if (contentType === 'note') {
        linkedContent = allLinkableContent.find(item => item.id === actualContentId)
        if (!linkedContent) {
          linkedContent = allLinkableContent.find(item => item.id === contentId)
        }
      } else {
        linkedContent = allLinkableContent.find(item => item.id === contentId)
      }
      
      // Return the title if found, otherwise keep the original format
      return linkedContent ? `@${linkedContent.title}\u200B` : match
    })
  }, [allLinkableContent, linkRegistry])



  // Handle textarea changes with atomic link handling
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const oldValue = currentInput
    
    // Check if this is a deletion that affects a link
    if (newValue.length < oldValue.length && linkRegistry.length > 0) {
      // Find the first difference to determine what was deleted
      let deletedIndex = -1
      for (let i = 0; i < Math.min(oldValue.length, newValue.length); i++) {
        if (oldValue[i] !== newValue[i]) {
          deletedIndex = i
          break
        }
      }
      
      if (deletedIndex === -1) {
        deletedIndex = newValue.length
      }
      
      // Find which link (if any) contains the deleted character
      const displayLinkPattern = /@([^@\n]+?)\u200B/g
      let displayMatch
      let linkIndex = 0
      
      while ((displayMatch = displayLinkPattern.exec(oldValue)) !== null && linkIndex < linkRegistry.length) {
        const displayStart = displayMatch.index
        const displayEnd = displayStart + displayMatch[0].length
        
        // Check if deletion affects this link
        if (deletedIndex >= displayStart && deletedIndex <= displayEnd) {
          console.log('🔗 [LINK DELETION] Deleting link:', {
            displayStart,
            displayEnd,
            deletedIndex,
            linkIndex: linkRegistry[linkIndex].index,
            displayText: displayMatch[0]
          })
          
          // Delete the entire link (including the invisible character)
          const beforeLink = newValue.substring(0, displayStart)
          const afterLink = newValue.substring(displayEnd)
          const newDisplayValue = beforeLink + afterLink
          
          // Update shadow text by removing the corresponding link
          const shadowLink = linkRegistry[linkIndex]
          const shadowLinkPattern = new RegExp(`@\\[${shadowLink.index}\\]@`)
          const newShadowValue = shadowInput.replace(shadowLinkPattern, '')
          
          console.log('🔗 [LINK DELETION] Shadow text update:', {
            before: shadowInput,
            after: newShadowValue,
            removed: `@[${shadowLink.index}]@`
          })
          
          // Remove the link from registry and reindex remaining links
          const deletedLinkIndex = shadowLink.index
          const newLinkRegistry = linkRegistry.filter(link => link.index !== deletedLinkIndex)
            .map((link, newIndex) => ({
              ...link,
              index: newIndex + 1
            }))
          
          setLinkRegistry(newLinkRegistry)
          
          // Update shadow text to reflect new indices
          let updatedShadowValue = newShadowValue
          newLinkRegistry.forEach((link, index) => {
            const oldIndex = link.index
            const newIndex = index + 1
            if (oldIndex !== newIndex) {
              // Replace old index with new index in shadow text
              updatedShadowValue = updatedShadowValue.replace(
                new RegExp(`@\\[${oldIndex}\\]@`, 'g'),
                `@[${newIndex}]@`
              )
            }
          })
          
          // Update both values
          setCurrentInput(newDisplayValue)
          setShadowInput(updatedShadowValue)
          
          // Set cursor position after the deleted link
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = displayStart
              textareaRef.current.selectionEnd = displayStart
            }
          }, 0)
          return
        }
        
        linkIndex++
      }
    }
    
    // For all other text changes, update both display and shadow text directly
    setCurrentInput(newValue)
    
    // Update shadow text by replacing display titles with their corresponding indices
    let newShadowValue = newValue
    
    // Replace each link in the display text with its shadow index
    linkRegistry.forEach((link) => {
      // Parse the content ID to find the content (same logic as getDisplayText)
      const contentId = link.contentId
      let actualContentId = contentId
      let contentType = 'note'
      
      // Check if it's a prefixed ID (note:, youtube:, etc.)
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      
      // Find the linked content
      let linkedContent
      if (contentType === 'note') {
        linkedContent = allLinkableContent?.find(item => item.id === actualContentId)
        if (!linkedContent) {
          linkedContent = allLinkableContent?.find(item => item.id === contentId)
        }
      } else {
        linkedContent = allLinkableContent?.find(item => item.id === contentId)
      }
      
      if (linkedContent) {
        const title = linkedContent.title || 'Untitled'
        const displayTitle = `@${title}\u200B` // Include the invisible character
        const shadowIndex = `@[${link.index}]@`
        
        // Replace the display title with the shadow index
        newShadowValue = newShadowValue.replace(displayTitle, shadowIndex)
      }
    })
    
    setShadowInput(newShadowValue)
    
    console.log('🔄 [TEXT CHANGE] Display text changed:', newValue)
    console.log('🔄 [TEXT CHANGE] Shadow text updated:', newShadowValue)
  }, [currentInput, shadowInput, setCurrentInput, textareaRef, linkRegistry, allLinkableContent])

  // Handle textarea selection to prevent cursor inside links
  const handleTextareaSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPos = textarea.selectionStart
    
    // If there's no shadow text with links, allow normal cursor positioning
    if (!shadowInput || !shadowInput.includes('@[')) {
      return
    }
    
    // Find all @Title patterns in the display text
    const displayText = currentInput
    // Updated regex to handle spaces in titles - match @Title with spaces until the invisible character
    const displayLinkPattern = /@([^@\n]+?)\u200B/g
    let displayMatch
    
    while ((displayMatch = displayLinkPattern.exec(displayText)) !== null) {
      const displayStart = displayMatch.index
      const displayEnd = displayStart + displayMatch[0].length
      
      // Check if cursor is inside this link
      if (cursorPos > displayStart && cursorPos < displayEnd) {
        // Move cursor to the end of the link
        setTimeout(() => {
          textarea.selectionStart = displayEnd
          textarea.selectionEnd = displayEnd
        }, 0)
        return
      }
    }
  }, [shadowInput, currentInput])

  // Use context-aware placeholders when analysis is available
  const activePlaceholders = hasAnalysis ? contextPlaceholders : placeholders

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = activePlaceholders.indexOf(prev)
        const nextIndex = (currentIndex + 1) % activePlaceholders.length
        return activePlaceholders[nextIndex] || activePlaceholders[0]
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [activePlaceholders])

  // Update placeholder when context changes
  useEffect(() => {
    setPlaceholder(activePlaceholders[0])
  }, [hasAnalysis, activePlaceholders])

  // Initialize shadow input when currentInput changes externally
  useEffect(() => {
    if (currentInput !== undefined && !shadowInput) {
      // Only initialize shadow input if it's empty
      // Don't convert display text to shadow text automatically
      setShadowInput('')
    }
  }, [currentInput, shadowInput])

  // Auto-resize textarea and sync display div
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 120) // Max height of ~3 lines
      textarea.style.height = `${scrollHeight}px`
    }
  }, [currentInput, textareaRef])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isLoading) {
      textareaRef.current.focus()
    }
  }, [autoFocus, isLoading, referencedMessage, textareaRef])

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

  // Function to convert numeric indices to content IDs
  const convertNumericIndicesToContentIds = (text: string): string => {
    if (!linkRegistry.length) return text
    
    return text.replace(/@\[(\d+)\]@/g, (match, indexStr) => {
      const index = parseInt(indexStr)
      const linkEntry = linkRegistry.find(link => link.index === index)
      return linkEntry ? `@[${linkEntry.contentId}]@` : match
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const messageToSend = shadowInput || currentInput
    if (messageToSend.trim() && !isLoading && currentInput.length <= maxLength) {
      // Convert numeric indices to content IDs before sending
      const processedMessage = convertNumericIndicesToContentIds(messageToSend.trim())
      
      console.log('📤 [CHAT INPUT] Sending message:')
      console.log('  Display text:', currentInput)
      console.log('  Shadow text (hidden layer):', shadowInput)
      console.log('  Processed message:', processedMessage)
      
      // Send the processed message with content IDs (no link registry needed)
      onSend(processedMessage)
      setCurrentInput('')
      setShadowInput('')
      setLinkRegistry([]) // Reset link registry after sending
    }
  }

  // Override reference handling when notepad is open
  const handleReferenceClick = () => {
    if (notepadOpen && referencedMessage && quotedForNotepad !== undefined) {
      // Add to notepad logic is handled by parent
      if (onClearQuoted) {
        onClearQuoted()
      }
      onClearReference?.()
    }
  }

  // Handle linking content from the selector
  const handleLinkContent = useCallback((contentId: string) => {
    console.log('🔗 handleLinkContent called with:', contentId)
    console.log('🔗 textareaRef.current:', textareaRef.current)
    
    if (!textareaRef.current) {
      console.log('❌ textareaRef.current is null')
      return
    }

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    console.log('🔗 cursorPos:', cursorPos)
    
    // Find the @ symbol position
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@')
    console.log('🔗 atSymbolIndex:', atSymbolIndex)
    console.log('🔗 textBeforeCursor:', textBeforeCursor)
    
    if (atSymbolIndex === -1) {
      console.log('❌ No @ symbol found')
      return
    }
    
    // Get content information from the query
    const linkedContent = allLinkableContent?.find(item => item.id === contentId)
    console.log('🔗 linkedContent:', linkedContent)
    if (!linkedContent) {
      console.log('❌ linkedContent not found')
      return
    }
    
    // Create the proper content ID format for storage
    let formattedContentId = contentId
    if (linkedContent.type === 'note' && !contentId.startsWith('note:')) {
      // For smart notes, ensure we have the note: prefix
      formattedContentId = `note:${contentId}`
    }
    console.log('🔗 formattedContentId:', formattedContentId)
    
    // Get the title for display
    const title = linkedContent.title || 'Untitled'
    
    // Add to link registry
    const newLinkIndex = linkRegistry.length + 1
    setLinkRegistry(prev => [...prev, { index: newLinkIndex, contentId: formattedContentId }])
    
    // Replace the @ and any text after it with the title format for display
    // Add an invisible character (zero-width space) after the link to mark its end
    const textAfterCursor = textarea.value.substring(cursorPos)
    const newDisplayText = textarea.value.substring(0, atSymbolIndex) + `@${title}\u200B` + textAfterCursor
    console.log('🔗 newDisplayText:', newDisplayText)
    
    // Update the display text
    setCurrentInput(newDisplayText)
    
    // Update the shadow text with the numeric index format
    const currentShadowText = shadowInput || textarea.value
    const shadowTextBeforeCursor = currentShadowText.substring(0, atSymbolIndex)
    const shadowTextAfterCursor = currentShadowText.substring(cursorPos)
    const newShadowText = shadowTextBeforeCursor + `@[${newLinkIndex}]@` + shadowTextAfterCursor
    setShadowInput(newShadowText)
    
    console.log('🔗 [LINK CONTENT] Link added:', {
      display: newDisplayText,
      shadow: newShadowText,
      linkIndex: newLinkIndex,
      contentId: formattedContentId
    })
    
    // Set cursor position after the inserted content (after the invisible character)
    const newCursorPos = atSymbolIndex + `@${title}\u200B`.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    
    // Hide the content selector
    setShowEnhancedContentSelector(false)
    setContentSearchTerm('')
    
    console.log('✅ Content linking completed')
  }, [textareaRef, allLinkableContent, linkRegistry])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        const messageToSend = shadowInput || currentInput
        if (!messageToSend.trim() || isLoading || characterCount >= maxLength) return
        
        // Convert numeric indices to content IDs before sending
        const processedMessage = convertNumericIndicesToContentIds(messageToSend.trim())
        onSend(processedMessage)
        setCurrentInput('')
        setShadowInput('')
        setLinkRegistry([]) // Reset link registry after sending
      }
    }

    // '@' to open content linking selector
    if (e.key === '@') {
      // Let the @ be typed first, then open selector
      setTimeout(() => {
        if (textareaRef.current) {
          const coords = getCursorCoordinates(textareaRef.current)
          setContentSelectorPosition(coords)
          setShowEnhancedContentSelector(true)
          setContentSearchTerm('')
        }
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }

    // Handle ESC to close content selector
    if (e.key === 'Escape' && showEnhancedContentSelector) {
      e.preventDefault()
      e.stopPropagation()
      setShowEnhancedContentSelector(false)
      return
    }
  }

  const characterCount = currentInput.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  // Dynamic placeholder based on context
  let contextPlaceholder = placeholder
  if (hasContext && contextPlatform) {
    if (contextPlatform === 'ai-insights') {
      contextPlaceholder = "Ask about these insights..."
    } else if (contextPlatform === 'smart-notes') {
      contextPlaceholder = "Ask about your notes..."
    } else {
      contextPlaceholder = `Ask about your ${contextPlatform} content...`
    }
  } else if (hasAnalysis) {
    contextPlaceholder = "Ask me anything about your content..."
  }

  return (
    <div className="shrink-0 bg-background relative">
      <form onSubmit={handleSubmit} className="p-2 sm:p-3">
        {/* Context indicator */}
        {hasContext && (
          <div className="w-full mb-2">
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${
              hasAnalysis 
                ? `${accentColor} ${accentBgLight} border-${accentBorder.split('-')[1]}/20`
                : `${accentColor} ${accentBgLight} border-${accentBorder.split('-')[1]}/20`
            }`}>
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">
                {hasAnalysis 
                  ? `AI analysis for this ${contextPlatform} content will be included as context`
                  : `Discussing ${contextPlatform} content`
                }
              </span>
            </div>
          </div>
        )}

        {/* Reference preview */}
        {referencedMessage && !notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/80 p-2 rounded-lg border border-border/50">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <button 
                onClick={() => setShowFullReply(!showFullReply)}
                className="flex-1 text-left hover:text-foreground transition-colors"
              >
                <span className={showFullReply ? "break-words whitespace-pre-wrap" : "truncate block"}>
                  Replying to: {showFullReply 
                    ? referencedMessage.content 
                    : referencedMessage.content.length > 60 
                      ? `${referencedMessage.content.slice(0, 60)}...` 
                      : referencedMessage.content}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted flex-shrink-0 transition-colors"
                aria-label="Clear reply"
              >
                <span className="text-base font-medium">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Reference notification when notepad is open */}
        {referencedMessage && notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-3 text-xs text-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <button 
                onClick={handleReferenceClick}
                className="flex-1 text-left hover:text-foreground transition-colors font-medium"
              >
                Add quote to notepad
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
                aria-label="Clear reply"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end w-full relative">
          <div className={`
            flex-1 relative rounded-xl border-2 transition-all duration-200
            ${isAtLimit ? 'border-destructive' : ''}
            ${isNearLimit && !isAtLimit ? 'border-warning' : ''}
            ${!isAtLimit && !isNearLimit ? 'border-transparent hover:border-purple-600 dark:hover:border-accent' : ''}
            ${accentFocusBorder}
            focus-within:bg-background
          `}>
            {/* Top section - Text input area */}
            <div className={`flex items-center rounded-t-xl bg-muted/50
              pl-3 py-2 pr-3
            `}>
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={handleTextareaChange}
                placeholder={contextPlaceholder}
                className="text-base leading-relaxed flex-1 bg-transparent border-0 outline-0 resize-none placeholder:text-muted-foreground chat-font 
                [&::-webkit-scrollbar]:w-2 
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-border 
                [&::-webkit-scrollbar-thumb]:rounded-full 
                [&::-webkit-scrollbar-thumb]:border-transparent
                [&::-webkit-scrollbar-thumb]:bg-clip-padding
                hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50
                [&::-webkit-scrollbar-corner]:bg-transparent
                [scrollbar-width:thin]
                [scrollbar-color:hsl(var(--border))_transparent]"
                disabled={isLoading || disabled}
                onKeyDown={handleKeyDown}
                onSelect={handleTextareaSelect}
                maxLength={maxLength}
              />
            </div>

            {/* Bottom section - Buttons area */}
            <div className={`flex items-center justify-between rounded-b-xl
              px-3 py-2 h-10
            `}>
              {/* Left side - Smart Search */}
              <div className="flex items-center">
                {embeddingInfo?.hasEmbeddings && (
                  <div className="relative flex items-center"
                    onMouseEnter={() => setSmartSearchHovered(true)}
                    onMouseLeave={() => setSmartSearchHovered(false)}
                  >
                    {/* Smart Search Toggle Button */}
                    <button
                      type="button"
                      onClick={() => onToggleContextSearch?.(!useContextSearch)}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 transform hover:scale-105 ${
                        useContextSearch 
                          ? `${accentBgLight} ${accentColor} shadow-sm` 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      aria-label="Toggle Smart Search"
                      title={useContextSearch ? 'Smart Search: ON' : 'Smart Search: OFF'}
                    >
                      <Brain className="w-4 h-4" />
                    </button>

                    {/* Smart Search Text Label - always visible */}
                    <div className="ml-3">
                      <span className={`text-xs font-medium transition-colors duration-300 ${
                        useContextSearch 
                          ? 'text-foreground' 
                          : 'text-muted-foreground'
                      }`}>
                        {useContextSearch 
                          ? `Smart search activated - ${embeddingInfo.count} items included` 
                          : `Activate smart search to include ${embeddingInfo.count} items as context`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right side - Character count, Notes, Send */}
              <div className="flex items-center gap-2">
                {/* Character count */}
                {!isLoading && (
                  <div className={`text-xs
                    ${isAtLimit ? 'text-destructive font-medium' : ''}
                    ${isNearLimit && !isAtLimit ? 'text-warning font-medium' : 'text-muted-foreground'}
                    transition-colors duration-200
                  `}>
                    {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
                  </div>
                )}
                
                {/* Notepad button */}
                {openNotepad && (
                  <button
                    type="button"
                    onClick={openNotepad}
                    aria-label="Open markdown notepad"
                    title="Open markdown notepad"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={isLoading || !currentInput.trim() || isAtLimit || disabled}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                    ${isLoading || !currentInput.trim() || isAtLimit || disabled 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : `${accentBg} text-white ${accentBgHover} shadow-sm hover:shadow-md hover:scale-105 active:scale-95`
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line, @ to link content
        </div>
        
        {/* Temporary shadow text display - only in development */}
        {process.env.NODE_ENV === 'development' && shadowInput && (
          <div className="absolute top-2 left-2 z-50 p-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded text-xs max-w-xs">
            <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              🔍 Shadow Text:
            </div>
            <div className="font-mono text-yellow-700 dark:text-yellow-300 break-all text-xs">
              {shadowInput}
            </div>
            {linkRegistry.length > 0 && (
              <>
                <div className="font-medium text-yellow-800 dark:text-yellow-200 mb-1 mt-2">
                  🔗 Link Registry:
                </div>
                <div className="font-mono text-yellow-700 dark:text-yellow-300 break-all text-xs">
                  {linkRegistry.map(link => (
                    <div key={link.index}>
                      {link.index}: {link.contentId}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </form>

      {/* Enhanced Content Selector */}
      <EnhancedContentSelector
        isOpen={showEnhancedContentSelector}
        onClose={() => setShowEnhancedContentSelector(false)}
        onSelect={handleLinkContent}
        position={contentSelectorPosition}
        searchTerm={contentSearchTerm}
        onSearchChange={setContentSearchTerm}
      />
    </div>
  )
}