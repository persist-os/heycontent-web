/**
 * useMessageList - Extracted from LabCompositions
 * 
 * Manages message list building from store state.
 * Handles pending messages, streaming content, and loading states.
 */

import React from 'react'
import { useDialogueStore } from '../stores/dialogueStore'
import type { Message } from '@/app/types/chat'

export function useMessageList(): Message[] {
  const conversationId = useDialogueStore(state => state.conversationId)
  const isLoading = useDialogueStore(state => state.isLoading)
  const pendingUserMessage = useDialogueStore(state => state.pendingUserMessage)
  const streamingContent = useDialogueStore(state => state.streamingContent)

  // Build message list from store state
  const messages: Message[] = React.useMemo(() => {
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
    
    return list
  }, [pendingUserMessage, isLoading, streamingContent])

  return messages
}
