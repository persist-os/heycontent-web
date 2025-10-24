'use client'

import type { Message } from '@/app/types/chat'
import { Quote } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { HorizontalProgressiveThinking } from '../components/HorizontalProgressiveThinking'
import { CopyButton } from '@/components/ui/copy-button'
import React from 'react'
import { ContentRenderer } from './ContentRenderer'
import { FileAttachmentRenderer } from '@/components/ui/FileAttachmentRenderer'
import { useTranslation } from '@/hooks/useTranslation'
import { StarRating } from '@/components/ui/star-rating'
import { useDialogueStore } from '@/app/dashboard/thinking_lab/stores/dialogueStore'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'

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
  
  const { text: sendToNotepadTooltip } = useTranslation('Send full message to notepad', {
    context: 'message.quote_to_notepad'
  })

  return (
    <div className={`w-full ${className}`}>
      {/* Message container */}
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1 group`}>
        <div className={`max-w-full sm:max-w-[95%] w-full`}>
          <div
            id={`message-${message.id}`}
            className={`
              ${isUser 
                ? 'rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-primary text-primary-foreground dark:text-black [&_*]:!text-primary-foreground dark:[&_*]:!text-black mr-1 sm:mr-2' 
                : 'px-0 py-1 text-foreground'
              }
              relative w-full min-w-0
            `}
          >
            {/* Thinking indicator for typing messages */}
            {message.status === 'typing' ? (
              // Crossfade between thinking indicator and streaming content
              <div className="relative min-h-[60px]">
                {/* Thinking indicator - fades out when content arrives */}
                <div 
                  className="absolute inset-0 flex items-center transition-opacity duration-300 ease-out"
                  style={{ 
                    opacity: message.content ? 0 : 1,
                    pointerEvents: message.content ? 'none' : 'auto'
                  }}
                >
                  <HorizontalProgressiveThinking />
                </div>
                
                {/* Streaming content - fades in as it arrives */}
                {message.content && (
                  <div 
                    className={`transition-opacity duration-300 ease-out ${isUser ? 'text-primary-foreground dark:text-black' : 'text-foreground'}`}
                    style={{ opacity: 1 }}
                  >
                    <MarkdownRenderer content={message.content} />
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Message content */}
                <div className={`${isUser ? 'text-primary-foreground dark:text-black' : 'text-foreground'}`}>
                  <MarkdownRenderer content={message.content} />
                </div>

                {/* File attachments */}
                {message.fileAttachments && message.fileAttachments.length > 0 && (
                  <div className="mt-3">
                    <FileAttachmentRenderer attachments={message.fileAttachments} />
                  </div>
                )}

                {/* Content renderer for linked content - only if content has @ links */}
                {message.content.includes('@[') && (
                  <ContentRenderer 
                    content={message.content}
                    onContentClick={onContentClick}
                  />
                )}

              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons below message */}
      <div className={`flex items-center gap-1 mt-2 opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
        <CopyButton 
          text={message.content}
          className="!w-8 !h-8 !p-2 hover:bg-background/80 rounded flex items-center justify-center"
          size="lg"
        />
        
        {/* Quote full message button */}
        {notepadOpen && onQuoteToNotepad && (
          <button
            onClick={() => onQuoteToNotepad(message.content)}
            className="w-8 h-8 p-2 hover:bg-background/80 rounded opacity-70 hover:opacity-100 flex items-center justify-center"
            title={sendToNotepadTooltip}
          >
            <Quote className="w-5 h-5" />
          </button>
        )}
        
        {/* Star rating for assistant messages only */}
        {!isUser && message.status !== 'typing' && (
          <div className="ml-2">
            <StarRating
              size="sm"
              value={messageRating}
              onRate={handleRateFeedback}
              disabled={isSubmittingFeedback}
              allowFeedbackText={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}