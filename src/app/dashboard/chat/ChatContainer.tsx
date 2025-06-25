import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { RefreshCw, Brain, CheckCircle, FileText } from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'
import { useTheme } from 'next-themes'

// Import types
import { ChatScreenProps } from './types'
import { Message } from '@/app/types/chat'

// Import components 
import { BottomBarActions } from './components/main_chat/BottomBarActions';
import { useAmbientInsightsActions } from './components/ambient_insights/AmbientInsightsActions';
import { PersonaTip } from './components/PersonaTip'
import ChatHeader from './components/main_chat/ChatHeader'
import ChatContextBox from './components/main_chat/ChatContextBox'
import AIInsightsContextBox from './components/ambient_insights/AIInsightsContextBox'
import ChatMessagesList from './components/main_chat/ChatMessagesList'
import ChatInputArea from './components/main_chat/ChatInputArea'
import { AmbientInsightsContainer } from './components/ambient_insights/AmbientInsightsContainer'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'
import { useWelcomeMessage } from './hooks/useWelcomeMessage'
import { useOnboardingState } from './hooks/useOnboardingState'
import { usePersonaData } from './hooks/usePersonaData'
import { useAuth } from '@/app/context/auth-context'
import { checkUserEmbeddings } from './utils/api-utils';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useMarkdownNotepad } from './hooks/useMarkdownNotepad'
import { useChatHandlers } from './hooks/useChatHandlers'
import { MarkdownNotepad } from './components/notepad/MarkdownNotepad'
import { useNotepadUI } from './hooks/useNotepadUI'
import { NotepadToggle } from './components/notepad/NotepadToggle'
import { useNotes } from '@/app/context/notes-context'


