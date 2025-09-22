import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Message } from '../types'

interface UseChatHandlersProps {
  // Core handlers from existing hooks
  handleSendMessage: (content: string, includeNotepad?: boolean) => Promise<void>
  handleClearReference: () => void
  handleNewChat: () => void
  
  // State setters
  setInputValue: (value: string) => void
  
  // Actions
  clearContentContext: () => void
  resetChat: () => void
  insertTextToNotepad: (text: string) => void
  
  // State
  inputValue: string
  messages: Message[]
  hasPersona: boolean
  notepadOpen: boolean
}

/**
 * Consolidated chat handlers to reduce repetitive handler logic
 * Replaces multiple similar handler patterns throughout ChatContainer
 */
export function useChatHandlers({
  handleSendMessage,
  handleClearReference,
  handleNewChat,
  setInputValue,
  clearContentContext,
  resetChat,
  insertTextToNotepad,
  inputValue,
  messages,
  hasPersona,
  notepadOpen
}: UseChatHandlersProps) {
  
  // Text manipulation utilities
  const cleanSuggestionText = useCallback((text: string): string => {
    return text
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
      .trim()
  }, [])

  const appendToInput = useCallback((newText: string) => {
    setInputValue(prevValue => {
      const separator = prevValue && !prevValue.endsWith(' ') && !prevValue.endsWith('\n') ? ' ' : ''
      return prevValue + separator + newText
    })
  }, [setInputValue])

  // Input handlers
  const handleInputAppend = useCallback((text: string) => {
    const cleanText = cleanSuggestionText(text)
    if (inputValue.trim()) {
      setInputValue(`${inputValue} ${cleanText}`)
    } else {
      setInputValue(cleanText)
    }
  }, [inputValue, setInputValue, cleanSuggestionText])

  const handleFollowUpPopulate = useCallback((choice: string) => {
    setInputValue(cleanSuggestionText(choice))
  }, [setInputValue, cleanSuggestionText])

  // Chat action handlers
  const handleActionClick = useCallback((action: string) => {
    try {
      handleSendMessage(action)
    } catch (error) {
      console.error('Error sending action message:', error)
    }
  }, [handleSendMessage])

  const handleSuggestionClick = useCallback((suggestion: string) => {
    try {
      handleSendMessage(suggestion)
    } catch (error) {
      console.error('Error sending suggestion:', error)
    }
  }, [handleSendMessage])

  // Enhanced send message with validation
  const handleSendMessageWithUpdateCheck = useCallback(async (content: string, includeNotepad?: boolean) => {
    if (!content.trim()) return
    
    try {
      await handleSendMessage(content, includeNotepad)
      setInputValue('') // Clear input after successful send
    } catch (error) {
      console.error('Error sending message:', error)
      // Don't clear input on error so user can retry
    }
  }, [handleSendMessage, setInputValue])

  // Reference and content handlers
  const handleReferenceClick = useCallback((messageId: string) => {
    if (notepadOpen) {
      // Find the message and insert it into notepad
      const message = messages.find(m => m.id === messageId)
      if (message) {
        insertTextToNotepad(`**Referenced from chat:**\n${message.content}\n\n`)
      }
    }
  }, [notepadOpen, messages, insertTextToNotepad])

  const handleContentClick = useCallback((content: string) => {
    if (notepadOpen) {
      insertTextToNotepad(content)
    }
  }, [notepadOpen, insertTextToNotepad])

  // Enhanced new chat handler
  const handleNewChatEnhanced = useCallback(() => {
    try {
      clearContentContext()
      resetChat()
      handleNewChat()
      setInputValue('')
    } catch (error) {
      console.error('Error starting new chat:', error)
    }
  }, [clearContentContext, resetChat, handleNewChat, setInputValue])

  return {
    // Text utilities
    cleanSuggestionText,
    appendToInput,
    
    // Input handlers
    handleInputAppend,
    handleFollowUpPopulate,
    
    // Action handlers
    handleActionClick,
    handleSuggestionClick,
    handleSendMessageWithUpdateCheck,
    
    // Content handlers
    handleReferenceClick,
    handleContentClick,
    
    // Chat management
    handleNewChat: handleNewChatEnhanced
  }
}