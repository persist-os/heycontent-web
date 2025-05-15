import { useState, useCallback } from 'react'
import { loadConversation } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'

export interface ConversationReturnType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  handleLoadConversation: (id: string) => Promise<void>;
  initSession: () => string | null;
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
    isLoading,
    error,
    setError
  } = chatState

  const [loading, setLoading] = useState(true)
  // Initialize session by setting sessionId to null
  // This ensures the backend will create a new session when the first message is sent
  const initSession = useCallback(() => {
    console.log('Initializing new chat session with null sessionId');
    setSessionId(null);
    return null;
  }, [setSessionId])

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
          console.log(`Loaded conversation: ${data.conversation.id} with ${data.conversation.messages.length} messages`);
        } else {
          console.error('Loaded conversation has invalid messages format');
          throw new Error('Invalid message format in loaded conversation');
        }
      }
    } catch (error: any) {
      if (error.message && error.message.includes('404')) {
        console.warn('Conversation not found. Initializing a new session with null sessionId.');
        initSession(); // Sets sessionId to null
        console.log('Reset sessionId to null after load failure');
      } else {
        console.error('Failed to load conversation:', error);
        setError('Failed to load conversation. Starting a new chat.');
        initSession(); // Sets sessionId to null
        console.log('Reset sessionId to null after load failure');
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