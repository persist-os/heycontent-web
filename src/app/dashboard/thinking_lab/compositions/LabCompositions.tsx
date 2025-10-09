/**
 * Lab Compositions - Clean Resizable Layout
 *
 * Simple resizable split pane with snap functionality.
 * - Drag the divider to resize
 * - Click buttons to snap to presets
 * - Quote functionality between chat and notepad
 */

import React from 'react'
import { Columns2, PanelRight, ChevronLeft } from 'lucide-react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useDialogueStore } from '../stores/dialogueStore'
import { useNotepadStore } from '../stores/notepadStore'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { BottomBarActions } from '../components/dialogue/components/BottomBarActions'
import { AmbientInsights } from '@/app/dashboard/ambient_insights/AmbientInsights'
import { WidgetPrompts } from '../components/WidgetPrompts'
import ChatMessagesList from '../components/dialogue/components/ChatMessagesList'
import { useOptimizedAuth } from '../components/notepad/hooks/useOptimizedAuth'
import { useResizablePanes } from '../hooks/useResizablePanes'
import { ContextIndicator } from '../components/ContextIndicator'
import { useAutoScroll } from '../hooks/useAutoScroll'
import type { Message } from '@/app/types/chat'

// =============================================================================
// PANEL COMPONENTS
// =============================================================================

