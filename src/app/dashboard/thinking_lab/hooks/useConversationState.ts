/**
 * useConversationState - Simple conversation state management
 * 
 * Manages conversation state without the complex store.
 * Uses direct Convex queries and local state.
 */

import React, { useState, useCallback } from 'react'
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

export function useConversationState(userId: string | undefined, projectId?: string, widgetId?: string, widgetOutputId?: string) {
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

  // Convex mutation for creating conversations
  const createConversation = useMutation(api.chatMutations.createConversation)

  // Load conversation from Convex
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId ? { userId, conversationId: conversationId as Id<"conversations"> } : "skip"
  )
  
  // Extract messages and suggestions
  const messages = conversation?.messages || []
  const suggestions = (() => {
    if (!messages.length) return []
    const assistantMessages = messages.filter((msg: any) => msg.role === 'assistant')
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
    return lastAssistantMessage?.suggestions || []
  })()
  
  // Note: No cleanup effect needed - useMessageList handles optimistic message removal
  // automatically via content matching. Messages disappear when Convex confirms them.

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
        
    // 1. Add optimistic user message immediately (don't overwrite - ADD to array)
    const userMsgId = `temp-user-${Date.now()}`
    setOptimisticMessages(prev => [...prev, {
      id: userMsgId,
      content,
      role: 'user',
      timestamp: Date.now()
    }])
    
    // 2. Add placeholder assistant message for streaming
    const assistantMsgId = `temp-assistant-${Date.now()}`
    setOptimisticMessages(prev => [...prev, {
      id: assistantMsgId,
      content: '',
      role: 'assistant',
      timestamp: Date.now()
    }])
    
    // 3. Start streaming
    setCurrentStreamingId(assistantMsgId)
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
        notepadContext: null,
        fileAttachments,
        projectId,
        widgetId,
        widgetOutputId,
        conversationType: widgetOutputId ? 'widget_prompt' : 'general',
        onStatusUpdate: (status: string) => {
          setCurrentStatus(status)
        }
      }
      
      // 4. Start streaming - chunks update in real-time
      const response = await transmitMessageWithStreaming(
        requestParams,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk)
        }
      )
      
      // 5. Streaming complete - update conversation ID
      const newConversationId = response.session_identifier || response.conversationId
      if (newConversationId) {
        setConversationId(newConversationId)
      }
      
      // 6. Mark streaming as complete
      setIsStreaming(false)
      setCurrentStatus(undefined)
      
      // 7. Clear optimistic messages after Convex confirms (with delay for DB sync)
      setTimeout(() => {
        setOptimisticMessages([])
        setStreamingContent('')
        setCurrentStreamingId(null)
      }, 500)
      
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
  }, [userId, conversationId, projectId, widgetId, widgetOutputId, createConversation])

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
