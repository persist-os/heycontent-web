import React, { useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/app/context/sidebar-context'
import { useTheme } from 'next-themes'
import { useConvex } from 'convex/react'

// Import types
import { ChatScreenProps } from './types'
import type { ChatContainerRefs } from './types/chat-container.types'
import type { MarkdownNotepadRef } from './components/notepad/types'

// Import components
import { BottomBarActions } from './components/main_chat/BottomBarActions'
import ChatInputArea from './components/main_chat/ChatInputArea'
import { MarkdownNotepad } from './components/notepad/MarkdownNotepad'
import { PersonaCrystallizationProvider } from '@/app/dashboard/chat/persona_crystallization/PersonaCrystallizationContext'
import { PersonaCrystallizationDebugPanel } from '@/app/dashboard/chat/persona_crystallization/PersonaCrystallizationDebugPanel'
import { PanelExpandButton } from './components/PanelExpandButton'
import { ChatContainerLayout } from './components/ChatContainerLayout'
import { ChatContent } from './components/ChatContent'
import { EmptyState } from './components/EmptyState'
import { ChatContainerModals } from './components/ChatContainerModals'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'
// import { useOnboardingState } from './hooks/useOnboardingState' // Removed - onboarding eliminated
import { usePersonaData } from './hooks/usePersonaData'
import { useNotepadUI } from './hooks/useNotepadUI'
import { useNotes } from '@/app/context/notes-context'
import { useSplitScreenLayout } from './hooks/useSplitScreenLayout'

// Import refactored hooks
import { useAuthData } from './hooks/useAuthData'
import { useChatContainerState } from './hooks/useChatContainerState'
import { useEmbeddingSync } from './hooks/useEmbeddingSync'
import { useChatContainerHandlers } from './hooks/useChatContainerHandlers'
import { useChatContainerEffects } from './hooks/useChatContainerEffects'

import { usePersonaStore } from '@/store/persona-store'
import { useContentContextActions } from '@/store/content-context-store'

const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, noteId }) => {
  const router = useRouter()
  const convex = useConvex()
  
  // Initialize refs
  const refs: ChatContainerRefs = {
    loadedConversationRef: useRef<string | null>(null),
    askQueryProcessedRef: useRef<string | null>(null),
    notepadRef: useRef<MarkdownNotepadRef>(null)
  }
  
  // Initialize core hooks
  const authData = useAuthData()
  const { state, setters } = useChatContainerState()
  const { clearContentContext } = useContentContextActions()
  
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
  

  // Initialize embedding sync
  useEmbeddingSync({ 
    userId: authData.userId, 
    setEmbeddingInfo: setters.setEmbeddingInfo 
  })
  
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

  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
    handleOptionClick: handleOptionClickFromChat,
    handleFollowUpClick,
    handleReferenceClick: handleReferenceClickProp
  } = useChat(
    chatState, 
    authData.userId, 
    state.useContextSearch,
    () => {
      if (refs.notepadRef.current?.getCurrentNote) {
        try {
          const content = refs.notepadRef.current.getContent()
          const note = refs.notepadRef.current.getCurrentNote()
          return {
            content,
            title: note?.title
          }
        } catch (error) {
          console.error('Error getting notepad content:', error)
          return null
        }
      }
      return null
    },
    null, // ChatContainer doesn't use project context
    'chat' // Use regular chat mode
  )

  // Track onboarding state for persona tip - REMOVED (onboarding eliminated)

  // Initialize conversation hook with shared state
  const {
    loading: conversationLoading,
    setLoading: setConversationLoading,
    handleLoadConversation,
    initSession
  } = useConversation(chatState, authData.user)

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
    clearNotepadBadge,
    saveScrollPosition
  } = useNotepadUI()

  // Split-screen layout management
  const splitScreen = useSplitScreenLayout()

  // Initialize handlers
  const handlers = useChatContainerHandlers({
    state,
    setters,
    authData,
    chatState,
    refs,
    handleSendMessage,
    handleClearReference,
    clearContentContext,
    resetChat,
    messages,
    hasPersona,
    notepadOpen
  })
  
  const finalHandlers = handlers

  // Initialize effects
  useChatContainerEffects({
    state,
    setters,
    authData,
    chatState,
    refs,
    messages,
    askQuery,
    chatId,
    handleLoadConversation,
    handleSendMessageWithUpdateCheck: finalHandlers.handleSendMessageWithUpdateCheck,
    chatContainerRef,
    isMobile,
    activeTab,
    chatScrollPosition,
    saveScrollPosition
  })
  
  // Handle noteId parameter - FIXED: Consolidated dual effects to prevent cascade
  React.useEffect(() => {
    if (!noteId) return
    
    const searchParams = new URLSearchParams(window.location.search)
    const conversationIdParam = searchParams.get('conversationId')
    
    // Always open notepad for note editing
    if (!notepadOpen) {
      toggleNotepad()
    }
    
    // Switch to notes tab on mobile
    if (isMobile && activeTab !== 'notes') {
      switchToTab('notes')
    }
    
    // Load conversation if specified
    if (conversationIdParam && handleLoadConversation) {
      handleLoadConversation(conversationIdParam)
    }
    
    // Set note for editing when ref is ready - SINGLE CALL ONLY
    if (refs.notepadRef.current?.setNoteForEditing) {
      refs.notepadRef.current.setNoteForEditing(noteId)
    }
  }, [noteId, notepadOpen, toggleNotepad, isMobile, activeTab, switchToTab, handleLoadConversation])
  
  // REMOVED: Duplicate effect that caused cascading switches

  // Get notes for notepad
  const { notes } = useNotes()
  const availableNotes = useMemo(() => 
    notes.map(note => ({
      _id: String(note._id),
      title: note.title,
      type: note.type || 'idea_bank',
    })), 
    [notes]
  )

  // Computed values
  const hasMessagesOrContext = messages.length > 0

  // Mobile layout
  if (isMobile) {
    return (
      <PersonaCrystallizationProvider userId={authData.userId}>
        <ChatContainerLayout
          isMobile={isMobile}
          splitScreen={splitScreen}
          getMainContentStyle={getMainContentStyle}
        >
          {/* Main Content */}
          {hasMessagesOrContext && (
            <ChatContent
              isMobile={isMobile}
              activeTab={activeTab}
              switchToTab={switchToTab}
              hasUnreadNotepadChanges={hasUnreadNotepadChanges}
              authData={authData}
              themeColors={themeColors}
              messages={messages}
              chatContainerRef={chatContainerRef}
              handleNewChat={finalHandlers.handleNewChat}
              handleSendMessageWithUpdateCheck={finalHandlers.handleSendMessageWithUpdateCheck}
              handleInputAppend={finalHandlers.handleInputAppend}
              handleMessageReference={handleMessageReference}
              notepadReferenceHandler={(messageId: string) => finalHandlers.handleReferenceClick(messageId)}
              handleOptionClick={(option: string) => {
                handleOptionClickFromChat({ text: option })
              }}
              handleFollowUpPopulate={finalHandlers.handleFollowUpPopulate}
              handleSuggestionClick={finalHandlers.handleSuggestionClick}
              handleQuoteToNotepadEnhanced={finalHandlers.handleQuoteToNotepadEnhanced}
              handleContentClick={finalHandlers.handleContentClick}
              referencedMessage={referencedMessage}
              includeAnalysisInQuery={includeAnalysisInQuery}
              setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
              notepadOpen={notepadOpen}
              updatePersonaRequested={state.updatePersonaRequested}
              error={error}
              setError={chatState.setError}
            />
          )}

          {/* Empty State */}
          {!hasMessagesOrContext && (
            <EmptyState
              isMobile={isMobile}
              activeTab={activeTab}
              hasPersona={hasPersona}
              authData={authData}
              themeColors={themeColors}
              handleNewChat={finalHandlers.handleNewChat}
              handleSendMessageWithUpdateCheck={finalHandlers.handleSendMessageWithUpdateCheck}
              clearContentContext={clearContentContext}
            />
          )}

          {/* Mobile: Show notepad content when activeTab is 'notes' */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-hidden">
              <MarkdownNotepad
                ref={refs.notepadRef}
                isOpen={true}
                onClose={() => switchToTab('chat')}
                quotedContent={finalHandlers.quotedForNotepad}
                onClearQuoted={finalHandlers.handleClearQuoted}
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
              <BottomBarActions 
                onActionClick={finalHandlers.handleActionClick} 
                onInputPopulate={finalHandlers.handleInputAppend} 
              />
            </div>
          )}

          {/* Input Bar */}
          {activeTab !== 'notes' && (
            <div className="flex-shrink-0 border-t border-border bg-background">
              <ChatInputArea
                showAmbient={false}
                handleActionClick={finalHandlers.handleActionClick}
                handleSendMessage={finalHandlers.handleSendMessageWithUpdateCheck}
                inputRef={inputRef}
                isLoading={isLoading}
                referencedMessage={referencedMessage}
                handleClearReference={handleClearReference}
                includeAnalysisInQuery={includeAnalysisInQuery}
                inputValue={state.inputValue}
                onInputChange={setters.setInputValue}
                onInputPopulate={finalHandlers.handleInputAppend}
                notepadOpen={true}
                openNotepad={toggleNotepad}
                quotedForNotepad={finalHandlers.quotedForNotepad}
                onClearQuoted={finalHandlers.handleClearQuoted}
                isAuthenticated={authData.isAuthenticated}
                isMobile={isMobile}
                activeTab={activeTab}
                embeddingInfo={state.embeddingInfo}
                useContextSearch={state.useContextSearch}
                onToggleContextSearch={setters.setUseContextSearch}
                includeNotepadInMessages={state.includeNotepadInMessages}
                onToggleNotepadInMessages={setters.setIncludeNotepadInMessages}
              />
            </div>
          )}
        </ChatContainerLayout>

        {/* Modals */}
        <ChatContainerModals
          showNotepadWarning={state.showNotepadWarning}
          setShowNotepadWarning={setters.setShowNotepadWarning}
          overlayContent={state.overlayContent}
          notepadRef={refs.notepadRef}
          handleConfirmDiscardNotepad={finalHandlers.handleConfirmDiscardNotepad}
          handleCancelDiscardNotepad={finalHandlers.handleCancelDiscardNotepad}
          handleOverlayClose={finalHandlers.handleOverlayClose}
        />

        {/* No polling - backend handles all triggers */}
        
        {/* Development Debug Panel */}
        <PersonaCrystallizationDebugPanel />
      </PersonaCrystallizationProvider>
    )
  }

  // Desktop layout - proper split screen
  return (
    <PersonaCrystallizationProvider userId={authData.userId}>
      <div className="flex h-screen bg-background">
        {/* Chat Panel */}
        <div 
          className="flex flex-col h-screen bg-background relative group"
          style={splitScreen.getChatContainerStyle()}
        >
          <PanelExpandButton
            panelType="chat"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setChatFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />

          {/* Main Content */}
          {hasMessagesOrContext && (
            <ChatContent
              isMobile={false}
              activeTab={activeTab}
              switchToTab={switchToTab}
              hasUnreadNotepadChanges={hasUnreadNotepadChanges}
              authData={authData}
              themeColors={themeColors}
              messages={messages}
              chatContainerRef={chatContainerRef}
              handleNewChat={finalHandlers.handleNewChat}
              handleSendMessageWithUpdateCheck={finalHandlers.handleSendMessageWithUpdateCheck}
              handleInputAppend={finalHandlers.handleInputAppend}
              handleMessageReference={handleMessageReference}
              notepadReferenceHandler={(messageId: string) => finalHandlers.handleReferenceClick(messageId)}
              handleOptionClick={(option: string) => {
                handleOptionClickFromChat({ text: option })
              }}
              handleFollowUpPopulate={finalHandlers.handleFollowUpPopulate}
              handleSuggestionClick={finalHandlers.handleSuggestionClick}
              handleQuoteToNotepadEnhanced={finalHandlers.handleQuoteToNotepadEnhanced}
              handleContentClick={finalHandlers.handleContentClick}
              referencedMessage={referencedMessage}
              includeAnalysisInQuery={includeAnalysisInQuery}
              setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
              notepadOpen={notepadOpen}
              updatePersonaRequested={state.updatePersonaRequested}
              error={error}
              setError={chatState.setError}
            />
          )}

          {/* Empty State */}
          {!hasMessagesOrContext && (
            <EmptyState
              isMobile={false}
              activeTab={activeTab}
              hasPersona={hasPersona}
              authData={authData}
              themeColors={themeColors}
              handleNewChat={finalHandlers.handleNewChat}
              handleSendMessageWithUpdateCheck={finalHandlers.handleSendMessageWithUpdateCheck}
              clearContentContext={clearContentContext}
            />
          )}

          {/* Bottom Bar Actions - only show for users with personas */}
          {authData.user && messages.length === 0 && hasPersona && (
            <div className="flex-shrink-0">
              <BottomBarActions 
                onActionClick={finalHandlers.handleActionClick} 
                onInputPopulate={finalHandlers.handleInputAppend} 
              />
            </div>
          )}

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t border-border bg-background">
            <ChatInputArea
              showAmbient={false}
              handleActionClick={finalHandlers.handleActionClick}
              handleSendMessage={finalHandlers.handleSendMessageWithUpdateCheck}
              inputRef={inputRef}
              isLoading={isLoading}
              referencedMessage={referencedMessage}
              handleClearReference={handleClearReference}
              includeAnalysisInQuery={includeAnalysisInQuery}
              inputValue={state.inputValue}
              onInputChange={setters.setInputValue}
              onInputPopulate={finalHandlers.handleInputAppend}
              notepadOpen={true}
              openNotepad={toggleNotepad}
              quotedForNotepad={finalHandlers.quotedForNotepad}
              onClearQuoted={finalHandlers.handleClearQuoted}
              isAuthenticated={authData.isAuthenticated}
              isMobile={false}
              activeTab={activeTab}
              embeddingInfo={state.embeddingInfo}
              useContextSearch={state.useContextSearch}
              onToggleContextSearch={setters.setUseContextSearch}
              includeNotepadInMessages={state.includeNotepadInMessages}
              onToggleNotepadInMessages={setters.setIncludeNotepadInMessages}
            />
          </div>
        </div>

        {/* Notepad Panel */}
        <div 
          className="relative group h-screen bg-background"
          style={splitScreen.getNotepadContainerStyle()}
        >
          <PanelExpandButton
            panelType="notepad"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setNotepadFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />
          
          <MarkdownNotepad
            ref={refs.notepadRef}
            isOpen={true}
            onClose={() => {}}
            quotedContent={finalHandlers.quotedForNotepad}
            onClearQuoted={finalHandlers.handleClearQuoted}
            width="100%"
            style={{}}
            availableNotes={availableNotes}
            isMobile={false}
            noteId={noteId}
            fromChat={true}
            canNavigateBack={true}
            onBack={() => router.back()}
            sessionId={chatState.sessionId}
            panelState={splitScreen.panelState}
          />
        </div>
      </div>

      {/* Modals */}
      <ChatContainerModals
        showNotepadWarning={state.showNotepadWarning}
        setShowNotepadWarning={setters.setShowNotepadWarning}
        overlayContent={state.overlayContent}
        notepadRef={refs.notepadRef}
        handleConfirmDiscardNotepad={finalHandlers.handleConfirmDiscardNotepad}
        handleCancelDiscardNotepad={finalHandlers.handleCancelDiscardNotepad}
        handleOverlayClose={finalHandlers.handleOverlayClose}
      />

      {/* No polling - backend handles all triggers */}
      
      {/* Development Debug Panel */}
      <PersonaCrystallizationDebugPanel />
    </PersonaCrystallizationProvider>
  )
}

export default ChatContainer