'use client'

import type { Message } from '@/app/types/chat'
import type { InteractiveOption } from './interactive-response'
import { MessageSquare } from 'lucide-react'

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
  className = ''
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

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

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <p className="whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed overflow-hidden">
                  {message.chat_response || message.content}
                </p>

                {message.status === 'failed' && onRetry && (
                  <button
                    onClick={onRetry}
                    className="text-xs text-red-500 hover:text-red-700 mt-1"
                  >
                    Retry
                  </button>
                )}
              </div>

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