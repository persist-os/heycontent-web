'use client'

import type { Message } from '@/app/types/chat'
import { MessageSquare } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
  onRetry?: () => void
  onReference?: (message: Message) => void
  showReferenceButton?: boolean
  onReferenceClick?: (messageId: number) => void
  onOptionClick?: (option: { text: string }) => void
  onFollowUpClick?: (choice: string) => void
}

export function MessageBubble({ 
  message, 
  isLastMessage, 
  onRetry,
  onReference,
  showReferenceButton = true,
  onReferenceClick,
  onOptionClick,
  onFollowUpClick
}: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className="w-full">
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`
            max-w-[90%]
            rounded-2xl 
            px-4 
            py-3 
            ${isUser ? 'bg-heycontent-yellow text-black' : 'bg-white border'} 
            relative
            group
            inline-flex
            flex-col
          `}
        >
          <div className="flex items-start gap-2">
            {/* Reference button for AI messages */}
            {!isUser && showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
                aria-label="Reference message"
                className={`
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
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed overflow-hidden">
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

            {/* Reference button for user messages */}
            {isUser && showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
                aria-label="Reference message"
                className={`
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
        </div>
      </div>
     
     
    </div>
  );
} 