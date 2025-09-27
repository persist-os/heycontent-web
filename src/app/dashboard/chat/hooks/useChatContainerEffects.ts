import { useEffect, useRef } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { usePersonaStore } from '@/store/persona-store'
import { useConvex } from 'convex/react'
import { useGlobalSelectionState } from './useGlobalSelectionState'
import type { ChatStateReturnType } from './useChatState'
import type { ChatContainerState, ChatContainerRefs } from '../types/chat-container.types'
import type { Message } from '@/app/types/chat'

interface UseChatContainerEffectsProps {
  state: ChatContainerState
  setters: any
  authData: any
  chatState: ChatStateReturnType
  refs: ChatContainerRefs
  messages: Message[]
  askQuery?: string
  chatId?: string
  handleLoadConversation: (id: string) => void
  handleSendMessageWithUpdateCheck: (message: string, fileAttachments?: any[]) => void
  chatContainerRef: React.RefObject<HTMLDivElement>
  isMobile: boolean
  activeTab: string
  chatScrollPosition: number
  saveScrollPosition: (tab: string, position: number) => void
}

export function useChatContainerEffects({
  state,
  setters,
  authData,
  chatState,
  refs,
  messages,
  askQuery,
  chatId,
  handleLoadConversation,
  handleSendMessageWithUpdateCheck,
  chatContainerRef,
  isMobile,
  activeTab,
  chatScrollPosition,
  saveScrollPosition
}: UseChatContainerEffectsProps) {
  const { firebaseUser, getToken } = useAuth()
  const convex = useConvex()
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData)
  const invalidatePersonaData = usePersonaStore(state => state.invalidatePersonaData)
  const initializePersonaData = usePersonaStore(state => state.initializePersonaData)
  const { isScrollingSuppressed } = useGlobalSelectionState()

  // API key effect
  useEffect(() => {
    async function fetchApiKey() {
      if (firebaseUser && getToken) {
        try {
          const token = await getToken()
          setters.setApiKey(token)
        } catch (error) {
          setters.setApiKey(null)
        }
      } else {
        setters.setApiKey(null)
      }
    }
    fetchApiKey()
  }, [firebaseUser, getToken, setters])

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
  }, [chatId, authData.user, authData.isLoading, handleLoadConversation, chatState, refs])

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
      setters.setUpdatePersonaRequested(false)
      
      if (authData.userId && convex) {
        setTimeout(() => {
          invalidatePersonaData()
          refreshPersonaData(authData.userId, convex)
        }, 1000)
      }
    }
  }, [messages, authData.userId, convex, refreshPersonaData, invalidatePersonaData, setters])

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
  }, [askQuery, chatState.isLoading, handleSendMessageWithUpdateCheck, messages.length, authData.user, refs])

  // Clear conversation state on mount for clean start
  useEffect(() => {
    // Always clear state on mount for clean start (not welcome flow)
    chatState.setMessages([])
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    setters.setContextConsumption({ hasConsumed: false, isDisplayed: false })
    refs.askQueryProcessedRef.current = null
    refs.loadedConversationRef.current = null
  }, []) // Only run on mount

  // Selection-aware autoscroll functionality
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0 && !isScrollingSuppressed) {
      const scrollContainer = chatContainerRef.current
      
      const scrollToBottom = () => {
        // Double-check selection state before scrolling
        if (isScrollingSuppressed) return
        
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
      const timeoutId = setTimeout(() => {
        // Final check before delayed scroll
        if (!isScrollingSuppressed) {
          scrollToBottom()
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [messages, chatState.isLoading, isScrollingSuppressed, chatContainerRef])

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
}
