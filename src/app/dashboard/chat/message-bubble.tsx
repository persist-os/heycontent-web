'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare, Quote, Search, CheckCircle, Database } from 'lucide-react'
import { useTheme } from 'next-themes'
import { ExpandableInsights } from './expandable-insights'
import { MarkdownRenderer, ChatContentRenderer } from './markdown-renderer'
import { PersonaCardRenderer } from './components/PersonaCardRenderer'
import { ThinkingIndicator } from './components/main_chat/ThinkingIndicator'
import { CopyButton } from '@/components/ui/copy-button'
import React, { useState, useEffect } from 'react'
import VectorSearchContext from './components/VectorSearchContext'

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
  onQuoteToNotepad
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
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'primary' : 'primary'
  const accentBg = isDark ? 'bg-primary' : 'bg-primary'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-primary/90'
  const accentBgLight = isDark ? 'bg-primary/10' : 'bg-primary/10'
  const accentBorder = isDark ? 'border-primary' : 'border-primary'

  // Check if the message contains linked content
  const hasLinkedContent = message.content && message.content.includes('@[')

  // Stable selection handler with scroll support
  useEffect(() => {
    const messageElement = document.getElementById(`message-${message.id}`)
    if (!messageElement) return

    let persistentRange: Range | null = null

    const updateHighlightPositions = () => {
      if (!persistentRange) return

      try {
        const rects = Array.from(persistentRange.getClientRects())
        const mainRect = rects.length > 0 ? rects[0] : persistentRange.getBoundingClientRect()
        
        if (mainRect.width <= 0 || mainRect.height <= 0) return

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
        // Range might be invalid, clear selection
        console.log('Range invalid, clearing selection')
        clearSelection()
      }
    }

    const clearSelection = () => {
      setShowQuoteButton(false)
      setHighlightRects([])
      setSelectedText('')
      setSelectionRect(null)
      persistentRange = null
    }

    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()
        
        if (!text || text.length === 0) {
          return
        }

        if (!selection || selection.rangeCount === 0) return
        
        const range = selection.getRangeAt(0)
        
        // Simple check: is the selection in this message?
        const isInMessage = messageElement.contains(range.startContainer) && 
                           messageElement.contains(range.endContainer)
        
        if (!isInMessage) return

        // Clear any existing selection first to prevent overlaps
        clearSelection()

        // Clone the range to persist it
        persistentRange = range.cloneRange()
        
        console.log('✅ Selection captured:', text)

        setSelectedText(text)
        updateHighlightPositions()
        setShowQuoteButton(true)

        // Don't clear the browser selection immediately - let user see it briefly
        setTimeout(() => {
          window.getSelection()?.removeAllRanges()
        }, 100)
      }, 100)
    }

    // Handle scroll to update positions
    const handleScroll = () => {
      if (persistentRange && showQuoteButton) {
        updateHighlightPositions()
      }
    }

    // Clear selection on click outside this message
    const handleClickOutside = (event: MouseEvent) => {
      if (!messageElement.contains(event.target as Node) && showQuoteButton) {
        clearSelection()
      }
    }

    // Clear selection only on explicit dismiss (clicking quote button or ESC key)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showQuoteButton) {
        clearSelection()
      }
    }

    messageElement.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('scroll', handleScroll, true) // Use capture to catch all scroll events
    window.addEventListener('resize', handleScroll) // Also update on resize
    document.addEventListener('click', handleClickOutside, true)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      messageElement.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [message.id, showQuoteButton])

  // Handle quote button click
  const handleQuoteText = () => {
    if (selectedText) {
      if (notepadOpen && onQuoteToNotepad) {
        onQuoteToNotepad(`"${selectedText}"`)
      } else if (onInputPopulate) {
        onInputPopulate(`"${selectedText}"`)
      }
      // Clear the selection after using it
      setSelectedText('')
      setSelectionRect(null)
      setHighlightRects([])
      setShowQuoteButton(false)
    }
  }

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

  // Debug logging for persona detection
  if (message.role === 'assistant' && userId) {
    console.log('🔍 MessageBubble persona check:', {
      messageId: message.id,
      messageContent: message.content?.substring(0, 100) + '...',
      hasMetadata: !!message.metadata,
      metadata: message.metadata,
      mightHavePersona,
      is_persona_complete: message.metadata?.is_persona_complete,
      persona_created: message.metadata?.persona_created
    });
  }

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
          className={`fixed pointer-events-none z-30 ${isDark ? 'bg-primary/20' : 'bg-primary/20'} transition-opacity duration-200`}
          style={{
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }}
        />
      ))}

      {/* Floating Quote Button - clean and simple */}
      {showQuoteButton && selectionRect && (onInputPopulate || (notepadOpen && onQuoteToNotepad)) && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: selectionRect.viewportLeft + (selectionRect.width / 2) - 20,
            top: selectionRect.viewportTop - 45,
          }}
        >
          <button
            onClick={handleQuoteText}
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
          className={`flex-shrink max-w-full sm:max-w-[80%] ${isUser ? '' : 'sm:max-w-[90%]'}`}
        >
          <div
            id={`message-${message.id}`}
            className={`
              rounded-2xl
              px-3 sm:px-4 py-2 sm:py-3
              ${isUser ? 'bg-primary text-primary-foreground dark:text-black [&_*]:!text-primary-foreground dark:[&_*]:!text-black' : 'bg-card border text-foreground'}
              relative
              group
              w-full
            `}
          >
            {/* Referenced message preview */}
            {message.referencedMessage && (
              <button 
                onClick={() => onScrollToMessage?.(message.referencedMessage!.id)}
                className="text-[10px] sm:text-xs text-muted-foreground bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded mb-2 break-words text-left transition-colors w-full cursor-pointer"
              >
                <div className="font-medium mb-0.5">Replying to:</div>
                <div className="truncate opacity-80">{message.referencedMessage.content}</div>
              </button>
            )}

            {/* Vector Search Context Display - ABOVE message content */}
            {!isUser && message.vectorSearchMetadata && (
              <VectorSearchContext
                vectorSearchMetadata={message.vectorSearchMetadata}
              />
            )}

            {/* Main message content */}
            <div className="prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 max-w-none break-words">
              {message.status === 'typing' ? (
                <ThinkingIndicator />
              ) : mightHavePersona && userId ? (
                <PersonaCardRenderer message={message} userId={userId} />
              ) : isUser && hasLinkedContent ? (
                // Use ChatContentRenderer for user messages with linked content
                <ChatContentRenderer content={message.content} />
              ) : (
                // Use MarkdownRenderer for assistant messages and user messages without linked content
                <MarkdownRenderer content={message.chat_response || message.content} />
              )}
            </div>

            {/* Message Actions */}
            <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {onReference && showReferenceButton && (
                <button
                  onClick={() => onReference(message)}
                  className="p-1 rounded-full bg-background/70 backdrop-blur-sm border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
                  title="Reply"
                >
                  <MessageSquare className="w-3 h-3" />
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