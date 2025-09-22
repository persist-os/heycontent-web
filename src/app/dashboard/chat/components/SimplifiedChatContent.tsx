import React from 'react'
import { ChatContent } from './ChatContent'
import { EmptyState } from './EmptyState'
import type { Message } from '@/app/types/chat'
import type { OptimizedAuthData } from '../hooks/useOptimizedAuth'

interface SimplifiedChatContentProps {
  // Core data
  messages: Message[]
  authData: OptimizedAuthData
  
  // UI state
  isMobile: boolean
  activeTab?: string
  hasUnreadNotepadChanges?: boolean
  notepadOpen: boolean
  error?: string | null
  
  // Handlers - consolidated interface
  handlers: {
    handleNewChat: () => void
    handleSendMessageWithUpdateCheck: (content: string, includeNotepad?: boolean) => Promise<void>
    handleInputAppend: (text: string) => void
    handleActionClick: (action: string) => void
    handleSuggestionClick: (suggestion: string) => void
    handleReferenceClick: (messageId: string) => void
    handleContentClick: (content: string) => void
    handleFollowUpPopulate: (choice: string) => void
  }
  
  // Component refs and state
  chatContainerRef: React.RefObject<HTMLDivElement>
  referencedMessage?: any
  includeAnalysisInQuery?: boolean
  setIncludeAnalysisInQuery?: (value: boolean) => void
  updatePersonaRequested?: boolean
  setError?: (error: string | null) => void
  clearContentContext: () => void
  
  // Quote functionality
  onQuoteToNotepad?: (text: string) => void
  
  // Optional mobile props
  switchToTab?: (tab: string) => void
}

/**
 * Simplified chat content component that reduces prop drilling
 * Consolidates ChatContent and EmptyState logic with cleaner interface
 */
export function SimplifiedChatContent({
  messages,
  authData,
  isMobile,
  activeTab,
  hasUnreadNotepadChanges,
  notepadOpen,
  error,
  handlers,
  chatContainerRef,
  referencedMessage,
  includeAnalysisInQuery,
  setIncludeAnalysisInQuery,
  updatePersonaRequested,
  setError,
  clearContentContext,
  onQuoteToNotepad,
  switchToTab
}: SimplifiedChatContentProps) {
  
  const hasContent = messages.length > 0
  
  if (hasContent) {
    return (
      <ChatContent
        isMobile={isMobile}
        activeTab={activeTab as 'chat' | 'notes'}
        switchToTab={switchToTab}
        hasUnreadNotepadChanges={hasUnreadNotepadChanges}
        authData={authData}
        themeColors={{}} // Will be removed when ChatContent uses theme utils
        messages={messages}
        chatContainerRef={chatContainerRef}
        handleNewChat={handlers.handleNewChat}
        handleSendMessageWithUpdateCheck={handlers.handleSendMessageWithUpdateCheck}
        handleInputAppend={handlers.handleInputAppend}
        handleMessageReference={() => {}} // Simplified for now
        notepadReferenceHandler={handlers.handleReferenceClick}
        handleOptionClick={handlers.handleActionClick}
        handleFollowUpPopulate={handlers.handleFollowUpPopulate}
        handleSuggestionClick={handlers.handleSuggestionClick}
        handleQuoteToNotepadEnhanced={onQuoteToNotepad || handlers.handleContentClick}
        handleContentClick={handlers.handleContentClick}
        referencedMessage={referencedMessage}
        includeAnalysisInQuery={includeAnalysisInQuery}
        setIncludeAnalysisInQuery={setIncludeAnalysisInQuery}
        notepadOpen={notepadOpen}
        updatePersonaRequested={updatePersonaRequested}
        error={error}
        setError={setError}
      />
    )
  }
  
  return (
    <EmptyState
      isMobile={isMobile}
      activeTab={activeTab}
      authData={authData}
      themeColors={{}} // Will be removed when EmptyState uses theme utils
      handleNewChat={handlers.handleNewChat}
      handleSendMessageWithUpdateCheck={handlers.handleSendMessageWithUpdateCheck}
      clearContentContext={clearContentContext}
    />
  )
}
