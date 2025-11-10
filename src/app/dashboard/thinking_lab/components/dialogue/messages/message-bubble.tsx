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
// Removed dialogueStore import - using conversation hooks instead
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
  const isCoordination = message.contentType === 'widget_coordination'
  
  const { text: sendToNotepadTooltip } = useTranslation('Send full message to notepad', {
    context: 'message.quote_to_notepad'
  })

  // Star rating functionality
  const [messageRating, setMessageRating] = React.useState(0)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = React.useState(false)
  
  const handleRateFeedback = React.useCallback(async (rating: number, feedbackText?: string) => {
    if (!userId || !message.id || !message.decisionId) {
      console.warn('Missing required fields for feedback', { userId, messageId: message.id, decisionId: message.decisionId })
      return
    }
    
    setIsSubmittingFeedback(true)
    try {
      const { fetchWithApiKey } = await import('@/app/lib/api-helpers')
      
      // Extract message_index from message sequence field
      // sequence is the message's position in the conversation (0, 1, 2, ...)
      // For assistant messages, this IS the message_index we need
      let message_index: number | undefined = (message as any).sequence
      
      // If sequence not available, try to calculate from message index in conversation
      // This is a fallback - ideally sequence should always be present
      if (message_index === undefined) {
        // Note: This requires access to all messages, which we don't have here
        // Backend will handle this case
        console.warn('Message sequence not available, backend will calculate from decision')
      }
      
      // Build request body, omitting undefined fields
      const requestBody: any = {
        decision_id: message.decisionId,
        rating,
        message_id: message.id,
        conversation_id: message.sessionId || message.id,  // Use sessionId as conversation_id fallback
      }
      
      // Only include optional fields if they have values
      if (message.contextDecisionId) {
        requestBody.context_decision_id = message.contextDecisionId
      }
      if (feedbackText) {
        requestBody.feedback_text = feedbackText
      }
      if (message_index !== undefined) {
        requestBody.message_index = message_index
      }
      
      const response = await fetchWithApiKey('/api/v1/feedback/chat_message', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Feedback submission failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      setMessageRating(rating)
      
      // Optional: Show success toast
      console.log('Feedback submitted successfully:', result)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      // Optional: Show error toast to user
    } finally {
      setIsSubmittingFeedback(false)
    }
  }, [userId, message.id, message.decisionId, message.contextDecisionId, message.sessionId])

  return (
    <div className={`w-full ${className}`}>
      {/* Message container */}
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-1 group`}>
        <div className={`max-w-full sm:max-w-[95%] w-full`}>
          <div
            id={`message-${message.id}`}
            className={`
              ${isCoordination
                ? 'rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800'
                : isUser 
                ? 'rounded-2xl px-5 sm:px-7 py-2 sm:py-3 bg-primary text-primary-darker [&_*]:!text-primary-darker mr-1 sm:mr-2' 
                : 'px-0 py-1 text-foreground'
              }
              relative w-full min-w-0
            `}
          >
            {/* Thinking indicator for typing messages */}
            {message.status === 'typing' && !message.content ? (
              // Show thinking indicator while loading (only if no content)
              <div className="relative min-h-[60px]">
                <div className="flex items-center">
                  <HorizontalProgressiveThinking />
                </div>
              </div>
            ) : (
              <>
                {/* Coordination badge for A2A messages */}
                {isCoordination && (
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                    <span className="text-lg">🤝</span>
                    <span>Widget Coordination</span>
                  </div>
                )}
                
                {/* Message content - show streaming content in real-time */}
                <div className={`${isCoordination ? 'text-blue-900 dark:text-blue-100' : isUser ? 'text-primary-darker' : 'text-foreground'}`}>
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