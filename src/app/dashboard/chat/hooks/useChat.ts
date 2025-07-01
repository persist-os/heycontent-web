import { useState, useCallback, useRef } from 'react'
import { Message } from '@/app/types/chat'
import { sendChatMessage } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'
import { getHelpMessage } from '../data/help-message'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useContentContext } from '@/store/content-context-store'

import { v4 as uuidv4 } from 'uuid';

export const useChat = (
  chatState: ChatStateReturnType,
  userId?: string,
  useContextSearch: boolean = true
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
    includeAnalysisInQuery,
  } = chatState

  // Get content context from Zustand store
  const { context: contentContext } = useContentContext()

  const [referencedMessage, setReferencedMessage] = useState<Message | null>(null)
  const [searchStatus, setSearchStatus] = useState<string>('')
  
  // Add ref to track last sent message to prevent rapid duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  // Add mutation hooks for chat mutations
  const createConversationMutation = useMutation(api.chatMutations.createConversation);
  const addMessageToConversationMutation = useMutation(api.chatMutations.addMessageToConversation);

  const handleSendMessage = useCallback(async (content: string, linkRegistry?: Array<{index: number, contentId: string}>) => {
    console.log('🔗 useChat handleSendMessage called with:', {
      content: content.substring(0, 100) + '...',
      hasLinkRegistry: !!linkRegistry,
      linkRegistryLength: linkRegistry?.length || 0,
      linkRegistry: linkRegistry
    })
    
    if (!content || typeof content !== 'string' || !content.trim()) return;

    // Prevent duplicate messages within a short time window (1 second)
    const now = Date.now();
    const trimmedContent = content.trim();
    
    if (lastSentMessageRef.current && 
        lastSentMessageRef.current.content === trimmedContent && 
        now - lastSentMessageRef.current.timestamp < 1000) {
      console.log('Duplicate message prevented:', trimmedContent);
      return;
    }
    
    // Update last sent message tracking
    lastSentMessageRef.current = { content: trimmedContent, timestamp: now };

    // Clear all assistant message suggestions immediately when user sends a message
    setMessages(prev => {
      const hasSuggestionsToClear = prev.some(msg => msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0);
      if (!hasSuggestionsToClear) return prev;
      
      return prev.map(msg => {
        if (msg.role === 'assistant' && msg.suggestions) {
          return { ...msg, suggestions: [] };
        }
        return msg;
      });
    });

    // Check for help command (case-insensitive, exact match)
    if (content.trim().toLowerCase() === 'hey content help') {
      const helpMsg = getHelpMessage();
      const userMessage: Message = {
        id: uuidv4(),
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        chat_response: content,
        sessionId: sessionId
      };
      setMessages(prev => [...prev, userMessage, helpMsg]);
      return;
    }

    // Determine if this is the first message by checking sessionId directly
    const isFirstMessage = !sessionId;
    const backendSessionId = isFirstMessage ? null : sessionId;

    // Inject AI analysis into the query if enabled and available
    let enhancedQuery = content;
    if (includeAnalysisInQuery && contentContext?.analysis) {
      enhancedQuery = `Context for user question:\n\n${contentContext.analysis}\n\n Make sure to address user question in your response\n\n---\n\nUser question: ${content}`;
    }

    console.log('🔗 useChat: Creating message with:', {
      content: content.substring(0, 100) + '...',
      hasLinkRegistry: !!linkRegistry,
      linkRegistryLength: linkRegistry?.length || 0,
      linkRegistry: linkRegistry
    })
    
    const newMessage: Message = {
      id: uuidv4() as string,
      content, // Store the original user message for display
      role: 'user',
      timestamp: new Date().toISOString(),
      referencedMessage: referencedMessage ? {
        id: referencedMessage.id,
        content: referencedMessage.content
      } : undefined,
      chat_response: content,
      sessionId: sessionId, // Include current sessionId
      metadata: {
        ...(linkRegistry && { linkRegistry }), // Include link registry in metadata
        ...(linkRegistry && { debug_linkRegistry: JSON.stringify(linkRegistry) }), // Debug: also store as string
        ...(linkRegistry && { debug_content: content }) // Debug: store the content being sent
      }
    }

    try {
      setIsLoading(true)
      setError(null)
      setSearchStatus('') // Clear previous search status

      // Add user message and enhanced typing indicator with search status
      const typingMessage: Message = {
        id: uuidv4(),
        content: '...',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        status: 'typing',
        chat_response: '',
        searchStatus: ''
      };

      setMessages(prev => {
        const newMessages = [...prev, newMessage, typingMessage];
        console.log('🔗 useChat: Messages after adding user message:', {
          totalMessages: newMessages.length,
          userMessage: newMessage,
          userMessageMetadata: newMessage.metadata,
          userMessageLinkRegistry: newMessage.metadata?.linkRegistry
        });
        return newMessages;
      });

      // Status update callback to show search progress
      const handleStatusUpdate = (status: string) => {
        setSearchStatus(status);
        console.log('🔍 Vector Search Status:', status);
        
        // Check if this is a vector search results update
        if (status.startsWith('VECTOR_SEARCH_RESULTS:')) {
          const vectorSearchData = JSON.parse(status.replace('VECTOR_SEARCH_RESULTS:', ''));
          console.log('📊 Received vector search results immediately:', vectorSearchData);
          
          // Update the typing message with vector search results
          setMessages(prev => 
            prev.map(msg => 
              msg.status === 'typing' && msg.role === 'assistant' 
                ? { 
                    ...msg, 
                    searchStatus: `Found ${vectorSearchData.relevantItemsCount} relevant items`,
                    vectorSearchMetadata: vectorSearchData
                  }
                : msg
            )
          );
        } else {
          // Update the typing message with search status
          setMessages(prev => 
            prev.map(msg => 
              msg.status === 'typing' && msg.role === 'assistant' 
                ? { ...msg, searchStatus: status }
                : msg
            )
          );
        }
      };

      // Save persona conversations separately
      if (sessionId && sessionId.startsWith('persona_')) {
        if (isFirstMessage) {
          const conversationId = await createConversationMutation({
            userId: userId || '',
            title: 'Persona Conversation',
            messages: [
              {
                content: trimmedContent,
                role: 'user',
                timestamp: Date.now(),
              }
            ]
          });
          setSessionId(conversationId);
        } else {
          await addMessageToConversationMutation({
            userId: userId || '',
            conversationId: sessionId,
            message: {
              content: trimmedContent,
              role: 'user',
              timestamp: Date.now(),
            }
          });
        }
      }

      console.log('Sending message with isFirstMessage:', isFirstMessage, 'backendSessionId:', backendSessionId);

      // Send the enhanced query to the backend (with analysis injected if enabled)
      // Now includes vector search with status updates
      console.log('🔗 useChat: Sending to backend:', {
        enhancedQuery: enhancedQuery.substring(0, 100) + '...',
        hasLinkRegistry: !!linkRegistry,
        linkRegistry: linkRegistry
      })
      
      const data = await sendChatMessage(
        enhancedQuery, 
        isFirstMessage, 
        backendSessionId, 
        contentContext, 
        includeAnalysisInQuery && !!contentContext?.analysis,
        handleStatusUpdate, // Pass status update callback
        useContextSearch // Pass context search toggle
      );

      // CRITICAL DEBUG: Check the raw backend response for persona flags
      console.log('🔍 useChat: RAW BACKEND RESPONSE:', JSON.stringify(data, null, 2));
      
      // Log vector search results if available
      if (data.vector_search_metadata) {
        console.log('📊 Vector Search Results Applied:', {
          foundRelevantContent: data.vector_search_metadata.foundRelevantContent,
          relevantItemsCount: data.vector_search_metadata.relevantItemsCount,
          relevantContent: data.vector_search_metadata.relevantContent
        });
      }
      
      // Handle session ID from backend response
      console.log('[useChat] Received response:', {
        hasSessionId: !!data.session_id,
        currentSessionId: sessionId,
        isFirstMessage,
        isPersonaFlow: data.metadata?.is_persona_flow,
        hasVectorContext: !!data.vector_search_metadata,
        responseData: data
      });

      // Always use the session ID from the backend if it exists
      if (data.session_id) {
        console.log('[useChat] Received session ID from backend:', data.session_id);
        
        // Only update the session ID if it's different from the current one
        if (sessionId !== data.session_id) {
          console.log('[useChat] Updating session ID from:', sessionId, 'to:', data.session_id);
          setSessionId(data.session_id);
        }
      } 
      // Only generate a new session ID if this is the first message and we don't have one yet
      else if (isFirstMessage && !sessionId) {
        const newSessionId = `frontend_${Date.now()}`;
        console.log('[useChat] Generated new frontend session ID:', newSessionId);
        setSessionId(newSessionId);
      }
      
      // Log the current session state for debugging
      console.log('[useChat] Current session state:', { 
        receivedSessionId: data.session_id, 
        currentSessionId: sessionId,
        isFirstMessage,
        isPersonaFlow: data.metadata?.is_persona_flow,
        hasMetadata: !!data.metadata,
        hasVectorSearchMetadata: !!data.vector_search_metadata,
        metadata: data.metadata
      });

      // Update messages with the response
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => msg.status !== 'typing');
        const newMessage: Message = {
          id: uuidv4(),
          content: data.chat_response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          chat_response: data.chat_response,
          sessionId: data.session_id || sessionId,
          metadata: data.metadata,
          vectorSearchMetadata: data.vector_search_metadata, // Add vector search metadata
          suggestions: data.suggestions || []
        };
        
        const updatedMessages = [...withoutTyping, newMessage];
        console.log('🔗 useChat: Messages after assistant response:', {
          totalMessages: updatedMessages.length,
          userMessages: updatedMessages.filter(msg => msg.role === 'user'),
          userMessageWithLinks: updatedMessages.filter(msg => msg.role === 'user' && msg.content.includes('@[')),
          userMessageMetadata: updatedMessages.filter(msg => msg.role === 'user').map(msg => ({
            id: msg.id,
            content: msg.content.substring(0, 50) + '...',
            hasMetadata: !!msg.metadata,
            metadataKeys: msg.metadata ? Object.keys(msg.metadata) : [],
            linkRegistry: msg.metadata?.linkRegistry
          }))
        });
        
        return updatedMessages;
      });

      // Clear search status after completion
      setSearchStatus('');

      // Update first message state after first successful response
      if (isFirstMessage) {
        console.log('[useChat] First message completed successfully, setting isFirstMessage to false');
        setIsFirstMessage(false);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      
      // Remove typing indicator on error
      setMessages(prev => prev.filter(msg => msg.status !== 'typing'));
      setSearchStatus(''); // Clear search status on error
    } finally {
      setIsLoading(false);
    }
  }, [
    sessionId,
    setSessionId,
    messages,
    setMessages,
    setIsLoading,
    setError,
    isFirstMessage,
    setIsFirstMessage,
    includeAnalysisInQuery,
    referencedMessage,
    userId,
    createConversationMutation,
    addMessageToConversationMutation,
    useContextSearch,
    contentContext
  ]);

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