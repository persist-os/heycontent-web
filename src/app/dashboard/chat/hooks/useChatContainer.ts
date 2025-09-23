import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useConvex } from 'convex/react'
import { useAuth } from '@/app/context/auth-context'
import { usePersonaStore } from '@/store/persona-store'
import type { 
  ChatContainerState, 
  ChatContainerRefs, 
  ChatContainerHandlers, 
  EmbeddingInfo, 
  ContextConsumption, 
  OverlayContent,
  UseChatContainerProps,
  UseChatContainerReturn
} from '../types/chat-container.types'

export function useChatContainer({
  authData,
  chatState,
  handleSendMessage,
  handleClearReference,
  clearContentContext,
  resetChat,
  messages,
  askQuery,
  chatId,
  handleLoadConversation,
  chatContainerRef,
  isMobile,
  activeTab,
  chatScrollPosition,
  saveScrollPosition,
  notepadOpen,
  insertTextToNotepad
}: UseChatContainerProps): UseChatContainerReturn {
  // ========================================
  // STATE MANAGEMENT (from useChatContainerState)
  // ========================================
  
  // UI state - grouped related state together
  const [inputValue, setInputValue] = useState('')
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingInfo>({ 
    hasEmbeddings: false, 
    count: 0 
  })
  
  // Content context consumption tracking
  const [contextConsumption, setContextConsumption] = useState<ContextConsumption>({
    hasConsumed: false,
    isDisplayed: false
  })

  // Context search state - disable by default to reduce complexity
  const [useContextSearch, setUseContextSearch] = useState(false)
  
  // Notepad inclusion state - enable by default for better context
  const [includeNotepadInMessages, setIncludeNotepadInMessages] = useState(true)
  
  // Modal state for notepad warning
  const [showNotepadWarning, setShowNotepadWarning] = useState(false)
  const [pendingNewChat, setPendingNewChat] = useState(false)
  
  // Overlay state for content links
  const [overlayContent, setOverlayContent] = useState<OverlayContent | null>(null)
  
  // API state
  const [apiKey, setApiKey] = useState<string | null>(null)

  const state: ChatContainerState = {
    inputValue,
    embeddingInfo,
    contextConsumption,
    useContextSearch,
    includeNotepadInMessages,
    showNotepadWarning,
    pendingNewChat,
    overlayContent,
    apiKey
  }

  const setters = {
    setInputValue,
    setEmbeddingInfo,
    setContextConsumption,
    setUseContextSearch,
    setIncludeNotepadInMessages,
    setShowNotepadWarning,
    setPendingNewChat,
    setOverlayContent,
    setApiKey
  }

  // ========================================
  // REFS INITIALIZATION
  // ========================================
  
  const refs: ChatContainerRefs = {
    loadedConversationRef: useRef<string | null>(null),
    askQueryProcessedRef: useRef<string | null>(null),
    notepadRef: useRef(null)
  }

  // ========================================
  // HOOKS DEPENDENCIES
  // ========================================
  
  const router = useRouter()
  const convex = useConvex()
  const { firebaseUser, getToken } = useAuth()
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData)
  const invalidatePersonaData = usePersonaStore(state => state.invalidatePersonaData)
  const initializePersonaData = usePersonaStore(state => state.initializePersonaData)

  // ========================================
  // HANDLERS (from useChatContainerHandlers)
  // ========================================
  
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
      setShowNotepadWarning(true)
      setPendingNewChat(true)
      return
    }
    
    // UI resets
    resetChat()
    chatState.setMessages([])
    handleClearReference?.()
    
    // Reset content context consumption state
    setContextConsumption({ hasConsumed: false, isDisplayed: false })
    
    // Reset state for a new chat session
    window.localStorage.removeItem('chatSessionId')
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    
    // Clear content context when starting new chat
    clearContentContext()
    
    // Clear the loaded conversation ref
    refs.loadedConversationRef.current = null
    
    // Navigate to clean chat URL
    router.push('/dashboard')

    // Reset refs
    refs.askQueryProcessedRef.current = null
    setInputValue('')
  }, [resetChat, chatState, handleClearReference, clearContentContext, 
      router, notepadOpen, refs])

  // Handler for confirming discard in modal
  const handleConfirmDiscardNotepad = useCallback(() => {
    setShowNotepadWarning(false)
    setPendingNewChat(false)
    // Clear notepad content
    refs.notepadRef.current?.clearContent()
    // Proceed with new chat
    resetChat()
    chatState.setMessages([])
    handleClearReference?.()
    setContextConsumption({ hasConsumed: false, isDisplayed: false })
    window.localStorage.removeItem('chatSessionId')
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    clearContentContext()
    refs.loadedConversationRef.current = null
    router.push('/dashboard')
    refs.askQueryProcessedRef.current = null
    setInputValue('')
  }, [resetChat, chatState, handleClearReference, clearContentContext, router])

  // Handler for canceling discard in modal
  const handleCancelDiscardNotepad = useCallback(() => {
    setShowNotepadWarning(false)
    setPendingNewChat(false)
  }, [])

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
    setInputValue(cleanText)
  }, [])

  const handleInputAppend = useCallback((text: string) => {
    setInputValue((currentValue: string) => {
      const cleanText = text
        .replace(/^[\s]*[-*•]\s*/, '')
        .replace(/^[\s]*\*\s*/, '')
        .trim()
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
    })
  }, [])

  // Handle content click to show overlay
  const handleContentClick = useCallback((contentType: string, contentId: string) => {
    setOverlayContent({
      contentType: contentType as 'insight' | 'note',
      contentId
    })
  }, [])

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setOverlayContent(null)
  }, [])

  // Create notepad-aware reference handler
  const handleReferenceClick = useCallback((messageId: string) => {
    const referenceHandler = createReferenceClickHandler(notepadOpen, (id: string) => {
      // Handle reference click logic here
    })
    referenceHandler(messageId)
  }, [createReferenceClickHandler, notepadOpen])

  const handlers: ChatContainerHandlers = {
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

  // ========================================
  // EFFECTS (from useChatContainerEffects)
  // ========================================

  // API key effect
  useEffect(() => {
    async function fetchApiKey() {
      if (firebaseUser && getToken) {
        try {
          const token = await getToken()
          setApiKey(token)
        } catch (error) {
          setApiKey(null)
        }
      } else {
        setApiKey(null)
      }
    }
    fetchApiKey()
  }, [firebaseUser, getToken])

  // Initialize persona store when userId changes
  useEffect(() => {
    if (authData.userId && convex) {
      initializePersonaData(authData.userId, convex)
    }
  }, [authData.userId, convex, initializePersonaData])

  // Load conversation when user and chatId are available
  useEffect(() => {
    if (authData.user && !authData.isLoading) {
      if (chatId && refs.loadedConversationRef.current !== chatId) {
        refs.loadedConversationRef.current = chatId
        handleLoadConversation(chatId)
      } else if (!chatId && refs.loadedConversationRef.current !== null) {
        chatState.setMessages([])
        chatState.setSessionId(null)
        chatState.setIsFirstMessage(true)
        refs.loadedConversationRef.current = null
      }
    }
  }, [chatId, authData.user, authData.isLoading])

  // Effect to detect persona completion and trigger persona refresh
  useEffect(() => {
    if (!authData.userId || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    
    const hasPersonaCompletionFlags = lastMessage.metadata?.is_persona_complete === true || 
                                     lastMessage.metadata?.persona_created === true
    
    const hasPersonaContentPattern = lastMessage.content && (
      lastMessage.content.includes('*Your Content Persona*') ||
      lastMessage.content.includes('Content Persona') ||
      (lastMessage.content.includes('*Content Style*')) ||
      (lastMessage.content.includes('*Content Focus*') && lastMessage.content.includes('*Future Goals*'))
    )

    const isPersonaCompleted = lastMessage.role === 'assistant' && 
                              (hasPersonaCompletionFlags || hasPersonaContentPattern)

    if (isPersonaCompleted) {
      if (authData.userId && convex) {
        setTimeout(() => {
          invalidatePersonaData()
          refreshPersonaData(authData.userId, convex)
        }, 1000)
      }
    }
  }, [messages, authData.userId, convex, refreshPersonaData, invalidatePersonaData])

  // Handle initial ask query
  useEffect(() => {
    if (askQuery && 
        askQuery !== refs.askQueryProcessedRef.current && 
        !chatState.isLoading && 
        messages.length === 0 &&
        authData.user) {
      
      refs.askQueryProcessedRef.current = askQuery
      
      setTimeout(() => {
        handleSendMessageWithUpdateCheck(askQuery)
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href)
          url.searchParams.delete('ask')
          window.history.replaceState({}, '', url.toString())
        }
      }, 100)
    }
  }, [askQuery, chatState.isLoading, messages.length, authData.user])

  // Clear conversation state on mount for clean start
  useEffect(() => {
    // Always clear state on mount for clean start (not welcome flow)
    chatState.setMessages([])
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    setContextConsumption({ hasConsumed: false, isDisplayed: false })
    refs.askQueryProcessedRef.current = null
    refs.loadedConversationRef.current = null
  }, []) // Only run on mount

  // Auto-scroll functionality - simplified without global selection state
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const scrollContainer = chatContainerRef.current
      
      const scrollToBottom = () => {
        const scrollHeight = scrollContainer.scrollHeight
        const height = scrollContainer.clientHeight
        const maxScrollTop = scrollHeight - height
        const currentScrollTop = scrollContainer.scrollTop
        const isNearBottom = currentScrollTop >= maxScrollTop - 100
        
        if (isNearBottom || chatState.isLoading) {
          scrollContainer.scrollTo({
            top: scrollHeight + 200,
            behavior: 'smooth'
          })
        }
      }

      scrollToBottom()
      const timeoutId = setTimeout(scrollToBottom, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages, chatState.isLoading, chatContainerRef])

  // Scroll position management for mobile tab switching
  useEffect(() => {
    if (!isMobile || !chatContainerRef.current) return

    const scrollContainer = chatContainerRef.current
    
    const handleScroll = () => {
      saveScrollPosition('chat', scrollContainer.scrollTop)
    }

    scrollContainer.addEventListener('scroll', handleScroll)
    
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
  }, [isMobile, saveScrollPosition, chatContainerRef])

  // Restore scroll position when switching tabs
  useEffect(() => {
    if (!isMobile || !chatContainerRef.current) return

    const scrollContainer = chatContainerRef.current
    
    // Restore chat scroll position when switching to chat tab
    if (activeTab === 'chat' && chatScrollPosition > 0) {
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: chatScrollPosition,
          behavior: 'instant'
        })
      }, 100)
    }
  }, [isMobile, activeTab, chatScrollPosition, chatContainerRef])

  // Cleanup effect to prevent auto-restart on unmount
  useEffect(() => {
    return () => {
      refs.askQueryProcessedRef.current = null
      refs.loadedConversationRef.current = null
    }
  }, [refs])

  // ========================================
  // RETURN CONSOLIDATED API
  // ========================================
  
  return {
    // State
    state,
    setters,
    refs,
    
    // Handlers
    ...handlers
  }
}
