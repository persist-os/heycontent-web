'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare, Quote, Search, CheckCircle, Database } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ExpandableInsights } from './expandable-insights'
import { MarkdownRenderer } from '../thinking_lab/components/dialogue/messages/MarkdownRenderer'
import { ContentRenderer as ChatContentRenderer } from '../thinking_lab/components/dialogue/messages/ContentRenderer'
import { PersonaCardRenderer } from './components/PersonaCardRenderer'
import { HorizontalProgressiveThinking } from './components/main_chat/HorizontalProgressiveThinking'
import { CopyButton } from '@/components/ui/copy-button'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTextSelection } from '@/hooks/useTextSelection'
import { useQuoteActions } from '@/hooks/useQuoteActions'
import { TextSelectionWrapper } from '@/components/ui/TextSelectionErrorBoundary'

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
  const { theme } = useTheme()
  // Create unique selection ID for this message
  const selectionId = useMemo(() => `selection-${message.id}`, [message.id])
  
  // Simple selection management - can be enhanced later
  const activeSelections = useRef<Set<string>>(new Set())
  const addActiveSelection = useCallback((id: string) => {
    activeSelections.current.add(id)
  }, [])
  const removeActiveSelection = useCallback((id: string) => {
    activeSelections.current.delete(id)
  }, [])
  
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
  
  // Debounced position update to avoid excessive recalculation during scroll
  const debouncedUpdatePositions = useCallback((
    callback: () => void,
    timer: { current: NodeJS.Timeout | null }
  ) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(callback, 16) // ~60fps
  }, [])

  // Text selection hook
  const { state: textSelectionState, handlers: textSelectionHandlers } = useTextSelection({
    messageId: message.id,
    selectionId,
    addActiveSelection,
    removeActiveSelection,
    debouncedUpdatePositions,
    isRangeValid
  })
  
  const { showQuoteButton, selectedText, selectionRect, highlightRects, hasError, errorMessage } = textSelectionState
  const { clearSelection, setSelectedText, setSelectionRect, setHighlightRects, setShowQuoteButton, resetError } = textSelectionHandlers
  
  // Quote actions hook
  const { handleQuoteText } = useQuoteActions({
    messageId: message.id,
    messageContent: message.content,
    selectedText,
    notepadOpen,
    onQuoteToNotepad,
    onInputPopulate,
    clearSelection,
    announceToScreenReader: textSelectionHandlers.announceToScreenReader
  })
  
  
  // Computed values - organized following component patterns
  const isDark = theme === 'dark'

  const hasLinkedContent = useMemo(() => Boolean(
    message.content && (
      message.content.includes('@[') ||
      (message.content.includes('[') && message.content.includes(']'))
    )
  ), [message.content])
  
  const mightHavePersona = useMemo(() => 
    message.role === 'assistant' && 
    userId && 
    (message.metadata?.is_persona_complete === true || 
     message.metadata?.persona_created === true ||
     (message.content && (
       message.content.includes('*Your Content Persona*') ||
       message.content.includes('Content Persona') ||
       (message.content.includes('persona') && message.content.includes('guide your content creation'))
     ))), [message.role, message.metadata, message.content, userId])
  
  const textToCopy = useMemo(() => 
    isUser ? message.content : (message.chat_response || message.content), 
    [isUser, message.content, message.chat_response])

  // Debug logging for linked content (development only)
  useEffect(() => {
    if (hasLinkedContent && process.env.NODE_ENV === 'development') {
      console.log('🔗 MessageBubble linked content detected:', {
        messageId: message.id,
        content: message.content.substring(0, 100) + '...',
        hasMetadata: !!message.metadata,
        linkRegistry: message.metadata?.linkRegistry
      })
    }
  }, [hasLinkedContent, message.id, message.content, message.metadata])

  return (
    <div className={`w-full ${className}`}>
      {/* Text Selection UI with Error Boundary */}
      <TextSelectionWrapper 
        fallback={hasError ? (
          <div className="text-xs text-muted-foreground p-1 rounded bg-muted/30 flex items-center gap-1">
            <span>Quote feature unavailable</span>
            <button 
              onClick={resetError}
              className="text-primary hover:text-primary/80 underline"
            >
              retry
            </button>
          </div>
        ) : undefined}
      >
      {/* Persistent Highlight Overlays - only show if this message has active selection */}
        {!hasError && showQuoteButton && highlightRects.map((rect, index) => (
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

        {/* Floating Quote Button - clean and simple with accessibility */}
        {!hasError && showQuoteButton && selectionRect && (onInputPopulate || (notepadOpen && onQuoteToNotepad)) && (
        <div
          data-selection-ui
          className="fixed z-50 pointer-events-none"
          style={{
            left: selectionRect.viewportLeft + (selectionRect.width / 2) - 20,
            top: selectionRect.viewportTop - 45,
          }}
            role="tooltip"
            aria-live="polite"
        >
          <button
            onClick={handleQuoteText}
            data-quote-button
              className={`pointer-events-auto bg-primary text-primary-foreground p-2 rounded-lg shadow-lg hover:bg-primary/90 hover:text-primary-foreground transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              aria-label={`Quote selected text: "${selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}". Press Enter or Space to quote this text.`}
            title={`Quote "${selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleQuoteText()
                }
              }}
            >
              <Quote className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Quote selected text</span>
          </button>
        </div>
      )}
      </TextSelectionWrapper>

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
              {/* New: Quote All (markdown) button */}
              {(onInputPopulate || (notepadOpen && onQuoteToNotepad)) && (
                <button
                  onClick={() => {
                    if (notepadOpen && onQuoteToNotepad) {
                      onQuoteToNotepad(message.content);
                    } else if (onInputPopulate) {
                      onInputPopulate(message.content);
                    }
                  }}
                  className="p-1 rounded-full bg-background/70 backdrop-blur-sm border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                  title="Quote entire message (markdown)"
                >
                  <Quote className="w-3 h-3" />
                </button>
              )}
              <CopyButton text={textToCopy} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}