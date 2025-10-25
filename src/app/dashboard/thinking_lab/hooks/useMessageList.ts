/**
 * useMessageList - Extracted from LabCompositions
 * 
 * Manages message list building from state.
 * Handles pending messages, streaming content, and loading states.
 */

import React from 'react'
import type { Message } from '@/app/types/chat'

interface UseMessageListProps {
  conversationId?: string
  isLoading: boolean
  pendingUserMessage?: string
  streamingContent: string
  messages: any[]
}

export function useMessageList(props?: UseMessageListProps): Message[] {
  // Always use the provided props if available, otherwise use empty defaults
  const conversationId = props?.conversationId
  const isLoading = props?.isLoading || false
  const pendingUserMessage = props?.pendingUserMessage
  const streamingContent = props?.streamingContent || ''
  const messages = props?.messages || []

  // Build message list from state
  const messageList: Message[] = React.useMemo(() => {
    const list: Message[] = []
    const now = Date.now().toString()
    
    // Add optimistic user message (before streaming starts)
    if (pendingUserMessage) {
      list.push({
        id: 'pending-user',
        content: pendingUserMessage,
        role: 'user',
        timestamp: now,
        chat_response: pendingUserMessage,
        status: 'delivered',
        suggestions: [],
        metadata: {}
      })
    }
    
    // Add streaming assistant message (real-time updates)
    if (isLoading || streamingContent) {
      list.push({
        id: 'streaming-assistant',
        content: streamingContent, // Real-time streaming content
        role: 'assistant',
        timestamp: now,
        chat_response: streamingContent,
        status: 'typing', // Show as typing during streaming
        searchStatus: isLoading ? 'Understanding what you\'re thinking about' : 'Streaming response...',
        statusHistory: isLoading ? [
          'Understanding what you\'re thinking about',
          'Query needs context - proceeding with vector search',
          'Looking through all your content',
          'Quality filtering'
        ] : ['Streaming response...'],
        suggestions: [],
        metadata: {}
      })
    }
    
    // Add real messages from Convex
    messages.forEach((msg: any) => {
      list.push({
        id: msg._id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp?.toString() || now,
        chat_response: msg.content,
        status: 'delivered',
        suggestions: msg.suggestions || [],
        metadata: msg.metadata || {}
      })
    })
    
    return list
  }, [pendingUserMessage, isLoading, streamingContent, messages])
  
  return messageList
}