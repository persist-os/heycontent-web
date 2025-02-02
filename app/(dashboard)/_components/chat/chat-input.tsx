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
    <form onSubmit={handleSubmit} className="border-t p-4">
      {/* Referenced message preview */}
      {referencedMessage && (
        <div className="max-w-5xl mx-auto mb-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg">
            <MessageSquare className="w-4 h-4" />
            <span className="flex-1 truncate">
              Replying to: {referencedMessage.content}
            </span>
            <button
              onClick={() => onClearReference?.()}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 items-end max-w-5xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full rounded-lg border px-4 py-2 
              focus:outline-none focus:ring-2 focus:ring-blue-500
              resize-none overflow-hidden min-h-[44px] max-h-[200px]
              ${isAtLimit ? 'border-red-500' : ''}
              ${isNearLimit ? 'border-yellow-500' : ''}
              transition-colors duration-200
            `}
            disabled={isLoading}
            rows={1}
            maxLength={maxLength}
          />
          {/* Character count */}
          <div className={`absolute right-2 bottom-2 text-xs
            ${isAtLimit ? 'text-red-500' : ''}
            ${isNearLimit ? 'text-yellow-500' : ''}
            ${isLoading ? 'hidden' : ''}
          `}>
            {characterCount}/{maxLength}
          </div>
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute right-3 bottom-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !input.trim() || isAtLimit}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg 
            hover:bg-blue-600 transition-colors disabled:opacity-50 
            disabled:cursor-not-allowed h-[44px] flex items-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Press Enter to send, Shift+Enter for new line
      </div>
    </form>
  )
} 