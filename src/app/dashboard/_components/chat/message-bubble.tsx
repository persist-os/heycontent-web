'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare } from 'lucide-react'
import { ExpandableInsights } from './expandable-insights'
import { MarkdownRenderer } from './markdown-renderer'
import { PersonaCardRenderer } from './components/PersonaCardRenderer'

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
  userId
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

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

  return (
    <div className={`w-full ${className}`}>
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2 sm:mb-4`}>
        <div
          className={`
            max-w-[85%] sm:max-w-[80%] md:max-w-[75%]
            rounded-2xl
            px-3 sm:px-4
            py-2 sm:py-3
            ${isUser ? 'bg-heycontent-yellow text-black' : 'bg-white border'}
            relative
            group
            inline-flex
            flex-col
          `}
        >
          <div className="flex flex-col gap-1">
            {/* Referenced message preview */}
            {message.referencedMessage && (
              <button 
                onClick={() => onScrollToMessage?.(message.referencedMessage!.id)}
                className="text-[10px] sm:text-xs text-gray-500 bg-black/5 hover:bg-black/10 p-1.5 rounded mb-1 break-words text-left transition-colors w-full cursor-pointer"
              >
                <div className="font-medium mb-0.5">Replying to:</div>
                <div className="line-clamp-2">{message.referencedMessage.content}</div>
              </button>
            )}
            
            <div className="flex items-start gap-1 sm:gap-2">
              {/* Reference button for AI messages - hidden on mobile, visible on hover for desktop */}
              {!isUser && showReferenceButton && onReference && (
                <button
                  onClick={() => onReference(message)}
                  aria-label="Reference message"
                  className={`
                    hidden sm:block
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    p-1 rounded-full
                    bg-gray-100
                    hover:bg-opacity-80
                    mt-0.5
                    flex-shrink-0
                  `}
                >
                  <MessageSquare className="w-3 h-3 text-text-gray" />
                </button>
              )}

              {/* Message Content or Persona Card */}
              <div className="flex-1 min-w-0">
                <div className="break-words overflow-hidden">
                  {mightHavePersona ? (
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

              {/* Expandable Insights for assistant messages with suggestions */}
              {!isUser && message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                <div className="mt-2">
                  <ExpandableInsights
                    message={{
                      ...message,
                      suggestions: message.metadata.suggestions,
                    }}
                    onSuggestionPress={onFollowUpClick}
                  />
                </div>
              )}

              {/* Reference button for user messages - hidden on mobile, visible on hover for desktop */}
              {isUser && showReferenceButton && onReference && (
                <button
                  onClick={() => onReference(message)}
                  aria-label="Reference message"
                  className={`
                    hidden sm:block
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                    p-1 rounded-full
                    bg-heycontent-yellow/80
                    hover:bg-opacity-80
                    mt-0.5
                  `}
                >
                  <MessageSquare className="w-3 h-3 text-black" />
                </button>
              )}
            </div>

            {/* Mobile-only reference buttons - always visible at bottom of message */}
            <div className="sm:hidden flex justify-end mt-1">
              {onReference && (
                <button
                  onClick={() => onReference(message)}
                  aria-label="Reference message"
                  className={`
                    p-1 rounded-full
                    ${isUser ? 'bg-heycontent-yellow/80' : 'bg-gray-100'}
                    hover:bg-opacity-80
                    flex-shrink-0
                    scale-90
                  `}
                >
                  <MessageSquare className={`w-3 h-3 ${isUser ? 'text-black' : 'text-text-gray'}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}