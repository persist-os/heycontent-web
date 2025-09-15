'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare, Quote, Search, CheckCircle, Database } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ExpandableInsights } from './expandable-insights'
import { MarkdownRenderer, ChatContentRenderer } from './markdown-renderer'
import { PersonaCardRenderer } from './components/PersonaCardRenderer'
import { HorizontalProgressiveThinking } from './components/main_chat/HorizontalProgressiveThinking'
import { CopyButton } from '@/components/ui/copy-button'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGlobalSelectionState } from './hooks/useGlobalSelectionState'
import { toast } from 'sonner'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
  onRetry?: () => void
  onReference?: (message: Message) => void
  showReferenceButton?: boolean
  onReferenceClick?: (messageId: string) => void
  onOptionClick?: (option: InteractiveOption) => void
  onFollowUpClick?: (choice: string) => void
  onScrollToMessage?: (messageId: string) => void
  className?: string
  userId?: string
  onInputPopulate?: (text: string) => void
  notepadOpen?: boolean
  onQuoteToNotepad?: (text: string) => void
  onContentClick?: (contentType: string, contentId: string) => void
}

export function MessageBubble({
  message,
  isLastMessage,
  onRetry,
  onReference,
  showReferenceButton = true,
  onReferenceClick,
  onOptionClick,
  onFollowUpClick,
  onScrollToMessage,
  className = '',
  userId,
  onInputPopulate,
  notepadOpen,
  onQuoteToNotepad,
  onContentClick
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [selectedText, setSelectedText] = useState('')
  const [showQuoteButton, setShowQuoteButton] = useState(false)
  const [selectionRect, setSelectionRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    viewportTop: number;
    viewportLeft: number;
  } | null>(null)
  const [highlightRects, setHighlightRects] = useState<DOMRect[]>([])
  const { theme } = useTheme()
  const { addActiveSelection, removeActiveSelection } = useGlobalSelectionState()
  
  // Create unique selection ID for this message
  const selectionId = useMemo(() => `selection-${message.id}`, [message.id])
  
  // Cache for position calculations to avoid excessive DOM queries
  const lastValidRect = useRef<DOMRect | null>(null)
  const lastValidRects = useRef<DOMRect[]>([])
  
  // Utility function to validate if a range is still valid
  const isRangeValid = useCallback((range: Range | null): range is Range => {
    if (!range) return false
    
    try {
      // Check if nodes are still connected to DOM
      if (!range.startContainer.isConnected || !range.endContainer.isConnected) {
        return false
      }
      
      // Check if range has valid bounds
      const rects = range.getClientRects()
      return rects.length > 0
    } catch {
      return false
    }
  }, [])
  
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'primary' : 'primary'
  const accentBg = isDark ? 'bg-primary' : 'bg-primary'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-primary/90'
  const accentBgLight = isDark ? 'bg-primary/10' : 'bg-primary/10'
  const accentBorder = isDark ? 'border-primary' : 'border-primary'

  // Check if the message contains linked content
  const hasLinkedContent = Boolean(
    message.content && (
      message.content.includes('@[') ||
      // Also detect backend-processed titles like [Title]
      (message.content.includes('[') && message.content.includes(']'))
    )
  )
  
  // Debug logging for linked content
  if (hasLinkedContent) {
    console.log('🔗 MessageBubble linked content detected:', {
      messageId: message.id,
      content: message.content.substring(0, 100) + '...',
      hasMetadata: !!message.metadata,
      metadata: message.metadata,
      linkRegistry: message.metadata?.linkRegistry,
      debug_linkRegistry: message.metadata?.debug_linkRegistry,
      debug_content: message.metadata?.debug_content,
      metadataKeys: message.metadata ? Object.keys(message.metadata) : []
    })
  }

  // Debounced position update function
  const debouncedUpdatePositions = useCallback((
    updateFn: () => void,
    timerRef: { current: NodeJS.Timeout | null }
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateFn()
    }, 16) // ~60fps update rate
  }, [])

  // Optimized text selection with debounced scroll handling
  useEffect(() => {
    const messageElement = document.getElementById(`message-${message.id}`)
    if (!messageElement) return

    let persistentRange: Range | null = null
    const positionUpdateTimer = { current: null as NodeJS.Timeout | null }

    const updateHighlightPositions = () => {
      if (!showQuoteButton) return
      
      // Validate the range before proceeding
      if (!isRangeValid(persistentRange)) {
        clearSelection()
        return
      }

      try {
        const rects = Array.from(persistentRange.getClientRects())
        if (rects.length === 0) {
          // Try to use cached rects if available and still reasonable
          if (lastValidRects.current.length > 0 && lastValidRect.current) {
            // Only use cache if it's recent (avoid stale positions)
            setHighlightRects(lastValidRects.current)
            setSelectionRect({
              top: lastValidRect.current.top,
              left: lastValidRect.current.left,
              width: lastValidRect.current.width,
              height: lastValidRect.current.height,
              viewportTop: lastValidRect.current.top,
              viewportLeft: lastValidRect.current.left
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
          if (lastValidRect.current && lastValidRect.current.width > 0) {
            return // Keep using cache
          }
          clearSelection()
          return
        }

        // Cache valid rects for fallback
        lastValidRect.current = mainRect
        lastValidRects.current = rects

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
        // Any error in position calculation should clear selection
        console.warn('Text selection position update failed:', error)
        clearSelection()
      }
    }

    const clearSelection = () => {
      setShowQuoteButton(false)
      setHighlightRects([])
      setSelectedText('')
      setSelectionRect(null)
      persistentRange = null
      removeActiveSelection(selectionId)
      
      // Clear cached positions
      lastValidRect.current = null
      lastValidRects.current = []
      
      if (positionUpdateTimer.current) {
        clearTimeout(positionUpdateTimer.current)
        positionUpdateTimer.current = null
      }
    }

    const handleMouseUp = () => {
      setTimeout(() => {
        try {
          const selection = window.getSelection()
          const text = selection?.toString().trim()
          
          // Enhanced validation
          if (!text || text.length === 0 || text.length > 10000) return
          if (!selection || selection.rangeCount === 0) return
          
          const range = selection.getRangeAt(0)
          
          // Comprehensive validation of the selection
          if (!range || range.collapsed) return
          
          // Validate selection is within this message and makes sense
          const isInMessage = messageElement.contains(range.startContainer) && 
                             messageElement.contains(range.endContainer)
          
          if (!isInMessage) return
          
          // Check that the range is valid before proceeding
          if (!isRangeValid(range)) return

          // Clear any existing selection
          clearSelection()

          // Store the selection with validation
          try {
            persistentRange = range.cloneRange()
            setSelectedText(text)
            setShowQuoteButton(true)
            addActiveSelection(selectionId)
            updateHighlightPositions()

            // Clear browser selection after brief delay
            setTimeout(() => {
              const currentSelection = window.getSelection()
              if (currentSelection && currentSelection.rangeCount > 0) {
                currentSelection.removeAllRanges()
              }
            }, 100)
          } catch (error) {
            console.warn('Failed to create text selection:', error)
            clearSelection()
          }
        } catch (error) {
          console.warn('Mouse selection handler error:', error)
        }
      }, 50) // Reduced timing to minimize conflicts
    }

    // Passive scroll handler with debouncing
    const handleScroll = () => {
      if (persistentRange && showQuoteButton) {
        debouncedUpdatePositions(updateHighlightPositions, positionUpdateTimer)
      }
    }

    // Enhanced click outside detection with better target validation
    const handleClickOutside = (event: MouseEvent) => {
      if (!showQuoteButton) return
      
      const target = event.target as Node
      if (!target || !messageElement.contains(target)) {
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
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showQuoteButton) {
        clearSelection()
      }
    }

    // Add event listeners with passive scroll for better performance
    messageElement.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      messageElement.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll, true)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleKeyDown)
      if (positionUpdateTimer.current) clearTimeout(positionUpdateTimer.current)
    }
  }, [message.id, showQuoteButton, addActiveSelection, removeActiveSelection, selectionId, debouncedUpdatePositions, isRangeValid])

  // Cleanup effect when component unmounts or message changes
  useEffect(() => {
    return () => {
      removeActiveSelection(selectionId)
    }
  }, [removeActiveSelection, selectionId])

  // Single condition for when quoting is available
  const canQuote = onInputPopulate || (notepadOpen && onQuoteToNotepad);

  // Handle quote button click for selected text
  const handleQuoteText = () => {
    try {
      // Validate selection
      if (!selectedText || !selectedText.trim()) {
        toast.error('No text selected to quote');
        return;
      }

      // Validate text length (prevent extremely large quotes)
      if (selectedText.length > 10000) {
        toast.error('Selected text is too long to quote (max 10,000 characters)');
        return;
      }

      // Validate that we have valid handlers
      if (!canQuote) {
        toast.error('Quote functionality is not available');
        return;
      }

      // Format as blockquote - split by lines, prefix with "> ", and append newlines
      const quoteToInsert = selectedText
        .split('\n')
        .map(line => line ? `> ${line}` : '>')
        .join('\n') + '\n\n';

      // Validate the formatted quote
      if (!quoteToInsert || quoteToInsert.trim() === '') {
        toast.error('Failed to format quote text');
        return;
      }

      // Attempt to insert the quote
      let insertionSuccessful = false;
      if (notepadOpen && onQuoteToNotepad) {
        try {
          onQuoteToNotepad(quoteToInsert);
          insertionSuccessful = true;
          toast.success('Text quoted to notepad');
        } catch (error) {
          console.error('Failed to quote to notepad:', error);
          toast.error('Failed to add quote to notepad');
        }
      } else if (onInputPopulate) {
        try {
          onInputPopulate(quoteToInsert);
          insertionSuccessful = true;
          toast.success('Text quoted to chat input');
        } catch (error) {
          console.error('Failed to quote to input:', error);
          toast.error('Failed to add quote to chat input');
        }
      }
      
      // Only clear selection if insertion was successful
      if (insertionSuccessful) {
        setSelectedText('');
        setSelectionRect(null);
        setHighlightRects([]);
        setShowQuoteButton(false);
      }
    } catch (error) {
      console.error('Unexpected error in handleQuoteText:', error);
      toast.error('An unexpected error occurred while quoting text');
    }
  };

  // Handle quote entire message
  const handleQuoteEntireMessage = () => {
    try {
      // Validate message content
      if (!message.content || !message.content.trim()) {
        toast.error('Message has no content to quote');
        return;
      }

      // Validate content length
      if (message.content.length > 20000) {
        toast.error('Message is too long to quote (max 20,000 characters)');
        return;
      }

      // Validate that we have valid handlers
      if (!canQuote) {
        toast.error('Quote functionality is not available');
        return;
      }

      // Attempt to insert the quote
      let insertionSuccessful = false;
      if (notepadOpen && onQuoteToNotepad) {
        try {
          onQuoteToNotepad(message.content);
          insertionSuccessful = true;
          toast.success('Message quoted to notepad');
        } catch (error) {
          console.error('Failed to quote message to notepad:', error);
          toast.error('Failed to add message to notepad');
        }
      } else if (onInputPopulate) {
        try {
          onInputPopulate(message.content);
          insertionSuccessful = true;
          toast.success('Message quoted to chat input');
        } catch (error) {
          console.error('Failed to quote message to input:', error);
          toast.error('Failed to add message to chat input');
        }
      }

      if (!insertionSuccessful) {
        toast.error('No valid destination for quote');
      }
    } catch (error) {
      console.error('Unexpected error in handleQuoteEntireMessage:', error);
      toast.error('An unexpected error occurred while quoting message');
    }
  };

  // Determine if this message might contain a completed persona
  // Check for explicit completion flags OR content that indicates persona creation
  const mightHavePersona = message.role === 'assistant' && 
    userId && 
    (message.metadata?.is_persona_complete === true || 
     message.metadata?.persona_created === true ||
     // Fallback: check if message content suggests persona creation completed
     (message.content && (
       message.content.includes('*Your Content Persona*') ||
       message.content.includes('Content Persona') ||
       (message.content.includes('persona') && message.content.includes('guide your content creation'))
     )));

  // Get the text content to copy
  const getTextToCopy = () => {
    if (isUser) {
      return message.content;
    } else {
      return message.chat_response || message.content;
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Persistent Highlight Overlays - only show if this message has active selection */}
      {showQuoteButton && highlightRects.map((rect, index) => (
        <div
          key={`${message.id}-highlight-${index}`}
          data-selection-ui
          className={`fixed pointer-events-none z-30 ${isDark ? 'bg-primary/20' : 'bg-primary/20'} transition-opacity duration-200 quote-overlay`}
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}

      {/* Floating Quote Button - clean and simple */}
      {showQuoteButton && selectionRect && canQuote && (
        <div
          data-selection-ui
          className="fixed z-50 pointer-events-none"
          style={{
            left: selectionRect.viewportLeft + (selectionRect.width / 2) - 20,
            top: selectionRect.viewportTop - 45,
          }}
        >
          <button
            onClick={handleQuoteText}
            data-quote-button
            className={`pointer-events-auto bg-primary text-primary-foreground p-2 rounded-lg shadow-lg hover:bg-primary/90 hover:text-primary-foreground transition-all duration-200 transform hover:scale-105`}
            title={`Quote "${selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"`}
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Bubble Container */}
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
        <div
          className={`max-w-full sm:max-w-[95%] w-full`}
        >
          <div
            id={`message-${message.id}`}
            className={`
              ${isUser ? 'rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-primary text-primary-foreground dark:text-black [&_*]:!text-primary-foreground dark:[&_*]:!text-black mr-1 sm:mr-2' : 'px-0 py-1 text-foreground'}
              relative
              group
              w-full
              min-w-0
            `}
          >
            {/* Referenced message preview */}
            {message.referencedMessage && (
              <button 
                onClick={() => onScrollToMessage?.(message.referencedMessage!.id)}
                className="text-[10px] sm:text-xs text-muted-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded mb-2 break-words text-left transition-colors w-full cursor-pointer min-w-0"
              >
                <div className="font-medium mb-0.5">Replying to:</div>
                <div className="truncate opacity-80 break-words">{message.referencedMessage.content}</div>
              </button>
            )}

            {/* Main message content */}
            <div className="prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 max-w-none break-words word-break-break-word hyphens-auto w-full">
              {mightHavePersona && userId ? (
                <PersonaCardRenderer message={message} userId={userId} />
              ) : isUser && hasLinkedContent ? (
                <>
                  {/* Use ChatContentRenderer for user messages with linked content */}
                  <ChatContentRenderer 
                    content={message.content} 
                    onContentClick={onContentClick}
                  />
                </>
              ) : (
                <>
                  {/* Progressive Thinking Steps - integrated into message content */}
                  {!isUser && (
                    message.status === 'typing' || 
                    message.vectorSearchMetadata?.foundRelevantContent ||
                    (message.statusHistory && message.statusHistory.length > 0) ||
                    message.vectorSearchMetadata
                  ) && (
                    <HorizontalProgressiveThinking 
                      searchStatus={message.searchStatus || ''}
                      statusHistory={message.statusHistory || []}
                      isCompleted={message.status !== 'typing'}
                      vectorSearchMetadata={message.vectorSearchMetadata}
                      onComplete={() => {
                        // This will be called when thinking is complete
                        // The parent component will handle the transition
                      }}
                    />
                  )}
                  
                  {/* Use MarkdownRenderer for assistant messages and user messages without linked content */}
                  <MarkdownRenderer content={message.chat_response || message.content} />
                </>
              )}
            </div>

            {/* Message Actions */}
            <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onReference && showReferenceButton && (
                <button
                  onClick={() => onReference(message)}
                  data-reference-button
                  className="p-1 rounded-full bg-background/70 backdrop-blur-sm border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                  title="Reply"
                >
                  <MessageSquare className="w-3 h-3" />
                </button>
              )}
              {/* Quote entire message button */}
              {canQuote && (
                <button
                  onClick={handleQuoteEntireMessage}
                  className="p-1 rounded-full bg-background/70 backdrop-blur-sm border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                  title="Quote entire message"
                >
                  <Quote className="w-3 h-3" />
                </button>
              )}
              <CopyButton text={getTextToCopy()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}