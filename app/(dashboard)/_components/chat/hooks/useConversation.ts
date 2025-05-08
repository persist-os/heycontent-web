import { useState, useCallback } from 'react'
import { Message } from '@/app/types/chat'
import { loadConversation } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'
import { v4 as uuidv4 } from 'uuid'

export interface ConversationReturnType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleLoadConversation: (id: string) => Promise<void>;
  initSession: () => string;
}

export const useConversation = (
  chatState: ChatStateReturnType,
  user: any
): ConversationReturnType => {
  const {
    messages,
    setMessages,
    sessionId,
    setSessionId,
    conversationSaved,
    setConversationSaved,
    isLoading,
    error,
    setError
  } = chatState

  const [loading, setLoading] = useState(true)
  // Initialize session with UUID
  const initSession = useCallback(() => {
    // Generate deterministic UUID for new sessions
    const newSessionId = uuidv4();
    console.log('Initializing new chat session with ID:', newSessionId);
    setSessionId(newSessionId);
    setConversationSaved(false);
    return newSessionId;
  }, [setSessionId, setConversationSaved])

  const handleLoadConversation = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setLoading(true);
      console.log('Loading conversation:', id);
      const data = await loadConversation(id);
      if (data.conversation) {
        // Validate messages before setting
        if (Array.isArray(data.conversation.messages)) {
          setMessages(data.conversation.messages);
          setSessionId(data.conversation.id);
          setConversationSaved(true);
          console.log(`Loaded conversation: ${data.conversation.id} with ${data.conversation.messages.length} messages`);
        } else {
          console.error('Loaded conversation has invalid messages format');
          throw new Error('Invalid message format in loaded conversation');
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        console.warn('Conversation not found. Initializing a new session.');
        const newId = initSession();
        console.log('Created new session ID after load failure:', newId);
      } else {
        console.error('Failed to load conversation:', error);
        setError('Failed to load conversation. Starting a new chat.');
        const newId = initSession();
        console.log('Created new session ID after load failure:', newId);
      }
    } finally {
      setLoading(false);
    }
  }, [user, setMessages, setSessionId, setError, initSession]);

  return {
    loading,
    setLoading,
    handleLoadConversation,
    initSession,
  }
} 