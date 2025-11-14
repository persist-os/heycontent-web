/**
 * ChatPanel - Extracted from LabCompositions
 * 
 * Handles chat rendering with loading states, error states, and empty states.
 * Reuses existing components and hooks for consistency.
 */

import React from 'react'
import { PanelRight, X } from 'lucide-react'
import { useOptimizedAuth } from '../../components/notepad/hooks/useOptimizedAuth'
import { useAutoScroll } from '../../hooks/useAutoScroll'
import ChatMessagesList from './components/ChatMessagesList'
import { AmbientInsights } from '@/app/dashboard/ambient_insights/AmbientInsights'
import { WidgetPrompts } from '../../components/WidgetPrompts'
import { HorizontalProgressiveThinking } from './components/HorizontalProgressiveThinking'
import { filterMessages } from '../../utils/messageTypes'
import type { Message } from '@/app/types/chat'
import { T } from '@/components/translation/T'

interface ChatPanelProps {
  messages: Message[]
  onInputPopulate: (text: string) => void
  onQuoteToNotepad: (text: string) => void
  widgetOutputId?: string
  isFullScreen?: boolean
  onRestoreNotepad?: () => void
  onCloseChat?: () => void
  suggestions?: string[]
  sendMessage: (content: string) => void
  startNewConversation: () => void
  isLoading: boolean
  isStreaming?: boolean  // NEW: Track streaming state to show thinking
  error?: string
}

