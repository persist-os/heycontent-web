'use client'

import React, { useState, useCallback } from 'react'
import { LexicalNotepadEditor } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import { UnifiedCollaborativeEditor } from '@/components/ui/lexical-editor/UnifiedCollaborativeEditor'
import { NotepadHeader } from './NotepadHeader'
import type { Note, NoteUpdate } from '../../../../notes/types/index'
import type { Id } from "@/convex/_generated/dataModel"
import type { AIHandlers, NoteHandlers } from '../types'
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import type { UnifiedCollaborativeEditorRef } from '@/components/ui/lexical-editor/UnifiedCollaborativeEditor'
import type { PanelState } from '../../../hooks/useSplitScreenLayout'

interface DesktopNotepadLayoutProps {
  note: Note
  content: string
  currentNoteId: string | Id<"notes"> | null
  availableNotes: Array<{ _id: string; title: string; type: string }>
  noteTagData: Array<{ tags: string[]; updatedAt: number }>
  shouldShowSmartButton: boolean
  isGeneratingMetadata: boolean
  isCreating: boolean
  firebaseUserId?: string
  width: string
  style: React.CSSProperties
  sidebarRef: React.RefObject<HTMLDivElement>
  lexicalEditorRef: React.RefObject<LexicalNotepadEditorRef>
  collaborativeEditorRef: React.RefObject<UnifiedCollaborativeEditorRef>
  
  // Handlers
  noteHandlers: NoteHandlers
  aiHandlers: AIHandlers
  onEditingTitleChange: (editing: boolean) => void
  onLinkNote?: (noteId: string) => void
  onShare?: () => void
  isReadOnly?: boolean
  notePermission?: "owner" | "read" | "edit" | null
  panelState?: PanelState
}

