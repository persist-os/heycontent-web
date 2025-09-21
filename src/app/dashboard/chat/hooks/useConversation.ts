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
    setError,
    setIsFirstMessage
  } = chatState

  // Initialize loading to false - only set to true when actually loading a conversation
  const [loading, setLoading] = useState(false)
  
  // Initialize session by setting sessionId to null
  // This ensures the backend will create a new session when the first message is sent
  const initSession = useCallback(() => {
    console.log('Initializing new chat session with null sessionId');
    setSessionId(null);
    setIsFirstMessage(true);
    return null;
  }, [setSessionId, setIsFirstMessage])

  const handleLoadConversation = useCallback(async (id: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // CRITICAL: Clear messages FIRST to prevent appending to old conversation
      setMessages([]);
      console.log('✅ Cleared messages before loading conversation');
      
      const data = await loadConversation(id);
      if (data.conversation) {
        // Validate messages before setting
        if (Array.isArray(data.conversation.messages)) {
          // Set the conversation messages
          setMessages(data.conversation.messages);
          
          // CRITICAL: Set session ID to the conversation ID 
          // This tells the backend which conversation to continue
          setSessionId(id);
          
          // CRITICAL: Mark this as NOT the first message since we're continuing an existing conversation
          setIsFirstMessage(false);
        } else {
          console.error('Loaded conversation has invalid messages format');
          throw new Error('Invalid message format in loaded conversation');
        }
      } else {
        console.error('No conversation data received');
        throw new Error('No conversation data received');
      }
    } catch (error: any) {
      console.error('❌ CONVERSATION LOAD FAILED:', error);
      
      if (error.message && (error.message.includes('404') || error.message.includes('not found'))) {
        console.warn('Conversation not found. Initializing a new session.');
        setError('Conversation not found. Starting a new chat.');
      } else {
        setError('Failed to load conversation. Starting a new chat.');
      }
      
      // Reset to new chat state
      initSession();
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]); // Simplified dependencies - only depend on user.uid for stability

  return {
    loading,
    setLoading,
    handleLoadConversation,
    initSession,
  }
} 