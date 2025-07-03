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
      let actualContentId = linkEntry.contentId
      let contentType = 'note'
      if (linkEntry.contentId.includes(':')) {
        const [prefix, id] = linkEntry.contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      let linkedContent
      if (contentType === 'note') {
        linkedContent = allLinkableContent.find(item => item.id === actualContentId) || allLinkableContent.find(item => item.id === linkEntry.contentId)
      } else {
        linkedContent = allLinkableContent.find(item => item.id === linkEntry.contentId)
      }
      return linkedContent ? `@${linkedContent.title}\u200B` : match
    })
  }, [allLinkableContent, linkRegistry])

  // Handle textarea changes with atomic link handling
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const oldValue = currentInput
    if (newValue.length < oldValue.length && linkRegistry.length > 0) {
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
      const displayLinkPattern = /@([^@\n]+?)\u200B/g
      let displayMatch
      let linkIndex = 0
      while ((displayMatch = displayLinkPattern.exec(oldValue)) !== null && linkIndex < linkRegistry.length) {
        const displayStart = displayMatch.index
        const displayEnd = displayStart + displayMatch[0].length
        if (deletedIndex >= displayStart && deletedIndex <= displayEnd) {
          const beforeLink = newValue.substring(0, displayStart)
          const afterLink = newValue.substring(displayEnd)
          const newDisplayValue = beforeLink + afterLink
          const shadowLink = linkRegistry[linkIndex]
          const shadowLinkPattern = new RegExp(`@\\[${shadowLink.index}\\]@`)
          const newShadowValue = shadowInput.replace(shadowLinkPattern, '')
          const deletedLinkIndex = shadowLink.index
          const newLinkRegistry = linkRegistry.filter(link => link.index !== deletedLinkIndex)
            .map((link, newIndex) => ({ ...link, index: newIndex + 1 }))
          setLinkRegistry(newLinkRegistry)
          let updatedShadowValue = newShadowValue
          newLinkRegistry.forEach((link, index) => {
            const oldIndex = link.index
            const newIndex = index + 1
            if (oldIndex !== newIndex) {
              updatedShadowValue = updatedShadowValue.replace(
                new RegExp(`@\\[${oldIndex}\\]@`, 'g'),
                `@[${newIndex}]@`
              )
            }
          })
          setCurrentInput(newDisplayValue)
          setShadowInput(updatedShadowValue)
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
    setCurrentInput(newValue)
    let newShadowValue = newValue
    linkRegistry.forEach((link) => {
      const contentId = link.contentId
      let actualContentId = contentId
      let contentType = 'note'
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2)
        contentType = prefix
        actualContentId = id
      }
      let linkedContent
      if (contentType === 'note') {
        linkedContent = allLinkableContent?.find(item => item.id === actualContentId) || allLinkableContent?.find(item => item.id === contentId)
      } else {
        linkedContent = allLinkableContent?.find(item => item.id === contentId)
      }
      if (linkedContent) {
        const title = linkedContent.title || 'Untitled'
        const displayTitle = `@${title}\u200B`
        const shadowIndex = `@[${link.index}]@`
        newShadowValue = newShadowValue.replace(displayTitle, shadowIndex)
      }
    })
    setShadowInput(newShadowValue)
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
      const processedMessage = convertNumericIndicesToContentIds(messageToSend.trim())
      onSend(processedMessage)
      setCurrentInput('')
      setShadowInput('')
      setLinkRegistry([])
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
    if (!textareaRef.current) return
    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = textarea.value.substring(0, cursorPos)
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@')
    if (atSymbolIndex === -1) return
    const linkedContent = allLinkableContent?.find(item => item.id === contentId)
    if (!linkedContent) return
    let formattedContentId = contentId
    if (linkedContent.type === 'note' && !contentId.startsWith('note:')) {
      formattedContentId = `note:${contentId}`
    }
    const title = linkedContent.title || 'Untitled'
    const newLinkIndex = linkRegistry.length + 1
    setLinkRegistry(prev => [...prev, { index: newLinkIndex, contentId: formattedContentId }])
    const textAfterCursor = textarea.value.substring(cursorPos)
    const newDisplayText = textarea.value.substring(0, atSymbolIndex) + `@${title}\u200B` + textAfterCursor
    setCurrentInput(newDisplayText)
    const currentShadowText = shadowInput || textarea.value
    const shadowTextBeforeCursor = currentShadowText.substring(0, atSymbolIndex)
    const shadowTextAfterCursor = currentShadowText.substring(cursorPos)
    const newShadowText = shadowTextBeforeCursor + `@[${newLinkIndex}]@` + shadowTextAfterCursor
    setShadowInput(newShadowText)
    const newCursorPos = atSymbolIndex + `@${title}\u200B`.length
    textarea.setSelectionRange(newCursorPos, newCursorPos)
    setShowEnhancedContentSelector(false)
    setContentSearchTerm('')
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
        
        // Send the message with content IDs - backend will resolve them
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
        {/* Shadow text debug UI removed for production cleanup */}
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