/**
 * useConversationState - Simple conversation state management
 * 
 * Manages conversation state without the complex store.
 * Uses direct Convex queries and local state.
 */

import React, { useState, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
// Removed useNotepadContext import - no longer needed
import { transmitMessageWithStreaming } from '../modules/api/messageService'
import type { MessageTransmissionRequest } from '../types'
import type { FileUploadResponse } from '@/lib/file-upload'

export function useConversationState(userId: string | undefined, projectId?: string, widgetId?: string, widgetOutputId?: string) {
  // Local state
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [pendingUserMessage, setPendingUserMessage] = useState<string | undefined>()
  const [currentStatus, setCurrentStatus] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [quotedContent, setQuotedContent] = useState("")
  const [inputValue, setInputValue] = useState("")

  // Load conversation from Convex - with better error handling
  const conversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId ? { userId, conversationId } : "skip"
  )
  
  // Extract messages and suggestions
  const messages = conversation?.messages || []
  const suggestions = (() => {
    if (!messages.length) return []
    const assistantMessages = messages.filter((msg: any) => msg.role === 'assistant')
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]
    return lastAssistantMessage?.suggestions || []
  })()

  // Send message function
  const sendMessage = useCallback(async (content: string, fileAttachments?: FileUploadResponse[]) => {
    if (!userId) {
      setError('User not authenticated')
      return
    }
    
    const isFirstMessage = !conversationId
    
    // Set loading state
    setIsLoading(true)
    setError(undefined)
    setCurrentStatus('Thinking...')
    setPendingUserMessage(content)
    setStreamingContent('')
    
    try {
      // Removed notepad context - notepad content will be handled differently
      const notepadContext = null

      // Prepare request parameters
      const requestParams: MessageTransmissionRequest = {
        content,
        isFirstMessage,
        sessionIdentifier: conversationId || null,
        workspaceContext: conversationId ? { contentId: conversationId } : null,
        notepadContext,
        fileAttachments,
        projectId,
        widgetId,
        widgetOutputId,
        conversationType: widgetOutputId ? 'widget_prompt' : 'general',
        onStatusUpdate: (status: string) => {
          setCurrentStatus(status)
        }
      }
      
      // Call the streaming backend
      const response = await transmitMessageWithStreaming(
        requestParams,
        (chunk: string) => {
          setStreamingContent(prev => prev + chunk)
        }
      )
      
      // Update conversation ID if we got a new one
      const newConversationId = response.session_identifier || response.conversationId
      if (newConversationId && newConversationId !== conversationId) {
        setConversationId(newConversationId)
      }
      
      // Clear loading state
      setIsLoading(false)
      setCurrentStatus(undefined)
      setPendingUserMessage(undefined)
      
    } catch (error) {
      console.error('Failed to send message:', error)
      setIsLoading(false)
      setCurrentStatus(undefined)
      setPendingUserMessage(undefined)
      setStreamingContent('')
      setError(error instanceof Error ? error.message : 'Failed to send message')
    }
  }, [userId, conversationId])

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setConversationId(undefined)
    setError(undefined)
    setCurrentStatus(undefined)
    setPendingUserMessage(undefined)
    setStreamingContent('')
  }, [])

  // Clear streaming content when message is confirmed in Convex
  const clearStreamingContent = useCallback(() => {
    setStreamingContent('')
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

  // Clear streaming content when message is confirmed in Convex
  React.useEffect(() => {
    if (streamingContent && messages.length > 0) {
      clearStreamingContent()
    }
  }, [streamingContent, messages.length, clearStreamingContent])

  return {
    // State
    conversationId,
    isLoading,
    streamingContent,
    pendingUserMessage,
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
