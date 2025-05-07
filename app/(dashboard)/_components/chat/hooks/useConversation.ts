import { useState, useCallback, useEffect, useRef } from 'react'
import { Message } from '@/app/types/chat'
import { saveConversation, loadConversation } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'

export const useConversation = (
  chatState: ChatStateReturnType,
  user: any
) => {
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
  // Ref to prevent parallel saves
  const saving = useRef(false)
  // Ref to always have the latest conversationSaved in effects
  const conversationSavedRef = useRef(conversationSaved)
  useEffect(() => { conversationSavedRef.current = conversationSaved }, [conversationSaved])
  
  const handleSaveConversation = useCallback(async () => {
    // Only save if we have at least 2 messages (a user message and a response)
    if (messages.length < 2) {
      console.log('Skipping save conversation: not enough messages');
      return;
    }

    // Prevent saving if already in progress
    if (isLoading) {
      console.log('Skipping save conversation while messages are loading');
      return;
    }
    if (saving.current) {
      console.warn('Save already in progress, skipping this save attempt');
      return;
    }

    // Only save if sessionId is a valid backend UUID (canonical session)
    const isValidBackendSession = typeof sessionId === 'string' && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    if (!isValidBackendSession) {
      console.log('Not saving conversation: sessionId is not a valid backend UUID', sessionId);
      return;
    }

    try {
      saving.current = true;

      // Generate a title from the first user message
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const title = firstUserMessage ?
        (firstUserMessage.content.length > 30 ?
          firstUserMessage.content.substring(0, 30) + '...' :
          firstUserMessage.content) :
        'Chat conversation';

      // Skip if nothing has changed since last save
      if (conversationSaved) {
        console.log('Conversation already saved, skipping save');
        return;
      }

      // Clean up and deduplicate messages before saving
      const uniqueMessageIds = new Set();
      const cleanedMessages = messages
        // Remove typing indicators
        .filter(msg => msg.status !== 'typing')
        // Deduplicate messages based on content and role
        .filter(msg => {
          // Create a unique key for each message using content + role
          const messageKey = `${msg.role}:${msg.content.substring(0, 50)}`;
          if (uniqueMessageIds.has(messageKey)) {
            return false;
          }
          uniqueMessageIds.add(messageKey);
          return true;
        });

      // Save conversation with backend sessionId as both sessionId and conversationId
      const result = await saveConversation(
        cleanedMessages, 
        title, 
        sessionId,
        sessionId
      );
      
      // If we got a new conversationId back, update our sessionId (shouldn't happen if logic is correct)
      if (result && result !== sessionId) {
        console.log('Warning: backend returned a new conversationId, updating sessionId:', result);
        setSessionId(result);
      }
      setConversationSaved(true);
    } catch (error) {
      console.error('Failed to save conversation:', error);
      setError('Failed to save conversation');
      // Do NOT retry save in a loop; user must retry manually if needed
    } finally {
      saving.current = false;
    }
  }, [messages, sessionId, conversationSaved, isLoading, setSessionId, setError, setConversationSaved]);

  const handleLoadConversation = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await loadConversation(id);
      if (data.conversation) {
        setMessages(data.conversation.messages);
        setSessionId(data.conversation.id);
        setConversationSaved(true);
        console.log('Loaded conversation:', data.conversation.id);
      }
    } catch (error: any) {
      // Check if error is a 404 (conversation not found)
      if (error.message && error.message.includes('404')) {
        console.warn('Conversation not found, creating a new one...');
        try {
          // Create a new conversation with the given id as sessionId
          const conversationId = await saveConversation([], 'New Conversation', id);
          if (conversationId) {
            // Try loading the newly created conversation
            const data = await loadConversation(conversationId);
            if (data.conversation) {
              setMessages(data.conversation.messages);
              setSessionId(data.conversation.id);
              setConversationSaved(true);
              console.log('Created and loaded new conversation:', data.conversation.id);
              setError(null);
              return;
            }
          }
        } catch (createError) {
          console.error('Failed to create new conversation:', createError);
          setError('Failed to create a new conversation.');
        }
      } else {
        console.error('Failed to load conversation:', error);
        setError('Failed to load conversation. Starting a new chat.');
      }
      // Start a new session if loading fails for any reason
      setSessionId(Date.now().toString());
    } finally {
      setLoading(false);
    }
  }, [user, setMessages, setSessionId, setError, setConversationSaved]);

  // AUTO-SAVE: Save only once after a user/assistant exchange, never in a loop.
  useEffect(() => {
    // Only auto-save if:
    // - There are at least 2 messages
    // - The last message is from the assistant
    // - Not already saved
    // - Not already saving
    // - sessionId is valid
    const isValidBackendSession = typeof sessionId === 'string' && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    if (
      messages.length >= 2 &&
      messages[messages.length - 1]?.role === 'assistant' &&
      !conversationSavedRef.current &&
      !saving.current &&
      isValidBackendSession
    ) {
      handleSaveConversation();
    }
  }, [messages, sessionId]);

  return {
    loading,
    setLoading,
    handleSaveConversation,
    handleLoadConversation
  }
} 