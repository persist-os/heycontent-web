/**
 * Lab Compositions - Clean Resizable Layout
 *
 * Simple resizable split pane with snap functionality.
 * - Drag the divider to resize
 * - Click buttons to snap to presets
 * - Quote functionality between chat and notepad
 */

import React from 'react'
import { useDialogueStore } from '../stores/dialogueStore'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import { useResizablePanes } from '../hooks/useResizablePanes'
import { ContextIndicator } from '../components/ContextIndicator'
import { ChatPanel } from '../components/dialogue/ChatPanel'
import { FloatingActionButtons } from '../components/dialogue/FloatingActionButtons'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { useNotepadStore } from '../stores/notepadStore'
import { useMessageList } from '../hooks/useMessageList'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

// =============================================================================
// PANEL COMPONENTS
// =============================================================================

const NotepadPanel = React.memo<{
  noteId?: string
  quotedContent: string
  onClearQuoted: () => void
  isFullScreen: boolean
  onClose?: () => void
}>(({ noteId, quotedContent, onClearQuoted, isFullScreen, onClose }) => {
  const conversationId = useDialogueStore(state => state.conversationId)

  return (
    <div className="h-full">
      <MarkdownNotepad
        isOpen={true}
        quotedContent={quotedContent}
        onClearQuoted={onClearQuoted}
        width="100%"
        style={{}}
        availableNotes={[]}
        isMobile={false}
        noteId={noteId}
        fromChat={true}
        canNavigateBack={true}
        onBack={() => {}}
        sessionId={conversationId || undefined}
        panelState={isFullScreen ? "notepad-full" : "split"}
        onClose={onClose}
      />
    </div>
  )
})

NotepadPanel.displayName = 'NotepadPanel'

// =============================================================================
// INPUT SECTION
// =============================================================================

// =============================================================================
// MAIN LAYOUT
// =============================================================================

interface LabCompositionProps {
  className?: string
  chatId?: string
  noteId?: string
  askQuery?: string
  contentContext?: any
  widgetOutputId?: string
  projectId?: string
  widgetId?: string
}

export function FullThinkingLab({
  className,
  chatId,
  noteId,
  askQuery,
  contentContext,
  widgetOutputId,
  projectId,
  widgetId
}: LabCompositionProps) {
  // Simplified state - only what we need
  const [userId, setUserId] = React.useState<string | null>(null)
  
  // Store hooks - only what we need
  const { quotedContent, setQuotedContent, clearQuotedContent, clearStreamingContent } = useDialogueStore()
  const { includeInMessages, setIncludeInMessages } = useNotepadStore()
  const { isLoading, sendMessage } = useDialogueStore()
  
  // Input state
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = React.useState("")

  const handleInputPopulate = React.useCallback((text: string) => {
    const cleanText = text
      .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points
      .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
      .trim()
    setInputValue(currentValue => {
      return currentValue.trim() ? `${currentValue} ${cleanText}` : cleanText
    })
  }, [])

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
      quotedForNotepad=""
      onClearQuoted={clearQuotedContent}
      isAuthenticated={true}
      isMobile={false}
      activeTab="chat"
      embeddingInfo={{ hasEmbeddings: false, count: 0 }}
      includeNotepadInMessages={includeInMessages}
      onToggleNotepadInMessages={setIncludeInMessages}
    />
  ), [
    sendMessage,
    isLoading,
    inputValue,
    setInputValue,
    handleInputPopulate,
    includeInMessages,
    setIncludeInMessages,
    clearQuotedContent
  ])
  
  // Simple resizable setup
  const initialRatio = widgetOutputId ? 0.65 : (noteId ? 0.0 : 0.65)
  const resizable = useResizablePanes(initialRatio)
  
  // Get user ID once
  React.useEffect(() => {
    const getUserId = async () => {
      try {
        const { getCurrentUserId } = await import('@/app/lib/api-helpers')
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('[FullThinkingLab] Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])

  // Cleanup streaming content when component unmounts
  React.useEffect(() => {
    return () => {
      clearStreamingContent()
    }
  }, [clearStreamingContent])

  // Get conversationId from store
  const conversationId = useDialogueStore(state => state.conversationId)
  const streamingContent = useDialogueStore(state => state.streamingContent)
  
  // Query Convex to check if conversation has messages (to clear streaming content)
  const convexConversation = useQuery(
    api.chatQueries.getConversation,
    conversationId && userId ? { userId, conversationId } : "skip"
  )
  
  // Clear streaming content when message is confirmed in Convex
  React.useEffect(() => {
    if (streamingContent && convexConversation?.messages?.length > 0) {
      console.log('[FullThinkingLab] Message confirmed in Convex, clearing streaming content')
      clearStreamingContent()
    }
  }, [streamingContent, convexConversation?.messages, clearStreamingContent])
  
  // Use extracted message list hook
  const messages = useMessageList()

  // Check if we're in full screen mode
  const isChatFullScreen = resizable.state.splitRatio === 1.0
  const isNotepadFullScreen = resizable.state.splitRatio === 0.0
  const isFullScreen = isChatFullScreen || isNotepadFullScreen

  // Simplified handlers - no useCallback needed
  const handleNotepadClose = () => resizable.actions.snapToLeft()
  const handleNotepadExpand = () => resizable.actions.snapToSplit()
  const closeChat = () => resizable.actions.snapToRight()

  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden ${className} relative`}>
      {/* Context Indicator - shows when in project/widget container */}
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
              messages={messages}
              onInputPopulate={handleInputPopulate}
              onQuoteToNotepad={setQuotedContent}
              widgetOutputId={widgetOutputId}
              isFullScreen={isChatFullScreen}
              onRestoreNotepad={handleNotepadExpand}
              onCloseChat={closeChat}
            />
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-primary/20 backdrop-blur-sm bg-card/30 flex-shrink-0 shadow-inner shadow-primary/5">
            {inputComponent}
          </div>
        </div>

        {/* Draggable Divider - hover to resize */}
        <div
          className="w-1 cursor-col-resize flex-shrink-0 bg-[hsl(var(--notepad-border))] hover:bg-[hsl(var(--notepad-icon-hover))]/30 transition-all duration-200 relative group"
          style={resizable.styles.dividerStyle}
          onMouseDown={resizable.actions.startDrag}
          title="Drag to resize panels"
        />

        {/* Notepad Panel */}
        <div style={resizable.styles.rightPanelStyle} className="overflow-hidden">
          <NotepadPanel
            noteId={noteId}
            quotedContent={quotedContent}
            onClearQuoted={clearQuotedContent}
            isFullScreen={isNotepadFullScreen}
            onClose={handleNotepadClose}
          />
        </div>
      </div>
    </div>
  )
}

export default FullThinkingLab
export type { LabCompositionProps }