export const ChatPanel = React.memo<ChatPanelProps>(({ 
  messages, 
  onInputPopulate, 
  onQuoteToNotepad, 
  widgetOutputId, 
  isFullScreen, 
  onRestoreNotepad, 
  onCloseChat,
  suggestions = [],
  sendMessage,
  startNewConversation,
  isLoading,
  isStreaming = false,
  error
}) => {
  const authData = useOptimizedAuth()
  
  // Filter messages into A2A and user-facing categories
  const { a2aMessages, userFacingMessages } = React.useMemo(() => {
    return filterMessages(messages)
  }, [messages])
  
  // Check if last message is currently streaming (visible in chat)
  const lastMessageIsStreaming = React.useMemo(() => {
    if (userFacingMessages.length === 0) return false
    const lastMessage = userFacingMessages[userFacingMessages.length - 1]
    // Last message is streaming if it's an assistant message and isStreaming is true
    return lastMessage.role === 'assistant' && isStreaming
  }, [userFacingMessages, isStreaming])
  
  // Check if there's a gap after user message (waiting for response)
  const hasGapAfterUserMessage = React.useMemo(() => {
    if (userFacingMessages.length === 0) return false
    const lastMessage = userFacingMessages[userFacingMessages.length - 1]
    // Gap if: last message is user and no assistant response yet (not streaming, not loading)
    return lastMessage.role === 'user' && !isStreaming && !isLoading
  }, [userFacingMessages, isStreaming, isLoading])
  
  // Check if we have at least one user message (processing started)
  const hasUserMessage = React.useMemo(() => {
    return userFacingMessages.some(msg => msg.role === 'user')
  }, [userFacingMessages])
  
  // Determine if we should show thinking indicator
  // CRITICAL RULE: Always show thinking OR streaming message from first user message → last artifact created
  // - If message is streaming → message is visible, don't show thinking (user sees the message)
  // - Once message finishes streaming → immediately show thinking again (background processing)
  // - If gap after user message → show thinking (waiting for response)
  // - If we have A2A messages → show thinking (background processing)
  // - If we're loading → show thinking
  const shouldShowThinking = React.useMemo(() => {
    // Only show thinking if we have at least one user message (processing has started)
    if (!hasUserMessage) return false
    
    // Don't show thinking if last message is currently streaming (message is visible)
    if (lastMessageIsStreaming) return false
    
    // After streaming completes, always show thinking until artifact is created
    // Show thinking if: has A2A messages, loading, or gap after user message
    // This ensures continuous feedback from first user message → last artifact created
    return a2aMessages.length > 0 || isLoading || hasGapAfterUserMessage
  }, [hasUserMessage, lastMessageIsStreaming, a2aMessages.length, isLoading, hasGapAfterUserMessage])
  
  // Auto-scroll when messages change
  const scrollRef = useAutoScroll([messages])

  const handleSuggestionClick = React.useCallback((suggestion: any, onSendMessage: (text: string) => void) => {
    if (typeof suggestion === 'string') {
      onSendMessage(suggestion)
    } else if (suggestion.action || suggestion.text || suggestion.description) {
      onSendMessage(suggestion.action || suggestion.text || suggestion.description)
    }
  }, [])

  const handleActionClick = React.useCallback((action: string) => {
    sendMessage(action)
  }, [sendMessage])

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {messages.length > 0 ? (
        <>
          {/* Header with New Conversation Button and Restore Notepad Button */}
          <div className="flex justify-between items-center h-24 border-b border-border/30 flex-shrink-0 px-6 bg-background">
            <div></div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={startNewConversation}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                New conversation
              </button>
              
              {/* Close Chat Button - subtle X icon */}
              {onCloseChat && (
                <button
                  onClick={onCloseChat}
                  className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Restore Notepad Button - only show when in full screen */}
              {isFullScreen && onRestoreNotepad && (
                <button
                  onClick={onRestoreNotepad}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200"
                  title="Restore notepad"
                >
                  <PanelRight className="w-4 h-4" />
                  Restore notepad
                </button>
              )}
            </div>
          </div>

          {/* Messages Area - takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="p-4 sm:p-6 pl-12 sm:pl-12">
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* User-facing messages - chat responses, preflight questions, etc. */}
                  <ChatMessagesList
                    messages={userFacingMessages}
                    referencedMessage={null}
                    handleMessageReference={() => {}}
                    handleReferenceClick={() => {}}
                    handleOptionClick={sendMessage}
                    handleFollowUpClick={sendMessage}
                    userId={authData.user?.uid}
                    handleSuggestionClick={handleSuggestionClick}
                    handleSendMessage={sendMessage}
                    onInputPopulate={onInputPopulate}
                    notepadOpen={true}
                    onQuoteToNotepad={onQuoteToNotepad}
                    onContentClick={() => {}}
                  />
                  
                  {/* A2A Thinking Component - shows below most recent user message */}
                  {/* Show when: loading, streaming, has A2A messages, or gap after user message */}
                  {shouldShowThinking && (
                    <HorizontalProgressiveThinking
                      messages={a2aMessages.length > 0 ? a2aMessages : undefined}
                      isStreaming={isStreaming}
                      isLoading={isLoading}
                      hasFinalArtifact={false}  // TODO: Track artifact creation from widget execution
                    />
                  )}
                  
                  {/* Scroll anchor */}
                  <div ref={scrollRef} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : isLoading ? (
        /* Loading state - show while conversation is being loaded */
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-card/60 backdrop-blur-lg border border-border/50 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">
              <T context="chat.loading.conversation">Loading conversation...</T>
            </p>
          </div>
        </div>
      ) : error ? (
        /* Error state - show if conversation failed to load */
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md px-6 p-8 rounded-2xl bg-card/60 backdrop-blur-lg border border-destructive/30 shadow-xl">
            <div className="text-destructive text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                <T context="chat.error.load.failed">Failed to load conversation</T>
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
              >
                <T context="button.try.again">Try Again</T>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state - show widget prompts or ambient insights */
        <div className="h-full flex flex-col bg-background">
          {/* Header with Close Chat Button */}
          <div className="flex justify-between items-center h-24 border-b border-border/30 flex-shrink-0 px-6 bg-background">
            <div></div>
            
            <div className="flex items-center gap-3">
              {/* Close Chat Button - subtle X icon */}
              {onCloseChat && (
                <button
                  onClick={onCloseChat}
                  className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200"
                  title="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Restore Notepad Button - only show when in full screen */}
              {isFullScreen && onRestoreNotepad && (
                <button
                  onClick={onRestoreNotepad}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-all duration-200"
                  title="Restore notepad"
                >
                  <PanelRight className="w-4 h-4" />
                  Restore notepad
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 px-6 py-4">
            {widgetOutputId && authData.user?.uid ? (
              <WidgetPrompts
                key={widgetOutputId}
                widgetOutputId={widgetOutputId}
                userId={authData.user.uid}
                onPromptClick={(promptText) => {
                  onInputPopulate(promptText)
                }}
              />
            ) : (
              <AmbientInsights
                userId={authData.user?.uid}
                onInsightClick={(action: string, insight: any) => {
                  const fullMessage = `${insight.title}\n\n${insight.description}\n\n${action}`
                  sendMessage(fullMessage)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
})

ChatPanel.displayName = 'ChatPanel'
