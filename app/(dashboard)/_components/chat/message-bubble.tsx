'use client'

import { Message } from '@/types/chat'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
  onRetry?: () => void
  onReference?: (message: Message) => void
  showReferenceButton?: boolean
  onReferenceClick?: (messageId: number) => void
}

export function MessageBubble({ 
  message, 
  isLastMessage, 
  onRetry,
  onReference,
  showReferenceButton = true,
  onReferenceClick
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isTyping = message.status === 'typing'
  
  // If it's a typing indicator, show the special bubble
  if (isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-white border rounded-2xl px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative">
      {/* Referenced message preview */}
      {message.referencedMessage && (
        <div 
          onClick={() => onReferenceClick?.(message.referencedMessage!.id)}
          className={`
            text-xs text-gray-500 mb-2 
            ${isUser ? 'text-right' : 'text-left'}
            cursor-pointer hover:text-blue-500 transition-colors
            flex items-center gap-1
            ${isUser ? 'justify-end' : 'justify-start'}
          `}
        >
          <MessageSquare className="w-3 h-3" />
          <span>
            Replying to: "{message.referencedMessage.content.substring(0, 60)}..."
          </span>
        </div>
      )}

      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div 
          className={`
            max-w-[70%] 
            rounded-2xl 
            px-4 
            py-3 
            ${isUser ? 'bg-blue-500 text-white' : 'bg-white border'} 
            relative
            group
          `}
        >
          <div className="flex items-start gap-2">
            {/* Reference button for AI messages */}
            {!isUser && showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
                className={`
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  p-1 rounded-full
                  bg-gray-100
                  hover:bg-opacity-80
                  mt-0.5
                `}
              >
                <MessageSquare className="w-3 h-3 text-gray-500" />
              </button>
            )}
            
            {/* Message Content */}
            <div className="flex-1">
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
              
              {message.status === 'failed' && onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Retry
                </button>
              )}
              
              {/* Timestamp */}
              <div 
                className={`
                  text-xs 
                  mt-1 
                  ${isUser ? 'text-blue-100' : 'text-gray-500'}
                `}
              >
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </div>
            </div>

            {/* Reference button for user messages */}
            {isUser && showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
                className={`
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-200
                  p-1 rounded-full
                  bg-blue-400
                  hover:bg-opacity-80
                  mt-0.5
                `}
              >
                <MessageSquare className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 