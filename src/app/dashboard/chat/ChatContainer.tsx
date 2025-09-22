import React, { useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/app/context/sidebar-context'
import { useConvex } from 'convex/react'

// Import types
import { ChatScreenProps } from './types'
import type { ChatContainerRefs } from './types/chat-container.types'
import type { MarkdownNotepadRef } from './components/notepad/types'

// Import components
import { BottomBarActions } from './components/main_chat/BottomBarActions'
import ChatInputArea from './components/main_chat/ChatInputArea'
import { MarkdownNotepad } from './components/notepad/MarkdownNotepad'
import { PanelExpandButton } from './components/PanelExpandButton'
import { ChatContainerModals } from './components/ChatContainerModals'
import { SimplifiedChatContent } from './components/SimplifiedChatContent'
import { ChatLayout, ChatPanel, ContentArea, InputArea } from './components/layout/ChatLayout'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'
import { usePersonaData } from './hooks/usePersonaData'
import { useNotepadUI } from './hooks/useNotepadUI'
import { useNotes } from '@/app/context/notes-context'
import { useSplitScreenLayout } from './hooks/useSplitScreenLayout'

// Import optimized hooks
import { useOptimizedAuth } from './hooks/useOptimizedAuth'
import { useChatHandlers } from './hooks/useChatHandlers'
import { useChatContainerState } from './hooks/useChatContainerState'
import { useEmbeddingSync } from './hooks/useEmbeddingSync'
import { useChatContainerEffects } from './hooks/useChatContainerEffects'

// Import utilities
import { useThemeClasses } from '@/lib/theme-utils'
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
  
  // Initialize optimized hooks
  const authData = useOptimizedAuth()
  const { state, setters } = useChatContainerState()
  const { clearContentContext } = useContentContextActions()
  const { isExpanded } = useSidebar()
  const themeClasses = useThemeClasses()

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
    insertTextToNotepad,
    clearNotepadBadge,
    saveScrollPosition
  } = useNotepadUI()

  // Split-screen layout management
  const splitScreen = useSplitScreenLayout()

  // Initialize consolidated handlers
  const chatHandlers = useChatHandlers({
    handleSendMessage,
    handleClearReference,
    handleNewChat: () => {
      clearContentContext()
      resetChat()
    },
    setInputValue: setters.setInputValue,
    clearContentContext,
    resetChat,
    insertTextToNotepad,
    inputValue: state.inputValue,
    messages,
    hasPersona,
    notepadOpen
  })

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
    handleSendMessageWithUpdateCheck: chatHandlers.handleSendMessageWithUpdateCheck,
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
    
    // Load conversation if specified - but only once per noteId
    if (conversationIdParam && handleLoadConversation) {
      handleLoadConversation(conversationIdParam)
    }
    
    // Set note for editing when ref is ready - SINGLE CALL ONLY
    if (refs.notepadRef.current?.setNoteForEditing) {
      refs.notepadRef.current.setNoteForEditing(noteId)
    }
  }, [noteId, notepadOpen, toggleNotepad, isMobile, activeTab, switchToTab]) // REMOVED handleLoadConversation dependency
  
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
      <>
        <ChatLayout isMobile={true}>
          {/* Main Content */}
          <ContentArea>
            <SimplifiedChatContent
              messages={messages}
              authData={authData}
              hasPersona={hasPersona}
              isMobile={true}
              activeTab={activeTab}
              hasUnreadNotepadChanges={hasUnreadNotepadChanges}
              notepadOpen={notepadOpen}
              error={error}
              handlers={chatHandlers}
              chatContainerRef={chatContainerRef}
              referencedMessage={referencedMessage}
              includeAnalysisInQuery={includeAnalysisInQuery}
              setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
              updatePersonaRequested={state.updatePersonaRequested}
              setError={chatState.setError}
              clearContentContext={clearContentContext}
              switchToTab={switchToTab}
            />
          </ContentArea>

          {/* Mobile: Show notepad content when activeTab is 'notes' */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-hidden">
              <MarkdownNotepad
                ref={refs.notepadRef}
                isOpen={true}
                onClose={() => switchToTab('chat')}
                quotedContent=""
                onClearQuoted={() => {}}
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
            <BottomBarActions 
              onActionClick={chatHandlers.handleActionClick} 
              onInputPopulate={chatHandlers.handleInputAppend} 
            />
          )}

          {/* Input Bar */}
          {activeTab !== 'notes' && (
            <InputArea>
              <ChatInputArea
                showAmbient={false}
                handleActionClick={chatHandlers.handleActionClick}
                handleSendMessage={chatHandlers.handleSendMessageWithUpdateCheck}
                inputRef={inputRef}
                isLoading={isLoading}
                referencedMessage={referencedMessage}
                handleClearReference={handleClearReference}
                includeAnalysisInQuery={includeAnalysisInQuery}
                inputValue={state.inputValue}
                onInputChange={setters.setInputValue}
                onInputPopulate={chatHandlers.handleInputAppend}
                notepadOpen={true}
                openNotepad={toggleNotepad}
                quotedForNotepad=""
                onClearQuoted={() => {}}
                isAuthenticated={authData.isAuthenticated}
                isMobile={isMobile}
                activeTab={activeTab}
                embeddingInfo={state.embeddingInfo}
                useContextSearch={state.useContextSearch}
                onToggleContextSearch={setters.setUseContextSearch}
                includeNotepadInMessages={state.includeNotepadInMessages}
                onToggleNotepadInMessages={setters.setIncludeNotepadInMessages}
              />
            </InputArea>
          )}
        </ChatLayout>

        {/* Modals */}
        <ChatContainerModals
          overlayContent={state.overlayContent}
          handleOverlayClose={() => setters.setOverlayContent(null)}
        />
      </>
    )
  }

  // Desktop layout - proper split screen
  return (
    <>
      <ChatLayout isMobile={false}>
        {/* Chat Panel */}
        <ChatPanel style={splitScreen.getChatContainerStyle()}>
          <PanelExpandButton
            panelType="chat"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setChatFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />

          {/* Main Content */}
          <ContentArea>
            <SimplifiedChatContent
              messages={messages}
              authData={authData}
              hasPersona={hasPersona}
              isMobile={false}
              activeTab={activeTab}
              hasUnreadNotepadChanges={hasUnreadNotepadChanges}
              notepadOpen={notepadOpen}
              error={error}
              handlers={chatHandlers}
              chatContainerRef={chatContainerRef}
              referencedMessage={referencedMessage}
              includeAnalysisInQuery={includeAnalysisInQuery}
              setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
              updatePersonaRequested={state.updatePersonaRequested}
              setError={chatState.setError}
              clearContentContext={clearContentContext}
              switchToTab={switchToTab}
            />
          </ContentArea>

          {/* Bottom Bar Actions - only show for users with personas */}
          {authData.user && messages.length === 0 && hasPersona && (
            <BottomBarActions 
              onActionClick={chatHandlers.handleActionClick} 
              onInputPopulate={chatHandlers.handleInputAppend} 
            />
          )}

          {/* Input Bar */}
          <InputArea>
            <ChatInputArea
              showAmbient={false}
              handleActionClick={chatHandlers.handleActionClick}
              handleSendMessage={chatHandlers.handleSendMessageWithUpdateCheck}
              inputRef={inputRef}
              isLoading={isLoading}
              referencedMessage={referencedMessage}
              handleClearReference={handleClearReference}
              includeAnalysisInQuery={includeAnalysisInQuery}
              inputValue={state.inputValue}
              onInputChange={setters.setInputValue}
              onInputPopulate={chatHandlers.handleInputAppend}
              notepadOpen={true}
              openNotepad={toggleNotepad}
              quotedForNotepad=""
              onClearQuoted={() => {}}
              isAuthenticated={authData.isAuthenticated}
              isMobile={false}
              activeTab={activeTab}
              embeddingInfo={state.embeddingInfo}
              useContextSearch={state.useContextSearch}
              onToggleContextSearch={setters.setUseContextSearch}
              includeNotepadInMessages={state.includeNotepadInMessages}
              onToggleNotepadInMessages={setters.setIncludeNotepadInMessages}
            />
          </InputArea>
        </ChatPanel>

        {/* Notepad Panel */}
        <ChatPanel style={splitScreen.getNotepadContainerStyle()}>
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
            quotedContent=""
            onClearQuoted={() => {}}
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
        </ChatPanel>
      </ChatLayout>

      {/* Modals */}
      <ChatContainerModals
        overlayContent={state.overlayContent}
        handleOverlayClose={() => setters.setOverlayContent(null)}
      />
    </>
  )
}

export default ChatContainer