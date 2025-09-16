import { useCallback } from 'react'

interface UseKeyboardHandlersProps {
  currentInput: string
  isLoading: boolean
  isAtLimit: boolean
  convertTitlesToContentIds: (text: string) => string
  onSend: (message: string) => void
  setCurrentInput: (value: string) => void
  openContentSelector: () => void
  closeContentSelector: () => void
  showEnhancedContentSelector: boolean
  resetAccumulatedText?: () => void
}

export const useKeyboardHandlers = ({
  currentInput,
  isLoading,
  isAtLimit,
  convertTitlesToContentIds,
  onSend,
  setCurrentInput,
  openContentSelector,
  closeContentSelector,
  showEnhancedContentSelector,
  resetAccumulatedText
}: UseKeyboardHandlersProps) => {
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Allow new line with Shift+Enter
        return
      } else {
        // Send message with Enter
        e.preventDefault()
        if (!currentInput.trim() || isLoading || isAtLimit) return
        
        // Convert truncated titles back to content IDs before sending
        const processedMessage = convertTitlesToContentIds(currentInput.trim())
        onSend(processedMessage)
        setCurrentInput('')
        
        // Reset accumulated voice text since we're starting fresh
        resetAccumulatedText?.()
      }
    }

    // '@' to open content linking selector
    if (e.key === '@') {
      // Let the @ be typed first, then open selector
      setTimeout(() => {
        openContentSelector()
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }

    // Handle ESC to close content selector
    if (e.key === 'Escape' && showEnhancedContentSelector) {
      e.preventDefault()
      e.stopPropagation()
      closeContentSelector()
      return
    }
  }, [
    currentInput,
    isLoading,
    isAtLimit,
    convertTitlesToContentIds,
    onSend,
    setCurrentInput,
    openContentSelector,
    closeContentSelector,
    showEnhancedContentSelector,
    resetAccumulatedText
  ])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const oldValue = currentInput
    
    // If the user has cleared the input (from non-empty to empty), reset voice accumulation
    if (oldValue && !newValue && resetAccumulatedText) {
      resetAccumulatedText()
    }
    
    setCurrentInput(newValue)
  }, [setCurrentInput, currentInput, resetAccumulatedText])

  const handleTextareaSelect = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    // Simple cursor positioning - no complex link handling needed
  }, [])

  return {
    handleKeyDown,
    handleTextareaChange,
    handleTextareaSelect
  }
}
