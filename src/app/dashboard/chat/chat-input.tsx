'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageSquare, Brain } from 'lucide-react'
import { Message } from '@/app/types'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
  hasContext?: boolean
  contextPlatform?: string
  hasAnalysis?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  useContextSearch?: boolean
  onToggleContextSearch?: (enabled: boolean) => void
  embeddingInfo?: { hasEmbeddings: boolean; count: number }
}

const placeholders = [
  "Ask about content strategy...",
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
  inputValue,
  onInputChange,
  useContextSearch,
  onToggleContextSearch,
  embeddingInfo
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const [showFullReply, setShowFullReply] = useState(false)
  const internalInputRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef || internalInputRef

  // Use external input value if provided, otherwise use internal state
  const currentInput = inputValue !== undefined ? inputValue : input
  const setCurrentInput = (value: string) => {
    if (inputValue !== undefined) {
      onInputChange?.(value)
    } else {
      setInput(value)
    }
  }

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
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const scrollHeight = Math.min(textarea.scrollHeight, 120) // Max height of ~3 lines
      textarea.style.height = `${scrollHeight}px`
    }
  }, [currentInput, textareaRef])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isLoading) {
      textareaRef.current.focus()
    }
  }, [autoFocus, isLoading, referencedMessage, textareaRef])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentInput.trim() && !isLoading && currentInput.length <= maxLength) {
      onSend(currentInput.trim())
      setCurrentInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        if (!currentInput.trim() || isLoading || characterCount >= maxLength) return
        onSend(currentInput.trim())
        setCurrentInput('')
      }
    }
  }

  const characterCount = currentInput.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  // Dynamic placeholder based on context
  let contextPlaceholder = placeholder
  if (hasContext && contextPlatform) {
    if (contextPlatform === 'ai-insights') {
      contextPlaceholder = "Ask about these insights..."
    } else if (contextPlatform === 'smart-notes') {
      contextPlaceholder = "Ask about your notes..."
    } else {
      contextPlaceholder = `Ask about your ${contextPlatform} content...`
    }
  } else if (hasAnalysis) {
    contextPlaceholder = "Ask me anything about your content..."
  }

  return (
    <div className="shrink-0 bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="p-2 sm:p-3">
        {/* Context Search Toggle - Only show when embeddings are available */}
        {embeddingInfo?.hasEmbeddings && (
          <div className="w-full mb-3">
            <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-gray-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  Smart Search
                </span>
                <span className="text-xs text-gray-500">
                  ({embeddingInfo.count} items indexed)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useContextSearch}
                  onChange={(e) => onToggleContextSearch?.(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                <span className="ml-2 text-xs text-gray-600">
                  {useContextSearch ? 'ON' : 'OFF'}
                </span>
              </label>
            </div>
            {useContextSearch && (
              <div className="mt-1 text-xs text-gray-500 text-center">
                💡 AI will search your content for relevant context
              </div>
            )}
            {!useContextSearch && (
              <div className="mt-1 text-xs text-gray-500 text-center">
                🔒 Chat without searching your content
              </div>
            )}
          </div>
        )}

        {/* Context indicator */}
        {hasContext && (
          <div className="w-full mb-2">
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${
              hasAnalysis 
                ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
            }`}>
              <Brain className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">
                {hasAnalysis 
                  ? `AI analysis for this ${contextPlatform} content will be included as context`
                  : `Discussing ${contextPlatform} content`
                }
              </span>
            </div>
          </div>
        )}

        {/* Reference preview */}
        {referencedMessage && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50/80 dark:bg-gray-800/40 p-2 rounded-lg border border-gray-200/50 dark:border-gray-700/50">
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

        <div className="flex gap-2 items-end w-full relative">
          <div className="flex-1 relative">
            <div className={`flex items-center rounded-xl transition-all duration-200 bg-gray-50 dark:bg-gray-800 border-2
              ${isAtLimit ? 'border-red-400 dark:border-red-500' : ''}
              ${isNearLimit && !isAtLimit ? 'border-amber-400 dark:border-amber-500' : ''}
              ${!isAtLimit && !isNearLimit ? 'border-transparent hover:border-gray-200 dark:hover:border-gray-600' : ''}
              focus-within:border-heycontent-yellow focus-within:bg-white dark:focus-within:bg-gray-700
              px-3 py-2 pr-12
            `}>
              <textarea
                ref={textareaRef}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder={contextPlaceholder}
                className="text-base leading-relaxed flex-1 bg-transparent border-0 outline-0 resize-none placeholder:text-gray-500 dark:placeholder:text-gray-400 chat-font"
                disabled={isLoading}
                onKeyDown={handleKeyDown}
                maxLength={maxLength}
              />
              
              {/* Character count - positioned inside the input */}
              {!isLoading && (
                <div className={`absolute right-10 bottom-2 text-xs pointer-events-none
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
                disabled={isLoading || !currentInput.trim() || isAtLimit}
                className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200
                  ${isLoading || !currentInput.trim() || isAtLimit 
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                    : 'bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black shadow-sm hover:shadow-md hover:scale-105 active:scale-95'
                  }`}
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-xs text-gray-500 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </form>
    </div>
  )
}