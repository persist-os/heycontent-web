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
  getNotepadContext?: () => { content: string; title: string } | null
) {
  // Local state - clean and minimal
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [isStreaming, setIsStreaming] = useState(false)
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [currentStreamingId, setCurrentStreamingId] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [quotedContent, setQuotedContent] = useState("")
  const [inputValue, setInputValue] = useState("")

  // Ref to prevent cleanup from running multiple times per message cycle
  const cleanupDoneRef = useRef(false)

  // Convex mutation for creating conversations
  const createConversation = useMutation(api.chatMutations.createConversation)
  
  // ADD THIS: Convex mutation for adding messages directly
  const addMessageToConversation = useMutation(api.chatMutations.addMessageToConversation)

  // Load conversation from Convex
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId ? { userId, conversationId: conversationId as Id<"conversations"> } : "skip"
  )

  // Fetch widget output data when widgetOutputId is present
  const widgetOutput = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    widgetOutputId && userId ? { 
      userId,
      filters: { outputId: widgetOutputId },
      limit: 1
    } : 'skip'
  )

  // Extract opening message from widget output
  const openingMessage = React.useMemo(() => {
    if (!widgetOutput) return null
    const output = Array.isArray(widgetOutput) ? widgetOutput[0] : widgetOutput
    return output?.openingMessage || null
  }, [widgetOutput])
  
  // Extract messages and suggestions - memoized to prevent unnecessary re-renders
  const messages = React.useMemo(() => conversation?.messages || [], [conversation?.messages])
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
