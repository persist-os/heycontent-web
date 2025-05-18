import { useState, useCallback } from 'react'
import { Message } from '@/app/types/chat'
import { sendChatMessage } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'

import { v4 as uuidv4 } from 'uuid';

export const useChat = (
  chatState: ChatStateReturnType
) => {
  const {
    sessionId,
    setSessionId,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    error,
    setError,
    isFirstMessage,
    setIsFirstMessage
  } = chatState
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content || typeof content !== 'string' || !content.trim()) return;

    // Determine if this is the first message by checking sessionId directly
    const isFirstMessage = !sessionId;
    const backendSessionId = isFirstMessage ? null : sessionId;

    // Log current state to debug the issue
    console.log('Current chat state before sending message:', {
      isFirstMessage,
      sessionId,
      messagesCount: messages.length
    });

    const newMessage: Message = {
      id: uuidv4() as string,
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
      referencedMessage: referencedMessage ? {
        id: referencedMessage.id,
        content: referencedMessage.content
      } : undefined,
      chat_response: content
    }

    try {
      setIsLoading(true)
      setError(null)

      // Add user message and typing indicator
      setMessages(prev => [
        ...prev,
        newMessage,
        {
          id: uuidv4(),
          content: '...',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          status: 'typing',
          chat_response: ''
        }
      ]);


      console.log('Sending message with isFirstMessage:', isFirstMessage, 'backendSessionId:', backendSessionId);

      // Send message to the backend - pass isFirstMessage to ensure it's correctly flagged
      const data = await sendChatMessage(content, isFirstMessage, backendSessionId);

      // Log the response to check structure
      console.log('API response:', data);
      
      // Update messages with the response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing');
        return [...withoutTyping, {
          id: uuidv4(),
          content: data.chat_response,
          chat_response: data.chat_response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          suggestions: data.suggestions || []
        }];
      });



      // Only update sessionId from backend (never generate a local one for persistence)
      // Only set sessionId if we don't already have a valid one
      const isValidBackendSession = typeof sessionId === 'string' && sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      if (data.session_id && !isValidBackendSession) {
        console.log('Received session ID from API:', data.session_id);
        setSessionId(data.session_id);
        // Do NOT set conversationSaved(false) here; already set above after user message
      } else if (!sessionId) {
        // If the backend fails to return a sessionId, do not attempt to save or persist
        console.warn('No session ID received from API. Will not persist conversation until backend provides one.');
      } // else: do not set conversationSaved(false) again

      setReferencedMessage(null)

    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.filter(msg => msg.status !== 'typing'))
      setError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [referencedMessage, sessionId, messages.length, setMessages, setSessionId, setIsLoading, setError])

  const handleMessageReference = useCallback((message: Message) => {
    setReferencedMessage(message)
  }, [])

  const handleClearReference = useCallback(() => {
    setReferencedMessage(null)
  }, [])

  const handleOptionClick = useCallback((option: { text: string }) => {
    if (!option?.text) return;
    handleSendMessage(option.text);
  }, [handleSendMessage]);

  const handleFollowUpClick = useCallback((choice: string) => {
    handleSendMessage(choice);
  }, [handleSendMessage]);

  const handleReferenceClick = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
      // Add a brief highlight effect
      messageElement.classList.add('bg-yellow-100/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100/50');
      }, 2000);
    }
  }, []);

  return {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick
  }
} 