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
import { getProjectDiscoveryWelcomeMessage, projectDiscoverySuggestions } from '../data/project-discovery-welcome'
import { usePersonaData } from '../hooks/usePersonaData'
import { getApiKey } from '@/app/lib/api-helpers'
import ChatMessagesList from './main_chat/ChatMessagesList'
import { ChatInput } from '../chat-input'
import { ContentContext } from '../types'
import ChatContextBox from './main_chat/ChatContextBox'
import { useContentContext, useContentContextActions } from '@/store/content-context-store'
import { useProjectContext } from '../hooks/useProjectContext'
import AmbientFingerprintCanvas from './AmbientFingerprintCanvas'
import { ConstellationTransition } from '@/app/dashboard/living-projects/components/widgets/ConstellationTransition'
import { ProjectReveal } from '@/app/dashboard/living-projects/components/widgets/ProjectReveal'
import { ConvexHttpClient } from 'convex/browser'

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

  // Project reveal state
  const [showProjectReveal, setShowProjectReveal] = useState(false)
  const [showTransition, setShowTransition] = useState(false)

  // Fingerprint completion state
  const [fingerprintComplete, setFingerprintComplete] = useState(false)
  const [currentFingerprint, setCurrentFingerprint] = useState<any>(null)
  const [fingerprintEvolution, setFingerprintEvolution] = useState<any>(null)
  const [conversationSummaries, setConversationSummaries] = useState<any[]>([])
  const [isGeneratingFingerprint, setIsGeneratingFingerprint] = useState(false)
  const prevRealUserCountRef = useRef<number>(0)
  const convexClientRef = useRef<ConvexHttpClient | null>(null)
  const startedPollingRef = useRef<boolean>(false)
  const lastProcessedUserMessageIdRef = useRef<string | null>(null)
  // Simplified flow: trigger once when total messages (incl. assistant) reach random 12-20
  const triggerThresholdRef = useRef<number>(12 + Math.floor(Math.random() * 9))
  const hasTriggeredRef = useRef<boolean>(false)

  // Agent-based fingerprinting functions
  const processConversationMessage = useCallback(async (message: any, conversationHistory: any[]) => {
    if (!authData.userId || !projectId) return

    try {
      console.log('[DISCOVERY][processConversationMessage:start]', {
        hasUserId: !!authData.userId,
        projectId,
        messageRole: message?.role,
        messagePreview: (message?.content || '').slice(0, 120),
        conversationLength: Array.isArray(conversationHistory) ? conversationHistory.length : 'n/a'
      })
      setIsGeneratingFingerprint(true)
      
      // Get Firebase ID token for backend auth
      const idToken = await authData.user?.getIdToken?.()
      if (!idToken) {
        throw new Error('Authentication required')
      }
      console.log('[DISCOVERY][processConversationMessage:auth]', { hasIdToken: !!idToken })
      
      // Call the API route to process message and evolve fingerprint
      console.log('[DISCOVERY][processConversationMessage:fetch]', {
        url: `/api/projects/${projectId}/process-message`
      })
      const response = await fetch(`/api/projects/${projectId}/process-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          message,
          conversationHistory
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        let errJson: any = null
        try { errJson = JSON.parse(errText) } catch {}
        console.error('[DISCOVERY][processConversationMessage:response:error]', {
          status: response.status,
          errorJson: errJson,
          errorText: errText
        })
        throw new Error(errJson?.error || errJson?.detail || `Failed to process message (${response.status})`)
      }
      console.log('[DISCOVERY][processConversationMessage:response]', { status: response.status })

      const result = await response.json()
      console.log('[DISCOVERY][processConversationMessage:result]', {
        success: result?.success,
        hasSummary: !!result?.data?.conversationSummary,
        hasEvolution: !!result?.data?.fingerprintEvolution,
        decisionShouldContinue: result?.data?.fingerprintEvolution?.decision?.should_continue
      })
      
      if (result.success) {
        // Update conversation summaries
        if (result.data.conversationSummary) {
          setConversationSummaries(prev => [...prev, result.data.conversationSummary])
        }
        
        // Update fingerprint evolution
        if (result.data.fingerprintEvolution) {
          setFingerprintEvolution(result.data.fingerprintEvolution)
          console.log('[DISCOVERY][processConversationMessage:evolution:set]', {
            name: result.data.fingerprintEvolution?.name,
            domain: result.data.fingerprintEvolution?.domain,
            confidence: result.data.fingerprintEvolution?.confidence_score
          })
          
          // Check if fingerprint is complete
          if (result.data.fingerprintEvolution.decision?.should_continue === false) {
            // Transform FingerprintEvolution to ProjectFingerprint format
            const fingerprintData = result.data.fingerprintEvolution
            const projectFingerprint = {
              projectId: projectId,
              userId: authData.userId,
              name: fingerprintData.name || 'Unnamed Project',
              description: fingerprintData.description || 'AI-generated project fingerprint',
              domain: fingerprintData.domain || 'General',
              complexity_level: fingerprintData.complexity_level || 5,
              collaboration_style: fingerprintData.collaboration_style || 'Unknown',
              time_horizon: fingerprintData.time_horizon || 'Unknown',
              primary_pattern: fingerprintData.primary_pattern || 'Unknown',
              working_style: fingerprintData.working_style || [],
              tangible_deliverables: fingerprintData.tangible_deliverables || [],
              intangible_benefits: fingerprintData.intangible_benefits || [],
              measurement_approach: fingerprintData.measurement_approach || 'Unknown',
              sharing_intention: fingerprintData.sharing_intention || 'Unknown',
              base_personality: fingerprintData.base_personality || 'Unknown',
              project_voice: fingerprintData.project_voice || 'Unknown',
              created_at: Date.now(),
              last_evolution: Date.now(),
              intelligence_version: '1.0',
              // Include all other fields from the evolution data
              ...fingerprintData
            }
            setCurrentFingerprint(projectFingerprint)
            console.log('[DISCOVERY][processConversationMessage:evolution:complete]', {
              willSetComplete: true,
              projectId
            })
            setFingerprintComplete(true)
          }
        }
      }
    } catch (error) {
      console.error('Error processing conversation message:', error)
    } finally {
      setIsGeneratingFingerprint(false)
      console.log('[DISCOVERY][processConversationMessage:end]')
    }
  }, [authData.userId, projectId])

  // Generate project widgets when fingerprint is complete
  const generateProjectWidgets = useCallback(async (providedFingerprintId?: string) => {
    if (!authData.userId || !projectId) return

    try {
      console.log('[DISCOVERY][widgets:start]', {
        hasUserId: !!authData.userId,
        projectId,
        hasCurrentFingerprint: !!currentFingerprint
      })
      // Get API key
      const apiKey = await getApiKey()
      if (!apiKey) {
        throw new Error('Authentication required')
      }
      
      // Call the API route to generate widgets
      console.log('[DISCOVERY][widgets:fetch]', { url: `/api/projects/${projectId}/generate-widgets` })
      const response = await fetch(`/api/projects/${projectId}/generate-widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          fingerprintId: providedFingerprintId || currentFingerprint?._id || `fp_${Date.now()}`
        })
      })

      if (!response.ok) {
        console.error('[DISCOVERY][widgets:response:error]', { status: response.status })
        throw new Error('Failed to generate widgets')
      }
      console.log('[DISCOVERY][widgets:response]', { status: response.status })

      const result = await response.json()
      
      if (result.success) {
        // Widgets will be stored in Convex and can be fetched by the project view
        console.log('[DISCOVERY][widgets:success]', { hasData: !!result.data })
      }
    } catch (error) {
      console.error('Error generating project widgets:', error)
    }
  }, [authData.userId, projectId, currentFingerprint])

  // Generate widgets and redirect when fingerprint is complete (based on Convex confirmation)
  useEffect(() => {
    if (fingerprintComplete) {
      const handleFingerprintComplete = async () => {
        try {
          console.log('[DISCOVERY][complete:start]', { projectId, hasCurrentFingerprint: !!currentFingerprint })
          // Generate widgets first
          await generateProjectWidgets()
          console.log('[DISCOVERY][complete:widgets:done]')
          
          // Wait a moment for widgets to be generated
          setTimeout(() => {
            // Redirect to the project view
            if (projectId) {
              console.log('[DISCOVERY][complete:redirect]', { to: `/dashboard/living-projects/${projectId}` })
              window.location.href = `/dashboard/living-projects/${projectId}`
            }
          }, 2000) // 2 second delay to show completion
        } catch (error) {
          console.error('Error completing fingerprint process:', error)
        }
      }
      
      handleFingerprintComplete()
    }
  }, [fingerprintComplete, currentFingerprint, generateProjectWidgets, projectId])

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

  // Initialize shared state and hooks
  const chatState = useChatState()
  const { messages, setMessages, error, isLoading, includeAnalysisInQuery, setIncludeAnalysisInQuery } = chatState

  // Count real user messages for fingerprint progress
  const realUserMessages = useMemo(() => {
    return messages.filter(msg => 
      msg.role === 'user' && !msg.metadata?.isWelcome
    )
  }, [messages])

  // Simplified trigger: once total messages (excluding welcome) reach random threshold, run full flow
  useEffect(() => {
    if (!projectId || !authData.userId || fingerprintComplete || hasTriggeredRef.current) return

    const effectiveMessages = messages.filter(m => !m.metadata?.isWelcome)
    const totalCount = effectiveMessages.length
    const threshold = triggerThresholdRef.current
    console.log('[DISCOVERY][simple:threshold]', { totalCount, threshold })

    if (totalCount >= threshold) {
      hasTriggeredRef.current = true
      const run = async () => {
        try {
          setIsGeneratingFingerprint(true)
          const idToken = await authData.user?.getIdToken?.()
          if (!idToken) throw new Error('Authentication required')

          const lastMessage = effectiveMessages[effectiveMessages.length - 1]
          console.log('[DISCOVERY][simple:fingerprint:start]', { projectId, totalCount })
          const resp = await fetch(`/api/projects/${projectId}/process-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
            body: JSON.stringify({ message: lastMessage, conversationHistory: effectiveMessages })
          })
          if (!resp.ok) {
            const txt = await resp.text()
            console.error('[DISCOVERY][simple:fingerprint:error]', { status: resp.status, txt })
            throw new Error(txt || 'Fingerprint generation failed')
          }
          const result = await resp.json()
          const fingerprintData = result?.data?.finalFingerprint || result?.data?.fingerprintEvolution || result?.fingerprint_data
          const projectFingerprint = {
            projectId: projectId,
            userId: authData.userId,
            name: fingerprintData?.name || 'Unnamed Project',
            description: fingerprintData?.description || 'AI-generated project fingerprint',
            domain: fingerprintData?.domain || 'General',
            complexity_level: fingerprintData?.complexity_level || 5,
            collaboration_style: fingerprintData?.collaboration_style || 'Unknown',
            time_horizon: fingerprintData?.time_horizon || 'Unknown',
            primary_pattern: fingerprintData?.primary_pattern || 'Unknown',
            working_style: fingerprintData?.working_style || [],
            tangible_deliverables: fingerprintData?.tangible_deliverables || [],
            intangible_benefits: fingerprintData?.intangible_benefits || [],
            measurement_approach: fingerprintData?.measurement_approach || 'Unknown',
            sharing_intention: fingerprintData?.sharing_intention || 'Unknown',
            base_personality: fingerprintData?.base_personality || 'Unknown',
            project_voice: fingerprintData?.project_voice || 'Unknown',
            created_at: Date.now(),
            last_evolution: Date.now(),
            intelligence_version: '1.0',
            ...fingerprintData
          }
          setCurrentFingerprint(projectFingerprint)
          setFingerprintComplete(true)

          console.log('[DISCOVERY][simple:widgets:start]')
          await generateProjectWidgets(undefined as any)

          setTimeout(() => {
            window.location.href = `/dashboard/living-projects/${projectId}`
          }, 1500)
        } catch (e) {
          console.error('[DISCOVERY][simple:flow:error]', e)
        } finally {
          setIsGeneratingFingerprint(false)
        }
      }
      run()
    }
  }, [messages, projectId, authData.userId, fingerprintComplete, generateProjectWidgets, authData.user])

  // Set project context when component mounts - force set if we have project data
  useEffect(() => {
    // Force set project context if we have project data, regardless of existing context
    // This ensures project context takes priority over any lingering context
    if (projectContext && !isProjectLoading && contentSummary && contentSummary.totalItems > 0) {
      console.log('[DISCOVERY][projectContext:set]', {
        hasProjectContext: !!projectContext,
        totalItems: contentSummary.totalItems
      })
      setContentContext(projectContext as any)
    }
  }, [projectContext, currentContext, setContentContext, isProjectLoading, contentSummary])

  // Show project discovery welcome message when component mounts
  useEffect(() => {
    if (projectId && messages.length === 0 && !isLoading) {
      console.log('🎯 Showing project discovery welcome message')
      setMessages([getProjectDiscoveryWelcomeMessage(0)])
    }
  }, [projectId, messages.length, isLoading, setMessages])

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

  // Initialize welcome message hook for onboarding users without personas
  const { handleSuggestionClick: handleWelcomeSuggestionClick } = useWelcomeMessage(
    messages, 
    isLoading, 
    authData.user, 
    setMessages, 
    hasPersona, 
    false
  )

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

  // Transition handlers
  const handleStarsDiscovered = useCallback(() => {
    // Gate overlay strictly on fingerprint completion to avoid premature UI
    if (fingerprintComplete) setShowTransition(true)
  }, [fingerprintComplete])

  const handleTransitionComplete = useCallback(() => {
    setShowTransition(false)
    setShowProjectReveal(true)
  }, [])

  const handleBackFromProjectReveal = useCallback(() => {
    setShowProjectReveal(false)
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

  // Show project reveal if triggered
  if (showProjectReveal) {
    return (
      <ProjectReveal
        fingerprint={currentFingerprint}
        onBack={handleBackFromProjectReveal}
      />
    )
  }

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
        onAllStarsDiscovered={handleStarsDiscovered}
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

      {/* Project Reveal - shows when fingerprint is complete */}
      {fingerprintComplete && (
        <div className="flex-1 overflow-hidden">
          <ProjectReveal fingerprint={currentFingerprint} />
        </div>
      )}

      {/* Input Area - hide when fingerprint is complete */}
      {!fingerprintComplete && (
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
      )}

      {/* Constellation Transition Overlay */}
      <ConstellationTransition
        isActive={showTransition}
        onComplete={handleTransitionComplete}
        duration={3000}
      />
    </div>
  )
}

export default ProjectDiscoveryChat