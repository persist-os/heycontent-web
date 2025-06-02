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
    setIsFirstMessage,
    contentContext,
    includeAnalysisInQuery
  } = chatState
  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)

  // Helper function to clean up role prefixes from AI responses
  const cleanupResponse = (response: string): string => {
    if (!response) return response;
    
    // Remove common role prefixes that shouldn't appear in responses
    const rolePrefixes = [
      /^Assistant:\s*/i,
      /^AI:\s*/i,
      /^Bot:\s*/i,
      /^ChatBot:\s*/i,
      /^System:\s*/i
    ];
    
    let cleaned = response;
    for (const prefix of rolePrefixes) {
      cleaned = cleaned.replace(prefix, '');
    }
    
    return cleaned.trim();
  };

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content || typeof content !== 'string' || !content.trim()) return;

    // Determine if this is the first message by checking sessionId directly
    const isFirstMessage = !sessionId;
    const backendSessionId = isFirstMessage ? null : sessionId;

    // Inject AI analysis into the query if enabled and available
    let enhancedQuery = content;
    let hasContextInjection = false;
    
    if (includeAnalysisInQuery && contentContext?.analysis) {
      hasContextInjection = true;
      
      // Use a more forceful prompt structure, especially for first messages
      if (isFirstMessage) {
        // More explicit instructions for first messages to prevent default responses
        enhancedQuery = `IMPORTANT: This is a content analysis discussion. DO NOT respond with generic greetings or default messages.

CONTEXT: I have a ${contentContext.platform.toUpperCase()} ${contentContext.platform === 'youtube' ? 'video' : 'content'} analysis that I want to discuss.

ANALYSIS DATA:
${contentContext.analysis}

CRITICAL INSTRUCTION: You MUST analyze and respond based on the provided context above. Do not ignore this context or provide generic responses.

USER QUESTION: ${content}

Please provide a detailed response based on the analysis data provided.`;
      } else {
        // Less aggressive for subsequent messages
        enhancedQuery = `Context for user question:\n\n${contentContext.analysis}\n\nMake sure to answer the following user question in your response USING THE CONTEXT PROVIDED\n\n---\n\nUser question: ${content}`;
      }
    }

    // Log current state to debug the issue
    console.log('Current chat state before sending message:', {
      isFirstMessage,
      sessionId,
      messagesCount: messages.length,
      hasContentContext: !!contentContext,
      contentContextPlatform: contentContext?.platform,
      includeAnalysisInQuery,
      hasAnalysis: !!contentContext?.analysis,
      hasContextInjection,
      originalQueryLength: content.length,
      enhancedQueryLength: enhancedQuery.length,
      contextAnalysisPreview: contentContext?.analysis?.substring(0, 100) + '...'
    });

    // Log the enhanced query structure for debugging
    if (hasContextInjection) {
      console.log('Enhanced query with context injection:', {
        isFirstMessage,
        queryStructure: isFirstMessage ? 'FORCEFUL_FIRST_MESSAGE' : 'STANDARD_CONTEXT',
        fullQuery: enhancedQuery.substring(0, 200) + '...'
      });
    }

    const newMessage: Message = {
      id: uuidv4() as string,
      content, // Store the original user message for display
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

      // Send the enhanced query to the backend (with analysis injected if enabled)
      // Don't send content_context separately anymore since it's injected in the query
      const data = await sendChatMessage(enhancedQuery, isFirstMessage, backendSessionId, null, hasContextInjection);

      // Log the response to check structure
      console.log('API response:', data);
      
      // Check if the response seems to be ignoring context
      if (hasContextInjection) {
        const response = data.chat_response?.toLowerCase() || '';
        const hasGenericGreeting = response.includes('hey') || response.includes('ready to make') || response.includes('brainstorm');
        const responseLength = data.chat_response?.length || 0;
        
        console.log('Context injection analysis:', {
          hasContextInjection,
          isFirstMessage,
          hasGenericGreeting,
          responseLength,
          seemsToIgnoreContext: hasGenericGreeting && responseLength < 200,
          responsePreview: data.chat_response?.substring(0, 150) + '...'
        });
        
        if (hasGenericGreeting && responseLength < 200) {
          console.warn('⚠️ Backend appears to be ignoring context injection - received generic response');
        }
      }

      // Update messages with the response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing');
        const cleanedResponse = cleanupResponse(data.chat_response);
        return [...withoutTyping, {
          id: uuidv4(),
          content: cleanedResponse,
          chat_response: cleanedResponse,
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
  }, [referencedMessage, sessionId, messages.length, setMessages, setSessionId, setIsLoading, setError, contentContext, includeAnalysisInQuery])

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