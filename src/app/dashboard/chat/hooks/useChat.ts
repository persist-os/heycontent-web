import { useState, useCallback, useRef } from 'react'
import { Message } from '@/app/types/chat'
import { sendChatMessage } from '../utils/api-utils'
import { ChatStateReturnType } from './useChatState'
import { getHelpMessage } from '../data/help-message'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useContentContext } from '@/store/content-context-store'
import { useRouter } from 'next/navigation'
import { AuthenticationError } from '@/app/lib/errors'

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
  const [statusHistory, setStatusHistory] = useState<string[]>([]) // Track all status updates
  
  // Add ref to track last sent message to prevent rapid duplicates
  const lastSentMessageRef = useRef<{ content: string; timestamp: number } | null>(null);

  // Add mutation hooks for chat mutations
  const createConversationMutation = useMutation(api.chatMutations.createConversation);
  const addMessageToConversationMutation = useMutation(api.chatMutations.addMessageToConversation);

  const router = useRouter();

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('🔗 useChat handleSendMessage called with:', {
      content: content.substring(0, 100) + '...',
      hasContentLinks: content.includes('@[')
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
      hasContentLinks: content.includes('@[')
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
      sessionId: sessionId // Include current sessionId
    }

    try {
      setIsLoading(true)
      setError(null)
      setSearchStatus('') // Clear previous search status
      setStatusHistory([]) // Reset status history for new message

      // Add user message and enhanced typing indicator with search status
      const typingMessage: Message = {
        id: uuidv4(),
        content: '...',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        status: 'typing',
        chat_response: '',
        searchStatus: '',
        statusHistory: [] // Initialize empty status history
      };

      setMessages(prev => {
        const newMessages = [...prev, newMessage, typingMessage];
        console.log('🔗 useChat: Messages after adding user message:', {
          totalMessages: newMessages.length,
          userMessage: newMessage,
          hasContentLinks: newMessage.content.includes('@[')
        });
        return newMessages;
      });

      // Status update handler for enhanced loading states
      const handleStatusUpdate = (status: string) => {
        console.log('🔍 Vector Search Status:', status);
        
        // Add to status history to track all updates
        setStatusHistory(prev => [...prev, status]);
        
        // Also update current status for display
        setSearchStatus(status);
        
        // Update the typing message with the current status
        setMessages(prev => 
          prev.map(msg => 
            msg.status === 'typing' 
              ? { ...msg, searchStatus: status, statusHistory: [...(msg.statusHistory || []), status] }
              : msg
          )
        );
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
        hasContentLinks: enhancedQuery.includes('@[')
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

      // Add final completion status update
      handleStatusUpdate('Analysis complete - response ready');

      // CRITICAL DEBUG: Check the raw backend response for persona flags
      console.log('🔍 useChat: RAW BACKEND RESPONSE:', JSON.stringify(data, null, 2));
      
      // Debug: Check if user_message is present
      console.log('🔗 useChat: Backend response debug:', {
        hasUserMessage: !!data.user_message,
        userMessageContent: data.user_message,
        userMessageLength: data.user_message?.length
      });
      
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
        console.log('🔗 useChat: Updating messages with backend response:', {
          totalMessages: prev.length,
          userMessages: prev.filter(msg => msg.role === 'user'),
          hasUserMessage: !!data.user_message,
          userMessagePreview: data.user_message?.substring(0, 100)
        });
        
        // Transform the typing message into the final response message
        const updatedMessages = prev.map((msg: Message) => {
          console.log('🔗 useChat: Processing message:', {
            id: msg.id,
            role: msg.role,
            status: msg.status,
            hasContentLinks: msg.content.includes('@['),
            contentPreview: msg.content.substring(0, 100),
            shouldUpdate: msg.role === 'user' && data.user_message && msg.content.includes('@[')
          });
          
          if (msg.status === 'typing') {
            return { 
              ...msg, 
              status: 'sent' as const, // Change status to completed
              content: data.chat_response, // Replace the "..." with actual content
              chat_response: data.chat_response, // Set the chat response
              searchStatus: '✅ Analysis complete - response ready',
              // Preserve all the progressive thinking data
              statusHistory: msg.statusHistory || [],
              vectorSearchMetadata: data.vector_search_metadata ? {
                foundRelevantContent: data.vector_search_metadata.foundRelevantContent,
                relevantItemsCount: data.vector_search_metadata.relevantItemsCount,
                relevantContent: data.vector_search_metadata.relevantContent || []
              } : undefined,
              // Add the response metadata
              sessionId: data.session_id || sessionId,
              metadata: data.metadata,
              suggestions: data.suggestions || []
            };
          } else if (msg.role === 'user' && data.user_message && msg.content.includes('@[')) {
            // Update the user message with the cleaned version from backend
            console.log('🔗 useChat: Updating user message with cleaned version:', {
              originalContent: msg.content,
              cleanedContent: data.user_message,
              hasUserMessage: !!data.user_message,
              hasContentLinks: msg.content.includes('@[')
            });
            return {
              ...msg,
              content: data.user_message, // Use the cleaned user message with titles
              chat_response: data.user_message
            };
          } else if (msg.role === 'user' && data.user_message) {
            // Debug: log why the message update condition didn't match
            console.log('🔗 useChat: Message update condition debug:', {
              role: msg.role,
              hasUserMessage: !!data.user_message,
              hasContentLinks: msg.content.includes('@['),
              contentPreview: msg.content.substring(0, 100),
              userMessagePreview: data.user_message.substring(0, 100)
            });
          }
          return msg;
        });
        
        // Add useful logging from main
        console.log('🔗 useChat: Messages after assistant response:', {
          totalMessages: updatedMessages.length,
          userMessages: updatedMessages.filter(msg => msg.role === 'user'),
          userMessageWithLinks: updatedMessages.filter(msg => msg.role === 'user' && msg.content.includes('@['))
        });
        
        return updatedMessages;
      });

      // Don't remove the typing message anymore - just clear the current status
      setTimeout(() => {
        // Clear search status and status history but keep the message
        setSearchStatus('');
        setStatusHistory([]); 
      }, 2000); // 2 second delay to show completion state

      // Update first message state after first successful response
      if (isFirstMessage) {
        console.log('[useChat] First message completed successfully, setting isFirstMessage to false');
        setIsFirstMessage(false);
      }

    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Optionally clear auth state here if needed
        router.push('/auth/login?reason=session_expired');
        return;
      }
      console.error('Chat error:', error);
      const friendlyError = error instanceof Error 
        ? error.message.includes('rate limit') 
          ? 'We\'re getting lots of love from creators right now! Please take a quick break and try again in a moment. Your creative flow is worth the wait! 🎨✨'
          : error.message.includes('timeout')
            ? 'Your creative genius is working hard! Let\'s give it a moment and try that again.'
            : `We hit a creative block: ${error.message}. Your work is safe - please try again!`
        : 'Our creative engine is warming up! Please try again in a moment.';
      setError(friendlyError);
      
      // Remove typing indicator on error and clear status after
      setMessages(prev => prev.filter(msg => msg.status !== 'typing'));
      setTimeout(() => {
        setSearchStatus(''); // Clear search status after error
        setStatusHistory([]); // Clear status history after error
      }, 1000); // Brief delay to allow error to be visible
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
    contentContext,
    router
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