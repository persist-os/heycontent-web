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
import { useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import { useResizablePanes } from '../hooks/useResizablePanes'
import { ContextIndicator } from '../components/ContextIndicator'
import { ChatPanel } from '../components/dialogue/ChatPanel'
import { FloatingActionButtons } from '../components/dialogue/FloatingActionButtons'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
import { useMessageList } from '../hooks/useMessageList'
import { useConversationState } from '../hooks/useConversationState'
import { useOptimizedAuth } from '../components/notepad/hooks/useOptimizedAuth'
import { NotepadProvider, useNotepadContext } from '../contexts/NotepadContext'
import { ArtifactPanel } from '../components/ArtifactPanel'
import { WidgetPanel } from '../components/WidgetPanel'
import { useIsMobile } from '../layouts/ResponsiveLayout'
import { MobileBottomNav } from '@/components/ui/MobileBottomNav'
import { ChatMobileView } from '../components/mobile/ChatMobileView'
import { PanelMobileView } from '../components/mobile/PanelMobileView'
import { ProjectCollaboratorsModal } from '@/components/projects/ProjectCollaboratorsModal'
import type { Id } from '@/convex/_generated/dataModel'

// =============================================================================
// PANEL COMPONENTS
// =============================================================================

const NotepadPanel = React.memo<{
  noteId?: string
  quotedContent: string
  onClearQuoted: () => void
  onClose?: () => void
}>(({ noteId, quotedContent, onClearQuoted, onClose }) => {
  const notepadContext = useNotepadContext()
  const notepadRef = React.useRef<any>(null)

  // Set the notepad ref in the context when component mounts
  React.useEffect(() => {
    if (notepadRef.current) {
      notepadContext.setNotepadRef(notepadRef.current)
    }
  }, [notepadContext])

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
  const router = useRouter()
  
  // Mobile detection
  const isMobile = useIsMobile()
  
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'chat' | 'panel'>('chat')
  
  // Collaboration state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  
  // Right panel mode (notepad, artifacts, or widgets)
  // Initialize from localStorage or default to 'notepad'
  const [rightPanelMode, setRightPanelMode] = useState<'notepad' | 'artifacts' | 'widgets'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('thinking-lab-right-panel-mode')
      if (saved === 'notepad' || saved === 'artifacts' || saved === 'widgets') {
        return saved
      }
    }
    return 'notepad'
  })
  
  // Persist rightPanelMode to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('thinking-lab-right-panel-mode', rightPanelMode)
    }
  }, [rightPanelMode])
  
  // Use the notepad context
  const notepadContext = useNotepadContext()
  
  // Get user permission for project (if projectId exists)
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    projectId && userId ? {
      userId,
      contentType: 'project',
      contentId: projectId,
    } : 'skip'
  )
  
  // Get project name for modal
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? {
      projectId: projectId as Id<'projects'>,
      userId,
    } : 'skip'
  )
  
  // Determine current view for presence
  const currentView = rightPanelMode === 'notepad' ? 'notepad' 
    : rightPanelMode === 'artifacts' ? 'artifacts'
    : rightPanelMode === 'widgets' ? 'widgets'
    : 'chat'
  
  // Use the conversation state hook with notepad context getter
  const {
    conversationId,
    isStreaming,
    streamingContent,
    optimisticMessages,
    currentStreamingId,
    currentStatus,
    error,
    messages,
    suggestions,
    quotedContent,
    inputValue,
    isOrchestratorRunning,
    sendMessage,
    startNewConversation,
    clearStreamingContent,
    setError,
    setStatus,
    handleInputPopulate,
    handleQuoteToNotepad,
    clearQuotedContent,
    setInputValue
  } = useConversationState(userId, projectId, widgetId, widgetOutputId, notepadContext.getNotepadContent, chatId)

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Input ref
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  
  // Thread navigation handlers
  const handleThreadSelect = React.useCallback((threadId: string) => {
    const params = new URLSearchParams()
    params.set('chatId', threadId)
    if (projectId) params.set('projectId', projectId)
    router.push(`/dashboard/thinking_lab?${params.toString()}`)
  }, [router, projectId])
  
  const handleNewThread = React.useCallback(() => {
    router.push('/dashboard/thinking_lab')
  }, [router])

  // Use existing useMessageList hook with clean props
  const messageList = useMessageList({
    convexMessages: messages,
    optimisticMessages,
    streamingContent,
    currentStreamingId,
    isStreaming
  })

  // Resizable panes - ensure notepad is visible by default (60% chat, 40% notepad)
  const resizable = useResizablePanes(0.6)

  // Check if we're in full screen mode
  const isChatFullScreen = resizable.state.splitRatio === 1.0
  const isNotepadFullScreen = resizable.state.splitRatio === 0.0
  const isFullScreen = isChatFullScreen || isNotepadFullScreen

  // Simplified handlers
  const handleNotepadClose = React.useCallback(() => resizable.actions.snapToLeft(), [resizable.actions])
  const handleNotepadExpand = React.useCallback(() => resizable.actions.snapToSplit(), [resizable.actions])
  const closeChat = React.useCallback(() => resizable.actions.snapToRight(), [resizable.actions])

  // Input component
  const inputComponent = React.useMemo(() => (
    <ChatInputArea
      showAmbient={false}
      handleActionClick={sendMessage}
      handleSendMessage={sendMessage}
      inputRef={inputRef}
      isLoading={isStreaming}
      isOrchestratorRunning={isOrchestratorRunning}
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
      includeNotepadInMessages={notepadContext.includeInMessages}
      onToggleNotepadInMessages={notepadContext.setIncludeInMessages}
      userId={userId}
      activeThreadId={chatId}
      onThreadSelect={handleThreadSelect}
      isMobile={isMobile}
      activeTab="chat"
    />
  ), [sendMessage, isStreaming, isOrchestratorRunning, inputValue, handleInputPopulate, quotedContent, clearQuotedContent, notepadContext.includeInMessages, notepadContext.setIncludeInMessages, userId, chatId, handleThreadSelect, isMobile])

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

  // Render mobile layout
  if (isMobile) {
    return (
      <div className={`h-screen flex flex-col bg-background overflow-hidden ${className || ''}`}>
        {/* Context Indicator */}
        <ContextIndicator />

        {/* Content Area - Simple conditional rendering */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'chat' ? (
            <ChatMobileView
              messageList={messageList}
              onInputPopulate={handleInputPopulate}
              onQuoteToNotepad={handleQuoteToNotepad}
              widgetOutputId={widgetOutputId}
              suggestions={suggestions}
              sendMessage={sendMessage}
              startNewConversation={startNewConversation}
              isLoading={isStreaming}
              error={error}
              inputComponent={inputComponent}
            />
          ) : (
            <PanelMobileView
              rightPanelMode={rightPanelMode}
              setRightPanelMode={setRightPanelMode}
              noteId={noteId}
              quotedContent={quotedContent}
              onClearQuoted={clearQuotedContent}
              projectId={projectId}
              conversationId={conversationId}
              userId={userId}
            />
          )}
        </div>

        {/* Bottom Navigation - Fixed at bottom */}
        <MobileBottomNav activeTab={mobileTab} onTabChange={setMobileTab} />
      </div>
    )
  }

  // Desktop layout (existing resizable panes)
  return (
    <div className={`h-screen flex flex-col bg-background overflow-hidden ${className || ''}`}>
      {/* Context Indicator with Collaboration Features */}
      <ContextIndicator
        projectId={projectId}
        userId={userId}
        userPermission={userPermission as 'owner' | 'editor' | 'read' | null}
        currentView={currentView}
        conversationId={conversationId}
        onShareClick={() => setShowCollaboratorsModal(true)}
      />
      
      {/* Collaborators Modal */}
      {projectId && project && (
        <ProjectCollaboratorsModal
          projectId={projectId as Id<'projects'>}
          projectName={project.name || 'Untitled Project'}
          isOpen={showCollaboratorsModal}
          onClose={() => setShowCollaboratorsModal(false)}
        />
      )}

      {/* Floating Action Buttons - Desktop only */}
      {!isMobile && (
        <FloatingActionButtons
          isChatFullScreen={isChatFullScreen}
          isNotepadFullScreen={isNotepadFullScreen}
          onRestoreNotepad={handleNotepadExpand}
        />
      )}

      {/* Main Layout: Resizable Panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Resizable Split Panes - Chat + Notepad */}
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
                isLoading={isStreaming}
                error={error}
              />
            </div>
            
            {/* Chat Input */}
            <div className="border-t border-primary/20 backdrop-blur-sm bg-card/30 flex-shrink-0 shadow-inner shadow-primary/5">
              {inputComponent}
            </div>
          </div>

          {/* Right Panel (Notepad or Artifacts) */}
          <div style={resizable.styles.rightPanelStyle} className="flex flex-col h-full overflow-hidden">
            {/* Panel Mode Toggle - Always Visible */}
            <div className="border-b border-border/20 p-2 flex gap-2 bg-card/50 backdrop-blur-sm flex-shrink-0 min-w-[200px]">
              <button
                onClick={() => setRightPanelMode('notepad')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  rightPanelMode === 'notepad'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                Notepad
              </button>
              <button
                onClick={() => setRightPanelMode('artifacts')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  rightPanelMode === 'artifacts'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                Artifacts
              </button>
              <button
                onClick={() => setRightPanelMode('widgets')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  rightPanelMode === 'widgets'
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-accent text-muted-foreground'
                }`}
              >
                Widgets
              </button>
            </div>
            
            {/* Conditional Panel Rendering - Hide content when panel is collapsed */}
            <div className={`flex-1 overflow-hidden ${resizable.state.splitRatio === 1 ? 'hidden' : ''}`}>
              {rightPanelMode === 'notepad' ? (
                <NotepadPanel
                  noteId={noteId}
                  quotedContent={quotedContent}
                  onClearQuoted={clearQuotedContent}
                  onClose={handleNotepadClose}
                />
              ) : rightPanelMode === 'artifacts' ? (
                <ArtifactPanel
                  projectId={projectId}
                  conversationId={conversationId}
                  userId={userId}
                />
              ) : userId ? (
                <WidgetPanel
                  projectId={projectId}
                  conversationId={conversationId}
                  userId={userId}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-6">
                  <div className="text-center text-muted-foreground">
                    <p className="text-sm">Loading...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main export - wrapped with NotepadProvider
export function FullThinkingLab(props: LabCompositionProps) {
  return (
    <NotepadProvider>
      <FullThinkingLabInternal {...props} />
    </NotepadProvider>
  )
}