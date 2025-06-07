import React, { useState, useEffect, useRef } from 'react'
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
import { SuggestionChip } from './components/SuggestionChip'
import { AmbientInsights } from './components/AmbientInsights'
import { useAmbientInsightsActions } from './components/AmbientInsightsActions'
import { ContextBox } from './components/ContextBox'
import { PersonaTip } from './components/PersonaTip'
import ChatHeader from './components/ChatHeader'
import ChatContextBox from './components/ChatContextBox'
import AIInsightsContextBox from './components/AIInsightsContextBox'
import ChatMessagesList from './components/ChatMessagesList'
import ChatInputArea from './components/ChatInputArea'

// Import data
import { ambientInsights } from './data/ambient-insights'

import { welcomeMessageSteps, getWelcomeStepMessage, welcomeSuggestions, welcomeSuggestionsWithPersona } from './data/welcome-message'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'

import { useOnboardingState } from './hooks/useOnboardingState'
import { usePersonaData } from './hooks/usePersonaData'


const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery }) => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === 'true';
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const { isExpanded } = useSidebar()
  
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
    ambientLoading,
    handleInsightClick: handleRawInsightClick,
    handleRefresh,
    resetChat
  } = useUIEffects(messages, isExpanded)

  // Initialize chat hook with shared state
  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick: handleReferenceClickProp
  } = useChat(chatState)

  // Initialize ambient insights actions
  const ambientInsightsActions = useAmbientInsightsActions(handleSendMessage)

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
      // The PersonaCardRenderer should now pick this up and display the persona
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

  // Wrapper for insight click to pass handleSendMessage
  const handleInsightClick = (action: string, insight: any) => {
    handleRawInsightClick(action, insight, handleSendMessage)
  }

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
    // Only process askQuery if we haven't processed it yet and we're not in a loading state
    if (askQuery && 
        askQuery !== askQueryProcessedRef.current && 
        !isLoading && 
        !welcome &&
        messages.length === 0) {
      
      console.log('Processing askQuery:', askQuery);
      
      // Mark this askQuery as processed immediately to prevent duplicate processing
      askQueryProcessedRef.current = askQuery;
      
      // Send the message directly without timeout
      handleSendMessage(askQuery);
    }
  }, [askQuery, isLoading, welcome, handleSendMessage, messages.length]);

  // Authentication effect
  useEffect(() => {
    let auth
    try {
      auth = getFirebaseAuth()
    } catch (e) {
      auth = null
    }
    if (!auth) {
      console.error('Firebase auth not initialized')
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setUserId(firebaseUser?.uid)
      setUserEmail(firebaseUser?.email)
      if (!firebaseUser) {
        setAuthLoading(false)
        return
      }
      if (chatId) {
        // If we have a chat ID, we'll load the conversation in a separate effect
        console.log('Chat ID provided, will load conversation:', chatId)
      } else {
        // For a new chat, reset to clean state
        console.log('No chat ID provided, initializing new chat state')
        chatState.setSessionId(null)
        chatState.setIsFirstMessage(true)
        setMessages([])
        loadedConversationRef.current = null
      }
      setAuthLoading(false)
    })
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, chatState.setSessionId, chatState.setIsFirstMessage, setMessages]);

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
  }, [chatId, chatState.setSessionId]);

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

  // Move handleSuggestionClick definition outside of any conditional or loading block, so it is only defined once and used throughout
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
    // Otherwise, normal suggestion click
    const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
    onSendMessage(message);
  };

  if (!user) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-white w-full">
      {/* Header */}
      <ChatHeader
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onNewChat={handleNewChat}
      />

      {/* Context Box - shown when context is available */}
      {currentContext?.platform === 'ai-insights' ? (
        <AIInsightsContextBox
          currentContext={currentContext}
          messages={messages}
          onRemove={handleRemoveContext}
          includeAnalysisInQuery={includeAnalysisInQuery}
          onToggleAnalysis={setIncludeAnalysisInQuery}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <ChatContextBox
          currentContext={currentContext}
          messages={messages}
          onRemove={handleRemoveContext}
          includeAnalysisInQuery={includeAnalysisInQuery}
          onToggleAnalysis={setIncludeAnalysisInQuery}
          onSendMessage={handleSendMessage}
        />
      )}

      {/* Main chat container */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={chatContainerRef}
          className="h-full overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 pb-28 sm:pb-32 md:pb-36"
        >
          {/* Only show ambient insights when there's no context and no messages */}
          {showAmbient && messages.length === 0 && !currentContext ? (
            <div className="p-6">
              <AmbientInsights
                insights={ambientInsights}
                loading={ambientLoading}
                error={error}
                onInsightClick={ambientInsightsActions.handleClickInsight}
                onInsightHover={ambientInsightsActions.handleHover}
                onInsightFocus={ambientInsightsActions.handleFocus}
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                <ChatMessagesList
                  messages={messages}
                  referencedMessage={referencedMessage}
                  handleMessageReference={handleMessageReference}
                  handleReferenceClick={handleReferenceClick}
                  handleOptionClick={handleOptionClick}
                  handleFollowUpClick={handleFollowUpClick}
                  userId={userId}
                  handleSuggestionClick={handleSuggestionClick}
                  handleSendMessage={handleSendMessage}
                />
                {/* Show persona tip in onboarding flow when ready and at least 4 messages exist */}
                {onboardingState.shouldShowPersonaTip && messages.length >= 4 && (
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
          )}
        </div>
        <ChatInputArea
          showAmbient={showAmbient}
          currentContext={currentContext}
          ambientInsights={ambientInsights}
          ambientLoading={ambientLoading}
          error={error}
          handleInsightClick={ambientInsightsActions.handleClickAction}
          handleSendMessage={handleSendMessage}
          inputRef={inputRef}
          isLoading={isLoading}
          referencedMessage={referencedMessage}
          handleClearReference={handleClearReference}
          includeAnalysisInQuery={includeAnalysisInQuery}
        />
      </div>
    </div>
  )
}

export default ChatContainer 