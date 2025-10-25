/**
 * Lab Compositions - Clean Resizable Layout
 *
 * Simple resizable split pane with snap functionality.
 * - Drag the divider to resize
 * - Click buttons to snap to presets
 * - Quote functionality between chat and notepad
 */

import React from 'react'
import { Columns2, PanelRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
  messages: Message[]
  onInputPopulate: (text: string) => void
  onQuoteToNotepad: (text: string) => void
  widgetOutputId?: string
  isFullScreen?: boolean
  onRestoreNotepad?: () => void
  onCloseChat?: () => void
}>(({ messages, onInputPopulate, onQuoteToNotepad, widgetOutputId, isFullScreen, onRestoreNotepad, onCloseChat }) => {
  const { sendMessageStream, startNewConversation, isLoading, error } = useDialogueStore()
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
    sendMessageStream(action)
  }, [sendMessageStream])


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
                  <ChatMessagesList
                    messages={messages}
                    referencedMessage={null}
                    handleMessageReference={() => {}}
                    handleReferenceClick={() => {}}
                    handleOptionClick={sendMessageStream}
                    handleFollowUpClick={sendMessageStream}
                    userId={authData.user?.uid}
                    handleSuggestionClick={handleSuggestionClick}
                    handleSendMessage={sendMessageStream}
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
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8 rounded-2xl bg-card/60 backdrop-blur-lg border border-border/50 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground">Loading conversation...</p>
          </div>
        </div>
      ) : error ? (
        /* Error state - show if conversation failed to load */
        <div className="h-full flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md px-6 p-8 rounded-2xl bg-card/60 backdrop-blur-lg border border-destructive/30 shadow-xl">
            <div className="text-destructive text-4xl">⚠️</div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Failed to load conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-lg transition-all duration-200"
              >
                Try Again
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
                  sendMessageStream(fullMessage)
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

function useInputSection(clearQuotedContent: () => void) {
  const { isLoading, sendMessageStream } = useDialogueStore()
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
      handleActionClick={sendMessageStream}
      handleSendMessage={sendMessageStream}
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
    sendMessageStream,
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
  // All basic state hooks first to maintain consistent hook order
  const [userId, setUserId] = React.useState<string | null>(null)
  
  // Store hooks
  const { quotedContent, setQuotedContent, clearQuotedContent, startNewConversation } = useDialogueStore()
  // Custom hooks
  const { inputComponent, handleInputPopulate } = useInputSection(clearQuotedContent)
  
  // When noteId is provided, default to notepad-full view (0.0 = full notepad)
  // UNLESS widgetOutputId is also provided (AI conversation), then use split view (0.65)
  // When chatId or widgetOutputId is provided, default to split view (0.65)
  // When nothing is provided, default to balanced view (0.65)
  const initialRatio = widgetOutputId ? 0.65 : (noteId ? 0.0 : 0.65)
  const resizable = useResizablePanes(initialRatio)
  
  // Ref to resizable actions to avoid hook order issues
  const resizableActionsRef = React.useRef(resizable.actions)
  React.useEffect(() => {
    resizableActionsRef.current = resizable.actions
  }, [resizable.actions])
  
  // Force split view when coming from widget (ignore localStorage)
  React.useEffect(() => {
    if (widgetOutputId) {
      resizable.actions.setSplitRatio(0.65)
    }
  }, [widgetOutputId, resizable.actions])
  
  // Close chat function - only closes the chat panel, does NOT clear messages
  const closeChat = React.useCallback(() => {
    // Simply snap to full notepad view (close chat panel)
    resizableActionsRef.current.snapToRight()
  }, [])

  // Set the preferred ratio for restore actions (always 0.65 for split view)
  React.useEffect(() => {
    resizable.actions.setPreferredRatio(0.65)
  }, [resizable.actions])

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

  // Simple: Get conversationId from store
  const conversationId = useDialogueStore(state => state.conversationId)
  const isLoading = useDialogueStore(state => state.isLoading)
  const pendingUserMessage = useDialogueStore(state => state.pendingUserMessage)
  const streamingContent = useDialogueStore(state => state.streamingContent)

  // Simple: Subscribe to conversation (chatId from URL or conversationId from store)
  const activeConvId = chatId || conversationId
  const conversationData = useQuery(
    api.chatQueries.getConversation,
    userId && activeConvId && !widgetOutputId ? {
      userId,
      conversationId: activeConvId as any
    } : 'skip'
  )

  // Watch for Convex messages to arrive after streaming completes
  const streamingComplete = useDialogueStore(state => state.streamingComplete)
  const prevMessageCount = React.useRef(conversationData?.messages?.length || 0)
  
  React.useEffect(() => {
    const currentMessageCount = conversationData?.messages?.length || 0
    
    // If streaming is complete and message count increased, clear optimistic state
    if (streamingComplete && currentMessageCount > prevMessageCount.current) {
      useDialogueStore.setState({
        isLoading: false,
        pendingUserMessage: undefined,
        streamingContent: "",
        streamingComplete: false
      })
    }
    
    prevMessageCount.current = currentMessageCount
  }, [conversationData?.messages?.length, streamingComplete])
  
  // Simple: When conversation data arrives initially, update conversationId
  React.useEffect(() => {
    if (conversationData?._id && !conversationId) {
      useDialogueStore.setState({
        conversationId: conversationData._id
      })
    }
  }, [conversationData?._id, conversationId])

  // Simple: Build message list
  const messages: Message[] = (() => {
    const list: Message[] = []
    
    // Add Convex messages with their persisted suggestions
    conversationData?.messages?.forEach((msg: any, i: number) => {
      list.push({
        id: `msg-${i}`,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp?.toString() || Date.now().toString(),
        chat_response: msg.content,
        status: 'delivered',
        suggestions: msg.suggestions || [],
        metadata: {}
      })
    })
    
    // Add optimistic user message (before Convex write completes)
    if (pendingUserMessage) {
      list.push({
        id: 'pending-user',
        content: pendingUserMessage,
        role: 'user',
        timestamp: Date.now().toString(),
        chat_response: pendingUserMessage,
        status: 'delivered',
        suggestions: [],
        metadata: {}
      })
    }
    
    // Add typing indicator with streaming content
    if (isLoading) {
      list.push({
        id: 'typing',
        content: streamingContent || '', // Show streaming content as it arrives
        role: 'assistant',
        timestamp: Date.now().toString(),
        chat_response: streamingContent || '',
        status: 'typing',
        searchStatus: 'Understanding what you\'re thinking about',
        statusHistory: [
          'Understanding what you\'re thinking about',
          'Query needs context - proceeding with vector search',
          'Looking through all your content',
          'Quality filtering'
        ],
        suggestions: [],
        metadata: {}
      })
    }
    
    return list
  })()

  // Auto-snap to full screen when dragged close to edges (only after drag ends)
  React.useEffect(() => {
    if (!resizable.state.isDragging && !resizable.state.isSnapping) {
      const { splitRatio } = resizable.state
      if (splitRatio > 0.95) {
        resizable.actions.snapToLeft()
      } else if (splitRatio < 0.05) {
        resizable.actions.snapToRight()
      }
    }
  }, [resizable.state.isDragging, resizable.state.isSnapping, resizable.state.splitRatio, resizable.actions])

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
          className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 p-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-xl hover:shadow-2xl hover:bg-muted/40 hover:border-border transition-all duration-200 group"
          title="Restore notepad"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
      
      {/* Floating Expand Chat Button - appears when notepad is full screen */}
      {isNotepadFullScreen && (
        <button
          onClick={handleNotepadExpand}
          className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50 p-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-xl hover:shadow-2xl hover:bg-muted/40 hover:border-border transition-all duration-200 group"
          title="Expand chat"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
      
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
