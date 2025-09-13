'use client'

import React from 'react'
import { LexicalNotepadEditor } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import { NotepadHeader } from './NotepadHeader'
import type { Note, NoteUpdate } from '../../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import type { AIHandlers, NoteHandlers } from '../types'
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'

interface MobileNotepadLayoutProps {
  note: Note
  content: string
  currentNoteId: string | Id<"notes"> | null
  availableNotes: Array<{ _id: string; title: string; type: string }>
  noteTagData: Array<{ tags: string[]; updatedAt: number }>
  shouldShowSmartButton: boolean
  isGeneratingMetadata: boolean
  isCreating: boolean
  firebaseUserId?: string
  sidebarRef: React.RefObject<HTMLDivElement>
  lexicalEditorRef: React.RefObject<LexicalNotepadEditorRef>
  
  // Handlers
  noteHandlers: NoteHandlers
  aiHandlers: AIHandlers
  onEditingTitleChange: (editing: boolean) => void
  onLinkNote?: (noteId: string) => void
}

export function MobileNotepadLayout({
  note,
  content,
  currentNoteId,
  availableNotes,
  noteTagData,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  firebaseUserId,
  sidebarRef,
  lexicalEditorRef,
  noteHandlers,
  aiHandlers,
  onEditingTitleChange,
  onLinkNote
}: MobileNotepadLayoutProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <NotepadHeader
        note={note}
        currentNoteId={currentNoteId}
        availableNotes={availableNotes}
        noteTagData={noteTagData}
        shouldShowSmartButton={shouldShowSmartButton}
        isGeneratingMetadata={isGeneratingMetadata}
        isCreating={isCreating}
        isMobile={true}
        onNoteUpdate={noteHandlers.handleNoteUpdate}
        onEditingTitleChange={onEditingTitleChange}
        onCreateNewNote={noteHandlers.handleCreateNewNote}
        onSwitchNote={noteHandlers.handleSwitchToNote}
        onTriggerCommandPalette={noteHandlers.handleTriggerCommandPalette}
        onGenerateMetadata={noteHandlers.handleGenerateMetadata}
        onSaveNote={noteHandlers.handleSaveAsNote}
      />

      {/* Editor Area */}
      <div className="flex-1 overflow-auto relative">
        <LexicalNotepadEditor
          content={content}
          onContentChange={noteHandlers.handleContentChange}
          placeholder="Start writing your note..."
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
        />
      </div>
    </div>
  )
}
