/**
 * useMessageList - Clean Message List with Optimistic UI
 * 
 * Single source of truth pattern with automatic deduplication:
 * - Convex messages are the source of truth
 * - Optimistic messages are temporary overlays (stored in array)
 * - Auto-remove optimistic messages when Convex confirms them (by content matching)
 * - No cleanup effect needed - self-managing
 */

import React from 'react'
import type { Message } from '@/app/types/chat'

interface OptimisticMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

interface UseMessageListProps {
  convexMessages: any[]
  optimisticMessages: OptimisticMessage[]
  streamingContent: string
  currentStreamingId: string | null
  isStreaming: boolean
}

export function useMessageList(props: UseMessageListProps): Message[] {
  const { convexMessages, optimisticMessages, streamingContent, currentStreamingId, isStreaming } = props

  return React.useMemo(() => {
    const list: Message[] = []
    const now = Date.now()
    
    // 1. ALL Convex messages (source of truth) - always show these first
    convexMessages.forEach((msg: any) => {
      list.push({
        id: msg._id,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp || now,
        chat_response: msg.content,
        status: 'delivered',
        suggestions: msg.suggestions || [],
        metadata: msg.metadata || {}
      })
    })
    
    // Helper: Check if user message already exists in Convex (exact match only)
    const isUserMessageInConvex = (content: string): boolean => {
      return convexMessages.some((msg: any) => {
        return msg.role === 'user' && msg.content === content
      })
    }
    
    // 2. Add optimistic user messages (only if not yet in Convex)
    optimisticMessages.forEach((optMsg) => {
      // Only add user messages optimistically (no assistant messages)
      if (optMsg.role === 'user') {
        // Skip if this user message is already in Convex
        if (isUserMessageInConvex(optMsg.content)) {
          return
        }
        
        list.push({
          id: optMsg.id,
          content: optMsg.content,
          role: optMsg.role,
          timestamp: optMsg.timestamp.toString(),
          chat_response: optMsg.content,
          status: 'sent',
          suggestions: [],
          metadata: {}
        })
      }
    })
    
    // Helper: Check if streaming content matches a Convex assistant message
    const hasMatchingConvexAssistant = (content: string): boolean => {
      return convexMessages.some((msg: any) => {
        return msg.role === 'assistant' && msg.content === content
      })
    }
    
    // 3. Add streaming content as assistant message if streaming OR if no matching Convex message yet
    const shouldShowStreaming = (isStreaming && streamingContent) || 
                               (!isStreaming && streamingContent && !hasMatchingConvexAssistant(streamingContent))
    
    if (shouldShowStreaming) {
      list.push({
        id: 'streaming-assistant',
        content: streamingContent,
        role: 'assistant',
        timestamp: now.toString(),
        chat_response: streamingContent,
        status: isStreaming ? 'typing' : 'delivered',
        suggestions: [],
        metadata: {}
      })
    }
    
    // Sort by timestamp to ensure chronological order
    list.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? parseInt(a.timestamp) : a.timestamp
      const timeB = typeof b.timestamp === 'string' ? parseInt(b.timestamp) : b.timestamp
      return timeA - timeB  // Ascending order (oldest first)
    })
    
    return list
  }, [convexMessages, optimisticMessages, streamingContent, currentStreamingId, isStreaming])
}