export function DesktopNotepadLayout({
  note,
  content,
  currentNoteId,
  availableNotes,
  noteTagData,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  firebaseUserId,
  width,
  style,
  sidebarRef,
  lexicalEditorRef,
  collaborativeEditorRef,
  noteHandlers,
  aiHandlers,
  onEditingTitleChange,
  onLinkNote,
  onShare,
  isReadOnly = false,
  notePermission = null,
  panelState
}: DesktopNotepadLayoutProps) {
  // Collaboration state
  const [enableCollaboration, setEnableCollaboration] = useState(true)
  const [enablePresence, setEnablePresence] = useState(true)
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  // Determine if collaboration should be enabled based on note sharing and user authentication
  const shouldEnableCollaboration = !note.isTemporary && (notePermission === 'owner' || notePermission === 'edit') && !!firebaseUserId
  const shouldEnablePresence = !note.isTemporary && !!firebaseUserId
  
  const handleCollaboratorsChange = useCallback((newCollaborators: string[]) => {
    setCollaborators(newCollaborators)
  }, [])
  
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected)
  }, [])
  
  // Wrapper functions to match UnifiedCollaborativeEditor prop signatures
  const handleCollaborativeAskAI = useCallback((text: string, context?: any) => {
    aiHandlers.handleAskAI(text)
  }, [aiHandlers.handleAskAI])
  
  const handleCollaborativeRequestAnalysis = useCallback(() => {
    aiHandlers.handleRequestAnalysis(note.type || 'idea_bank')
  }, [aiHandlers.handleRequestAnalysis, note.type])
  
  const handleCollaborativeRefineText = useCallback((text: string, refinementType: string) => {
    aiHandlers.handleRefineText(refinementType, text)
  }, [aiHandlers.handleRefineText])
  
  return (
    <div 
      ref={sidebarRef}
      className="h-full bg-background border-l border-border/50 flex flex-col"
      style={{ width, ...style }}
    >
      {/* Header */}
      <NotepadHeader
        note={note}
        currentNoteId={currentNoteId}
        availableNotes={availableNotes}
        noteTagData={noteTagData}
        shouldShowSmartButton={shouldShowSmartButton}
        isGeneratingMetadata={isGeneratingMetadata}
        isCreating={isCreating}
        isMobile={false}
        onNoteUpdate={noteHandlers.handleNoteUpdate}
        onEditingTitleChange={onEditingTitleChange}
        onCreateNewNote={noteHandlers.handleCreateNewNote}
        onSwitchNote={noteHandlers.handleSwitchToNote}
        onTriggerCommandPalette={noteHandlers.handleTriggerCommandPalette}
        onGenerateMetadata={noteHandlers.handleGenerateMetadata}
        onSaveNote={noteHandlers.handleSaveAsNote}
        onShare={onShare}
        isReadOnly={isReadOnly}
        notePermission={notePermission}
        panelState={panelState}
        // Collaboration props
        isConnected={isConnected}
        collaborators={collaborators}
        enableCollaboration={shouldEnableCollaboration && enableCollaboration}
        enablePresence={shouldEnablePresence && enablePresence}
        onToggleCollaboration={setEnableCollaboration}
        onTogglePresence={setEnablePresence}
      />

      {/* Editor Area */}
      <div className="flex-1 overflow-auto relative">
        {/* Calculate padding to match header - desktop uses px-6 base, pl-20 pr-6 for full-screen */}
        <div className={`h-full ${panelState === 'notepad-full' ? 'pl-20 pr-6' : 'px-6'}`}>
          {(shouldEnableCollaboration || shouldEnablePresence) && currentNoteId && firebaseUserId ? (
          <UnifiedCollaborativeEditor
            noteId={currentNoteId as Id<"notes">}
            content={content}
            onContentChange={noteHandlers.handleContentChange}
            placeholder={isReadOnly ? "This note is read-only" : "Start writing your note..."}
            onAskAI={handleCollaborativeAskAI}
            onRequestAnalysis={handleCollaborativeRequestAnalysis}
            onRequestIdeas={aiHandlers.handleRequestIdeas}
            userId={firebaseUserId}
            noteType={note.type || "idea_bank"}
            availableNotes={availableNotes}
            onLinkNote={onLinkNote}
            className="h-full border-0"
            containerRef={sidebarRef}
            ref={collaborativeEditorRef}
            onRefineText={handleCollaborativeRefineText}
            onAcceptRefinement={aiHandlers.handleAcceptRefinement}
            onRejectRefinement={aiHandlers.handleRejectRefinement}
            onRetryRefinement={aiHandlers.handleRetryRefinement}
            disabled={isReadOnly}
            isReadOnly={isReadOnly}
            enableCollaboration={shouldEnableCollaboration && enableCollaboration}
            enablePresence={shouldEnablePresence && enablePresence}
            showCollaboratorPanel={false}
            showFloatingIndicator={true}
            onCollaboratorsChange={handleCollaboratorsChange}
            onConnectionChange={handleConnectionChange}
          />
          ) : (
            <LexicalNotepadEditor
              content={content}
              onContentChange={noteHandlers.handleContentChange}
              placeholder={isReadOnly ? "This note is read-only" : "Start writing your note..."}
              onAskAI={aiHandlers.handleAskAI}
              onRequestAnalysis={aiHandlers.handleRequestAnalysis}
              onRequestIdeas={aiHandlers.handleRequestIdeas}
              userId={firebaseUserId}
              noteType={note.type || "idea_bank"}
              availableNotes={availableNotes}
              onLinkNote={onLinkNote}
              className="h-full border-0"
              containerRef={sidebarRef}
              ref={lexicalEditorRef}
              onRefineText={aiHandlers.handleRefineText}
              onAcceptRefinement={aiHandlers.handleAcceptRefinement}
              onRejectRefinement={aiHandlers.handleRejectRefinement}
              onRetryRefinement={aiHandlers.handleRetryRefinement}
              disabled={isReadOnly}
            />
          )}
        </div>
      </div>
    </div>
  )
}
