import React, { useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// Import types
import { ChatScreenProps } from './types'

// Import components
import { BottomBarActions } from './components/main_chat/BottomBarActions'
import ChatInputArea from './components/main_chat/ChatInputArea'
import { MarkdownNotepad } from './components/notepad/MarkdownNotepad'
import { PanelExpandButton } from './components/PanelExpandButton'
import { ChatContainerModals } from './components/ChatContainerModals'
import { ChatContent } from './components/ChatContent'
import { EmptyState } from './components/EmptyState'
import { ChatLayout, ChatPanel, ContentArea, InputArea } from './components/layout/ChatLayout'

// Import custom hooks
import { useChatState } from './hooks/useChatState'
import { useChat } from './hooks/useChat'
import { useConversation } from './hooks/useConversation'
import { useUIEffects } from './hooks/useUIEffects'
import { useNotepadUI } from './hooks/useNotepadUI'
import { useNotes } from '@/app/context/notes-context'
import { useSplitScreenLayout } from './hooks/useSplitScreenLayout'
import { useOptimizedAuth } from './hooks/useOptimizedAuth'
import { useChatContainer } from './hooks/useChatContainer'
import { useEmbeddingSync } from './hooks/useEmbeddingSync'

// Import utilities
import { useThemeClasses } from '@/lib/theme-utils'
import { useContentContextActions } from '@/store/content-context-store'

const ChatContainer: React.FC<ChatScreenProps> = ({ chatId, contentContext, askQuery, noteId }) => {
  const router = useRouter()
  
  // Initialize hooks
  const authData = useOptimizedAuth()
  const { clearContentContext } = useContentContextActions()
  const themeClasses = useThemeClasses()
  const chatState = useChatState()
  const { messages, error, isLoading, includeAnalysisInQuery, setIncludeAnalysisInQuery } = chatState
  
  // UI hooks
  const { chatContainerRef, inputRef, resetChat } = useUIEffects(messages, false)
  const {
    isOpen: notepadOpen,
    width: notepadWidth,
    toggleNotepad,
    isMobile,
    activeTab,
    chatScrollPosition,
    hasUnreadNotepadChanges,
    switchToTab,
    insertTextToNotepad,
    saveScrollPosition
  } = useNotepadUI()
  const splitScreen = useSplitScreenLayout()

  // Chat hooks
  const {
    referencedMessage,
    handleSendMessage,
    handleMessageReference,
    handleClearReference,
  } = useChat(chatState, authData.userId, false, null, null, 'chat')

  const { handleLoadConversation } = useConversation(chatState, authData.user)

  // Initialize embedding sync
  useEmbeddingSync({ 
    userId: authData.userId, 
    setEmbeddingInfo: () => {}
  })

  // Initialize consolidated container hook
  const containerHandlers = useChatContainer({
    authData,
    chatState,
    handleSendMessage,
    handleClearReference,
    clearContentContext,
    resetChat,
    messages,
    askQuery,
    chatId,
    handleLoadConversation,
    chatContainerRef,
    isMobile,
    activeTab,
    chatScrollPosition,
    saveScrollPosition,
    notepadOpen,
    insertTextToNotepad
  })

  // Quote handler
  const [quotedForNotepad, setQuotedForNotepad] = React.useState('')
  const handleQuoteToNotepad = React.useCallback((text: string) => {
    setQuotedForNotepad(text)
    if (isMobile) {
      switchToTab('notes')
    } else if (!notepadOpen) {
      toggleNotepad()
    }
  }, [isMobile, switchToTab, notepadOpen, toggleNotepad])
  
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

  // Handle noteId parameter
  React.useEffect(() => {
    if (!noteId) return
    
    const searchParams = new URLSearchParams(window.location.search)
    const conversationIdParam = searchParams.get('conversationId')
    
    if (!notepadOpen) toggleNotepad()
    if (isMobile && activeTab !== 'notes') switchToTab('notes')
    if (conversationIdParam) handleLoadConversation(conversationIdParam)
    if (containerHandlers.refs.notepadRef.current?.setNoteForEditing) {
      containerHandlers.refs.notepadRef.current.setNoteForEditing(noteId)
    }
  }, [noteId, notepadOpen, toggleNotepad, isMobile, activeTab, switchToTab])

  // Render shared content helper
  const renderChatContent = (isMobileView: boolean) => (
    messages.length > 0 ? (
      <ChatContent
        isMobile={isMobileView}
        activeTab={activeTab as 'chat' | 'notes'}
        switchToTab={switchToTab}
        hasUnreadNotepadChanges={hasUnreadNotepadChanges}
        authData={authData}
        themeColors={themeClasses}
        messages={messages}
        chatContainerRef={chatContainerRef}
        handleNewChat={containerHandlers.handleNewChat}
        handleSendMessageWithUpdateCheck={containerHandlers.handleSendMessageWithUpdateCheck}
        handleInputAppend={containerHandlers.handleInputAppend}
        handleMessageReference={handleMessageReference}
        notepadReferenceHandler={containerHandlers.handleReferenceClick}
        handleOptionClick={containerHandlers.handleActionClick}
        handleFollowUpPopulate={containerHandlers.handleFollowUpPopulate}
        handleSuggestionClick={containerHandlers.handleSuggestionClick}
        handleQuoteToNotepadEnhanced={handleQuoteToNotepad}
        handleContentClick={containerHandlers.handleContentClick}
        referencedMessage={referencedMessage}
        includeAnalysisInQuery={includeAnalysisInQuery}
        setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
        notepadOpen={notepadOpen}
        updatePersonaRequested={false}
        error={error}
        setError={chatState.setError}
      />
    ) : (
      <EmptyState
        isMobile={isMobileView}
        activeTab={activeTab}
        authData={authData}
        themeColors={themeClasses}
        handleNewChat={containerHandlers.handleNewChat}
        handleSendMessageWithUpdateCheck={containerHandlers.handleSendMessageWithUpdateCheck}
        clearContentContext={clearContentContext}
      />
    )
  )

  // Mobile layout
  if (isMobile) {
    return (
      <>
        <ChatLayout isMobile={true}>
          <ContentArea>
            {renderChatContent(true)}
          </ContentArea>

          {activeTab === 'notes' && (
            <div className="flex-1 overflow-hidden">
              <MarkdownNotepad
                ref={containerHandlers.refs.notepadRef}
                isOpen={true}
                onClose={() => switchToTab('chat')}
                quotedContent={quotedForNotepad}
                onClearQuoted={() => setQuotedForNotepad('')}
                width={notepadWidth}
                style={{}}
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

          {authData.user && messages.length === 0 && (
            <BottomBarActions 
              onActionClick={containerHandlers.handleActionClick} 
              onInputPopulate={containerHandlers.handleInputAppend} 
            />
          )}

          {activeTab !== 'notes' && (
            <InputArea>
              <ChatInputArea
                showAmbient={false}
                handleActionClick={containerHandlers.handleActionClick}
                handleSendMessage={containerHandlers.handleSendMessageWithUpdateCheck}
                inputRef={inputRef}
                isLoading={isLoading}
                referencedMessage={referencedMessage}
                handleClearReference={handleClearReference}
                includeAnalysisInQuery={includeAnalysisInQuery}
                inputValue={containerHandlers.state.inputValue}
                onInputChange={containerHandlers.setters.setInputValue}
                onInputPopulate={containerHandlers.handleInputAppend}
                notepadOpen={true}
                openNotepad={toggleNotepad}
                quotedForNotepad=""
                onClearQuoted={() => {}}
                isAuthenticated={authData.isAuthenticated}
                isMobile={isMobile}
                activeTab={activeTab}
                embeddingInfo={containerHandlers.state.embeddingInfo}
                useContextSearch={containerHandlers.state.useContextSearch}
                onToggleContextSearch={containerHandlers.setters.setUseContextSearch}
                includeNotepadInMessages={containerHandlers.state.includeNotepadInMessages}
                onToggleNotepadInMessages={containerHandlers.setters.setIncludeNotepadInMessages}
              />
            </InputArea>
          )}
        </ChatLayout>

        <ChatContainerModals
          overlayContent={containerHandlers.state.overlayContent}
          handleOverlayClose={containerHandlers.handleOverlayClose}
        />
      </>
    )
  }

  // Desktop layout
  return (
    <>
      <ChatLayout isMobile={false}>
        <ChatPanel style={splitScreen.getChatContainerStyle()}>
          <PanelExpandButton
            panelType="chat"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setChatFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />
          <ContentArea>
            {renderChatContent(false)}
          </ContentArea>
          {authData.user && messages.length === 0 && (
            <BottomBarActions 
              onActionClick={containerHandlers.handleActionClick} 
              onInputPopulate={containerHandlers.handleInputAppend} 
            />
          )}
          <InputArea>
            <ChatInputArea
              showAmbient={false}
              handleActionClick={containerHandlers.handleActionClick}
              handleSendMessage={containerHandlers.handleSendMessageWithUpdateCheck}
              inputRef={inputRef}
              isLoading={isLoading}
              referencedMessage={referencedMessage}
              handleClearReference={handleClearReference}
              includeAnalysisInQuery={includeAnalysisInQuery}
              inputValue={containerHandlers.state.inputValue}
              onInputChange={containerHandlers.setters.setInputValue}
              onInputPopulate={containerHandlers.handleInputAppend}
              notepadOpen={true}
              openNotepad={toggleNotepad}
              quotedForNotepad=""
              onClearQuoted={() => {}}
              isAuthenticated={authData.isAuthenticated}
              isMobile={false}
              activeTab={activeTab}
              embeddingInfo={containerHandlers.state.embeddingInfo}
              useContextSearch={containerHandlers.state.useContextSearch}
              onToggleContextSearch={containerHandlers.setters.setUseContextSearch}
              includeNotepadInMessages={containerHandlers.state.includeNotepadInMessages}
              onToggleNotepadInMessages={containerHandlers.setters.setIncludeNotepadInMessages}
            />
          </InputArea>
        </ChatPanel>

        <ChatPanel style={splitScreen.getNotepadContainerStyle()}>
          <PanelExpandButton
            panelType="notepad"
            panelState={splitScreen.panelState}
            onExpand={splitScreen.setNotepadFullScreen}
            onRestore={splitScreen.restoreSplitView}
          />
          <MarkdownNotepad
            ref={containerHandlers.refs.notepadRef}
            isOpen={true}
            onClose={() => {}}
            quotedContent={quotedForNotepad}
            onClearQuoted={() => setQuotedForNotepad('')}
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

      <ChatContainerModals
        overlayContent={containerHandlers.state.overlayContent}
        handleOverlayClose={containerHandlers.handleOverlayClose}
      />
    </>
  )
}

export default ChatContainer