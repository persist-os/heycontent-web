'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'

// Import essential chat components and hooks
import { useChatState } from '../hooks/useChatState'
import { useChat } from '../hooks/useChat'
import { useConversation } from '../hooks/useConversation'
import { useWelcomeMessage } from '../hooks/useWelcomeMessage'
import { usePersonaData } from '../hooks/usePersonaData'
import ChatMessagesList from './main_chat/ChatMessagesList'
import { ChatInput } from '../chat-input'
import { ContentContext } from '../types'
import ChatContextBox from './main_chat/ChatContextBox'
import { useContentContext, useContentContextActions } from '@/store/content-context-store'
import { useProjectContext } from '../hooks/useProjectContext'
import AmbientFingerprintCanvas from './AmbientFingerprintCanvas'

interface ProjectDiscoveryChatProps {
  projectId?: string
  fingerprintId?: string
}

const ProjectDiscoveryChat: React.FC<ProjectDiscoveryChatProps> = ({
  projectId,
  fingerprintId
}) => {
  const searchParams = useSearchParams()
  
  // Authentication and user data
  const { firebaseUser } = useAuth()
  const authData = useMemo(() => ({
    user: firebaseUser,
    userId: firebaseUser?.uid,
    userEmail: firebaseUser?.email,
    isAuthenticated: !!firebaseUser,
    isLoading: firebaseUser === undefined
  }), [firebaseUser])

  // UI state
  const [inputValue, setInputValue] = useState('')
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ 
    hasEmbeddings: false, 
    count: 0 
  })
  const [useContextSearch, setUseContextSearch] = useState(true)
  const [contextConsumption, setContextConsumption] = useState({
    hasConsumed: false,
    isDisplayed: false
  })

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const askQueryProcessedRef = useRef<string | null>(null)

  // Embedding sync heartbeat
  const userHeartbeat = useAction(api.embeddingSystem.userHeartbeat)

  // Get real project context with content
  const { 
    projectContext, 
    isLoading: isProjectLoading, 
    error: projectError,
    contentSummary 
  } = useProjectContext(projectId, fingerprintId, authData.userId)

  // Get content context from Zustand store
  const { context: currentContext, hasContext } = useContentContext()
  const { clearContentContext, setContentContext } = useContentContextActions()

  // Set project context when component mounts - force set if we have project data
  useEffect(() => {
    // Force set project context if we have project data, regardless of existing context
    // This ensures project context takes priority over any lingering context
    if (projectContext && !isProjectLoading && contentSummary && contentSummary.totalItems > 0) {
      setContentContext(projectContext as any)
    }
  }, [projectContext, currentContext, setContentContext, isProjectLoading, contentSummary])

  // Initialize shared state and hooks
  const chatState = useChatState()
  const { messages, setMessages, error, isLoading, includeAnalysisInQuery, setIncludeAnalysisInQuery } = chatState

  // Get persona data
  const { hasPersona } = usePersonaData(authData.userId, authData.isAuthenticated)

  // Initialize chat hook with shared state and userId
  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick
  } = useChat(chatState, authData.userId, useContextSearch)

  // Initialize conversation hook
  const { initSession } = useConversation(chatState, authData.user)

  // Initialize welcome message hook for onboarding users without personas
  const { handleSuggestionClick: handleWelcomeSuggestionClick } = useWelcomeMessage(
    messages, 
    isLoading, 
    authData.user, 
    setMessages, 
    hasPersona, 
    false
  )

  // Embedding sync heartbeat for active chat users  
  useEffect(() => {
    if (!authData.userId) return

    const heartbeatInterval = setInterval(async () => {
      try {
        await userHeartbeat({ userId: authData.userId! })
      } catch (error) {
        console.error('Chat heartbeat sync failed:', error)
      }
    }, 2 * 60 * 1000) // 2 minutes

    return () => clearInterval(heartbeatInterval)
  }, [authData.userId, userHeartbeat])

  // Handle content context display and consumption
  useEffect(() => {
    if (currentContext && !contextConsumption.hasConsumed) {
      setContextConsumption(prev => ({ ...prev, isDisplayed: true }))
    }
  }, [currentContext, contextConsumption.hasConsumed])

  // Mark context as consumed after first message
  useEffect(() => {
    if (currentContext && 
        contextConsumption.isDisplayed && 
        !contextConsumption.hasConsumed && 
        messages.length > 0) {
      
      const hasRealMessage = messages.some(msg => !msg.metadata?.isWelcome)
      
      if (hasRealMessage) {
        setContextConsumption(prev => ({ ...prev, hasConsumed: true }))
      }
    }
  }, [messages.length, currentContext, contextConsumption])

  // Handle initial ask query
  const askQuery = searchParams.get('ask')
  useEffect(() => {
    if (askQuery && 
        askQuery !== askQueryProcessedRef.current && 
        !isLoading && 
        messages.length === 0 &&
        authData.user) {
      
      askQueryProcessedRef.current = askQuery
      
      setTimeout(() => {
        handleSendMessage(askQuery)
      }, 100)
    }
  }, [askQuery, isLoading, handleSendMessage, messages.length, authData.user])

  // Handlers
  const handleRemoveContext = useCallback(() => {
    clearContentContext()
  }, [clearContentContext])

  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    if (!hasPersona) {
      handleWelcomeSuggestionClick(suggestion, onSendMessage)
    } else {
      const message = typeof suggestion === 'string' ? suggestion : suggestion.description
      onSendMessage(message)
    }
  }, [hasPersona, handleWelcomeSuggestionClick])

  const handleInputAppend = useCallback((text: string) => {
    setInputValue(currentValue => {
      const cleanText = text
        .replace(/^[\s]*[-*•]\s*/, '')
        .replace(/^[\s]*\*\s*/, '')
        .trim()
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
    })
  }, [])

  const handleFollowUpPopulate = useCallback((choice: string) => {
    const cleanText = choice
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
      .trim()
    setInputValue(cleanText)
  }, [])

  // Autoscroll functionality
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const scrollContainer = chatContainerRef.current
      
      const scrollToBottom = () => {
        const scrollHeight = scrollContainer.scrollHeight
        const height = scrollContainer.clientHeight
        const maxScrollTop = scrollHeight - height
        const currentScrollTop = scrollContainer.scrollTop
        const isNearBottom = currentScrollTop >= maxScrollTop - 100
        
        if (isNearBottom || isLoading) {
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
  }, [messages, isLoading])

  // Clear state on mount for clean start
  useEffect(() => {
    setMessages([])
    chatState.setSessionId(null)
    chatState.setIsFirstMessage(true)
    setContextConsumption({ hasConsumed: false, isDisplayed: false })
    askQueryProcessedRef.current = null
  }, []) // Only run on mount

  if (!authData.isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-md space-y-6">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent w-2/3" />
          <div className="space-y-3">
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              Authentication required
            </h2>
            <p className="text-muted-foreground/80 leading-relaxed ml-1">
              Please sign in to begin your project discovery journey.
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Fingerprint Constellation Minimap */}
      <AmbientFingerprintCanvas
        messageCount={messages.length}
        isActive={authData.isAuthenticated}
      />
      
      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 pb-4">
            <div className="max-w-4xl sm:max-w-6xl mx-auto space-y-3">
              {/* Context box */}
              {currentContext && (
                <ChatContextBox
                  currentContext={currentContext}
                  messages={messages}
                  onRemove={handleRemoveContext}
                  includeAnalysisInQuery={includeAnalysisInQuery}
                  onToggleAnalysis={setIncludeAnalysisInQuery}
                  onSendMessage={handleSendMessage}
                  onInputPopulate={handleInputAppend}
                />
              )}
              
              {/* Messages */}
              {messages.length > 0 ? (
                <ChatMessagesList
                  messages={messages}
                  referencedMessage={referencedMessage}
                  handleMessageReference={handleMessageReference}
                  handleReferenceClick={handleReferenceClick}
                  handleOptionClick={handleOptionClick}
                  handleFollowUpClick={handleFollowUpPopulate}
                  userId={authData.userId}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSendMessage={handleSendMessage}
                  onInputPopulate={handleInputAppend}
                  notepadOpen={false}
                  onQuoteToNotepad={() => {}}
                />
              ) : (
                // Empty state with project discovery messaging
                <div className="flex-1 flex items-center justify-center px-8 min-h-[400px]">
                  <div className="max-w-lg space-y-8">
                    <div className="h-px bg-gradient-to-r from-blue-400/60 via-transparent to-transparent w-3/4" />
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-baseline gap-4">
                          <h2 className="text-4xl font-light tracking-tight text-foreground">
                            Begin
                          </h2>
                          <div className="h-px bg-border/40 flex-1 mb-2" />
                        </div>
                        <h3 className="text-xl font-medium text-muted-foreground ml-6">
                          together
                        </h3>
                      </div>
                      
                      <div className="ml-1 space-y-4">
                        <p className="text-muted-foreground/80 leading-relaxed text-base">
                          Share what you're working on. I'll listen, ask thoughtful questions, 
                          and help create an AI fingerprint that truly understands your project.
                        </p>
                        
                        {/* Show project content summary if available */}
                        {contentSummary && contentSummary.totalItems > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/20 rounded-lg p-3 mt-4">
                            <p className="text-blue-800 dark:text-blue-300 text-sm">
                              <strong>Project Context Loaded:</strong> {contentSummary.totalItems} items 
                              ({contentSummary.itemCounts.notes} notes, {contentSummary.itemCounts.conversations} conversations)
                            </p>
                          </div>
                        )}
                        
                        {isLoading && (
                          <div className="flex items-center gap-3 mt-6">
                            <div className="w-5 h-5 border-2 border-blue-400/60 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground/70">
                              Preparing conversation space...
                            </span>
                          </div>
                        )}
                        
                        {isProjectLoading && (
                          <div className="flex items-center gap-3 mt-6">
                            <div className="w-5 h-5 border-2 border-green-400/60 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-muted-foreground/70">
                              Loading project content...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/20 rounded-lg p-3 mt-4">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  <button
                    onClick={() => chatState.setError(null)}
                    className="text-xs text-red-600 dark:text-red-400 hover:opacity-80 mt-1"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              
              {/* Project loading error display */}
              {projectError && (
                <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/20 rounded-lg p-3 mt-4">
                  <p className="text-orange-600 dark:text-orange-400 text-sm">
                    <strong>Project Context:</strong> {projectError}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-border bg-background">
        <div className="max-w-4xl sm:max-w-6xl mx-auto px-2 sm:px-3 pt-1 pb-2">
          <ChatInput
            inputRef={inputRef}
            onSend={handleSendMessage}
            isLoading={isLoading}
            disabled={!authData.isAuthenticated}
            referencedMessage={referencedMessage}
            onClearReference={handleClearReference}
            hasContext={!!currentContext}
            contextPlatform={currentContext?.platform}
            hasAnalysis={currentContext?.analysis ? true : false}
            inputValue={inputValue}
            onInputChange={setInputValue}
            useContextSearch={useContextSearch}
            onToggleContextSearch={setUseContextSearch}
            embeddingInfo={embeddingInfo}
            notepadOpen={false}
            openNotepad={() => {}}
            quotedForNotepad={null}
            onClearQuoted={() => {}}
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectDiscoveryChat