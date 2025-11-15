/**
 * messagesWithThinking - Insert thinking message into message list
 * 
 * Simple function that inserts a thinking message after the last user message.
 * Eliminates complex index calculations and conditional rendering logic.
 */

import type { Message } from '@/app/types/chat'

export interface ThinkingMessageData {
  a2aMessages: Message[]
  isStreaming: boolean
  isLoading: boolean
  hasFinalArtifact: boolean
}

/**
 * Inserts a thinking message into the message list at the END (always last).
 * 
 * CRITICAL: Thinking component must ALWAYS be the last message to prevent
 * A2A messages from appearing in the middle of the chat.
 * 
 * If shouldShowThinking is false, returns the original messages unchanged.
 * 
 * @param userFacingMessages - User-facing messages (already filtered)
 * @param shouldShowThinking - Whether to show thinking component
 * @param a2aMessages - A2A messages for thinking display
 * @param isStreaming - Whether a message is currently streaming
 * @param isLoading - Whether the system is loading
 * @param hasFinalArtifact - Whether final artifact has been created
 * @returns Message array with thinking message inserted at the end (if applicable)
 */
export function messagesWithThinking(
  userFacingMessages: Message[],
  shouldShowThinking: boolean,
  a2aMessages: Message[],
  isStreaming: boolean,
  isLoading: boolean,
  hasFinalArtifact: boolean
): Message[] {
  if (!shouldShowThinking) {
    return userFacingMessages
  }
  
  // CRITICAL: Always insert thinking message at the END of the message list
  // This ensures A2A messages (thinking component) always appear last,
  // not in the middle of the chat
  const result = [...userFacingMessages]
  
  // Remove any existing thinking message first (in case it was already inserted)
  const existingThinkingIndex = result.findIndex(msg => msg.id === 'thinking')
  if (existingThinkingIndex >= 0) {
    result.splice(existingThinkingIndex, 1)
  }
  
  // Insert thinking message at the very end
  result.push({
    id: 'thinking',
    role: 'thinking' as any, // Thinking is a special role
    contentType: 'thinking' as any,
    content: null as any,
    timestamp: Date.now().toString(),
    chat_response: '',
    // Pass thinking-specific data via metadata
    metadata: {
      thinkingData: {
        a2aMessages,
        isStreaming,
        isLoading,
        hasFinalArtifact
      }
    }
  })
  
  return result
}

