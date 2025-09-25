/**
 * Conversation State Management Hook
 * 
 * Custom React hook for managing conversation state and message history
 * in the project discovery system. Handles message addition, updates,
 * and conversation history management.
 * 
 * Used by: Message display components, main container component
 */
import { useCallback, useState } from 'react'
import type { MessageData, ConversationState } from '../types/discoveryTypes'

/**
 * useConversationState
 * 
 * Manages conversation metadata and message history for the
 * Project Discovery experience.
 */
export function useConversationState(initialMessages: MessageData[] = []) {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages)
  const [conversation, setConversation] = useState<ConversationState>({
    conversation_id: null,
    fingerprint_complete: false,
    last_updated: null,
    error_occurred: false
  })

  /** Add a new message to the conversation. */
  const addMessage = useCallback((message: MessageData): void => {
    setMessages(prev => [...prev, message])
    setConversation(prev => ({ ...prev, last_updated: new Date().toISOString() }))
  }, [])

  /** Replace the message at a specific index. */
  const updateMessage = useCallback((index: number, message: MessageData): void => {
    setMessages(prev => prev.map((m, i) => (i === index ? message : m)))
    setConversation(prev => ({ ...prev, last_updated: new Date().toISOString() }))
  }, [])

  /** Remove all messages and reset conversation timestamps. */
  const clearConversation = useCallback((): void => {
    setMessages([])
    setConversation(prev => ({ ...prev, last_updated: new Date().toISOString() }))
  }, [])

  /** Get an immutable snapshot of the message history. */
  const getConversationHistory = useCallback((): MessageData[] => {
    return [...messages]
  }, [messages])

  return { messages, conversation, setConversation, addMessage, updateMessage, clearConversation, getConversationHistory }
}

export default useConversationState


