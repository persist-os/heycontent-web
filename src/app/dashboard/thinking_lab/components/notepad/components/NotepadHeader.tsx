'use client'

import React from 'react'
import { NoteMeta } from '../../../../notes/components/NoteMeta'
import { NoteSelector } from './NoteSelector'
import { SimpleTypeSelector } from './SimpleTypeSelector'
import { ActionButtons } from './ActionButtons'
import type { Note, NoteUpdate } from '../../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import type { PanelState } from '../hooks/useSplitScreenLayout'

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
  panelState?: PanelState
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
  notePermission = null,
  panelState
}: NotepadHeaderProps) {
  // Calculate responsive padding with anti-corporate asymmetric spacing
  const isFullScreen = panelState === 'notepad-full'
  
  // More thoughtful padding that creates breathing room
  const basePaddingX = isMobile ? "px-4" : "px-6 lg:px-8"
  const fullScreenPaddingX = isMobile ? "px-4" : "pl-20 pr-6 lg:pl-24 lg:pr-8"
  const paddingX = isFullScreen ? fullScreenPaddingX : basePaddingX
  const paddingY = isMobile ? "py-4" : "py-6 lg:py-7"
  const containerPadding = `${paddingX} ${paddingY}`
  
  // Progressive spacing that scales elegantly
  const metaSpacing = isMobile ? "mb-4" : "mb-5 lg:mb-6"
  const controlsMarginTop = isMobile ? "mt-3" : "mt-4 lg:mt-5"

  return (
    <div className={`${containerPadding} border-b border-border/30 bg-background/95`}>
      {/* Note Metadata Section */}
      <div className={metaSpacing}>
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
      </div>
      
      {/* Controls Section - Responsive layout that prevents overlap */}
      <div className={controlsMarginTop}>
        {/* Mobile: Stack controls vertically for clarity */}
        <div className="sm:hidden space-y-3">
          {/* Top row: Type and Note selectors with generous spacing */}
          <div className="flex items-center gap-2">
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

          {/* Bottom row: Action buttons centered with breathing room */}
          <div className="flex justify-center pt-1">
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

        {/* Tablet and up: Asymmetric horizontal layout with calculated space */}
        <div className="hidden sm:block">
          <div className="flex items-center">
            {/* Left side: Selectors with controlled width - max width to prevent overlap */}
            <div className="flex items-center gap-3 min-w-0 flex-shrink max-w-[60%] sm:max-w-[70%] lg:max-w-[75%]">
              <SimpleTypeSelector
                noteId={note._id}
                currentType={note.type || 'idea_bank'}
                onTypeChange={(type) => onNoteUpdate(note._id, { type })}
                isMobile={false}
                isReadOnly={isReadOnly}
              />
              
              <NoteSelector
                currentNoteId={currentNoteId}
                availableNotes={availableNotes}
                onCreateNew={onCreateNewNote}
                onSwitchNote={onSwitchNote}
                isMobile={false}
              />
            </div>

            {/* Flexible spacer with minimum gap to prevent overlap */}
            <div className="flex-1 min-w-4 sm:min-w-6 lg:min-w-8" />

            {/* Right side: Action buttons with fixed positioning */}
            <div className="flex-shrink-0">
              <ActionButtons
                onTriggerCommandPalette={onTriggerCommandPalette}
                onGenerateMetadata={onGenerateMetadata}
                onSaveNote={onSaveNote}
                onShare={onShare}
                shouldShowSmartButton={shouldShowSmartButton}
                isGeneratingMetadata={isGeneratingMetadata}
                isCreating={isCreating}
                isMobile={false}
                isReadOnly={isReadOnly}
                notePermission={notePermission}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
