'use client'

import React, { useState, useCallback } from 'react'
import { LexicalNotepadEditor } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import { NotepadHeader } from './NotepadHeader'
import type { Note, NoteUpdate } from '../../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import type { AIHandlers, NoteHandlers } from '../types'
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import type { PanelState } from '../hooks/useSplitScreenLayout'

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
  
  // Handlers
  noteHandlers: NoteHandlers
  aiHandlers: AIHandlers
  onEditingTitleChange: (editing: boolean) => void
  onLinkNote?: (noteId: string) => void
  onShare?: () => void
  onClose?: () => void
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
  noteHandlers,
  aiHandlers,
  onEditingTitleChange,
  onLinkNote,
  onShare,
  onClose,
  isReadOnly = false,
  notePermission = null,
  panelState
}: DesktopNotepadLayoutProps) {
  
  return (
    <div 
      ref={sidebarRef}
      className="h-full bg-[hsl(var(--notepad-bg))] flex flex-col"
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
        onClose={onClose}
        isReadOnly={isReadOnly}
        notePermission={notePermission}
        panelState={panelState}
      />

      {/* Editor Area */}
      <div className="flex-1 overflow-auto relative scrollbar-hide">
        {/* Calculate padding to match header - desktop uses px-6 base, pl-20 pr-6 for full-screen */}
        <div className={`h-full ${panelState === 'notepad-full' ? 'pl-20 pr-6' : 'px-6'}`}>
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
        </div>
      </div>
    </div>
  )
}
