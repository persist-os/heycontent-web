/**
 * Lab Compositions - Clean Resizable Layout
 *
 * Simple resizable split pane with snap functionality.
 * - Drag the divider to resize
 * - Click buttons to snap to presets
 * - Quote functionality between chat and notepad
 */

import React from 'react'
import { Maximize2, Minimize2, SplitSquareHorizontal } from 'lucide-react'
import { useDialogueStore } from '../stores/dialogueStore'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { BottomBarActions } from '../components/dialogue/components/BottomBarActions'
import { AmbientInsights } from '@/app/dashboard/ambient_insights/AmbientInsights'
import ChatMessagesList from '../components/dialogue/components/ChatMessagesList'
import { useOptimizedAuth } from '../components/notepad/hooks/useOptimizedAuth'
import { useResizablePanes } from '../hooks/useResizablePanes'

// =============================================================================
// PANEL COMPONENTS
// =============================================================================

const ChatPanel = React.memo<{
  onInputPopulate: (text: string) => void
  onQuoteToNotepad: (text: string) => void
}>(({ onInputPopulate, onQuoteToNotepad }) => {
  const { messages, sendMessage, startNewConversation } = useDialogueStore()
  const authData = useOptimizedAuth()

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
          {/* Header with New Conversation Button - fixed at top */}
          <div className="flex justify-center p-2.5 border-b border-border flex-shrink-0">
            <button
              onClick={startNewConversation}
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-transparent hover:border-current pb-1"
            >
              New conversation
            </button>
          </div>

          {/* Messages Area - takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="p-4 sm:p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                  <ChatMessagesList
                    messages={messages}
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
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty state - no header needed */
        <div className="h-full flex flex-col">
          <div className="flex-1 px-6 py-4">
            <AmbientInsights
              userId={authData.user?.uid}
              onInsightClick={(action: string, insight: any) => {
                const fullMessage = `${insight.title}\n\n${insight.description}\n\n${action}`
                sendMessage(fullMessage)
              }}
            />
          </div>
          <div className="px-6 py-3 border-t border-border">
            <BottomBarActions
              onActionClick={handleActionClick}
              onInputPopulate={onInputPopulate}
              isFullScreen={false}
            />
          </div>
        </div>
      )}
    </div>
  )
})

ChatPanel.displayName = 'ChatPanel'

const NotepadPanel = React.memo<{
  noteId?: string
  quotedContent: string
  onClearQuoted: () => void
}>(({ noteId, quotedContent, onClearQuoted }) => {
  const { sessionId } = useDialogueStore()

  return (
    <div className="h-full bg-background">
      <MarkdownNotepad
        isOpen={true}
        onClose={() => {}}
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
        sessionId={sessionId || "session-1"}
        panelState="split"
      />
    </div>
  )
})

NotepadPanel.displayName = 'NotepadPanel'

// =============================================================================
// INPUT SECTION
// =============================================================================

function useInputSection(clearQuotedContent: () => void) {
  const { isLoading, sendMessage } = useDialogueStore()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = React.useState("")
  const [useContextSearch, setUseContextSearch] = React.useState(true)
  const [includeNotepadInMessages, setIncludeNotepadInMessages] = React.useState(false)

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
      useContextSearch={useContextSearch}
      onToggleContextSearch={setUseContextSearch}
      includeNotepadInMessages={includeNotepadInMessages}
      onToggleNotepadInMessages={setIncludeNotepadInMessages}
    />
  ), [
    sendMessage,
    isLoading,
    inputValue,
    setInputValue,
    handleInputPopulate,
    useContextSearch,
    setUseContextSearch,
    includeNotepadInMessages,
    setIncludeNotepadInMessages,
    clearQuotedContent
  ])

  return { inputComponent, handleInputPopulate }
}

// =============================================================================
// MAIN LAYOUT
// =============================================================================

interface LabCompositionProps {
  className?: string
  chatId?: string
  noteId?: string
  askQuery?: string
  contentContext?: any
}

export function FullThinkingLab({
  className,
  chatId,
  noteId,
  askQuery,
  contentContext
}: LabCompositionProps) {
  const { quotedContent, setQuotedContent, clearQuotedContent } = useDialogueStore()
  const { inputComponent, handleInputPopulate } = useInputSection(clearQuotedContent)
  const resizable = useResizablePanes(0.5)
  
  // Determine if we're in full-screen mode
  const isChatFullScreen = resizable.state.splitRatio === 1.0
  const isNotepadFullScreen = resizable.state.splitRatio === 0.0

  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden ${className}`}>
      {/* Control Bar */}
      <div className="flex items-center justify-center gap-4 p-3 border-b border-border bg-background/95 backdrop-blur-sm">
        <button
          onClick={resizable.actions.snapToLeft}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background hover:bg-muted transition-colors text-sm"
          title="Chat Full Screen (100% width)"
        >
          <Maximize2 className="w-4 h-4" />
          Chat
        </button>

        <button
          onClick={resizable.actions.snapToSplit}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background hover:bg-muted transition-colors text-sm"
          title="Split View (50/50)"
        >
          <SplitSquareHorizontal className="w-4 h-4" />
          Split
        </button>

        <button
          onClick={resizable.actions.snapToRight}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background hover:bg-muted transition-colors text-sm"
          title="Notepad Full Screen (100% width)"
        >
          <Maximize2 className="w-4 h-4" />
          Notepad
        </button>
      </div>

      {/* Resizable Split Panes */}
      <div ref={resizable.containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div style={resizable.styles.leftPanelStyle} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              onInputPopulate={handleInputPopulate}
              onQuoteToNotepad={setQuotedContent}
            />
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-border flex-shrink-0">
            {inputComponent}
          </div>
        </div>

        {/* Invisible Draggable Divider - hover to resize */}
        <div
          className="w-2 hover:w-3 cursor-col-resize flex-shrink-0 transition-all duration-200 hover:bg-border/20"
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
          />
        </div>
      </div>
    </div>
  )
}

export default FullThinkingLab
export type { LabCompositionProps }