'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageSquare } from 'lucide-react'
import { Message } from '@/app/types'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLInputElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
}

const placeholders = [
  "Ask about content strategy...",
  "Analyze audience growth...",
  "Get partnership recommendations...",
  "Optimize engagement...",
]

export function ChatInput({
  onSend,
  isLoading,
  inputRef,
  maxLength = 1000,
  referencedMessage,
  onClearReference,
  autoFocus = true
}: ChatInputProps) {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(prev => {
        const currentIndex = placeholders.indexOf(prev)
        return placeholders[(currentIndex + 1) % placeholders.length]
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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
      onSend(input.trim())
      setInput('')
      // Reset textarea height
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto'
        // Auto-focus after sending
        setTimeout(() => {
          textAreaRef.current?.focus()
        }, 0)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const characterCount = input.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return (
    <form onSubmit={handleSubmit} className="py-2 w-full">
      {/* Referenced message preview - mobile responsive */}
      {referencedMessage && (
        <div className="w-full mx-auto mb-2">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 bg-gray-50 p-1.5 sm:p-2 rounded-lg">
            <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
            <span className="flex-1 truncate">
              Replying to: {referencedMessage.content}
            </span>
            <button
              onClick={() => onClearReference?.()}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1 sm:gap-2 items-end w-full mx-auto relative">
        <div className="flex-1 relative">
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full rounded-lg border px-2 sm:px-3 py-1.5
              focus:outline-none focus:ring-2 focus:ring-heycontent-yellow
              resize-none overflow-hidden min-h-[36px] max-h-[120px] sm:max-h-[200px]
              text-sm
              ${isAtLimit ? 'border-red-500' : ''}
              ${isNearLimit ? 'border-yellow-500' : ''}
              transition-colors duration-200
            `}
            disabled={isLoading}
            rows={1}
            maxLength={maxLength}
          />
          {/* Character count - hidden on smallest screens */}
          <div className={`absolute right-2 bottom-1.5 text-[10px] sm:text-xs
            ${isAtLimit ? 'text-red-500' : ''}
            ${isNearLimit ? 'text-yellow-500' : ''}
            ${isLoading ? 'hidden' : ''}
          `}>
            {characterCount}/{maxLength}
          </div>
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-2 sm:right-3 bottom-2">
              <Loader2 className="w-3 sm:w-4 h-3 sm:h-4 animate-spin text-text-gray" />
            </div>
          )}
        </div>
        <button
          type="submit"
          aria-label="Send message"
          disabled={isLoading || !input.trim() || isAtLimit}
          className="bg-heycontent-yellow text-black px-2 sm:px-3 py-1.5 rounded-lg
            hover:bg-heycontent-yellow/80 transition-colors disabled:opacity-50
            disabled:cursor-not-allowed h-[36px] flex items-center flex-shrink-0"
        >
          <Send className="w-3 sm:w-4 h-3 sm:h-4" />
        </button>
      </div>
      <div className="mt-1 text-[10px] sm:text-xs text-text-gray text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </form>
  )
}