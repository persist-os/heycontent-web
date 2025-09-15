import React from 'react'
import { MobileTabBar } from './notepad/MobileTabBar'
import ChatContextBox from './main_chat/ChatContextBox'
import ChatMessagesList from './main_chat/ChatMessagesList'
import { PersonaTip } from './PersonaTip'
import type { Message } from '@/app/types/chat'

interface ChatContentProps {
  // Mobile props
  isMobile: boolean
  activeTab: 'chat' | 'notes'
  switchToTab: (tab: 'chat' | 'notes') => void
  hasUnreadNotepadChanges: boolean
  
  // Auth props
  authData: any
  
  // Theme props
  themeColors: any
  
  // Chat props
  messages: Message[]
  currentContext?: any
  chatContainerRef: React.RefObject<HTMLDivElement>
  
  // Handlers
  handleNewChat: () => void
  handleRemoveContext?: () => void
  handleSendMessageWithUpdateCheck: (message: string) => void
  handleInputAppend: (text: string) => void
  handleMessageReference: (message: Message) => void
  notepadReferenceHandler: (messageId: string) => void
  handleOptionClick: (option: string) => void
  handleFollowUpPopulate: (choice: string) => void
  handleSuggestionClick: (suggestion: any, onSendMessage: (msg: string) => void) => void
  handleQuoteToNotepadEnhanced: (text: string) => void
  handleContentClick: (contentType: string, contentId: string) => void
  
  // State
  referencedMessage: Message | null
  includeAnalysisInQuery: boolean
  setIncludeAnalysisInQuery: (value: boolean) => void
  notepadOpen: boolean
  updatePersonaRequested: boolean
  error: string | null
  setError: (error: string | null) => void
}

export function ChatContent({
  isMobile,
  activeTab,
  switchToTab,
  hasUnreadNotepadChanges,
  authData,
  themeColors,
  messages,
  currentContext,
  chatContainerRef,
  handleNewChat,
  handleRemoveContext,
  handleSendMessageWithUpdateCheck,
  handleInputAppend,
  handleMessageReference,
  notepadReferenceHandler,
  handleOptionClick,
  handleFollowUpPopulate,
  handleSuggestionClick,
  handleQuoteToNotepadEnhanced,
  handleContentClick,
  referencedMessage,
  includeAnalysisInQuery,
  setIncludeAnalysisInQuery,
  notepadOpen,
  updatePersonaRequested,
  error,
  setError
}: ChatContentProps) {
  const hasMessagesOrContext = currentContext || messages.length > 0

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pt-6' : ''}`}>
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
                <div className="flex justify-end items-center pb-6 pr-6 pt-6">
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

                {/* Persona tip - removed as part of onboarding elimination */}
                {updatePersonaRequested && (
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
                      onClick={() => setError(null)}
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
      ) : null}
    </div>
  )
}
