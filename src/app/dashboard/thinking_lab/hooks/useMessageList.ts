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
    // TEMPORARY DEBUG LOGGING - Remove after fixing
    console.log('[DEBUG:useMessageList] Convex messages:', convexMessages.length, convexMessages.map(m => ({
      id: m._id,
      role: m.role,
      content: (m.content || '').slice(0, 40) + '...'
    })))
    console.log('[DEBUG:useMessageList] Optimistic messages:', optimisticMessages.length, optimisticMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: (m.content || '').slice(0, 40) + '...'
    })))
    console.log('[DEBUG:useMessageList] Current streaming ID:', currentStreamingId)
    console.log('[DEBUG:useMessageList] Streaming content length:', streamingContent.length)
    
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
    
    // Helper: Check if message already exists in Convex
    const isInConvex = (content: string, role: 'user' | 'assistant'): boolean => {
      return convexMessages.some((msg: any) => {
        // Match by role
        if (msg.role !== role) return false
        
        // Match by content (exact or prefix for streaming messages)
        const msgContent = msg.content || ''
        if (role === 'assistant') {
          // For streaming assistant messages, check if Convex has the complete version
          // or if streaming content is a prefix of Convex content
          return msgContent === content || msgContent.startsWith(content) || content.startsWith(msgContent)
        } else {
          // For user messages, require exact match
          return msgContent === content
        }
      })
    }
    
    // 2. Add optimistic messages (only if not yet in Convex)
    optimisticMessages.forEach((optMsg) => {
      // Check if this is the currently streaming message
      const isCurrentlyStreaming = optMsg.id === currentStreamingId
      
      // CRITICAL: Don't check isInConvex for messages that are currently streaming
      // They should always show while streaming, even if content is empty or partial
      if (!isCurrentlyStreaming) {
        // Skip if this message is already in Convex (but only check non-streaming messages)
        const inConvex = isInConvex(optMsg.content, optMsg.role)
        console.log('[DEBUG:useMessageList] Checking optimistic message:', {
          id: optMsg.id,
          role: optMsg.role,
          content: (optMsg.content || '').slice(0, 40) + '...',
          isInConvex: inConvex
        })
        if (inConvex) {
          console.log('[DEBUG:useMessageList] SKIPPING optimistic message (already in Convex)')
          return
        }
      } else {
        console.log('[DEBUG:useMessageList] Currently streaming message:', optMsg.id)
      }
      
      // Use real-time streaming content if this is the streaming message
      const content = isCurrentlyStreaming && streamingContent ? streamingContent : optMsg.content
      
      console.log('[DEBUG:useMessageList] ADDING optimistic message to list:', {
        id: optMsg.id,
        role: optMsg.role,
        contentLength: content.length,
        isStreaming: isStreaming && isCurrentlyStreaming
      })
      
      list.push({
        id: optMsg.id,
        content,
        role: optMsg.role,
        timestamp: optMsg.timestamp.toString(),
        chat_response: content,
        status: optMsg.role === 'user' ? 'sent' : (isStreaming && isCurrentlyStreaming ? 'typing' : 'delivered'),
        suggestions: [],
        metadata: {}
      })
    })
    
    // Sort by timestamp to ensure chronological order
    list.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? parseInt(a.timestamp) : a.timestamp
      const timeB = typeof b.timestamp === 'string' ? parseInt(b.timestamp) : b.timestamp
      return timeA - timeB  // Ascending order (oldest first)
    })
    
    console.log('[DEBUG:useMessageList] FINAL sorted message list:', list.length, list.map(m => ({
      id: m.id,
      role: m.role,
      content: (m.content || '').slice(0, 40) + '...',
      status: m.status,
      timestamp: m.timestamp
    })))
    
    return list
  }, [convexMessages, optimisticMessages, streamingContent, currentStreamingId, isStreaming])
}