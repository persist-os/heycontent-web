import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSidebar } from '@/app/context/sidebar-context'
import { useChatState } from './useChatState'
import { useChat } from './useChat'
import { useConversation } from './useConversation'
import { useUIEffects } from './useUIEffects'
// import { useOnboardingState } from './useOnboardingState' // Removed - onboarding eliminated
import { usePersonaData } from './usePersonaData'
import { useAuth } from '@/app/context/auth-context'
import { useAmbientInsightsActions } from '../components/ambient_insights/AmbientInsightsActions'
import { useMarkdownNotepad } from './useMarkdownNotepad'
import { checkUserEmbeddings } from '../utils/api-utils'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { getWelcomeStepMessage, welcomeSuggestions, welcomeSuggestionsWithPersona } from '../data/welcome-message'
import { Message } from '@/app/types/chat'

export function useChatContainer(chatId: string | undefined, contentContext: any, askQuery: string | undefined) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const welcome = searchParams.get('welcome') === 'true'
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const { isExpanded } = useSidebar()
  
  const loadedConversationRef = useRef<string | null>(null)
  
  // Initialize shared state
  const chatState = useChatState()
  const {
    messages,
    setMessages,
    error,
    isLoading,
    includeAnalysisInQuery,
    setIncludeAnalysisInQuery
  } = chatState

  // Input and context state
  const [inputValue, setInputValue] = useState('')
  const [useContextSearch, setUseContextSearch] = useState(false)
  const [welcomeStep, setWelcomeStep] = useState(0)
  const [hasStartedNewChat, setHasStartedNewChat] = useState(false)
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ hasEmbeddings: false, count: 0 })
  
  // Notepad state
  const { isOpen: notepadOpen, width: notepadWidth, openNotepad, closeNotepad, updateWidth } = useMarkdownNotepad()
  const [quotedForNotepad, setQuotedForNotepad] = useState<string>('')

  const askQueryProcessedRef = useRef<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [apiKey, setApiKey] = useState<string | null>(null)

  // Check if user has an existing persona
  const { hasPersona } = usePersonaData(userId, !!userId)

  // Initialize UI effects hook
  const uiEffects = useUIEffects(messages, isExpanded)

  // Initialize chat hook with shared state and userId
  const chatHook = useChat(chatState, userId, useContextSearch, undefined, null, 'chat')

  // Initialize ambient insights actions
  const ambientInsightsActions = useAmbientInsightsActions(chatHook.handleSendMessage)

  // Track onboarding state for persona tip - REMOVED (onboarding eliminated)
  // const onboardingState = useOnboardingState(messages, chatState.sessionId)

  // Initialize conversation hook with shared state
  const conversationHook = useConversation(chatState, user)

  // Authentication
  const { firebaseUser, getToken } = useAuth()

  // Set user, userId, and userEmail from firebaseUser
  useEffect(() => {
    if (firebaseUser) {
      setUser(firebaseUser)
      setUserId(firebaseUser.uid)
      setUserEmail(firebaseUser.email)
      setAuthLoading(false)
    } else {
      setUser(null)
      setUserId(undefined)
      setUserEmail(undefined)
      setAuthLoading(true)
    }
  }, [firebaseUser])

  // API key effect
  useEffect(() => {
    async function fetchApiKey() {
      if (firebaseUser && getToken) {
        try {
          const token = await getToken()
          setApiKey(token)
        } catch (error) {
          console.error('Failed to get API key token:', error)
          setApiKey(null)
        }
      } else {
        setApiKey(null)
      }
    }
    fetchApiKey()
  }, [firebaseUser, getToken])

  // Utility functions
  const appendToInput = useCallback((newText: string) => {
    setInputValue(prevValue => {
      const separator = prevValue && !prevValue.endsWith(' ') && !prevValue.endsWith('\n') ? ' ' : ''
      return prevValue + separator + newText
    })
  }, [])

  const cleanSuggestionText = (text: string): string => {
    return text
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
      .trim()
  }

  const handleFollowUpPopulate = useCallback((choice: string) => {
    setInputValue(cleanSuggestionText(choice))
  }, [])

  const handleInputAppend = useCallback((text: string) => {
    setInputValue(currentValue => {
      const cleanText = cleanSuggestionText(text)
      if (currentValue.trim()) {
        return `${currentValue} ${cleanText}`
      }
      return cleanText
    })
  }, [])

  // Notepad handlers
  const handleNotepadSendToChat = useCallback((content: string) => {
    if (content.trim()) {
      chatHook.handleSendMessage(content)
    }
  }, [chatHook.handleSendMessage])

  const handleClearQuoted = useCallback(() => {
    setQuotedForNotepad('')
  }, [])

  const handleReferenceClickForNotepad = useCallback((messageId: string) => {
    if (notepadOpen) {
      const message = messages.find(m => m.id === messageId)
      if (message) {
        setQuotedForNotepad(message.content)
        chatHook.handleClearReference()
      }
    } else {
      chatHook.handleReferenceClick(messageId)
    }
  }, [notepadOpen, messages, chatHook.handleClearReference, chatHook.handleReferenceClick])

  return {
    // State
    user,
    userId,
    userEmail,
    authLoading,
    apiKey,
    welcome,
    inputValue,
    setInputValue,
    useContextSearch,
    setUseContextSearch,
    welcomeStep,
    setWelcomeStep,
    hasStartedNewChat,
    setHasStartedNewChat,
    embeddingInfo,
    setEmbeddingInfo,
    notepadOpen,
    notepadWidth,
    quotedForNotepad,
    
    // Chat state
    ...chatState,
    
    // Hooks
    uiEffects,
    chatHook,
    ambientInsightsActions,
    conversationHook,
    
    // Computed
    hasPersona,
    hasMessagesOrContext: contentContext || messages.length > 0,
    
    // Handlers
    appendToInput,
    cleanSuggestionText,
    handleFollowUpPopulate,
    handleInputAppend,
    handleNotepadSendToChat,
    handleClearQuoted,
    handleReferenceClickForNotepad,
    openNotepad,
    closeNotepad,
    updateWidth,
    
    // Refs
    loadedConversationRef,
    askQueryProcessedRef,
  }
} 