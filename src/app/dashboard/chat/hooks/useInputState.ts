import { useState, useEffect, useRef } from 'react'

interface UseInputStateProps {
  inputValue?: string
  onInputChange?: (value: string) => void
  hasAnalysis?: boolean
  maxLength?: number
  autoFocus?: boolean
  isLoading?: boolean
  referencedMessage?: any
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

const placeholders = [
  "What should I focus on next?",
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

export const useInputState = ({
  inputValue,
  onInputChange,
  hasAnalysis = false,
  maxLength = 5000,
  autoFocus = true,
  isLoading = false,
  referencedMessage,
  textareaRef
}: UseInputStateProps) => {
  const [input, setInput] = useState('')
  const [placeholder, setPlaceholder] = useState(placeholders[0])

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

  // Auto-resize textarea and sync display div
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      // Use requestAnimationFrame to prevent layout thrashing
      requestAnimationFrame(() => {
        const baseHeight = 40 // Base height for single line
        const maxVisibleHeight = baseHeight * 2 // Double the height (2x expansion)
        
        // Temporarily set to auto to get scroll height
        const previousHeight = textarea.style.height
        textarea.style.height = 'auto'
        const scrollHeight = textarea.scrollHeight
        
        if (scrollHeight <= maxVisibleHeight) {
          // Content fits within 2x height - expand textarea, no scroll
          const newHeight = Math.max(baseHeight, scrollHeight)
          if (previousHeight !== `${newHeight}px`) {
            textarea.style.height = `${newHeight}px`
          }
          textarea.style.overflowY = 'hidden'
        } else {
          // Content exceeds 2x height - fix at max height, enable hidden scroll
          if (previousHeight !== `${maxVisibleHeight}px`) {
            textarea.style.height = `${maxVisibleHeight}px`
          }
          textarea.style.overflowY = 'scroll'
        }
      })
    }
  }, [currentInput, textareaRef])

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && textareaRef.current && !isLoading) {
      // Use requestAnimationFrame to prevent focus from causing layout shift
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      })
    }
  }, [autoFocus, isLoading, referencedMessage, textareaRef])

  // Character count and validation
  const characterCount = currentInput.length
  const isNearLimit = characterCount > maxLength * 0.8
  const isAtLimit = characterCount >= maxLength

  return {
    currentInput,
    setCurrentInput,
    placeholder,
    characterCount,
    isNearLimit,
    isAtLimit
  }
}
