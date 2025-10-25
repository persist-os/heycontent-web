/**
 * Lab Compositions - Clean Resizable Layout
 *
 * Simple resizable split pane with snap functionality.
 * - Drag the divider to resize
 * - Click buttons to snap to presets
 * - Quote functionality between chat and notepad
 * - Direct Convex integration without store
 */

import React, { useState } from 'react'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import { useResizablePanes } from '../hooks/useResizablePanes'
import { ContextIndicator } from '../components/ContextIndicator'
import { ChatPanel } from '../components/dialogue/ChatPanel'
import { FloatingActionButtons } from '../components/dialogue/FloatingActionButtons'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { useMessageList } from '../hooks/useMessageList'
import { useConversationState } from '../hooks/useConversationState'
import { useOptimizedAuth } from '../components/notepad/hooks/useOptimizedAuth'
// Removed NotepadProvider - using simple local state instead

// =============================================================================
// PANEL COMPONENTS
// =============================================================================

const NotepadPanel = React.memo<{
  noteId?: string
  quotedContent: string
  onClearQuoted: () => void
  onClose?: () => void
  notepadRef?: React.RefObject<any>
}>(({ noteId, quotedContent, onClearQuoted, onClose, notepadRef }) => {
  return (
    <div className="h-full">
      <MarkdownNotepad
        ref={notepadRef}
        isOpen={true}
        noteId={noteId}
        quotedContent={quotedContent}
        onClearQuoted={onClearQuoted}
        onClose={onClose}
        width="100%"
        style={{}}
      />
    </div>
  )
})

NotepadPanel.displayName = 'NotepadPanel'

// =============================================================================
// MAIN COMPOSITION
// =============================================================================

export interface LabCompositionProps {
  className?: string
  chatId?: string
  noteId?: string
  askQuery?: string
  contentContext?: any
  widgetOutputId?: string
  projectId?: string
  widgetId?: string
}

// Internal component that uses the notepad context
function FullThinkingLabInternal({
  className,
  chatId,
  noteId,
  askQuery,
  contentContext,
  widgetOutputId,
  projectId,
  widgetId
}: LabCompositionProps) {
  // Auth and user
  const { user, isLoading: authLoading } = useOptimizedAuth()
  const userId = user?.uid
  
  // Simple local state instead of complex context
  const [includeInMessages, setIncludeInMessages] = useState(false)
  
  // Use the conversation state hook with all logic
  const {
    conversationId,
    isLoading,
    streamingContent,
    pendingUserMessage,
    currentStatus,
    error,
    messages,
    suggestions,
    quotedContent,
    inputValue,
    sendMessage,
    startNewConversation,
    clearStreamingContent,
    setError,
    setStatus,
    handleInputPopulate,
    handleQuoteToNotepad,
    clearQuotedContent,
    setInputValue
  } = useConversationState(userId, projectId, widgetId, widgetOutputId)

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className={`h-screen flex flex-col bg-background overflow-hidden ${className || ''}`}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading Thinking Lab...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Input ref
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // Use existing useMessageList hook with props
  const messageList = useMessageList({
    conversationId,
    isLoading,
    pendingUserMessage,
    streamingContent,
    messages
  })

  // Resizable panes
  const resizable = useResizablePanes()

  // Check if we're in full screen mode
  const isChatFullScreen = resizable.state.splitRatio === 1.0
  const isNotepadFullScreen = resizable.state.splitRatio === 0.0
  const isFullScreen = isChatFullScreen || isNotepadFullScreen

  // Simplified handlers
  const handleNotepadClose = () => resizable.actions.snapToLeft()
  const handleNotepadExpand = () => resizable.actions.snapToSplit()
  const closeChat = () => resizable.actions.snapToRight()

  // Input component
  const inputComponent = React.useMemo(() => (
    <ChatInputArea
      showAmbient={false}
      handleActionClick={sendMessage}
      handleSendMessage={sendMessage}
      inputRef={inputRef}
      isLoading={isLoading}
      referencedMessage={null}
      handleClearReference={() => {}}
      includeAnalysisInQuery={true}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onInputPopulate={handleInputPopulate}
      notepadOpen={true}
      openNotepad={() => {}}
      quotedForNotepad={quotedContent}
      onClearQuoted={clearQuotedContent}
      onToggleNotepadInMessages={setIncludeInMessages}
    />
  ), [sendMessage, isLoading, inputValue, handleInputPopulate, quotedContent, clearQuotedContent, setIncludeInMessages])

  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden ${className || ''}`}>
      {/* Context Indicator */}
      <ContextIndicator />

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        isChatFullScreen={isChatFullScreen}
        isNotepadFullScreen={isNotepadFullScreen}
        onRestoreNotepad={handleNotepadExpand}
      />

      {/* Resizable Split Panes */}
      <div ref={resizable.containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div style={resizable.styles.leftPanelStyle} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              messages={messageList}
              onInputPopulate={handleInputPopulate}
              onQuoteToNotepad={handleQuoteToNotepad}
              widgetOutputId={widgetOutputId}
              isFullScreen={isChatFullScreen}
              onRestoreNotepad={handleNotepadExpand}
              onCloseChat={closeChat}
              suggestions={suggestions}
              sendMessage={sendMessage}
              startNewConversation={startNewConversation}
              isLoading={isLoading}
              error={error}
            />
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-primary/20 backdrop-blur-sm bg-card/30 flex-shrink-0 shadow-inner shadow-primary/5">
            {inputComponent}
          </div>
        </div>

        {/* Notepad Panel */}
        <div style={resizable.styles.rightPanelStyle} className="flex flex-col h-full overflow-hidden">
          <NotepadPanel
            noteId={noteId}
            quotedContent={quotedContent}
            onClearQuoted={clearQuotedContent}
            onClose={handleNotepadClose}
          />
        </div>
      </div>
    </div>
  )
}

// Main export - no provider needed
export function FullThinkingLab(props: LabCompositionProps) {
  return <FullThinkingLabInternal {...props} />
}