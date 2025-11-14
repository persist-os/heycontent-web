/**
 * Message Type Constants and Filtering Utilities
 * 
 * Centralized constants for A2A vs user-facing message types.
 * Single source of truth for message filtering logic.
 */

import type { Message } from '@/app/types/chat'

/**
 * A2A (Agent-to-Agent) message types that should be displayed in thinking dropdown.
 * These are internal coordination messages, not user-facing.
 * Users don't need to see widget introductions, artifact creation, or status updates.
 */
export const A2A_MESSAGE_TYPES = [
  'a2a_announcement',
  'widget_agent_announcement',
  'widget_introduction',
  'artifact_created',
  'widget_status'
] as const

/**
 * User-facing message types that should remain in main chat.
 * These are messages users need to see and interact with.
 * Only preflight questions are truly user-facing - users need to answer them.
 */
export const USER_FACING_MESSAGE_TYPES = [
  'preflight_questions'
] as const

/**
 * TypeScript types derived from constants
 */
export type A2AMessageType = typeof A2A_MESSAGE_TYPES[number]
export type UserFacingMessageType = typeof USER_FACING_MESSAGE_TYPES[number]

/**
 * Check if a message is an A2A message
 */
export function isA2AMessage(message: Message): boolean {
  return message.contentType !== undefined && 
         A2A_MESSAGE_TYPES.includes(message.contentType as any)
}

/**
 * Filter messages into A2A and user-facing categories
 * 
 * CRITICAL: Messages without contentType are treated as user-facing (regular chat).
 * Only messages with explicit A2A contentType are filtered to thinking dropdown.
 */
export function filterMessages(messages: Message[]): {
  a2aMessages: Message[]
  userFacingMessages: Message[]
} {
  const a2aMessages = messages.filter(isA2AMessage)
  // User-facing: preflight questions, regular chat (no contentType), and any non-A2A messages
  const userFacingMessages = messages.filter(msg => {
    // If message has contentType, check if it's A2A
    if (msg.contentType) {
      return !isA2AMessage(msg)
    }
    // Messages without contentType are regular chat - always user-facing
    return true
  })
  return { a2aMessages, userFacingMessages }
}

