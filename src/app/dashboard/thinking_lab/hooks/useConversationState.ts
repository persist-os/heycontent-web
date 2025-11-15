/**
 * useConversationState - Simple conversation state management
 * 
 * Manages conversation state without the complex store.
 * Uses direct Convex queries and local state.
 */

import React, { useState, useCallback, useEffect, useRef, startTransition } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
// Removed useNotepadContext import - no longer needed
import { transmitMessageWithStreaming } from '../modules/api/messageService'
import type { MessageTransmissionRequest } from '../types'
import type { FileUploadResponse } from '@/lib/file-upload'

interface OptimisticMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

export function useConversationState(
  userId: string | undefined, 
  projectId?: string, 
  widgetId?: string, 
  widgetOutputId?: string,
  getNotepadContext?: () => { content: string; title: string } | null,
  chatId?: string
) {
  // Local state - clean and minimal
  // Initialize with chatId if provided (for loading existing conversations)
  const [conversationId, setConversationId] = useState<string | undefined>(chatId)
  const [isStreaming, setIsStreaming] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [quotedContent, setQuotedContent] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [isOrchestratorRunning, setIsOrchestratorRunning] = useState(false)

  // Ref to prevent cleanup from running multiple times per message cycle
  const cleanupDoneRef = useRef(false)

  // Convex mutation for creating conversations
  const createConversation = useMutation(api.chatMutations.createConversation)
  
  // ADD THIS: Convex mutation for adding messages directly
  const addMessageToConversation = useMutation(api.chatMutations.addMessageToConversation)

  // Query for project-scoped conversation when projectId is provided
  const projectConversation = useQuery(
    api.chatQueries.getProjectScopedConversation,
    projectId && userId ? { projectId: projectId as any, userId } : "skip"
  )

  // Load conversation from Convex (either by conversationId OR from project query)
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId ? { userId, conversationId: conversationId as Id<"conversations"> } : "skip"
  )
  
  // Query A2A notes for this conversation/project
  const a2aNotes = useQuery(
    api.a2aQueries.getLatestA2ANotesPublic,
    (conversationId || projectId) && userId 
      ? { 
          conversationId: conversationId as any, 
          projectId: projectId as any,
          limit: 50 
        } 
      : "skip"
  )
  
  // Track previous projectId to detect switches
  const prevProjectIdRef = useRef<string | undefined>(projectId)
  
  // Load conversation from chatId when provided (e.g., from URL)
  // CRITICAL: Update conversationId whenever chatId changes (thread switching)
  useEffect(() => {
    if (chatId && chatId !== conversationId) {
      // Clear streaming state when switching threads
      setIsStreaming(false)
      setStreamingContent('')
      setCurrentStreamingId(null)
      setOptimisticMessages([])
      setError(undefined)
      // Set new conversation
      setConversationId(chatId)
    } else if (!chatId && !projectId && conversationId) {
      // If no chatId and no projectId, clear conversation (new thread)
      setConversationId(undefined)
    }
  }, [chatId, projectId])
  
  // Auto-set conversationId when project conversation is found
  // Reset conversationId when switching projects or back to main chat
  useEffect(() => {
    const prevProjectId = prevProjectIdRef.current
    
    if (projectId && projectConversation?._id) {
      // Set to project conversation
      if (conversationId !== projectConversation._id) {
        setConversationId(projectConversation._id)
      }
    } else if (!projectId && prevProjectId && conversationId && !chatId) {
      // ONLY clear conversationId when SWITCHING from project to non-project
      // (prevProjectId exists but projectId doesn't = we just switched away from a project)
      // BUT don't clear if we have a chatId (user opened a specific conversation)
      setConversationId(undefined)
    }
    
    // Update ref for next render
    prevProjectIdRef.current = projectId
  }, [projectId, projectConversation, conversationId, chatId])

  // NOTE: widgetOutputId is a legacy field from widget outputs table
  // Artifacts don't have outputId, so we can't query by it
  // If opening message is needed, it should come from the widget or conversation context
  // For now, we skip this query since artifacts don't support outputId lookup
  const openingMessage = null
  
  // Extract messages - CRITICAL FIX: Sort user-facing messages first, then append A2A messages at the end
  // This ensures A2A messages (thinking component) always appear last, not in the middle
  const messages = React.useMemo(() => {
    const regularMessages = conversation?.messages || []
    
    // Convert A2A notes to message format, but skip ones already posted as messages
    const a2aMessages = (a2aNotes || [])
      .filter((note: any) => {
        // Skip A2A notes that were already posted as messages
        const noteTimestamp = note.createdAt
        const alreadyPosted = regularMessages.some((msg: any) => {
          if (msg.contentType !== "a2a_announcement") return false
          const msgAgentId = msg.a2aMetadata?.agentId || msg.a2aMetadata?.report?.agent_id
          const msgTimestamp = msg.timestamp || 0
          // Match if same agent and timestamp within 5 seconds
          return msgAgentId === note.agentId && Math.abs(msgTimestamp - noteTimestamp) < 5000
        })
        return !alreadyPosted
      })
      .map((note: any) => {
        const report = note.report || {}
        const agentId = note.agentId || report.agent_id || "orchestrator"
        const announcement = report.announcement || (agentId === "orchestrator" 
          ? "Orchestration complete" 
          : "Chat agent communication")
        
        // Format announcement similar to factory method
        const agentEmoji = agentId === "orchestrator" ? "🎯" : "💬"
        const agentName = agentId === "orchestrator" ? "Orchestrator" : "Chat Agent"
        
        const contentParts = [`${agentEmoji} **${agentName}**: ${announcement}`]
        
        const promisedActions = report.promised_actions || report.chat_promised || []
        if (promisedActions.length > 0) {
          contentParts.push(`\n**Promised:** ${promisedActions.join(", ")}`)
        }
        
        const conversationStage = report.conversation_stage
        if (conversationStage) {
          contentParts.push(`\n**Stage:** ${conversationStage}`)
        }
        
        const suggestedTitle = report.suggested_title || report.metadata?.suggested_title
        if (suggestedTitle) {
          contentParts.push(`\n**Suggested Title:** ${suggestedTitle}`)
        }
        
        return {
          _id: note._id,
          content: contentParts.join(""),
          role: "assistant" as const,
          timestamp: note.createdAt,
          contentType: "a2a_announcement",
          a2aMetadata: {
            agentId: agentId,
            report: report
          }
        }
      })
    
    // CRITICAL FIX: Separate user-facing messages from A2A messages
    // Sort user-facing messages by timestamp, then append A2A messages at the end
    const a2aTypes = ['a2a_announcement', 'widget_agent_announcement', 'widget_introduction', 'artifact_created', 'widget_status']
    const userFacingMessages = regularMessages.filter((msg: any) => {
      return !msg.contentType || !a2aTypes.includes(msg.contentType)
    })
    const a2aFromMessages = regularMessages.filter((msg: any) => {
      return msg.contentType && a2aTypes.includes(msg.contentType)
    })
    
    // Sort user-facing messages by timestamp
    const sortedUserFacing = userFacingMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    
    // Append A2A messages at the end (they'll be filtered out by deriveChatState but this ensures correct order)
    // Sort A2A messages by timestamp for consistent ordering
    const allA2A = [...a2aMessages, ...a2aFromMessages].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
    
    // Return user-facing messages first, then A2A messages at the end
    return [...sortedUserFacing, ...allA2A]
  }, [conversation?.messages, a2aNotes])
  const suggestions = (() => {
    if (!messages.length) return []
    const assistantMessages = messages.filter((msg: any) => msg.role === 'assistant')
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
    return lastAssistantMessage?.suggestions || []
  })()
  
  // Reactive cleanup: Clear optimistic messages and streaming content when Convex confirms them
  useEffect(() => {
    // Don't cleanup while actively streaming or if already cleaned up
    if (isStreaming || cleanupDoneRef.current) return
    
    // Check if ALL optimistic user messages are now in Convex
    const allUserMessagesConfirmed = optimisticMessages.length === 0 || optimisticMessages.every(optMsg => {
      return messages.some((convexMsg: any) => {
        // Role must match
        if (convexMsg.role !== optMsg.role) return false
        
        // Use original content for matching
        const content = optMsg.content
        if (!content) return false // Skip empty content
        
        // Content matching (exact match for user messages)
        const convexContent = convexMsg.content || ''
        return convexContent === content
      })
    })
    
    // Check if streaming content has a matching Convex assistant message
    const streamingContentConfirmed = !streamingContent || messages.some((convexMsg: any) => {
      return convexMsg.role === 'assistant' && convexMsg.content === streamingContent
    })
    
    // If all confirmed, clear optimistic state (only once per message cycle)
    if (allUserMessagesConfirmed && streamingContentConfirmed) {
      cleanupDoneRef.current = true  // Prevent cleanup from running multiple times
      
      // Batch all state updates together with startTransition to prevent multiple renders
      startTransition(() => {
        setOptimisticMessages([])
        setStreamingContent('')
        setCurrentStreamingId(null)
      })
    }
  }, [messages, optimisticMessages, isStreaming, streamingContent])

  // Send message function - clean streaming implementation
  const sendMessage = useCallback(async (content: string, fileAttachments?: FileUploadResponse[]) => {
    if (!userId) {
      setError('User not authenticated')
      return
    }
    
    // Create conversation eagerly if first message
    let currentConversationId = conversationId
    const isFirstMessage = !conversationId  // Track if conversation was just created
    
    if (!currentConversationId) {
      currentConversationId = await createConversation({
        userId,
        title: "New Conversation",
        conversationType: widgetOutputId ? 'widget_prompt' : 'general',
        projectId: projectId as Id<"projects"> | undefined,
        widgetId: widgetId as Id<"widgets"> | string | undefined,
        widgetOutputId
      })
      setConversationId(currentConversationId)
    }
        
    // 1. Reset cleanup flag for new message cycle
    cleanupDoneRef.current = false
    
    // 2. Generate timestamp and ID for user message only
    const baseTimestamp = Date.now()
    const userMsgId = `temp-user-${baseTimestamp}`
    
    // 3. Add ONLY user message optimistically (no ghost assistant message)
    setOptimisticMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        content,
        role: 'user',
        timestamp: baseTimestamp
      }
    ])
    
    // 4. Start streaming (no assistant message ID needed)
    setCurrentStreamingId(null)
    setStreamingContent('')
    setIsStreaming(true)
    setError(undefined)
    setCurrentStatus('Connecting...')
    
    try {
      // Prepare request parameters
      const requestParams: MessageTransmissionRequest = {
        content,
        isFirstMessage,  // True if conversation was just created, false if it already existed
        sessionIdentifier: currentConversationId || null,
        workspaceContext: currentConversationId ? { contentId: currentConversationId } : null,
        notepadContext: getNotepadContext?.() || null,
        fileAttachments,
        projectId,
        widgetId,
        widgetOutputId,
        conversationType: widgetOutputId ? 'widget_prompt' : 'general',
        onStatusUpdate: (status: string) => {
          setCurrentStatus(status)
        }
      }
      
      // 5. Start streaming - chunks update in real-time
      const response = await transmitMessageWithStreaming(
        requestParams,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk)
        },
        {
          onOrchestratorStart: () => {
            setIsOrchestratorRunning(true)
            setCurrentStatus('Analyzing conversation...')
          },
          onOrchestratorComplete: () => {
            setIsOrchestratorRunning(false)
            setCurrentStatus(undefined)
          }
        }
      )
      
      // 6. Streaming complete - update conversation ID
      const newConversationId = response.session_identifier || response.conversationId
      if (newConversationId) {
        setConversationId(newConversationId)
      }
      
      // 7. Mark streaming as complete
      setIsStreaming(false)
      setCurrentStatus(undefined)
      
      // 8. Optimistic messages will be cleared by useEffect when Convex confirms them
      // No setTimeout needed - reactive cleanup based on actual Convex confirmation
      
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsStreaming(false)
      setCurrentStatus(undefined)
      setStreamingContent('')
      setCurrentStreamingId(null)
      // On error, clear the failed optimistic messages
      setOptimisticMessages([])
      setError(error instanceof Error ? error.message : 'Failed to send message')
    }
  }, [userId, conversationId, projectId, widgetId, widgetOutputId, createConversation, getNotepadContext])

  // Subscribe to orchestrator_complete messages from Convex
  useEffect(() => {
    if (!conversationId || !messages.length) return
    
    // Check for orchestrator_complete message
    const orchestratorComplete = messages.find(
      (m: any) => m.contentType === 'orchestrator_complete'
    )
    
    if (orchestratorComplete && isOrchestratorRunning) {
      setIsOrchestratorRunning(false)
      setCurrentStatus(undefined)
    }
  }, [messages, conversationId, isOrchestratorRunning])

  // Track if we've auto-sent the opening message
  const hasAutoSentRef = useRef(false)

  // Auto-add opening message as AI's first message (only once)
  // Creates conversation if needed, then adds the opening message
  useEffect(() => {
    // Only proceed if conditions are met
    if (!openingMessage || hasAutoSentRef.current || !userId || messages.length > 0 || isStreaming) {
      return
    }

    // Create conversation if it doesn't exist
    const createAndAddOpeningMessage = async () => {
      try {
        let currentConversationId = conversationId
        
        if (!currentConversationId) {
          currentConversationId = await createConversation({
            userId,
            title: "New Conversation",
            conversationType: widgetOutputId ? 'widget_prompt' : 'general',
            projectId: projectId as Id<"projects"> | undefined,
            widgetId: widgetId as Id<"widgets"> | string | undefined,
            widgetOutputId
          })
          setConversationId(currentConversationId)
        }
        hasAutoSentRef.current = true
        
        // Add the opening message directly as an assistant message to the conversation
        await addMessageToConversation({
          userId,
          conversationId: currentConversationId as any,
          message: {
            content: openingMessage,
            role: 'assistant',
            timestamp: Date.now()
          }
        })
      } catch (error) {
        console.error('[useConversationState] Failed to create conversation or add opening message:', error)
      }
    }

    createAndAddOpeningMessage()
  }, [openingMessage, messages.length, userId, isStreaming, conversationId, createConversation, addMessageToConversation, projectId, widgetId, widgetOutputId])

  // Reset auto-send flag when widgetOutputId changes (new widget launch)
  useEffect(() => {
    hasAutoSentRef.current = false
  }, [widgetOutputId])

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setConversationId(undefined)
    setError(undefined)
    setCurrentStatus(undefined)
    setOptimisticMessages([])
    setStreamingContent('')
    setCurrentStreamingId(null)
    setIsStreaming(false)
  }, [])

  // Clear streaming content manually (for edge cases)
  const clearStreamingContent = useCallback(() => {
    setStreamingContent('')
    setCurrentStreamingId(null)
    setOptimisticMessages([])
  }, [])

  // Input handlers
  const handleInputPopulate = useCallback((text: string) => {
    const cleanText = text
      .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points
      .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
      .trim()
    setInputValue(currentValue => {
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
    })
  }, [])

  const handleQuoteToNotepad = useCallback((text: string) => {
    setQuotedContent(text)
  }, [])

  const clearQuotedContent = useCallback(() => {
    setQuotedContent("")
  }, [])

  return {
    // State
    conversationId,
    isStreaming,
    streamingContent,
    optimisticMessages,
    currentStreamingId,
    currentStatus,
    error,
    messages,
    suggestions,
    quotedContent,
    inputValue,
    isOrchestratorRunning,
    
    // Actions
    sendMessage,
    startNewConversation,
    clearStreamingContent,
    setError: (error: string | undefined) => setError(error),
    setStatus: (status: string | undefined) => setCurrentStatus(status),
    
    // Handlers
    handleInputPopulate,
    handleQuoteToNotepad,
    clearQuotedContent,
    setInputValue
  }
}
