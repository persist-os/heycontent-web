import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { RefreshCw, Brain } from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'

// Import types
import { ChatScreenProps, SuggestedAction } from './types'
import { Message } from '@/app/types/chat'

// Import components 
import { BottomBarActions } from './components/BottomBarActions';
import { useAmbientInsightsActions } from './components/AmbientInsightsActions';
import { PersonaTip } from './components/PersonaTip'
import ChatHeader from './components/ChatHeader'
import ChatContextBox from './components/ChatContextBox'
import AIInsightsContextBox from './components/AIInsightsContextBox'
import ChatMessagesList from './components/ChatMessagesList'
import ChatInputArea from './components/ChatInputArea'
import { AmbientInsightsContainer } from './components/AmbientInsightsContainer'

import { welcomeMessageSteps, getWelcomeStepMessage, welcomeSuggestions, welcomeSuggestionsWithPersona } from './data/welcome-message'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'

import { useOnboardingState } from './hooks/useOnboardingState'
import { usePersonaData } from './hooks/usePersonaData'
import { useAuth } from '@/app/context/auth-context'
import { generateEmbeddingsForUser, checkUserEmbeddings, deleteAllUserEmbeddings } from './utils/api-utils';
import { getCurrentUserId } from '@/app/lib/api-helpers';