const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery }) => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === 'true';
  const [user, setUser] = useState<any>(null)
  const [userId, setUserId] = useState<string | undefined>()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [updatePersonaRequested, setUpdatePersonaRequested] = useState(false);
  const { isExpanded, setIsExpanded } = useSidebar()
  const { theme } = useTheme()
  
  // Theme-aware accent colors
  const isDark = theme === 'dark'
  const accentColor = isDark ? 'text-primary' : 'text-purple-600'
  const accentBg = isDark ? 'bg-primary' : 'bg-purple-600'
  const accentBgHover = isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700'
  const accentBgLight = isDark ? 'bg-primary/10' : 'bg-purple-600/10'
  const accentBorder = isDark ? 'border-primary' : 'border-purple-600'
  
  // Track which conversation has been loaded to prevent infinite loops
  const loadedConversationRef = useRef<string | null>(null)
  const askQueryProcessedRef = useRef<string | null>(null)

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
  const [useContextSearch, setUseContextSearch] = useState(true)

  // Function to append text to the input value
  const appendToInput = useCallback((newText: string) => {
    setInputValue(prevValue => {
      const separator = prevValue && !prevValue.endsWith(' ') && !prevValue.endsWith('\n') ? ' ' : ''
      return prevValue + separator + newText
    })
  }, [])

  // Utility function to clean bullet points from suggestions
  const cleanSuggestionText = (text: string): string => {
    return text
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
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
  } = useChat(chatState, userId, useContextSearch)

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
      setUpdatePersonaRequested(false);
  
    }
  }, [messages, userId]);

  // Base reference click handler
  const handleReferenceClick = (messageId: string) => {
    handleReferenceClickProp(messageId)
  }

  // Initialize welcome message hook
  const {
    welcomeStep,
    setWelcomeStep,
    handleSuggestionClick: handleWelcomeSuggestionClick
  } = useWelcomeMessage(
    welcome,
    messages,
    isLoading,
    user,
    setMessages,
    hasPersona
  )

  // Modified suggestion click handler to use welcome message hook
  const handleSuggestionClick = (suggestion: any, onSendMessage: (msg: string) => void) => {
    handleWelcomeSuggestionClick(suggestion, handleSendMessage);
  };

  // Clear welcome parameter from URL
  useEffect(() => {
    if (welcome && messages.length === 0 && !isLoading && user) {
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
  }, [welcome, messages.length, isLoading, user]);

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
  
  // Modified handleSendMessage to detect persona update request
  const handleSendMessageWithUpdateCheck = (message: string) => {
    if (message.toLowerCase().trim() === 'hey content update persona') {
      setUpdatePersonaRequested(true);
    }
    handleSendMessage(message);
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
    setUpdatePersonaRequested(false);
    
    // CRITICAL: Reset state for a new chat session
    
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
      
      // Mark this askQuery as processed immediately to prevent duplicate processing
      askQueryProcessedRef.current = askQuery;
      
      // Send the message with a small delay to ensure context is properly set
      setTimeout(() => {
        handleSendMessageWithUpdateCheck(askQuery);
      }, 100);
    }
  }, [askQuery, isLoading, welcome, handleSendMessage, messages.length, user, currentContext]);
  
  // Handle insight clicks by sending the action as a message
  const handleInsightClick = useCallback((action: string, insight: any) => {
    handleSendMessageWithUpdateCheck(action);
  }, [handleSendMessageWithUpdateCheck]);

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
        loadedConversationRef.current = chatId; // Mark this conversation as being loaded
        handleLoadConversation(chatId);
      } else if (!chatId && loadedConversationRef.current !== null) {
        // User navigated to new chat - reset state
        setMessages([]);
        chatState.setSessionId(null);
        chatState.setIsFirstMessage(true);
        loadedConversationRef.current = null;
      }
    }
  }, [chatId, user, authLoading, handleLoadConversation, chatState]);

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
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ hasEmbeddings: false, count: 0 });
  
  // Replace existing notepad state with useNotepadUI
  const {
    isOpen: notepadOpen,
    width: notepadWidth,
    toggleNotepad,
    updateWidth,
    getMainContentStyle,
    getNotepadStyle
  } = useNotepadUI()

  const { 
    quotedForNotepad, 
    handleClearQuoted, 
    handleQuoteToNotepad, 
    handleNotepadSendToChat,
    createReferenceClickHandler 
  } = useChatHandlers(handleSendMessage, handleClearReference, messages)

  // Create notepad-aware reference handler
  const notepadReferenceHandler = createReferenceClickHandler(notepadOpen, handleReferenceClick)

  // Check for existing embeddings when component mounts or user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
      }
    };

    checkEmbeddings();
  }, [userId]);

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

  const { notes } = useNotes();

  // Prepare availableNotes for MarkdownNotepad (all notes for now)
  const availableNotes = notes.map(note => ({
    _id: String(note._id),
    title: note.title,
    type: note.type || 'idea_bank',
  }));

  // Always render the static UI shell, even when authentication is in progress
  // User-dependent content will be conditionally rendered

  return (
    <>
      <div 
        data-chat-container
        className="flex flex-col min-h-screen bg-background"
        style={getMainContentStyle()}
      >
        {/* Header - Always render this static element */}
        <ChatHeader 
          isRefreshing={isRefreshing} 
          onNewChat={handleNewChat}
          isAuthenticated={!!user}
        />

        {/* Main Content - Always render the container, conditionally render content */}
        <div className="flex-1 flex flex-col">
          {!user ? (
            // Static placeholder for unauthenticated state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-4">
                <div className={`h-12 w-12 rounded-full ${accentBgLight} mx-auto mb-4`}></div>
                <div className={`h-4 w-48 ${accentBgLight} rounded mx-auto mb-2`}></div>
                <div className={`h-3 w-32 ${accentBgLight} rounded mx-auto`}></div>
              </div>
            </div>
          ) : hasMessagesOrContext ? (
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
                        onSendMessage={handleSendMessageWithUpdateCheck}
                        onInputPopulate={handleInputAppend}
                      />
                    ) : (
                      <ChatContextBox
                        currentContext={currentContext}
                        messages={messages}
                        onRemove={handleRemoveContext}
                        includeAnalysisInQuery={includeAnalysisInQuery}
                        onToggleAnalysis={setIncludeAnalysisInQuery}
                        onSendMessage={handleSendMessageWithUpdateCheck}
                        onInputPopulate={handleInputAppend}
                      />
                    )
                  )}
                  
                  <ChatMessagesList
                    messages={messages}
                    referencedMessage={referencedMessage}
                    handleMessageReference={handleMessageReference}
                    handleReferenceClick={notepadReferenceHandler}
                    handleOptionClick={handleOptionClick}
                    handleFollowUpClick={handleFollowUpPopulate}
                    userId={userId}
                    handleSuggestionClick={handleSuggestionClick}
                    handleSendMessage={handleSendMessageWithUpdateCheck}
                    onInputPopulate={handleInputAppend}
                    notepadOpen={notepadOpen}
                    onQuoteToNotepad={handleQuoteToNotepad}
                  />

                  {/* Show persona tip in onboarding flow when ready and at least 4 messages exist OR when update is requested */}
                  {(updatePersonaRequested || (onboardingState.shouldShowPersonaTip && messages.length >= 4)) && !onboardingState.hasCompletedPersona && (
                    <PersonaTip
                      userId={userId}
                      onTipClick={handleSendMessageWithUpdateCheck}
                    />
                  )}

                  {error && (
                    <div className={`${accentBgLight} border ${accentBorder}/20 rounded-lg p-3 mt-4`}>
                      <p className={`${accentColor} text-sm`}>{error}</p>
                      <button
                        onClick={() => chatState.setError(null)}
                        className={`text-xs ${accentColor} hover:opacity-80 mt-1`}
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* AI Intelligence Status Display (user-friendly) - Only show when no embeddings */}
              <AmbientInsightsContainer 
                userId={userId}
                handleSendMessage={(msg, context) => {
                  // Start a new chat with the context from the insight
                  handleNewChat();
                  setTimeout(() => {
                    if (context) setContentContext(context);
                    handleSendMessageWithUpdateCheck(msg);
                  }, 0);
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom Bar Actions - Only show when authenticated and there are no messages */}
        {user && messages.length === 0 && (
          <BottomBarActions onActionClick={handleActionClick} onInputPopulate={handleInputAppend} />
        )}

        {/* Input Bar - Always render the container, but conditionally enable functionality */}
        <div className="flex-shrink-0 border-t border-border">
          <ChatInputArea
            showAmbient={false}
            currentContext={currentContext}
            handleActionClick={handleActionClick}
            handleSendMessage={handleSendMessageWithUpdateCheck}
            inputRef={inputRef}
            isLoading={isLoading}
            referencedMessage={referencedMessage}
            handleClearReference={handleClearReference}
            includeAnalysisInQuery={includeAnalysisInQuery}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onInputPopulate={handleInputAppend}
            useContextSearch={useContextSearch}
            onToggleContextSearch={setUseContextSearch}
            embeddingInfo={embeddingInfo}
            notepadOpen={notepadOpen}
            openNotepad={toggleNotepad}
            quotedForNotepad={quotedForNotepad}
            onClearQuoted={handleClearQuoted}
            isAuthenticated={!!user}
          />
        </div>
      </div>

      {/* Markdown Notepad */}
      <MarkdownNotepad
        isOpen={notepadOpen}
        onClose={toggleNotepad}
        onSendToChat={handleNotepadSendToChat}
        quotedContent={quotedForNotepad}
        onClearQuoted={handleClearQuoted}
        width={notepadWidth}
        onWidthChange={updateWidth}
        style={getNotepadStyle()}
        availableNotes={availableNotes}
      />
    </>
  );
}

export default ChatContainer; 