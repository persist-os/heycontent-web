import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { useChatHandlers } from './hooks/useChatHandlers'
import { MarkdownNotepad } from './components/notepad/MarkdownNotepad'
import { useNotepadUI } from './hooks/useNotepadUI'
import { useNotes } from '@/app/context/notes-context'
import { usePersonaStore } from '@/store/persona-store'
import { useConvex } from 'convex/react'
import { useContentContext, useContentContextActions, useContentContextStore } from '@/store/content-context-store'

// Help system imports
import { HelpModal } from '@/components/ui/help-modal'
import { HelpIconButton } from '@/components/ui/help-icon-button'
import { chatHelp } from '@/helpContent'

const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery }) => {
  const router = useRouter()
  const searchParams = useSearchParams();
  const welcome = searchParams.get('welcome') === 'true';
  
  // Authentication and user data (derived from firebaseUser)
  const { firebaseUser, getToken } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Derive user data from firebaseUser to avoid redundant state
  const authData = useMemo(() => ({
    user: firebaseUser,
    userId: firebaseUser?.uid,
    userEmail: firebaseUser?.email,
    isAuthenticated: !!firebaseUser,
    isLoading: firebaseUser === undefined
  }), [firebaseUser]);

  // UI state - grouped related state together
  const [updatePersonaRequested, setUpdatePersonaRequested] = useState(false);
  const [inputValue, setInputValue] = useState('')
  const [embeddingInfo, setEmbeddingInfo] = useState<{ hasEmbeddings: boolean; count: number }>({ 
    hasEmbeddings: false, 
    count: 0 
  });
  
  // Content context consumption tracking
  const [contextConsumption, setContextConsumption] = useState({
    hasConsumed: false,
    isDisplayed: false
  });

  // Shared refs
  const loadedConversationRef = useRef<string | null>(null)
  const askQueryProcessedRef = useRef<string | null>(null)
  
  const { isExpanded } = useSidebar()
  const { theme } = useTheme()
  
  // Theme-aware colors (memoized)
  const themeColors = useMemo(() => {
    const isDark = theme === 'dark'
    return {
      accentColor: isDark ? 'text-primary' : 'text-purple-600',
      accentBg: isDark ? 'bg-primary' : 'bg-purple-600',
      accentBgHover: isDark ? 'hover:bg-primary/90' : 'hover:bg-purple-700',
      accentBgLight: isDark ? 'bg-primary/10' : 'bg-purple-600/10',
      accentBorder: isDark ? 'border-primary' : 'border-purple-600'
    }
  }, [theme])

  // Initialize shared state and hooks
  const chatState = useChatState()
  const { messages, setMessages, error, isLoading, includeAnalysisInQuery, setIncludeAnalysisInQuery } = chatState

  // Get content context from Zustand store
  const { context: currentContext, hasContext } = useContentContext()
  const { clearContentContext } = useContentContextActions()

  // Context search state - enable by default when no context, keep enabled for YouTube videos without analysis
  const [useContextSearch, setUseContextSearch] = useState(!hasContext)
  
  // Help modal state
  const [helpOpen, setHelpOpen] = useState(false)

  // Auto-disable context search when content context is available, unless it's YouTube without analysis
  useEffect(() => {
    if (hasContext && useContextSearch) {
      // Keep context search enabled for YouTube videos without analysis to help AI understand the content better
      const isYouTubeWithoutAnalysis = currentContext?.platform === 'youtube' && !currentContext?.analysis;
      if (!isYouTubeWithoutAnalysis) {
        setUseContextSearch(false);
      }
    }
  }, [hasContext, useContextSearch, currentContext]);

  // Get convex client for persona operations
  const convex = useConvex()

  // Get persona data from the centralized store
  const currentPersona = usePersonaStore(state => state.currentPersona)
  const isPersonaLoading = usePersonaStore(state => state.isLoading)
  const initializePersonaData = usePersonaStore(state => state.initializePersonaData)
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData)
  const invalidatePersonaData = usePersonaStore(state => state.invalidatePersonaData)
  
  // Check if user has an existing persona
  const { hasPersona } = usePersonaData(authData.userId, authData.isAuthenticated)

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
  } = useChat(chatState, authData.userId, useContextSearch)

  // Initialize ambient insights actions
  const ambientInsightsActions = useAmbientInsightsActions(handleSendMessage);

  // Track onboarding state for persona tip
  const onboardingState = useOnboardingState(messages, chatState.sessionId)

  // Initialize conversation hook with shared state
  const {
    loading: conversationLoading,
    setLoading: setConversationLoading,
    handleLoadConversation,
    initSession
  } = useConversation(chatState, authData.user)

  // Initialize welcome message hook
  const {
    welcomeStep,
    setWelcomeStep,
    handleSuggestionClick: handleWelcomeSuggestionClick
  } = useWelcomeMessage(
    welcome,
    messages,
    isLoading,
    authData.user,
    setMessages,
    hasPersona
  )

  // Notepad functionality
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

  // Memoized handlers to prevent unnecessary re-renders
  const handleSendMessageWithUpdateCheck = useCallback((message: string) => {
    const lowerMessage = message.toLowerCase().trim();
    
    if (lowerMessage === 'hey content update persona') {
      setUpdatePersonaRequested(true);
    }
    
    if (lowerMessage === 'hey content write my persona' && authData.userId && convex) {
      refreshPersonaData(authData.userId, convex);
    }
    
    handleSendMessage(message);
  }, [handleSendMessage, authData.userId, convex, refreshPersonaData]);

  const handleNewChat = useCallback(() => {
    // UI resets
    resetChat();
    setMessages([]);
    handleClearReference?.();
    setUpdatePersonaRequested(false);
    
    // Reset content context consumption state
    setContextConsumption({ hasConsumed: false, isDisplayed: false });
    
    // Reset state for a new chat session
    window.localStorage.removeItem('chatSessionId');
    chatState.setSessionId(null);
    chatState.setIsFirstMessage(true);
    
    // Clear content context when starting new chat
    clearContentContext();
    
    // Clear the loaded conversation ref
    loadedConversationRef.current = null;
    
    // Force refresh persona data
    if (authData.userId && convex) {
      refreshPersonaData(authData.userId, convex);
    }
    
    // Navigate to clean chat URL
    router.push('/dashboard/chat');

    // Reset refs
    askQueryProcessedRef.current = null;
    setInputValue('');
  }, [resetChat, setMessages, handleClearReference, chatState, clearContentContext, 
      authData.userId, convex, refreshPersonaData, router]);

  const handleRemoveContext = useCallback(() => {
    clearContentContext();
    const url = new URL(window.location.href);
    url.searchParams.delete('contentContext');
    router.replace(url.pathname + url.search);
  }, [clearContentContext, router]);

  const handleActionClick = useCallback((action: string) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    handleWelcomeSuggestionClick(suggestion, handleSendMessage);
  }, [handleWelcomeSuggestionClick, handleSendMessage]);

  const handleInsightClick = useCallback((action: string, insight: any) => {
    handleSendMessageWithUpdateCheck(action);
  }, [handleSendMessageWithUpdateCheck]);

  const handleReferenceClick = useCallback((messageId: string) => {
    handleReferenceClickProp(messageId)
  }, [handleReferenceClickProp]);

  const handleFollowUpPopulate = useCallback((choice: string) => {
    const cleanText = choice
      .replace(/^[\s]*[-*•]\s*/, '')
      .replace(/^[\s]*\*\s*/, '')
      .trim();
    setInputValue(cleanText);
  }, []);

  const handleInputAppend = useCallback((text: string) => {
    setInputValue(currentValue => {
      const cleanText = text
        .replace(/^[\s]*[-*•]\s*/, '')
        .replace(/^[\s]*\*\s*/, '')
        .trim();
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText;
    });
  }, []);

  // Create notepad-aware reference handler
  const notepadReferenceHandler = useMemo(() => 
    createReferenceClickHandler(notepadOpen, handleReferenceClick), 
    [createReferenceClickHandler, notepadOpen, handleReferenceClick]
  );

  // Initialize persona store when userId changes
  useEffect(() => {
    if (authData.userId && convex) {
      initializePersonaData(authData.userId, convex);
    }
  }, [authData.userId, convex, initializePersonaData]);

  // API key effect
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

  // Load conversation when user and chatId are available
  useEffect(() => {
    if (authData.user && !authData.isLoading) {
      if (chatId && loadedConversationRef.current !== chatId) {
        loadedConversationRef.current = chatId;
        handleLoadConversation(chatId);
      } else if (!chatId && loadedConversationRef.current !== null) {
        setMessages([]);
        chatState.setSessionId(null);
        chatState.setIsFirstMessage(true);
        loadedConversationRef.current = null;
      }
    }
  }, [chatId, authData.user, authData.isLoading, handleLoadConversation, chatState]);

  // Effect to detect persona completion and trigger persona refresh
  useEffect(() => {
    if (!authData.userId || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    const hasPersonaCompletionFlags = lastMessage.metadata?.is_persona_complete === true || 
                                     lastMessage.metadata?.persona_created === true;
    
    const hasPersonaContentPattern = lastMessage.content && (
      lastMessage.content.includes('*Your Content Persona*') ||
      lastMessage.content.includes('Content Persona') ||
      (lastMessage.content.includes('*Content Style*')) ||
      (lastMessage.content.includes('*Content Focus*') && lastMessage.content.includes('*Future Goals*'))
    );

    const isPersonaCompleted = lastMessage.role === 'assistant' && 
                              (hasPersonaCompletionFlags || hasPersonaContentPattern);

    if (isPersonaCompleted) {
      setUpdatePersonaRequested(false);
      
      if (authData.userId && convex) {
        setTimeout(() => {
          invalidatePersonaData();
          refreshPersonaData(authData.userId, convex);
        }, 1000);
      }
    }
  }, [messages, authData.userId, convex, refreshPersonaData, invalidatePersonaData]);

  // Clear welcome parameter from URL
  useEffect(() => {
    if (welcome && messages.length === 0 && !isLoading && authData.user) {
      const url = new URL(window.location.href)
      url.searchParams.delete('welcome')
      window.history.replaceState({}, '', url.toString())
    }
  }, [welcome, messages.length, isLoading, authData.user]);

  // Handle content context display and consumption
  useEffect(() => {
    if (currentContext && !contextConsumption.hasConsumed) {
      setContextConsumption(prev => ({ ...prev, isDisplayed: true }));
      
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (url.searchParams.has('contentContext')) {
          url.searchParams.delete('contentContext');
          window.history.replaceState({}, '', url.toString());
        }
      }
    }
  }, [currentContext, contextConsumption.hasConsumed]);

  // Mark context as consumed after first message, but keep context visible
  useEffect(() => {
    if (currentContext && 
        contextConsumption.isDisplayed && 
        !contextConsumption.hasConsumed && 
        messages.length > 0) {
      
      const hasRealMessage = messages.some(msg => !msg.metadata?.isWelcome);
      
      if (hasRealMessage) {
        setContextConsumption(prev => ({ ...prev, hasConsumed: true }));
        // Note: Removed auto-clear to keep context visible throughout conversation
      }
    }
  }, [messages.length, currentContext, contextConsumption]);

  // Handle initial ask query
  useEffect(() => {
    if (askQuery && 
        askQuery !== askQueryProcessedRef.current && 
        !isLoading && 
        !welcome &&
        messages.length === 0 &&
        authData.user) {
      
      askQueryProcessedRef.current = askQuery;
      
      setTimeout(() => {
        handleSendMessageWithUpdateCheck(askQuery);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('ask');
          window.history.replaceState({}, '', url.toString());
        }
      }, 100);
    }
  }, [askQuery, isLoading, welcome, handleSendMessageWithUpdateCheck, messages.length, authData.user, currentContext]);

  // Check for existing embeddings when user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      const currentUserId = getCurrentUserId();
      if (currentUserId) {
        const info = await checkUserEmbeddings(currentUserId);
        setEmbeddingInfo(info);
      }
    };

    if (authData.userId) {
      checkEmbeddings();
    }
  }, [authData.userId]);

  // Clear conversation state and stale context when component mounts
  useEffect(() => {
    setMessages([]);
    chatState.setSessionId(null);
    chatState.setIsFirstMessage(true);
    setContextConsumption({ hasConsumed: false, isDisplayed: false });
    
    const { isCacheValid } = useContentContextStore.getState();
    
    if (currentContext && !isCacheValid()) {
      clearContentContext();
    }
    
    askQueryProcessedRef.current = null;
    loadedConversationRef.current = null;
  }, []); // Only run on mount

  // Autoscroll functionality
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      const scrollContainer = chatContainerRef.current;
      
      const scrollToBottom = () => {
        const scrollHeight = scrollContainer.scrollHeight;
        const height = scrollContainer.clientHeight;
        const maxScrollTop = scrollHeight - height;
        const currentScrollTop = scrollContainer.scrollTop;
        const isNearBottom = currentScrollTop >= maxScrollTop - 100;
        
        if (isNearBottom || isLoading) {
          scrollContainer.scrollTo({
            top: scrollHeight + 200,
            behavior: 'smooth'
          });
        }
      };

      scrollToBottom();
      const timeoutId = setTimeout(scrollToBottom, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  // Cleanup effect to prevent auto-restart on unmount
  useEffect(() => {
    return () => {
      askQueryProcessedRef.current = null;
      loadedConversationRef.current = null;
    };
  }, []);

  // Computed values
  const hasMessagesOrContext = currentContext || messages.length > 0;
  const { notes } = useNotes();
  const availableNotes = useMemo(() => 
    notes.map(note => ({
      _id: String(note._id),
      title: note.title,
      type: note.type || 'idea_bank',
    })), 
    [notes]
  );

  // Debug logging for content context
  useEffect(() => {
    console.log('🔍 [CHAT CONTAINER] Context state changed:', {
      hasContext,
      currentContext: currentContext ? {
        platform: currentContext.platform,
        contentId: currentContext.contentId,
        title: currentContext.title,
        hasContent: !!currentContext.content
      } : null
    });
  }, [currentContext, hasContext]);

  return (
    <>
      <div 
        data-chat-container
        className="flex flex-col h-screen bg-background"
        style={getMainContentStyle()}
      >
        {/* Header */}
        <ChatHeader 
          isRefreshing={isRefreshing} 
          onNewChat={handleNewChat}
          isAuthenticated={authData.isAuthenticated}
          rightContent={<HelpIconButton onClick={() => setHelpOpen(true)} />}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!authData.user ? (
            // Loading placeholder for unauthenticated state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-4">
                <div className={`h-12 w-12 rounded-full ${themeColors.accentBgLight} mx-auto mb-4`}></div>
                <div className={`h-4 w-48 ${themeColors.accentBgLight} rounded mx-auto mb-2`}></div>
                <div className={`h-3 w-32 ${themeColors.accentBgLight} rounded mx-auto`}></div>
              </div>
            </div>
          ) : hasMessagesOrContext ? (
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="p-2 sm:p-4 pb-4">
                <div className="max-w-4xl sm:max-w-6xl mx-auto space-y-3">
                  {/* Context box */}
                  {currentContext && (
                    <ChatContextBox
                      currentContext={currentContext}
                      messages={messages}
                      onRemove={handleRemoveContext}
                      includeAnalysisInQuery={includeAnalysisInQuery}
                      onToggleAnalysis={setIncludeAnalysisInQuery}
                      onSendMessage={handleSendMessageWithUpdateCheck}
                      onInputPopulate={handleInputAppend}
                    />
                  )}
                  
                  <ChatMessagesList
                    messages={messages}
                    referencedMessage={referencedMessage}
                    handleMessageReference={handleMessageReference}
                    handleReferenceClick={notepadReferenceHandler}
                    handleOptionClick={handleOptionClick}
                    handleFollowUpClick={handleFollowUpPopulate}
                    userId={authData.userId}
                    handleSuggestionClick={handleSuggestionClick}
                    handleSendMessage={handleSendMessageWithUpdateCheck}
                    onInputPopulate={handleInputAppend}
                    notepadOpen={notepadOpen}
                    onQuoteToNotepad={handleQuoteToNotepad}
                  />

                  {/* Persona tip */}
                  {(updatePersonaRequested || (onboardingState.shouldShowPersonaTip && messages.length >= 4)) && !onboardingState.hasCompletedPersona && (
                    <PersonaTip
                      userId={authData.userId}
                      onTipClick={handleSendMessageWithUpdateCheck}
                    />
                  )}

                  {/* Error display */}
                  {error && (
                    <div className={`${themeColors.accentBgLight} border ${themeColors.accentBorder}/20 rounded-lg p-3 mt-4`}>
                      <p className={`${themeColors.accentColor} text-sm`}>{error}</p>
                      <button
                        onClick={() => chatState.setError(null)}
                        className={`text-xs ${themeColors.accentColor} hover:opacity-80 mt-1`}
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
              <AmbientInsightsContainer 
                userId={authData.userId}
                handleSendMessage={(msg, context) => {
                  handleNewChat();
                  setTimeout(() => {
                    if (context) clearContentContext();
                    handleSendMessageWithUpdateCheck(msg);
                  }, 0);
                }}
              />
            </div>
          )}

          {/* Bottom Bar Actions */}
          {authData.user && messages.length === 0 && (
            <div className="flex-shrink-0">
              <BottomBarActions onActionClick={handleActionClick} onInputPopulate={handleInputAppend} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex-shrink-0 border-t border-border bg-background">
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
            isAuthenticated={authData.isAuthenticated}
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
      
      {/* Help Modal */}
      <HelpModal 
        open={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        pages={chatHelp}
        title="Chat Guide"
      />
    </>
  );
}

export default ChatContainer; 