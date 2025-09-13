import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/app/context/sidebar-context'
import { useTheme } from 'next-themes'
import { useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'

// Import types
import { ChatScreenProps } from './types'
import { Message } from '@/app/types/chat'

// Import components 
import { BottomBarActions } from './components/main_chat/BottomBarActions';
import { useAmbientInsightsActions } from './components/ambient_insights/AmbientInsightsActions';
import { PersonaTip } from './components/PersonaTip'
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
import { MobileTabBar } from './components/notepad/MobileTabBar'
import { useNotepadUI } from './hooks/useNotepadUI'
import { useNotes } from '@/app/context/notes-context'
import { usePersonaStore } from '@/store/persona-store'
import { useConvex } from 'convex/react'
import { useContentContext, useContentContextActions, useContentContextStore } from '@/store/content-context-store'
import { useGlobalSelectionState } from './hooks/useGlobalSelectionState'


import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreateNoteButton } from '@/components/ui/CreateNoteButton';
import { ChatOverlay } from './components/ChatOverlay';
import { Plus } from 'lucide-react';

const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, noteId }) => {
  const router = useRouter()
  
  // Authentication and user data (derived from firebaseUser)
  const { firebaseUser, getToken } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Embedding sync heartbeat
  const userHeartbeat = useAction(api.embeddingSystem.userHeartbeat);
  
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
  
  // Get global selection state to prevent scroll interference
  const { isScrollingSuppressed } = useGlobalSelectionState()

  // Context search state - disable by default to reduce complexity
  const [useContextSearch, setUseContextSearch] = useState(false)
  
  // Notepad inclusion state - enable by default for better context
  const [includeNotepadInMessages, setIncludeNotepadInMessages] = useState(true)
  




  // Embedding sync heartbeat for active chat users  
  useEffect(() => {
    if (!authData.userId) return;

    // Set up heartbeat every 2 minutes when actively chatting for responsive queue processing
    const heartbeatInterval = setInterval(async () => {
      try {
        console.log('💓 [CHAT HEARTBEAT] Triggering sync for active chat user');
        await userHeartbeat({ userId: authData.userId! });
      } catch (error) {
        console.error('Chat heartbeat sync failed:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes - more frequent for active users

    return () => clearInterval(heartbeatInterval);
  }, [authData.userId, userHeartbeat]);



  // Note: Removed auto-disable of context search when content context is available
  // Users should be able to control both features independently

  // Get convex client for persona operations
  const convex = useConvex()

  // Get persona data from the centralized store
  const currentPersona = usePersonaStore(state => state.currentPersona)
  const isPersonaLoadingFromStore = usePersonaStore(state => state.isLoading)
  const initializePersonaData = usePersonaStore(state => state.initializePersonaData)
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData)
  const invalidatePersonaData = usePersonaStore(state => state.invalidatePersonaData)
  
  // Check if user has an existing persona
  const { hasPersona, isLoading: isPersonaDataLoading } = usePersonaData(authData.userId, authData.isAuthenticated)

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

  // Add ref for MarkdownNotepad (moved up to fix declaration order)
  const notepadRef = useRef<{ 
    hasUnsavedContent: () => boolean, 
    clearContent: () => void, 
    getContent: () => string,
    saveNote: () => Promise<string | null>,
    getCurrentNote: () => any,
    isNewNote: () => boolean,
    setNoteForEditing: (noteId: string) => void
  }>(null);

  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick,
    handleFollowUpClick,
    handleReferenceClick: handleReferenceClickProp
  } = useChat(
    chatState, 
    authData.userId, 
    useContextSearch,
    () => {
      console.log('🔔 [CHAT CONTAINER] Notepad getter called:', {
        hasNotepadRef: !!notepadRef.current,
        hasGetCurrentNote: !!(notepadRef.current?.getCurrentNote),
        hasGetContent: !!(notepadRef.current?.getContent)
      });
      
      if (notepadRef.current?.getCurrentNote) {
        try {
          const content = notepadRef.current.getContent();
          const note = notepadRef.current.getCurrentNote();
          console.log('🔔 [CHAT CONTAINER] Notepad content retrieved:', {
            content: content.substring(0, 100) + '...',
            contentLength: content.length,
            title: note?.title || 'No title'
          });
          return {
            content,
            title: note?.title
          };
        } catch (error) {
          console.error('🔔 [CHAT CONTAINER] Error getting notepad content:', error);
          return null;
        }
      } else {
        console.log('🔔 [CHAT CONTAINER] No notepad ref or getCurrentNote method');
        return null;
      }
    }
  )

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

  // Initialize welcome message hook for onboarding users without personas
  const {
    welcomeStep,
    setWelcomeStep,
    handleSuggestionClick: handleWelcomeSuggestionClick
  } = useWelcomeMessage(messages, isLoading, authData.user, setMessages, hasPersona, !!isPersonaDataLoading)

  // Notepad functionality
  const {
    isOpen: notepadOpen,
    width: notepadWidth,
    toggleNotepad,
    getMainContentStyle,
    getNotepadStyle,
    // Mobile tab bar functionality
    isMobile,
    activeTab,
    chatScrollPosition,
    notepadScrollPosition,
    hasUnreadNotepadChanges,
    switchToTab,
    insertTextToNotepad,
    clearNotepadBadge,
    saveScrollPosition
  } = useNotepadUI()

  // Debug logging for notepad state changes (after all variables are initialized)
  console.log('🔔 [CHAT CONTAINER] Component render:', {
    includeNotepadInMessages,
    notepadOpen,
    hasEmbeddings: embeddingInfo?.hasEmbeddings,
    embeddingCount: embeddingInfo?.count,
    useContextSearch
  })

  // Modal state for notepad warning
  const [showNotepadWarning, setShowNotepadWarning] = useState(false);
  
  // Overlay state for content links
  const [overlayContent, setOverlayContent] = useState<{
    contentType: 'youtube' | 'instagram' | 'gmail' | 'insight' | 'note';
    contentId: string;
  } | null>(null);

  // Handle content click to show overlay
  const handleContentClick = useCallback((contentType: string, contentId: string) => {
    setOverlayContent({
      contentType: contentType as 'youtube' | 'instagram' | 'gmail' | 'insight' | 'note',
      contentId
    });
  }, []);

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setOverlayContent(null);
  }, []);
  const [pendingNewChat, setPendingNewChat] = useState(false);

  // Handle noteId and conversationId parameters
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const conversationIdParam = searchParams.get('conversationId');
    
    if (noteId && notepadRef.current) {
      // Open the notepad if not already open
      if (!notepadOpen) {
        toggleNotepad();
      }
      
      // Set the note for editing in the notepad
      if (notepadRef.current.setNoteForEditing) {
        notepadRef.current.setNoteForEditing(noteId);
      }
      
      // Load conversation if specified
      if (conversationIdParam && handleLoadConversation) {
        console.log('🔗 Loading conversation from note:', conversationIdParam);
        handleLoadConversation(conversationIdParam);
      }
      
      // On mobile, switch to notes tab
      if (isMobile && activeTab !== 'notes') {
        switchToTab('notes');
      }
    }
  }, [noteId, notepadOpen, toggleNotepad, isMobile, activeTab, switchToTab, handleLoadConversation]);

  const { 
    quotedForNotepad, 
    handleClearQuoted, 
    handleQuoteToNotepad,
    createReferenceClickHandler 
  } = useChatHandlers(handleSendMessage, handleClearReference, messages)

  // Enhanced quote to notepad handler with mobile support
  const handleQuoteToNotepadEnhanced = useCallback((text: string) => {
    handleQuoteToNotepad(text)
    insertTextToNotepad(text)
  }, [handleQuoteToNotepad, insertTextToNotepad])

  // Memoized handlers to prevent unnecessary re-renders
  const handleSendMessageWithUpdateCheck = useCallback((message: string) => {
    const lowerMessage = message.toLowerCase().trim();
    
    if (lowerMessage === 'hey content update persona') {
      setUpdatePersonaRequested(true);
    }
    
    if (lowerMessage === 'hey content write my persona' && authData.userId && convex) {
      refreshPersonaData(authData.userId, convex);
    }
    
    // Pass the includeNotepadInMessages state to handleSendMessage
    handleSendMessage(message, includeNotepadInMessages);
  }, [handleSendMessage, authData.userId, convex, refreshPersonaData, includeNotepadInMessages]);

  const handleNewChat = useCallback(() => {
    // If notepad is open and has unsaved content, show warning modal
    if (notepadOpen && notepadRef.current?.hasUnsavedContent()) {
      setShowNotepadWarning(true);
      setPendingNewChat(true);
      return;
    }
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
      authData.userId, convex, refreshPersonaData, router, notepadOpen]);

  // Handler for confirming discard in modal
  const handleConfirmDiscardNotepad = () => {
    setShowNotepadWarning(false);
    setPendingNewChat(false);
    // Clear notepad content
    notepadRef.current?.clearContent();
    // Proceed with new chat
    resetChat();
    setMessages([]);
    handleClearReference?.();
    setUpdatePersonaRequested(false);
    setContextConsumption({ hasConsumed: false, isDisplayed: false });
    window.localStorage.removeItem('chatSessionId');
    chatState.setSessionId(null);
    chatState.setIsFirstMessage(true);
    clearContentContext();
    loadedConversationRef.current = null;
    if (authData.userId && convex) {
      refreshPersonaData(authData.userId, convex);
    }
    router.push('/dashboard/chat');
    askQueryProcessedRef.current = null;
    setInputValue('');
  };

  // Handler for canceling discard in modal
  const handleCancelDiscardNotepad = () => {
    setShowNotepadWarning(false);
    setPendingNewChat(false);
  };

  const handleRemoveContext = useCallback(() => {
    clearContentContext();
    const url = new URL(window.location.href);
    url.searchParams.delete('contentContext');
    router.replace(url.pathname + url.search);
  }, [clearContentContext, router]);

  const handleActionClick = useCallback((action: string) => {
    handleSendMessage(action);
  }, [handleSendMessage]);

  // Handle suggestion clicks - use welcome flow for users without personas
  const handleSuggestionClick = useCallback((suggestion: any, onSendMessage: (msg: string) => void) => {
    // If user doesn't have a persona, use the welcome message handler (onboarding flow)
    if (!hasPersona) {
      handleWelcomeSuggestionClick(suggestion, onSendMessage);
    } else {
      // For users with personas, directly send the message
      const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
      onSendMessage(message);
    }
  }, [hasPersona, handleWelcomeSuggestionClick]);

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
  }, [askQuery, isLoading, handleSendMessageWithUpdateCheck, messages.length, authData.user, currentContext]);

  // Check for existing embeddings when user changes
  useEffect(() => {
    const checkEmbeddings = async () => {
      if (authData.userId) {
        console.log('🔍 [CHAT CONTAINER] Checking user embeddings for:', authData.userId);
        try {
          const info = await checkUserEmbeddings(authData.userId);
          console.log('🔍 [CHAT CONTAINER] Embedding info received:', info);
          setEmbeddingInfo(info);
        } catch (error) {
          console.error('🔍 [CHAT CONTAINER] Error checking embeddings:', error);
          // Set default values on error
          setEmbeddingInfo({ hasEmbeddings: false, count: 0 });
        }
      }
    };

    if (authData.userId) {
      checkEmbeddings();
    }
  }, [authData.userId]);

  // Clear conversation state and stale context when component mounts for normal navigation
  useEffect(() => {
    // Always clear state on mount for clean start (not welcome flow)
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

  // Selection-aware autoscroll functionality
  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0 && !isScrollingSuppressed) {
      const scrollContainer = chatContainerRef.current;
      
      const scrollToBottom = () => {
        // Double-check selection state before scrolling
        if (isScrollingSuppressed) return;
        
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
      const timeoutId = setTimeout(() => {
        // Final check before delayed scroll
        if (!isScrollingSuppressed) {
          scrollToBottom();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading, isScrollingSuppressed]);

  // Scroll position management for mobile tab switching
  useEffect(() => {
    if (!isMobile || !chatContainerRef.current) return;

    const scrollContainer = chatContainerRef.current;
    
    const handleScroll = () => {
      saveScrollPosition('chat', scrollContainer.scrollTop);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isMobile, saveScrollPosition]);

  // Restore scroll position when switching tabs
  useEffect(() => {
    if (!isMobile || !chatContainerRef.current) return;

    const scrollContainer = chatContainerRef.current;
    
    // Restore chat scroll position when switching to chat tab
    if (activeTab === 'chat' && chatScrollPosition > 0) {
      setTimeout(() => {
        scrollContainer.scrollTo({
          top: chatScrollPosition,
          behavior: 'instant'
        });
      }, 100);
    }
  }, [isMobile, activeTab, chatScrollPosition]);

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

  // Debug state information - only log critical issues
  if (process.env.NODE_ENV === 'development' && !hasPersona && !isPersonaDataLoading) {
    console.warn('🎯 [CHAT CONTAINER] Missing persona for user');
  }

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
      <div className="flex h-screen bg-background">
        {/* Main chat content */}
        <div 
          data-chat-container
          className="flex flex-col h-screen bg-background"
          style={getMainContentStyle()}
        >
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Tab Bar */}
          {isMobile && (
            <MobileTabBar
              activeTab={activeTab}
              onTabChange={switchToTab}
              hasUnreadNotepadChanges={hasUnreadNotepadChanges}
            />
          )}

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
            // Mobile: Show chat content only when activeTab is 'chat'
            // Desktop: Always show chat content
            (!isMobile || activeTab === 'chat') && (
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="p-4 sm:p-6">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Clean header - no controls crowding */}
                    <div className="flex justify-end items-center pb-3">
                      {/* Only New Chat button - clean and minimal */}
                      <button 
                        onClick={handleNewChat}
                        className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-transparent hover:border-current pb-1"
                      >
                        New conversation
                      </button>
                    </div>

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
                    
                    {/* Messages */}
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
                      onQuoteToNotepad={handleQuoteToNotepadEnhanced}
                      onContentClick={handleContentClick}
                    />

                    {/* Persona tip */}
                    {(updatePersonaRequested || (onboardingState.shouldShowPersonaTip && messages.length >= 4)) && !onboardingState.hasCompletedPersona && (
                      <div className="mt-8">
                        <PersonaTip
                          userId={authData.userId}
                          onTipClick={handleSendMessageWithUpdateCheck}
                        />
                      </div>
                    )}

                    {/* Error display */}
                    {error && (
                      <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200 mb-2">{error}</p>
                        <button
                          onClick={() => chatState.setError(null)}
                          className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 
                            transition-colors duration-200"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          ) : (
            // Ambient insights - only show for users with personas
            hasPersona ? (
              <div className="flex-1 flex flex-col">
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
            ) : (
              // For users without personas, show empty state but welcome message should populate messages
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`h-12 w-12 rounded-full ${themeColors.accentBgLight} animate-pulse`}></div>
                    <div className="space-y-2">
                      <div className={`h-4 w-48 ${themeColors.accentBgLight} rounded animate-pulse`}></div>
                      <div className={`h-3 w-32 ${themeColors.accentBgLight} rounded animate-pulse`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Mobile: Show notepad content when activeTab is 'notes' */}
          {isMobile && activeTab === 'notes' && (
            <div className="flex-1 overflow-hidden">
              <MarkdownNotepad
                ref={notepadRef}
                isOpen={true}
                onClose={() => switchToTab('chat')}
                quotedContent={quotedForNotepad}
                onClearQuoted={handleClearQuoted}
                width={notepadWidth}
                style={getNotepadStyle()}
                availableNotes={availableNotes}
                isMobile={true}
                activeTab={activeTab}
                noteId={noteId}
                fromChat={true}
                canNavigateBack={true}
                onBack={() => router.back()}
                sessionId={chatState.sessionId}
              />
            </div>
          )}


          {/* Bottom Bar Actions - only show for users with personas */}
          {authData.user && messages.length === 0 && hasPersona && (
            <div className="flex-shrink-0">
              <BottomBarActions onActionClick={handleActionClick} onInputPopulate={handleInputAppend} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        {!(isMobile && activeTab === 'notes') && (
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
              notepadOpen={true} // Always open on desktop
              openNotepad={isMobile ? toggleNotepad : undefined} // Only show toggle on mobile
              quotedForNotepad={quotedForNotepad}
              onClearQuoted={handleClearQuoted}
              isAuthenticated={authData.isAuthenticated}
              isMobile={isMobile}
              activeTab={activeTab}
              // Anti-corporate controls
              embeddingInfo={embeddingInfo}
              useContextSearch={useContextSearch}
              onToggleContextSearch={setUseContextSearch}
              includeNotepadInMessages={includeNotepadInMessages}
              onToggleNotepadInMessages={setIncludeNotepadInMessages}
            />
          </div>
        )}
      </div>

      {/* Desktop Notepad - Always visible, taking 50% of space */}
        {!isMobile && (
          <MarkdownNotepad
            ref={notepadRef}
            isOpen={true} // Always open
            onClose={() => {}} // Disable close functionality
            quotedContent={quotedForNotepad}
            onClearQuoted={handleClearQuoted}
            width={notepadWidth}
            style={getNotepadStyle()}
            availableNotes={availableNotes}
            isMobile={false}
            noteId={noteId}
            fromChat={true}
            canNavigateBack={true}
            onBack={() => router.back()}
            sessionId={chatState.sessionId}
          />
        )}
      </div>
        
      {/* Notepad warning modal */}
      <Dialog open={showNotepadWarning} onOpenChange={setShowNotepadWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Notepad Content</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-foreground text-sm">
            Unsaved notes will be lost. <b>Save as a Smart Note before starting a new chat.</b> Continue?
          </div>
          {/* All three buttons in a row */}
          <div className="flex flex-row gap-3 justify-center mt-4">
            <CreateNoteButton
              content={notepadRef.current?.getContent ? notepadRef.current.getContent() : ''}
              onNoteCreate={() => {
                notepadRef.current?.clearContent();
                setShowNotepadWarning(false);
                setPendingNewChat(false);
              }}
              title={"Smart Note"}
            />
            <Button variant="secondary" onClick={handleCancelDiscardNotepad}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDiscardNotepad}>Discard and Start New Chat</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Chat Overlay */}
      {overlayContent && (
        <ChatOverlay
          contentType={overlayContent.contentType}
          contentId={overlayContent.contentId}
          onClose={handleOverlayClose}
        />
      )}
    </>
  );
}

export default ChatContainer; 