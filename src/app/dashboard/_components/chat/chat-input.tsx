'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageSquare, Brain } from 'lucide-react'
import { Message } from '@/app/types'
import { MentionInput } from '@/components/ui/mention-input'

interface ChatInputProps {
  onSend: (message: string, mentions?: Array<{id: string, type: 'platform' | 'content', subtype: string, title: string}>) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLInputElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
  hasContext?: boolean
  contextPlatform?: string
  hasAnalysis?: boolean
  userId?: string
}

const placeholders = [
  "Ask about content strategy... (Try @ for emails, # for videos)",
  "Analyze audience growth...",
  "Get partnership recommendations...",
  "Optimize engagement...",
]

const contextPlaceholders = [
  "Ask about this content's analysis...",
  "What insights can you share?",
  "How can I improve this content?",
  "What trends do you see?",
]

export function ChatInput({
  onSend,
  isLoading,
  inputRef,
  maxLength = 5000,
  referencedMessage,
  onClearReference,
  autoFocus = true,
  hasContext = false,
  contextPlatform,
  hasAnalysis = false,
  userId
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const [showFullReply, setShowFullReply] = useState(false)
  const [mentions, setMentions] = useState<Array<{id: string, type: 'platform' | 'content', subtype: string, title: string}>>([])
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Use context-aware placeholders when analysis is available
  const activePlaceholders = hasAnalysis ? contextPlaceholders : placeholders

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = activePlaceholders.indexOf(prev)
        const nextIndex = (currentIndex + 1) % activePlaceholders.length
        return activePlaceholders[nextIndex] || activePlaceholders[0]
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [activePlaceholders])

  // Update placeholder when context changes
  useEffect(() => {
    setPlaceholder(activePlaceholders[0])
  }, [hasAnalysis, activePlaceholders])

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto'
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`
    }
  }, [input])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textAreaRef.current && !isLoading) {
      textAreaRef.current.focus()
    }
  }, [autoFocus, isLoading, referencedMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && input.length <= maxLength) {
      onSend(input.trim(), mentions.length > 0 ? mentions : undefined)
      setInput('')
      setMentions([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleMentionSelect = (mentionItem: any) => {
    // Map MentionItem to our expected mention structure
    const mention = {
      id: mentionItem.id,
      type: mentionItem.type, // This is already 'platform' or 'content'
      subtype: mentionItem.subtype,
      title: mentionItem.title || mentionItem.fileName
    }
    
    // Add to mentions array if not already present
    setMentions(prev => {
      const exists = prev.find(m => m.id === mention.id && m.type === mention.type && m.subtype === mention.subtype)
      if (!exists) {
        return [...prev, mention]
      }
      return prev
    })
  }

  const characterCount = input.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="py-3 w-full">
        {/* Context indicator */}
        {hasContext && (
          <div className="w-full mb-3">
            <div className={`flex items-center gap-2 text-xs p-3 rounded-lg border transition-all ${
              hasAnalysis 
                ? 'text-violet-700 dark:text-violet-300 bg-violet-50/50 dark:bg-violet-950/20 border-violet-200/50 dark:border-violet-800/50'
                : 'text-gray-700 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/40 border-gray-200/50 dark:border-gray-700/50'
            }`}>
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span>
                {hasAnalysis 
                  ? `AI analysis for this ${contextPlatform} content will be included as context`
                  : `Discussing ${contextPlatform} content`
                }
              </span>
            </div>
          </div>
        )}

        {/* Referenced message preview - mobile responsive */}
        {referencedMessage && (
          <div className="w-full mb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/40 p-2 sm:p-3 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <button 
                onClick={() => setShowFullReply(!showFullReply)}
                className="flex-1 text-left hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <span className={showFullReply ? "break-words whitespace-pre-wrap" : "truncate block"}>
                  Replying to: {showFullReply 
                    ? referencedMessage.content 
                    : referencedMessage.content.length > 60 
                      ? `${referencedMessage.content.slice(0, 60)}...` 
                      : referencedMessage.content}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 flex-shrink-0 transition-colors"
                aria-label="Clear reply"
              >
                <span className="text-base font-medium">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Mention references preview */}
        {mentions.length > 0 && (
          <div className="w-full mb-3">
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Referenced:</div>
              {mentions.map((mention) => (
                <div
                  key={`${mention.type}-${mention.id}-${mention.subtype}`}
                  className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <span>{mention.type === 'platform' ? '📦' : '📄'}</span>
                  <span className="truncate max-w-[200px]">{mention.title}</span>
                  <button
                    onClick={() => setMentions(prev => prev.filter(m => !(m.id === mention.id && m.type === mention.type && m.subtype === mention.subtype)))}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 items-end w-full relative">
          <div className="flex-1 relative">
            <div className={`flex items-center rounded-2xl transition-all duration-200 bg-gray-50 dark:bg-gray-800 border-2
              ${isAtLimit ? 'border-red-400 dark:border-red-500' : ''}
              ${isNearLimit && !isAtLimit ? 'border-amber-400 dark:border-amber-500' : ''}
              ${!isAtLimit && !isNearLimit ? 'border-transparent hover:border-gray-200 dark:hover:border-gray-600' : ''}
              focus-within:border-heycontent-yellow focus-within:bg-white dark:focus-within:bg-gray-700
              px-4 py-3 pr-16
            `}>
              <MentionInput
                value={input}
                onChange={setInput}
                onMentionSelect={handleMentionSelect}
                placeholder={placeholder}
                className="text-sm leading-relaxed flex-1 bg-transparent border-0 outline-0 resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400"
                userId={userId}
                disabled={isLoading}
                onKeyPress={handleKeyDown}
              />
              
              {/* Character count - positioned inside the input */}
              {!isLoading && (
                <div className={`absolute right-14 bottom-3 text-xs pointer-events-none
                  ${isAtLimit ? 'text-red-500 font-medium' : ''}
                  ${isNearLimit && !isAtLimit ? 'text-amber-500 font-medium' : 'text-gray-400 dark:text-gray-500'}
                  transition-colors duration-200
                `}>
                  {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
                </div>
              )}
              
              {/* Send button - positioned inside the input */}
              <button
                type="submit"
                aria-label="Send message"
                disabled={isLoading || !input.trim() || isAtLimit}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isLoading || !input.trim() || isAtLimit 
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  )
}