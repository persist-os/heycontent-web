import React, { useState, useEffect, useRef } from 'react'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
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
// Removed usePersonaManager - now using direct Convex queries

const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, welcome }) => {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const { isExpanded } = useSidebar()

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

  // Track onboarding state for persona tip
  const onboardingState = useOnboardingState(messages, chatState.sessionId)

  // Track which welcome step the user is on
  const [welcomeStep, setWelcomeStep] = useState(0);
  
  // Add a ref to track if askQuery has been processed to prevent duplicates
  const askQueryProcessedRef = useRef<string | null>(null);

  const handleReferenceClick = (messageId: string) => {
    handleReferenceClickProp(messageId)
  }

  // Initialize conversation hook with shared state
  const {
    loading,
    setLoading,

    handleLoadConversation,

    initSession // Extract the initSession function from the hook
  } = useConversation(chatState, user)

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
    // Prevent duplicate processing of the same askQuery
    if (askQuery && 
        askQuery !== askQueryProcessedRef.current && 
        messages.length === 0 && 
        !isLoading && 
        !welcome) {
      
      // Mark this askQuery as processed
      askQueryProcessedRef.current = askQuery;
      
      // Auto-send the ask query when component mounts (unless welcome is true)
      handleSendMessage(askQuery);
    }
  }, [askQuery, messages.length, isLoading, welcome, handleSendMessage]);

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
        setLoading(false)
        return
      }
      if (chatId) {
        // If we have a chat ID, we'll load the conversation in a separate effect
      } else {
        // For a new chat, sessionId will be null initially
        // and will be set after the first message is sent
        chatState.setSessionId(null)
      }
      setLoading(false)
    })
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatId, chatState.setSessionId]);

  // Load conversation when user and chatId are available
  useEffect(() => {
    if (user && chatId && !loading) {
      handleLoadConversation(chatId)
    }
  }, [user, chatId, loading, handleLoadConversation])

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
  }, [welcome, messages.length, isLoading, user, setMessages])

  // Handle suggestion click for welcome steps and normal suggestions
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

  if (loading) {
    return <div className="flex items-center justify-center h-full w-full p-4">Loading...</div>
  }

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
                onInsightClick={handleInsightClick}
              />
            </div>
          ) : (
            <div className="p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {/* Show persona tip in onboarding flow when ready and at least 4 messages exist */}
                {onboardingState.shouldShowPersonaTip && messages.length >= 4 && (
                  <PersonaTip 
                    userId={userId}
                    onTipClick={handleSendMessage} 
                  />
                )}
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
          handleInsightClick={handleInsightClick}
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