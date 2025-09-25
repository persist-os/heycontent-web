'use client'

import type { Message } from '@/app/types/chat'
import { Quote } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { HorizontalProgressiveThinking } from '../components/HorizontalProgressiveThinking'
import { CopyButton } from '@/components/ui/copy-button'
import React, { useState, useEffect } from 'react'
import { ContentRenderer } from './ContentRenderer'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
  onRetry?: () => void
  onReference?: (message: Message) => void
  showReferenceButton?: boolean
  onReferenceClick?: (messageId: string) => void
  onOptionClick?: (option: any) => void
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

  // Minimal selection detection - don't interfere with native behavior
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      const text = selection?.toString().trim() || ''
      
      if (text) {
        setSelectedText(text)
        setShowQuoteButton(true)
      } else {
        setSelectedText('')
        setShowQuoteButton(false)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  // Handle quote - don't clear native selection
  const handleQuoteText = () => {
    if (selectedText && onQuoteToNotepad) {
      onQuoteToNotepad(selectedText)
      setSelectedText('')
      setShowQuoteButton(false)
      // Don't clear selection - let user copy normally
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Quote button - simple and centered */}
      {showQuoteButton && selectedText && notepadOpen && onQuoteToNotepad && (
        <div 
          className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-lg shadow-lg"
        >
          <button
            onClick={handleQuoteText}
            className="hover:bg-primary/90 transition-all duration-200 transform hover:scale-105"
            title={`Quote "${selectedText.slice(0, 30)}..."`}
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message container - keeping original styling */}
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className={`max-w-full sm:max-w-[95%] w-full`}>
          <div
            id={`message-${message.id}`}
            className={`
              ${isUser 
                ? 'rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-primary text-primary-foreground dark:text-black [&_*]:!text-primary-foreground dark:[&_*]:!text-black mr-1 sm:mr-2' 
                : 'px-0 py-1 text-foreground'
              }
              relative group w-full min-w-0
            `}
            style={{ userSelect: 'text' }}
          >
            {/* Thinking indicator for typing messages */}
            {message.status === 'typing' ? (
              <HorizontalProgressiveThinking 
                searchStatus={message.searchStatus}
                statusHistory={message.statusHistory}
              />
            ) : (
              <>
                {/* Message content */}
                <div className={`${isUser ? 'text-primary-foreground dark:text-black' : 'text-foreground'}`} style={{ userSelect: 'text' }}>
                  <MarkdownRenderer content={message.content} />
                </div>

                {/* Content renderer for linked content - only if content has @ links */}
                {message.content.includes('@[') && (
                  <ContentRenderer 
                    content={message.content}
                    onContentClick={onContentClick}
                  />
                )}

                {/* Action buttons - fixed bottom right */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ userSelect: 'none' }}>
                  <CopyButton 
                    text={message.content}
                    className="w-6 h-6 p-1 hover:bg-background/80 rounded"
                    size="sm"
                  />
                  
                  {/* Quote full message button */}
                  {notepadOpen && onQuoteToNotepad && (
                    <button
                      onClick={() => onQuoteToNotepad(message.content)}
                      className="w-6 h-6 p-1 hover:bg-background/80 rounded opacity-70 hover:opacity-100 flex items-center justify-center"
                      title="Send full message to notepad"
                    >
                      <Quote className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}