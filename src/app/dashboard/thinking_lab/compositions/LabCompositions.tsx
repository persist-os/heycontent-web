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
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { MarkdownNotepad } from '../components/notepad/MarkdownNotepad'
import { useResizablePanes } from '../hooks/useResizablePanes'
import { ContextIndicator } from '../components/ContextIndicator'
import { ChatPanel } from '../components/dialogue/ChatPanel'
import { FloatingActionButtons } from '../components/dialogue/FloatingActionButtons'
import ChatInputArea from '../components/dialogue/input/ChatInputArea'
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
import { usePanelModeSelection } from '@/hooks/usePanelModeSelection'
import { PanelModeSwitcher } from '@/components/ui/PanelModeSwitcher'
import type { Id } from '@/convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'

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
  conversationId?: string
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
  conversationId: initialConversationId,
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
  const searchParams = useSearchParams()
  
  // Mobile detection
  const isMobile = useIsMobile()
  
  // Mobile tab state
  const [mobileTab, setMobileTab] = useState<'chat' | 'panel'>('chat')
  
  // Collaboration state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  
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
  
  // Check if project has widgets to determine default panel mode
  const hasWidgets = useQuery(
    api.projectWidgetsQueries.hasWidgets,
    projectId && userId ? {
      projectId: projectId as Id<'projects'>,
      userId,
    } : 'skip'
  )
  
  // Panel mode selection (URL state hook)
  // Default to widgets if project has widgets, otherwise notepad
  // Only use widgets default if we have a definitive answer (hasWidgets === true)
  // If query is still loading (undefined) or false, default to notepad
  const { panelMode, setPanelMode } = usePanelModeSelection(
    hasWidgets === true ? 'widgets' : 'notepad'
  )
  
  // Determine current view for presence
  const currentView = panelMode === 'notepad' ? 'notepad' 
    : panelMode === 'artifacts' ? 'artifacts'
    : panelMode === 'widgets' ? 'widgets'
    : 'chat'
  
  // Use the conversation state hook with notepad context getter (for functions only)
  const {
    conversationId,
    optimisticMessages,
    currentStatus,
    error,
    suggestions,
    quotedContent,
    inputValue,
    isOrchestratorRunning,
    sendMessage,
    startNewConversation,
    setError,
    setStatus,
    handleInputPopulate,
    handleQuoteToNotepad,
    clearQuotedContent,
    setInputValue
  } = useConversationState(userId, projectId, widgetId, widgetOutputId, notepadContext.getNotepadContent, initialConversationId)

  // Use new Convex query for state (replaces messages from useConversationState)
  const conversationData = useQuery(
    api.chatQueries.getConversationWithState,
    conversationId && userId ? { userId, conversationId: conversationId as Id<"conversations"> } : "skip"
  )

  // Extract messages and thinkingState from query result
  const messages = conversationData?.messages || []
  const thinkingState = conversationData?.thinkingState

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Input ref
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  
  // Thread navigation handlers
  const handleThreadSelect = React.useCallback((threadId: string) => {
    const params = new URLSearchParams()
    params.set('conversationId', threadId)
    if (projectId) params.set('projectId', projectId)
    router.push(`/dashboard/thinking_lab?${params.toString()}`)
  }, [router, projectId])
  
  // Wrapper that clears both state and URL - used by ChatPanel "New conversation" button
  const handleStartNewConversation = React.useCallback(() => {
    // Clear conversation state first
    startNewConversation()
    // Then clear URL parameter (preserve projectId, widgetId, widgetOutputId if present)
    const params = new URLSearchParams()
    if (projectId) params.set('projectId', projectId)
    if (widgetId) params.set('widgetId', widgetId)
    if (widgetOutputId) params.set('widgetOutputId', widgetOutputId)
    // Remove conversationId from URL - this ensures old conversation doesn't reload
    const newUrl = params.toString() ? `/dashboard/thinking_lab?${params.toString()}` : '/dashboard/thinking_lab'
    router.push(newUrl)
  }, [router, startNewConversation, projectId, widgetId, widgetOutputId])

  const handleNewThread = React.useCallback(() => {
    // Clear conversation state first
    startNewConversation()
    // Then clear URL parameter
    router.push('/dashboard/thinking_lab')
  }, [router, startNewConversation])

  // Merge optimistic messages with Convex messages
  // Note: Optimistic updates are handled client-side for immediate feedback
  // Future: Consider moving to Convex for true single source of truth
  const messageList = React.useMemo(() => {
    const list = [...messages]
    
    // Add optimistic user messages
    optimisticMessages.forEach(optMsg => {
      if (optMsg.role === 'user' && !list.some(msg => msg.content === optMsg.content && msg.role === 'user')) {
        list.push({
          id: optMsg.id,
          content: optMsg.content,
          role: optMsg.role,
          timestamp: optMsg.timestamp.toString(),
          chat_response: optMsg.content,
          status: 'sent',
        } as any)
      }
    })
    
    // Sort by timestamp
    return list.sort((a, b) => {
      const timeA = typeof a.timestamp === 'string' ? parseInt(a.timestamp) : a.timestamp
      const timeB = typeof b.timestamp === 'string' ? parseInt(b.timestamp) : b.timestamp
      return timeA - timeB
    })
  }, [messages, optimisticMessages])

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
      isLoading={false}
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
      activeThreadId={conversationId}
      onThreadSelect={handleThreadSelect}
      isMobile={isMobile}
      activeTab="chat"
      messages={messageList}
    />
  ), [sendMessage, isOrchestratorRunning, inputValue, handleInputPopulate, quotedContent, clearQuotedContent, notepadContext.includeInMessages, notepadContext.setIncludeInMessages, userId, conversationId, handleThreadSelect, isMobile, messageList])

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className={`h-screen flex flex-col bg-background overflow-hidden relative ${className || ''}`}>
        {/* Glowing background orbs */}
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/[0.15] to-accent/[0.10] dark:from-primary/[0.08] dark:to-accent/[0.05] rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-accent/[0.12] to-primary/[0.08] dark:from-accent/[0.06] dark:to-primary/[0.04] rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}} />
        
        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Chat Panel Skeleton */}
          <div className="flex-1 flex flex-col border-r border-border/40">
            {/* Header skeleton */}
            <div className="h-16 flex items-center justify-end px-4 border-b border-border/40">
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            
            {/* Messages area skeleton */}
            <div className="flex-1 overflow-hidden p-4">
              <div className="max-w-[744px] mx-auto space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Input area skeleton */}
            <div className="border-t border-border/40 p-4">
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </div>
          
          {/* Notepad Panel Skeleton */}
          <div className="w-[40%] flex flex-col border-l border-border/40">
            {/* Header skeleton */}
            <div className="h-16 flex items-center gap-2 px-4 border-b border-border/40">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
            
            {/* Content skeleton */}
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-1/2 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
            </div>
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
              startNewConversation={handleStartNewConversation}
              isLoading={false}
              error={error}
              inputComponent={inputComponent}
            />
          ) : (
            <PanelMobileView
              rightPanelMode={panelMode}
              setRightPanelMode={setPanelMode}
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
                conversationData={conversationData}
                onInputPopulate={handleInputPopulate}
                onQuoteToNotepad={handleQuoteToNotepad}
                widgetOutputId={widgetOutputId}
                isFullScreen={isChatFullScreen}
                onRestoreNotepad={handleNotepadExpand}
                onCloseChat={closeChat}
                suggestions={suggestions}
                sendMessage={sendMessage}
                startNewConversation={handleStartNewConversation}
                isLoading={false}
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
            {/* Panel Mode Switcher - Only visible when panel is expanded */}
            {resizable.state.splitRatio === 1 ? null : (
              <div className="border-b border-border/20 p-2 bg-card/50 backdrop-blur-sm flex-shrink-0 flex justify-end">
                <PanelModeSwitcher
                  mode={panelMode}
                  onModeChange={setPanelMode}
                />
              </div>
            )}
            
            {/* Conditional Panel Rendering - Don't render content when panel is collapsed */}
            {resizable.state.splitRatio === 1 ? null : (
              <div className="flex-1 overflow-hidden">
                {panelMode === 'notepad' ? (
                  <NotepadPanel
                    noteId={noteId}
                    quotedContent={quotedContent}
                    onClearQuoted={clearQuotedContent}
                    onClose={handleNotepadClose}
                  />
                ) : panelMode === 'artifacts' ? (
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
            )}
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