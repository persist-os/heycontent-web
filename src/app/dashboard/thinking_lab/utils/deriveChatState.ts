/**
 * deriveChatState - Single source of truth for chat state derivation
 * 
 * Centralizes all state computation logic that was duplicated across
 * ChatPanel and HomepageChat components.
 * 
 * Pure function - no side effects, deterministic output.
 */

import type { Message } from '@/app/types/chat'
import { filterMessages } from './messageTypes'

export interface ChatState {
  a2aMessages: Message[]
  userFacingMessages: Message[]
  hasFinalArtifact: boolean
  lastMessageIsStreaming: boolean
  hasGapAfterUserMessage: boolean
  hasUserMessage: boolean
  shouldShowThinking: boolean
}

/**
 * Derives all chat state from messages and loading/streaming flags.
 * 
 * This is the SINGLE SOURCE OF TRUTH for chat state computation.
 * All components should use this function instead of duplicating logic.
 * 
 * @param messages - All messages in the conversation
 * @param isStreaming - Whether a message is currently streaming
 * @param isLoading - Whether the system is loading
 * @returns Complete chat state object
 */
export function deriveChatState(
  messages: Message[],
  isStreaming: boolean,
  isLoading: boolean
): ChatState {
  // Filter messages into A2A and user-facing categories
  const { a2aMessages, userFacingMessages } = filterMessages(messages)
  
  // Check if artifacts have been created (artifact_created messages exist)
  const hasFinalArtifact = messages.some(msg => 
    msg.contentType === 'artifact_created' || 
    (msg.contentType && String(msg.contentType).includes('artifact'))
  )
  
  // Check if last message is currently streaming (visible in chat)
  const lastMessageIsStreaming = userFacingMessages.length > 0 && 
    userFacingMessages[userFacingMessages.length - 1].role === 'assistant' && 
    isStreaming
  
  // Check if there's a gap after user message (waiting for response)
  const hasGapAfterUserMessage = userFacingMessages.length > 0 && 
    userFacingMessages[userFacingMessages.length - 1].role === 'user' && 
    !isStreaming && 
    !isLoading
  
  // Check if we have at least one user message (processing started)
  const hasUserMessage = userFacingMessages.some(msg => msg.role === 'user')
  
  // Determine if we should show thinking indicator
  // CRITICAL RULE: Always show thinking OR streaming message from first user message → last artifact created
  // - If message is streaming → message is visible, don't show thinking (user sees the message)
  // - Once message finishes streaming → immediately show thinking again (background processing)
  // - If gap after user message → show thinking (waiting for response)
  // - If we have A2A messages → show thinking (background processing)
  // - If we're loading → show thinking
  const shouldShowThinking = hasUserMessage && 
    !lastMessageIsStreaming && 
    (a2aMessages.length > 0 || isLoading || hasGapAfterUserMessage)
  
  return {
    a2aMessages,
    userFacingMessages,
    hasFinalArtifact,
    lastMessageIsStreaming,
    hasGapAfterUserMessage,
    hasUserMessage,
    shouldShowThinking
  }
}

