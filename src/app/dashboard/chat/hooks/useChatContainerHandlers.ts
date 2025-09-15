import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useConvex } from 'convex/react'
import { usePersonaStore } from '@/store/persona-store'
import { useWelcomeMessage } from './useWelcomeMessage'
import { useChatHandlers } from './useChatHandlers'
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
  hasPersona: boolean
  notepadOpen: boolean
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
  hasPersona,
  notepadOpen
}: UseChatContainerHandlersProps): ChatContainerHandlers {
  const router = useRouter()
  const convex = useConvex()
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData)

  // Initialize welcome message hook for onboarding users without personas
  const { handleSuggestionClick: handleWelcomeSuggestionClick } = useWelcomeMessage(
    messages, 
    chatState.isLoading, 
    authData.user, 
    chatState.setMessages, 
    hasPersona, 
    false
  )

  const { 
    quotedForNotepad, 
    handleClearQuoted, 
    handleQuoteToNotepad,
    createReferenceClickHandler 
  } = useChatHandlers(handleSendMessage, handleClearReference, messages)

  // Enhanced quote to notepad handler - now just handles the text insertion
  // UI state management (opening notepad, switching tabs) is handled by the UI components themselves
  const handleQuoteToNotepadEnhanced = useCallback((text: string) => {
    handleQuoteToNotepad(text)
  }, [handleQuoteToNotepad])

  // Memoized handlers to prevent unnecessary re-renders
  const handleSendMessageWithUpdateCheck = useCallback((message: string) => {
    const lowerMessage = message.toLowerCase().trim()
    
    if (lowerMessage === 'hey content update persona') {
      setters.setUpdatePersonaRequested(true)
    }
    
    if (lowerMessage === 'hey content write my persona' && authData.userId && convex) {
      refreshPersonaData(authData.userId, convex)
    }
    
    // Pass the includeNotepadInMessages state to handleSendMessage
    handleSendMessage(message, state.includeNotepadInMessages)
  }, [handleSendMessage, authData.userId, convex, refreshPersonaData, state.includeNotepadInMessages, setters])

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
    setters.setUpdatePersonaRequested(false)
    
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
    
    // Force refresh persona data
    if (authData.userId && convex) {
      refreshPersonaData(authData.userId, convex)
    }
    
    // Navigate to clean chat URL
    router.push('/dashboard/chat')

    // Reset refs
    refs.askQueryProcessedRef.current = null
    setters.setInputValue('')
  }, [resetChat, chatState, handleClearReference, setters, clearContentContext, 
      authData.userId, convex, refreshPersonaData, router, notepadOpen, refs])

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
    setters.setUpdatePersonaRequested(false)
    setters.setContextConsumption({ hasConsumed: false, isDisplayed: false })
    window.localStorage.removeItem('chatSessionId')
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    clearContentContext()
    refs.loadedConversationRef.current = null
    if (authData.userId && convex) {
      refreshPersonaData(authData.userId, convex)
    }
    router.push('/dashboard/chat')
    refs.askQueryProcessedRef.current = null
    setters.setInputValue('')
  }, [setters, refs, resetChat, chatState, handleClearReference, clearContentContext, authData.userId, convex, refreshPersonaData, router])

  // Handler for canceling discard in modal
  const handleCancelDiscardNotepad = useCallback(() => {
    setters.setShowNotepadWarning(false)
    setters.setPendingNewChat(false)
  }, [setters])

  const handleActionClick = useCallback((action: string) => {
    handleSendMessage(action)
  }, [handleSendMessage])

  // Handle suggestion clicks - use welcome flow for users without personas
  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    // If user doesn't have a persona, use the welcome message handler (onboarding flow)
    if (!hasPersona) {
      handleWelcomeSuggestionClick(suggestion, onSendMessage)
    } else {
      // For users with personas, directly send the message
      const message = typeof suggestion === 'string' ? suggestion : suggestion.description
      onSendMessage(message)
    }
  }, [hasPersona, handleWelcomeSuggestionClick])

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
