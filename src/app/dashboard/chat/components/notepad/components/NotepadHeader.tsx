'use client'

import React from 'react'
import { NoteMeta } from '../../../../notes/components/NoteMeta'
import { NoteSelector } from './NoteSelector'
import { SimpleTypeSelector } from './SimpleTypeSelector'
import { ActionButtons } from './ActionButtons'
import type { Note, NoteUpdate } from '../../../../notes/types/index'
import type { Id } from "@/convex/_generated/dataModel"

interface NotepadHeaderProps {
  note: Note
  currentNoteId: string | Id<"notes"> | null
  availableNotes: Array<{ _id: string; title: string; type: string }>
  noteTagData: Array<{ tags: string[]; updatedAt: number }>
  shouldShowSmartButton: boolean
  isGeneratingMetadata: boolean
  isCreating: boolean
  isMobile?: boolean
  
  // Handlers
  onNoteUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>
  onEditingTitleChange: (editing: boolean) => void
  onCreateNewNote: () => void
  onSwitchNote: (noteId: string) => void
  onTriggerCommandPalette: () => void
  onGenerateMetadata: () => void
  onSaveNote: () => void
  onShare?: () => void
  isReadOnly?: boolean
  notePermission?: "owner" | "read" | "edit" | null
}

export function NotepadHeader({
  note,
  currentNoteId,
  availableNotes,
  noteTagData,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  isMobile = false,
  onNoteUpdate,
  onEditingTitleChange,
  onCreateNewNote,
  onSwitchNote,
  onTriggerCommandPalette,
  onGenerateMetadata,
  onSaveNote,
  onShare,
  isReadOnly = false,
  notePermission = null
}: NotepadHeaderProps) {
  const containerPadding = isMobile ? "px-4 py-4" : "px-6 py-5"
  const spacing = isMobile ? "space-y-4" : "space-y-5"
  const controlsSpacing = isMobile ? "space-y-3 pt-2" : "space-y-4 pt-3"

  return (
    <div className={`${containerPadding} border-b border-border/30 bg-background/95`}>
      <div className={spacing}>
        {/* Note Metadata */}
        <NoteMeta
          note={note}
          onUpdate={onNoteUpdate}
          onTitleChange={() => {}}
          onTagsChange={(tags) => onNoteUpdate(note._id, { tags })}
          onEditingTitleChange={onEditingTitleChange}
          noteTagData={noteTagData}
          isReadOnly={isReadOnly}
          notePermission={notePermission}
        />
        
        {/* Controls Section - Single row with all controls */}
        <div className={controlsSpacing}>
          <div className="flex items-center justify-between">
            {/* Left side: Type and Note selectors */}
            <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-3'}`}>
              <SimpleTypeSelector
                noteId={note._id}
                currentType={note.type || 'idea_bank'}
                onTypeChange={(type) => onNoteUpdate(note._id, { type })}
                isMobile={isMobile}
                isReadOnly={isReadOnly}
              />
              
              <NoteSelector
                currentNoteId={currentNoteId}
                availableNotes={availableNotes}
                onCreateNew={onCreateNewNote}
                onSwitchNote={onSwitchNote}
                isMobile={isMobile}
              />
            </div>

            {/* Right side: Action buttons */}
            <ActionButtons
              onTriggerCommandPalette={onTriggerCommandPalette}
              onGenerateMetadata={onGenerateMetadata}
              onSaveNote={onSaveNote}
              onShare={onShare}
              shouldShowSmartButton={shouldShowSmartButton}
              isGeneratingMetadata={isGeneratingMetadata}
              isCreating={isCreating}
              isMobile={isMobile}
              isReadOnly={isReadOnly}
              notePermission={notePermission}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
