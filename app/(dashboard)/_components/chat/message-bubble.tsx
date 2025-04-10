'use client'

import type { Message } from '@/app/types'
import type { InteractiveOption } from '@/app/lib/chat/interactive-response'
import type { InteractiveResponse } from '@/app/types'
import { formatDistanceToNow } from 'date-fns'
import { MessageSquare, ChevronRight } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
  onRetry?: () => void
  onReference?: (message: Message) => void
  showReferenceButton?: boolean
  onReferenceClick?: (messageId: number) => void
  onOptionClick?: (option: InteractiveOption) => void
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
  const isTyping = message.status === 'typing'
  const interactiveResponse = message.interactiveResponse

  // Helper function to safely render message content
  const renderMessageContent = (content: any): string => {
    if (typeof content === 'string') return content;
    if (typeof content === 'object' && content !== null) {
      // Handle the specific AI response structure
      if (content.response && typeof content.response === 'string') {
        return content.response;
      }
      if (content.output && typeof content.output === 'string') {
        return content.output;
      }
      if (content.text && typeof content.text === 'string') {
        return content.text;
      }
      // If we have an object with insights and suggestions, format them nicely
      if (content.insights || content.suggestions) {
        let formattedContent = '';
        if (content.response) formattedContent += content.response + '\n\n';
        if (content.insights?.length) {
          formattedContent += 'Insights:\n' + content.insights.map((i: any) => `• ${i}`).join('\n') + '\n\n';
        }
        if (content.suggestions?.length) {
          formattedContent += 'Suggestions:\n' + content.suggestions.map((s: any) => `• ${s}`).join('\n');
        }
        return formattedContent.trim() || 'No content available';
      }
      // Fallback to JSON stringify for other objects
      return JSON.stringify(content, null, 2);
    }
    return 'No content available';
  };
  
  // If it's a typing indicator, show the special bubble
  if (isTyping) {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-white border rounded-2xl px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-heycontent-yellow rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-heycontent-yellow rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-heycontent-yellow rounded-full animate-bounce delay-200" />
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
            text-xs text-text-gray mb-2 
            ${isUser ? 'text-right' : 'text-left'}
            cursor-pointer hover:text-heycontent-yellow transition-colors
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
                {renderMessageContent(message.content)}
              </p>
              
              {message.status === 'failed' && onRetry && (
                <button
                  onClick={onRetry}
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Retry
                </button>
              )}

              {/* Interactive Elements */}
              {interactiveResponse && !isUser && (
                <div className="mt-4 space-y-4">
                  {/* Interactive Options */}
                  {(interactiveResponse.options ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(interactiveResponse.options ?? []).map((option: InteractiveOption, index: number) => (
                        <button
                          key={index}
                          onClick={() => onOptionClick?.(option)}
                          className={`
                            px-3 py-1.5 rounded-full text-sm
                            ${option.type === 'action' ? 'bg-heycontent-light-yellow text-black hover:bg-heycontent-yellow/20' :
                              option.type === 'detail' ? 'bg-heycontent-light-purple text-heycontent-purple hover:bg-heycontent-purple/20' :
                              'bg-gray-100 text-text-gray hover:bg-gray-200'}
                            transition-colors
                          `}
                        >
                          {option.text}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Follow-up Question */}
                  {interactiveResponse.followUp && (
                    <div className="space-y-2">
                      <p className="text-sm text-text-gray">{interactiveResponse.followUp.question}</p>
                      {(interactiveResponse.followUp.choices ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(interactiveResponse.followUp.choices ?? []).map((choice: string, index: number) => (
                            <button
                              key={index}
                              onClick={() => onFollowUpClick?.(choice)}
                              className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-text-gray rounded-full text-sm flex items-center gap-1"
                            >
                              {choice}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Contextual Suggestions */}
                  {(interactiveResponse.contextualSuggestions ?? []).length > 0 && (
                    <div className="text-sm text-text-gray space-y-2">
                      {(interactiveResponse.contextualSuggestions ?? []).map((suggestion: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => onOptionClick?.({ text: suggestion, type: 'suggestion' })}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-text-gray hover:bg-gray-100 transition-colors w-full text-left"
                        >
                          <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reference button for user messages */}
            {isUser && showReferenceButton && onReference && (
              <button
                onClick={() => onReference(message)}
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
  )
} 