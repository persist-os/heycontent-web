import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useConvex } from 'convex/react'
import type { ChatContainerHandlers, ChatContainerState, ChatContainerRefs } from '../types/chat-container.types'
import type { ChatStateReturnType } from './useChatState'
import type { MarkdownNotepadRef } from '../components/notepad/types'

interface UseChatContainerHandlersProps {
  state: ChatContainerState
  setters: any
  authData: any
  chatState: ChatStateReturnType
  refs: ChatContainerRefs
  handleSendMessage: (message: string, includeNotepad?: boolean) => void
  handleClearReference: () => void
  clearContentContext: () => void
  resetChat: () => void
  messages: any[]
  notepadOpen: boolean
  insertTextToNotepad: (text: string) => void
}

export function useChatContainerHandlers({
  state,
  setters,
  authData,
  chatState,
  refs,
  handleSendMessage,
  handleClearReference,
  clearContentContext,
  resetChat,
  messages,
  notepadOpen,
  insertTextToNotepad
}: UseChatContainerHandlersProps): ChatContainerHandlers {
  const router = useRouter()
  const convex = useConvex()

  // Quote handling state
  const quotedForNotepad = ''
  
  // Quote handlers
  const handleClearQuoted = useCallback(() => {
    // Implementation for clearing quotes
  }, [])
  
  const handleQuoteToNotepad = useCallback((text: string) => {
    // Implementation for quoting to notepad
  }, [])
  
  const createReferenceClickHandler = useCallback((notepadOpen: boolean, handler: (id: string) => void) => {
    return (messageId: string) => {
      if (notepadOpen) {
        handler(messageId)
      }
    }
  }, [])

  // Enhanced quote to notepad handler with mobile support
  const handleQuoteToNotepadEnhanced = useCallback((text: string) => {
    handleQuoteToNotepad(text)
    insertTextToNotepad(text)
  }, [handleQuoteToNotepad, insertTextToNotepad])

  // Memoized handlers to prevent unnecessary re-renders
  const handleSendMessageWithUpdateCheck = useCallback((message: string) => {
    const lowerMessage = message.toLowerCase().trim()
    
    
    // Pass the includeNotepadInMessages state to handleSendMessage
    handleSendMessage(message, state.includeNotepadInMessages)
  }, [handleSendMessage, state.includeNotepadInMessages])

  const handleNewChat = useCallback(() => {
    // If notepad is open and has unsaved content, show warning modal
    if (notepadOpen && refs.notepadRef.current?.hasUnsavedContent()) {
      setters.setShowNotepadWarning(true)
      setters.setPendingNewChat(true)
      return
    }
    
    // UI resets
    resetChat()
    chatState.setMessages([])
    handleClearReference?.()
    
    // Reset content context consumption state
    setters.setContextConsumption({ hasConsumed: false, isDisplayed: false })
    
    // Reset state for a new chat session
    window.localStorage.removeItem('chatSessionId')
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    
    // Clear content context when starting new chat
    clearContentContext()
    
    // Clear the loaded conversation ref
    refs.loadedConversationRef.current = null
    
    // Navigate to clean chat URL
    router.push('/dashboard/chat')

    // Reset refs
    refs.askQueryProcessedRef.current = null
    setters.setInputValue('')
  }, [resetChat, chatState, handleClearReference, setters, clearContentContext, 
      router, notepadOpen, refs])

  // Handler for confirming discard in modal
  const handleConfirmDiscardNotepad = useCallback(() => {
    setters.setShowNotepadWarning(false)
    setters.setPendingNewChat(false)
    // Clear notepad content
    refs.notepadRef.current?.clearContent()
    // Proceed with new chat
    resetChat()
    chatState.setMessages([])
    handleClearReference?.()
    setters.setContextConsumption({ hasConsumed: false, isDisplayed: false })
    window.localStorage.removeItem('chatSessionId')
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    clearContentContext()
    refs.loadedConversationRef.current = null
    router.push('/dashboard/chat')
    refs.askQueryProcessedRef.current = null
    setters.setInputValue('')
  }, [setters, refs, resetChat, chatState, handleClearReference, clearContentContext, router])

  // Handler for canceling discard in modal
  const handleCancelDiscardNotepad = useCallback(() => {
    setters.setShowNotepadWarning(false)
    setters.setPendingNewChat(false)
  }, [setters])

  const handleActionClick = useCallback((action: string) => {
    handleSendMessage(action)
  }, [handleSendMessage])

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    // Always directly send the message
    const message = typeof suggestion === 'string' ? suggestion : suggestion.description
    onSendMessage(message)
  }, [])  

  const handleInsightClick = useCallback((action: string, insight: any) => {
    handleSendMessageWithUpdateCheck(action)
  }, [handleSendMessageWithUpdateCheck])

  const handleFollowUpPopulate = useCallback((choice: string) => {
    const cleanText = choice
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
      .trim()
    setters.setInputValue(cleanText)
  }, [setters])

  const handleInputAppend = useCallback((text: string) => {
    setters.setInputValue((currentValue: string) => {
      const cleanText = text
        .replace(/^[\s]*[-*•]\s*/, '')
        .replace(/^[\s]*\*\s*/, '')
        .trim()
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
    })
  }, [setters])

  // Handle content click to show overlay
  const handleContentClick = useCallback((contentType: string, contentId: string) => {
    setters.setOverlayContent({
      contentType: contentType as 'youtube' | 'instagram' | 'gmail' | 'insight' | 'note',
      contentId
    })
  }, [setters])

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setters.setOverlayContent(null)
  }, [setters])

  // Create notepad-aware reference handler
  const handleReferenceClick = useCallback((messageId: string) => {
    const referenceHandler = createReferenceClickHandler(notepadOpen, (id: string) => {
      // Handle reference click logic here
    })
    referenceHandler(messageId)
  }, [createReferenceClickHandler, notepadOpen])

  return {
    handleSendMessageWithUpdateCheck,
    handleNewChat,
    handleConfirmDiscardNotepad,
    handleCancelDiscardNotepad,
    handleRemoveContext: () => {}, // Will be provided by useContextConsumption
    handleActionClick,
    handleSuggestionClick,
    handleInsightClick,
    handleReferenceClick,
    handleFollowUpPopulate,
    handleInputAppend,
    handleContentClick,
    handleOverlayClose,
    handleQuoteToNotepadEnhanced,
    quotedForNotepad,
    handleClearQuoted
  }
}