const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery }) => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === 'true';
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const { isExpanded, setIsExpanded } = useSidebar()
  
  // Track which conversation has been loaded to prevent infinite loops
  const loadedConversationRef = useRef<string | null>(null)

  // Initialize shared state
  const chatState = useChatState()
  const {
    messages,
    setMessages,
    error,
    isLoading,
    contentContext: currentContext,
    setContentContext,
    includeAnalysisInQuery,
    setIncludeAnalysisInQuery
  } = chatState

  // Add input state management
  const [inputValue, setInputValue] = useState('')

  // Utility function to clean bullet points from suggestions
  const cleanSuggestionText = (text: string): string => {
    return text
      .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points (-, *, •)
      .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
      .trim();
  };

  // Check if user has an existing persona
  const { hasPersona } = usePersonaData(userId, !!userId)

  // Set content context when component mounts or when contentContext prop changes
  useEffect(() => {
    if (contentContext && contentContext !== currentContext) {
      setContentContext(contentContext)
    }
  }, [contentContext, currentContext, setContentContext])

  // Initialize UI effects hook
  const {
    chatContainerRef,
    inputRef,
    showAmbient,
    setShowAmbient,
    isRefreshing,
    ambientError,
    handleInsightClick: handleRawInsightClick,
    handleRefresh,
    resetChat
  } = useUIEffects(messages, isExpanded)

  // Initialize chat hook with shared state and userId
  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick: handleReferenceClickProp
  } = useChat(chatState, userId)

  // Initialize ambient insights actions
  const ambientInsightsActions = useAmbientInsightsActions(handleSendMessage);

  // Track onboarding state for persona tip
  const onboardingState = useOnboardingState(messages, chatState.sessionId)

  // Effect to detect persona completion and trigger persona display
  useEffect(() => {
    if (!userId || messages.length === 0) return;

    // Check if the last message indicates persona completion
    const lastMessage = messages[messages.length - 1];
    const isPersonaCompleted = lastMessage.role === 'assistant' && 
                              (lastMessage.metadata?.is_persona_complete === true || 
                               lastMessage.metadata?.persona_created === true);

    if (isPersonaCompleted) {
      console.log('🎭 Persona completion detected in chat flow!');
  
    }
  }, [messages, userId]);

  // Track which welcome step the user is on
  const [welcomeStep, setWelcomeStep] = useState(0);
  
  // Add a ref to track if askQuery has been processed to prevent duplicates
  const askQueryProcessedRef = useRef<string | null>(null);

  const handleReferenceClick = (messageId: string) => {
    handleReferenceClickProp(messageId)
  }

  // Initialize conversation hook with shared state
  const {
    loading: conversationLoading,
    setLoading: setConversationLoading,
    handleLoadConversation,
    initSession // Extract the initSession function from the hook
  } = useConversation(chatState, user)

  // Use a separate loading state for auth
  const [authLoading, setAuthLoading] = useState(true)

  // Handle bottom bar action click
  const handleActionClick = (action: string) => {
    handleSendMessage(action);
  };
  // Handle new chat: this is the ONLY way to start a truly fresh conversation.
  // Clears all chat state and ensures the next message will start a new backend session/conversation.
  const handleNewChat = () => {
    // UI resets
    resetChat();
    setMessages([]);
    if (handleClearReference) {
      handleClearReference();
    }
    // CRITICAL: Reset state for a new chat session
    console.log('Initializing new chat session...');
    
    // Important: Force sessionId to null
    window.localStorage.removeItem('chatSessionId'); // Also clear from storage if present
    chatState.setSessionId(null);
    
    // Important: Set isFirstMessage to true
    chatState.setIsFirstMessage(true);
    
    // Clear content context when starting new chat
    setContentContext(null);
    
    // Clear the loaded conversation ref to allow loading new conversations
    loadedConversationRef.current = null;
    
    // Navigate to a clean chat URL without chatId
    router.push('/dashboard/chat');

    // Reset askQuery processing to allow new auto-sends
    askQueryProcessedRef.current = null;
    
    // Clear input value
    setInputValue('');
    
    console.log('Started new chat with fresh state:', {
      sessionId: null,
      isFirstMessage: true,
      messagesCount: 0,
      contentContext: null
    });

  };

  // Handle removing context
  const handleRemoveContext = () => {
    setContentContext(null);
    // Update URL to remove context parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('contentContext');
    router.replace(url.pathname + url.search);
  };

  // Handle initial ask query if provided
  useEffect(() => {
    // Only process askQuery if we haven't processed it yet, we're not in a loading state, and we have a user
    if (askQuery && 
        askQuery !== askQueryProcessedRef.current && 
        !isLoading && 
        !welcome &&
        messages.length === 0 &&
        user) {
      
      console.log('Processing askQuery:', askQuery, 'with context:', currentContext);
      
      // Mark this askQuery as processed immediately to prevent duplicate processing
      askQueryProcessedRef.current = askQuery;
      
      // Send the message with a small delay to ensure context is properly set
      setTimeout(() => {
        handleSendMessage(askQuery);
      }, 100);
    }
  }, [askQuery, isLoading, welcome, handleSendMessage, messages.length, user, currentContext]);
  
  // Handle insight clicks by sending the action as a message
  const handleInsightClick = useCallback((action: string, insight: any) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

  // Authentication effect
  const { firebaseUser, getToken } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);

  // Set user, userId, and userEmail from firebaseUser
  useEffect(() => {
    if (firebaseUser) {
      setUser(firebaseUser);
      setUserId(firebaseUser.uid);
      setUserEmail(firebaseUser.email);
      setAuthLoading(false);
    } else {
      setUser(null);
      setUserId(undefined);
      setUserEmail(undefined);
      setAuthLoading(true);
    }
  }, [firebaseUser]);

  useEffect(() => {
    async function fetchApiKey() {
      if (firebaseUser && getToken) {
        try {
          const token = await getToken();
          setApiKey(token);
        } catch (error) {
          console.error('Failed to get API key token:', error);
          setApiKey(null);
        }
      } else {
        setApiKey(null);
      }
    }
    fetchApiKey();
  }, [firebaseUser, getToken]);

  // Load conversation when user and chatId are available, or reset when chatId is null
  useEffect(() => {
    if (user && !authLoading) {
      if (chatId && loadedConversationRef.current !== chatId) {
        console.log('Attempting to load conversation:', chatId);
        loadedConversationRef.current = chatId; // Mark this conversation as being loaded
        handleLoadConversation(chatId);
      } else if (!chatId && loadedConversationRef.current !== null) {
        // User navigated to new chat - reset state
        console.log('Switching to new chat - resetting conversation state');
        setMessages([]);
        chatState.setSessionId(null);
        chatState.setIsFirstMessage(true);
        loadedConversationRef.current = null;
      }
    }
  }, [chatId, user, authLoading, handleLoadConversation, chatState]);

  // Handle welcome message for new users (multi-step)
  useEffect(() => {
    if (welcome && messages.length === 0 && !isLoading && user) {
      setWelcomeStep(0);
      setMessages([getWelcomeStepMessage(0)]);
      // Clear the welcome parameter from URL without causing a reload
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
  }, [user, chatId, authLoading, handleLoadConversation]);

  // Modified handleSuggestionClick to send messages automatically
  const handleSuggestionClick = (suggestion, onSendMessage) => {
    // If we're in the welcome step flow, advance the step
    if (
      messages.length > 0 &&
      messages[messages.length - 1].id.startsWith('welcome-step-') &&
      messages[messages.length - 1].role === 'assistant'
    ) {
      const currentStep = messages[messages.length - 1].metadata?.step || 0;
      const isLastStep = currentStep === welcomeMessageSteps.length - 1;
      const lastWelcomeWithSuggestions = messages[messages.length - 1].suggestions &&
        Array.isArray(messages[messages.length - 1].suggestions) &&
        messages[messages.length - 1].suggestions.length > 1 &&
        messages[messages.length - 1].suggestions.includes('hey content persona');
      // Prevent duplicate appending after the last step
      if (isLastStep && lastWelcomeWithSuggestions) {
        // After the last step, treat as a normal suggestion click
        const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
        onSendMessage(message);
        return;
      }
      const userMessage: Message = {
        id: `welcome-user-${currentStep}`,
        content: suggestion,
        chat_response: suggestion,
        role: 'user',
        timestamp: new Date().toISOString(),
        suggestions: [],
      };
      if (currentStep < welcomeMessageSteps.length - 1) {
        const nextStep = currentStep + 1;
        setWelcomeStep(nextStep);
        setMessages(prev => [
          ...prev,
          userMessage,
          { ...getWelcomeStepMessage(nextStep), role: 'assistant' }
        ]);
        return;
      } else {
        // Last step: show normal suggestions only once
        setMessages(prev => [
          ...prev,
          userMessage,
          {
            ...getWelcomeStepMessage(currentStep),
            role: 'assistant',
            suggestions: hasPersona ? welcomeSuggestionsWithPersona : welcomeSuggestions,
          },
        ]);
        return;
      }
    }
    // Auto-send the suggestion message
    const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
    onSendMessage(cleanSuggestionText(message));
  };

  // Autoscroll functionality
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const scrollContainer = chatContainerRef.current;
      
      // Add a small delay to account for suggestions and other content that might render
      const scrollToBottom = () => {
        const scrollHeight = scrollContainer.scrollHeight;
        const height = scrollContainer.clientHeight;
        const maxScrollTop = scrollHeight - height;
        
        // Only auto-scroll if user is near the bottom (within 100px) or if it's a new message
        const currentScrollTop = scrollContainer.scrollTop;
        const isNearBottom = currentScrollTop >= maxScrollTop - 100;
        
        if (isNearBottom || isLoading) {
          // Scroll to the very bottom plus some extra padding for suggestions
          scrollContainer.scrollTo({
            top: scrollHeight + 200,
            behavior: 'smooth'
          });
        }
      };

      // Initial scroll
      scrollToBottom();
      
      // Additional scroll after a short delay to catch any async content like suggestions
      const timeoutId = setTimeout(scrollToBottom, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  // Show messages if there are any, or if there is a context
  const hasMessagesOrContext = currentContext || messages.length > 0;

  // Create a function to populate input instead of sending for expandable insights
  const handleFollowUpPopulate = useCallback((choice: string) => {
    setInputValue(cleanSuggestionText(choice));
  }, []);

  const [hasStartedNewChat, setHasStartedNewChat] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState<string>('');
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [isDeletingEmbeddings, setIsDeletingEmbeddings] = useState(false);
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ hasEmbeddings: false, count: 0 });

  // Check for existing embeddings when component mounts or user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
        if (info.hasEmbeddings) {
          setEmbeddingStatus(`✅ Found ${info.count} existing embeddings`);
        }
      }
    };

    checkEmbeddings();
  }, [userId]);

  // Function to generate embeddings for user content
  const handleGenerateEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('❌ No user ID found');
      return;
    }

    setIsGeneratingEmbeddings(true);
    setEmbeddingStatus('🚀 Starting embedding generation...');
    
    try {
      const results = await generateEmbeddingsForUser(currentUserId);
      
      const convStats = `Conversations: ${results.conversations.succeeded}/${results.conversations.processed} (${results.conversations.skipped} skipped)`;
      const noteStats = `Notes: ${results.notes.succeeded}/${results.notes.processed} (${results.notes.skipped} skipped)`;
      
      setEmbeddingStatus(`✅ Complete! ${convStats}, ${noteStats}`);
      
      // Refresh embedding info
      const info = await checkUserEmbeddings(currentUserId);
      setEmbeddingInfo(info);
      
      if (results.errors.length > 0) {
        console.error('Embedding errors:', results.errors);
        setEmbeddingStatus(prev => prev + ` (${results.errors.length} errors - check console)`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`❌ Failed: ${error.message}`);
      console.error('Embedding generation failed:', error);
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Function to delete all embeddings
  const handleDeleteEmbeddings = async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setEmbeddingStatus('❌ No user ID found');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${embeddingInfo.count} embeddings? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingEmbeddings(true);
    setEmbeddingStatus('🗑️ Deleting embeddings...');
    
    try {
      const result = await deleteAllUserEmbeddings(currentUserId);
      
      if (result.success) {
        setEmbeddingStatus(`✅ Deleted ${result.deletedCount} embeddings`);
        
        // Refresh embedding info
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
      } else {
        setEmbeddingStatus(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setEmbeddingStatus(`❌ Failed: ${error.message}`);
      console.error('Embedding deletion failed:', error);
    } finally {
      setIsDeletingEmbeddings(false);
    }
  };

  // Create a function to append text to existing input instead of replacing it
  const handleInputAppend = useCallback((text: string) => {
    setInputValue(currentValue => {
      // If there's existing text, add a space before the new text
      const cleanText = cleanSuggestionText(text);
      if (currentValue.trim()) {
        return `${currentValue} ${cleanText}`;
      }
      return cleanText;
    });
  }, []);

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col h-screen bg-white w-full overflow-hidden prevent-horizontal-scroll">
      {/* Header */}
      <ChatHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} onNewChat={handleNewChat} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {hasMessagesOrContext ? (
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-2 sm:p-4">
              <div className="max-w-4xl sm:max-w-6xl mx-auto space-y-3">
                {/* Show context box when context is available */}
                {currentContext && (
                  currentContext.platform === 'ai-insights' ? (
                    <AIInsightsContextBox
                      currentContext={currentContext}
                      messages={messages}
                      onRemove={handleRemoveContext}
                      includeAnalysisInQuery={includeAnalysisInQuery}
                      onToggleAnalysis={setIncludeAnalysisInQuery}
                      onSendMessage={handleSendMessage}
                      onInputPopulate={handleInputAppend}
                    />
                  ) : (
                    <ChatContextBox
                      currentContext={currentContext}
                      messages={messages}
                      onRemove={handleRemoveContext}
                      includeAnalysisInQuery={includeAnalysisInQuery}
                      onToggleAnalysis={setIncludeAnalysisInQuery}
                      onSendMessage={handleSendMessage}
                      onInputPopulate={handleInputAppend}
                    />
                  )
                )}
                
                <ChatMessagesList
                  messages={messages}
                  referencedMessage={referencedMessage}
                  handleMessageReference={handleMessageReference}
                  handleReferenceClick={handleReferenceClick}
                  handleOptionClick={handleOptionClick}
                  handleFollowUpClick={handleFollowUpPopulate}
                  userId={userId}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSendMessage={handleSendMessage}
                  onInputPopulate={handleInputAppend}
                />

                {/* Show persona tip in onboarding flow when ready and at least 4 messages exist */}
                {onboardingState.shouldShowPersonaTip && messages.length >= 4 && !onboardingState.hasCompletedPersona && (
                  <PersonaTip
                    userId={userId}
                    onTipClick={handleSendMessage}
                  />
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                      onClick={() => chatState.setError(null)}
                      className="text-xs text-red-500 hover:text-red-700 mt-1"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Embedding Generation Debug Section (temporary) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 m-4 mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-800">🔬 Vector Search Setup</h3>
                  <p className="text-xs text-blue-600">
                    {embeddingInfo.hasEmbeddings 
                      ? `You have ${embeddingInfo.count} embeddings for AI-powered semantic search`
                      : 'Generate embeddings to enable AI-powered semantic search'
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  {embeddingInfo.hasEmbeddings ? (
                    <>
                      <button
                        onClick={handleGenerateEmbeddings}
                        disabled={isGeneratingEmbeddings}
                        className={`px-3 py-1 text-xs rounded ${
                          isGeneratingEmbeddings 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isGeneratingEmbeddings ? 'Updating...' : 'Update Embeddings'}
                      </button>
                      <button
                        onClick={handleDeleteEmbeddings}
                        disabled={isDeletingEmbeddings || isGeneratingEmbeddings}
                        className={`px-3 py-1 text-xs rounded ${
                          isDeletingEmbeddings || isGeneratingEmbeddings
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                      >
                        {isDeletingEmbeddings ? 'Deleting...' : 'Delete All'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleGenerateEmbeddings}
                      disabled={isGeneratingEmbeddings}
                      className={`px-3 py-1 text-xs rounded ${
                        isGeneratingEmbeddings 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isGeneratingEmbeddings ? 'Generating...' : 'Generate Embeddings'}
                    </button>
                  )}
                </div>
              </div>
              {embeddingStatus && (
                <div className="mt-2 text-xs text-blue-700 bg-blue-100 rounded p-2">
                  {embeddingStatus}
                </div>
              )}
            </div>
            
            <AmbientInsightsContainer 
              handleSendMessage={(msg, context) => {
                // Start a new chat with the context from the insight
                handleNewChat();
                setTimeout(() => {
                  if (context) setContentContext(context);
                  handleSendMessage(msg);
                }, 0);
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Bar Actions - Only show when there are no messages */}
      {messages.length === 0 && (
        <BottomBarActions onActionClick={handleActionClick} onInputPopulate={handleInputAppend} />
      )}

      {/* Input Bar */}
      <div className="flex-shrink-0 border-t border-gray-100">
        <ChatInputArea
          showAmbient={false}
          currentContext={currentContext}
          handleActionClick={handleActionClick}
          handleSendMessage={handleSendMessage}
          inputRef={inputRef}
          isLoading={isLoading}
          referencedMessage={referencedMessage}
          handleClearReference={handleClearReference}
          includeAnalysisInQuery={includeAnalysisInQuery}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onInputPopulate={handleInputAppend}
        />
      </div>
    </div>
  )
}

export default ChatContainer 