const ChatPanel = React.memo<{
  onInputPopulate: (text: string) => void
  onQuoteToNotepad: (text: string) => void
  widgetOutputId?: string
  isFullScreen?: boolean
  onRestoreNotepad?: () => void
}>(({ onInputPopulate, onQuoteToNotepad, widgetOutputId, isFullScreen, onRestoreNotepad }) => {
  const { messages, sendMessage, startNewConversation, isLoading, error } = useDialogueStore()
  const authData = useOptimizedAuth()
  
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
          <div className="flex justify-between items-center h-24 border-b border-border/20 flex-shrink-0 px-6">
            <button
              onClick={startNewConversation}
              className="text-sm font-light text-muted-foreground hover:text-foreground transition-colors duration-300 border-b border-transparent hover:border-current pb-1"
            >
              New conversation
            </button>
            
            {/* Restore Notepad Button - only show when in full screen */}
            {isFullScreen && onRestoreNotepad && (
              <button
                onClick={onRestoreNotepad}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors duration-200"
                title="Restore notepad"
              >
                <PanelRight className="w-4 h-4" />
                Restore notepad
              </button>
            )}
          </div>

          {/* Messages Area - takes remaining space */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto scrollbar-hide">
              <div className="p-4 sm:p-6 pl-12 sm:pl-12">
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
                  {/* Scroll anchor */}
                  <div ref={scrollRef} />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : isLoading ? (
        /* Loading state - show while conversation is being loaded */
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      ) : error ? (
        /* Error state - show if conversation failed to load */
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="text-red-500 text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Failed to load conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state - show widget prompts or ambient insights */
        <div className="h-full flex flex-col">
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
  isFullScreen: boolean
  onClose?: () => void
}>(({ noteId, quotedContent, onClearQuoted, isFullScreen, onClose }) => {
  const { sessionId } = useDialogueStore()

  return (
    <div className="h-full bg-background">
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
        sessionId={sessionId || undefined}
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

function useInputSection(clearQuotedContent: () => void) {
  const { isLoading, sendMessage } = useDialogueStore()
  const { includeInMessages, setIncludeInMessages } = useNotepadStore()
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
  const { quotedContent, setQuotedContent, clearQuotedContent, resetForWidget, messages, addMessage } = useDialogueStore()
  const { inputComponent, handleInputPopulate } = useInputSection(clearQuotedContent)
  const resizable = useResizablePanes(0.5)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [openingMessageSent, setOpeningMessageSent] = React.useState(false)

  // Get user ID
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

  // Fetch conversation from Convex when chatId is provided
  const conversationData = useQuery(
    api.chatQueries.getConversation,
    chatId && userId && !widgetOutputId ? {
      userId,
      conversationId: chatId as any // Convex ID type
    } : 'skip'
  )

  // Load conversation messages when data arrives
  React.useEffect(() => {
    if (conversationData && chatId && !widgetOutputId) {
      console.log('[FullThinkingLab] Loading conversation from Convex:', {
        conversationId: chatId,
        messageCount: conversationData.messages?.length || 0
      })

      // IMPORTANT: Set conversationId FIRST so backend knows we're resuming
      useDialogueStore.setState({
        conversationId: chatId,
        sessionId: chatId,
      })

      // Convert Convex messages to Message[] format
      const messages: Message[] = (conversationData.messages || []).map((msg: any, index: number) => ({
        id: `msg-${index}`,
        content: msg.content,
        role: msg.role as 'user' | 'assistant' | 'system',
        timestamp: msg.timestamp ? new Date(msg.timestamp).getTime().toString() : Date.now().toString(),
        chat_response: msg.content,
        status: 'delivered' as const,
        suggestions: [],
        metadata: {}
      }))

      // Then load messages
      useDialogueStore.setState({
        messages,
        isLoading: false,
        error: undefined
      })

      console.log('[FullThinkingLab] Conversation resumed - conversationId set for backend:', chatId)
    }
  }, [conversationData, chatId, widgetOutputId])

  // Fetch widget output data to get opening message
  const widgetOutputData = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    widgetOutputId && userId ? {
      userId,
      filters: { outputId: widgetOutputId },
      limit: 1
    } : 'skip'
  )

  // Reset dialogue store and opening message flag when widget changes
  React.useEffect(() => {
    if (widgetOutputId) {
      console.log('[FullThinkingLab] New widgetOutputId detected, resetting dialogue store:', widgetOutputId)
      resetForWidget()
      setOpeningMessageSent(false)
    }
  }, [widgetOutputId, resetForWidget])

  // Auto-send opening message when widget output loads
  React.useEffect(() => {
    if (!widgetOutputId || !widgetOutputData || openingMessageSent) return

    const output = Array.isArray(widgetOutputData) ? widgetOutputData[0] : widgetOutputData
    
    if (output?.openingMessage && messages.length === 0) {
      console.log('[FullThinkingLab] Auto-sending opening message from widget output')
      
      const aiMessage = {
        id: `msg-${Date.now()}`,
        content: output.openingMessage,
        role: 'assistant' as const,
        timestamp: Date.now().toString(),
        chat_response: output.openingMessage,
        status: 'delivered' as const,
        suggestions: output.prompts?.map((p: any) => p.text) || [],
        metadata: {}
      }
      
      addMessage(aiMessage)
      setOpeningMessageSent(true)
    }
  }, [widgetOutputId, widgetOutputData, openingMessageSent, messages.length, addMessage])

  // Auto-snap to full screen when dragged close to edges
  React.useEffect(() => {
    if (!resizable.state.isDragging) {
      const { splitRatio } = resizable.state
      if (splitRatio > 0.95) {
        resizable.actions.snapToLeft()
      } else if (splitRatio < 0.05) {
        resizable.actions.snapToRight()
      }
    }
  }, [resizable.state.isDragging, resizable.state.splitRatio, resizable.actions])

  // Check if we're in full screen mode
  const isChatFullScreen = resizable.state.splitRatio === 1.0
  const isNotepadFullScreen = resizable.state.splitRatio === 0.0
  const isFullScreen = isChatFullScreen || isNotepadFullScreen

  // Handle notepad collapse - snap to full chat screen (like dragging all the way right)
  const handleNotepadClose = React.useCallback(() => {
    resizable.actions.snapToLeft() // This will make chat full screen
  }, [resizable.actions])

  // Handle notepad expand - restore to split view
  const handleNotepadExpand = React.useCallback(() => {
    resizable.actions.snapToSplit() // This will restore to 50/50 split
  }, [resizable.actions])

  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden ${className} relative`}>
      {/* Context Indicator - shows when in project/widget container */}
      <ContextIndicator />
      
      {/* Floating Restore Notepad Button - appears when chat is full screen */}
      {isChatFullScreen && (
        <button
          onClick={handleNotepadExpand}
          className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 p-2 bg-background border border-border/50 rounded-full shadow-lg hover:shadow-xl hover:bg-muted/30 transition-all duration-200 group"
          title="Restore notepad"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
      
      {/* Resizable Split Panes */}
      <div ref={resizable.containerRef} className="flex flex-1 overflow-hidden">
        {/* Chat Panel */}
        <div style={resizable.styles.leftPanelStyle} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatPanel 
              onInputPopulate={handleInputPopulate}
              onQuoteToNotepad={setQuotedContent}
              widgetOutputId={widgetOutputId}
              isFullScreen={isChatFullScreen}
              onRestoreNotepad={handleNotepadExpand}
            />
          </div>
          
          {/* Chat Input */}
          <div className="border-t border-border flex-shrink-0">
            {inputComponent}
          </div>
        </div>

        {/* Invisible Draggable Divider - hover to resize */}
        <div
          className="w-2 cursor-col-resize flex-shrink-0 hover:bg-border/20 transition-colors duration-200"
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
