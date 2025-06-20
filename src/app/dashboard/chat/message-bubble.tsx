'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare, Quote, Search, CheckCircle, Database } from 'lucide-react'
import { ExpandableInsights } from './expandable-insights'
import { MarkdownRenderer } from './markdown-renderer'
import { PersonaCardRenderer } from './components/PersonaCardRenderer'
import { ThinkingIndicator } from './components/ThinkingIndicator'
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

  // Simple selection handler
  useEffect(() => {
    const messageElement = document.getElementById(`message-${message.id}`)
    if (!messageElement) return

    const handleMouseUp = () => {
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim()
        
        if (!text || text.length === 0) {
          setShowQuoteButton(false)
          setHighlightRects([])
          return
        }

        if (!selection || selection.rangeCount === 0) return
        
        const range = selection.getRangeAt(0)
        
        // Simple check: is the selection in this message?
        const isInMessage = messageElement.contains(range.startContainer) && 
                           messageElement.contains(range.endContainer)
        
        if (!isInMessage) return

        // Get all client rects for multi-line selections
        const rects = Array.from(range.getClientRects())
        const mainRect = rects.length > 0 ? rects[0] : range.getBoundingClientRect()
        
        // Simple validation
        if (mainRect.width <= 0 || mainRect.height <= 0) return

        console.log('✅ Selection captured:', text)

        setSelectedText(text)
        setSelectionRect({
          top: mainRect.top,
          left: mainRect.left,
          width: mainRect.width,
          height: mainRect.height,
          viewportTop: mainRect.top,
          viewportLeft: mainRect.left
        })
        setHighlightRects(rects)
        setShowQuoteButton(true)

        // Don't clear the browser selection immediately - let user see it briefly
        setTimeout(() => {
          window.getSelection()?.removeAllRanges()
        }, 100)

        // Auto-hide after 10 seconds
        setTimeout(() => {
          setShowQuoteButton(false)
          setHighlightRects([])
        }, 10000)
      }, 100)
    }

    // Clear selection on click elsewhere
    const handleClickOutside = (event: MouseEvent) => {
      if (!messageElement.contains(event.target as Node)) {
        setShowQuoteButton(false)
        setHighlightRects([])
      }
    }

    messageElement.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClickOutside)
    
    return () => {
      messageElement.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [message.id])

  // Handle quote button click
  const handleQuoteText = () => {
    if (selectedText) {
      if (notepadOpen && onQuoteToNotepad) {
        onQuoteToNotepad(`"${selectedText}"`)
      } else if (onInputPopulate) {
        onInputPopulate(`"${selectedText}"`)
      }
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
       message.content.includes('🎭 *Your Content Persona*') ||
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
      {/* Persistent Highlight Overlays - like ChatGPT */}
      {highlightRects.map((rect, index) => (
        <div
          key={index}
          className="fixed pointer-events-none z-30 bg-blue-200/40 dark:bg-blue-400/30"
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
            className="pointer-events-auto bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
            title={`Quote "${selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"`}
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Chat Bubble Container */}
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
        <div
          id={`message-${message.id}`}
          className={`
            ${isUser ? 'max-w-[80%]' : 'max-w-[90%]'}
            rounded-2xl
            ${isUser ? 'px-3 sm:px-4 py-2 sm:py-3' : 'px-4 sm:px-6 py-3 sm:py-4'}
            ${isUser ? 'bg-heycontent-yellow text-black' : 'bg-white border'}
            relative
            group
          `}
        >
          {/* Referenced message preview */}
          {message.referencedMessage && (
            <button 
              onClick={() => onScrollToMessage?.(message.referencedMessage!.id)}
              className="text-[10px] sm:text-xs text-gray-500 bg-black/5 hover:bg-black/10 p-1.5 rounded mb-2 break-words text-left transition-colors w-full cursor-pointer"
            >
              <div className="font-medium mb-0.5">Replying to:</div>
              <div className="line-clamp-2">{message.referencedMessage.content}</div>
            </button>
          )}
          
          {/* Vector Search Context */}
          {message.role === 'assistant' && message.vector_search_metadata && (
            <VectorSearchContext vectorSearchMetadata={message.vector_search_metadata} />
          )}

          {/* Message Content - Full Width */}
          <div className="w-full">
            <div className="break-words chat-font">
              {message.status === 'typing' ? (
                <div className="space-y-2">
                  <ThinkingIndicator />
                  {message.searchStatus && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <Search className="w-3 h-3 mr-1.5 flex-shrink-0" />
                      <span>{message.searchStatus}</span>
                    </div>
                  )}
                </div>
              ) : mightHavePersona ? (
                <>
                  <MarkdownRenderer 
                    content={message.chat_response || message.content} 
                    className=""
                  />
                  <PersonaCardRenderer message={message} userId={userId} />
                </>
              ) : (
                <MarkdownRenderer 
                  content={message.chat_response || message.content} 
                  className=""
                />
              )}
            </div>

            {message.status === 'failed' && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                Retry
              </button>
            )}
          </div>
          
          {/* Expandable Insights for assistant messages with suggestions - inside bubble */}
          {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
            <div className="mt-3">
              <ExpandableInsights
                message={{
                  ...message,
                  suggestions: message.metadata.suggestions,
                }}
                onSuggestionPress={onFollowUpClick}
                onInputPopulate={onInputPopulate}
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Outside and Below Bubble */}
      {message.status !== 'typing' && (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
          <div className={`flex items-center gap-2 ${isUser ? 'mr-4' : 'ml-4'}`}>
            {/* Copy Button */}
            <CopyButton
              text={getTextToCopy()}
              className="opacity-60 hover:opacity-100 transition-opacity duration-200"
              size="sm"
              variant="ghost"
              tooltipText={`Copy ${isUser ? 'your message' : 'AI response'}`}
            />
            
            {/* Quote Button - appears when text is selected */}
            {showQuoteButton && onInputPopulate && (
              <button
                onClick={handleQuoteText}
                aria-label="Quote selected text"
                className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                title={`Quote "${selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText}"`}
              >
                <Quote className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            
            {/* Reference/Reply Button */}
            {showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
                aria-label="Reference message"
                className="opacity-60 hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}