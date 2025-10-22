'use client'

import React from 'react'
import { X } from 'lucide-react'
import { NoteMeta } from '../../../../notes/components/NoteMeta'
import { NoteSelector } from './NoteSelector'
import { SimpleTypeSelector } from './SimpleTypeSelector'
import { ActionButtons } from './ActionButtons'
import type { Note, NoteUpdate } from '../../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import type { PanelState } from '../hooks/useSplitScreenLayout'
import { useTranslation } from '@/hooks/useTranslation'

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
  onClose?: () => void
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
  onClose,
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
  
  // Translations
  const { text: collapseTooltip } = useTranslation('Collapse notepad', {
    context: 'notepad.actions.collapse'
  })

  return (
    <div className={`${containerPadding} border-b border-[hsl(var(--notepad-border))] bg-[hsl(var(--notepad-header-bg))] relative`}>
      {/* Collapse Button - Top Right, absolutely positioned to never interfere */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[hsl(var(--notepad-icon))] hover:text-[hsl(var(--notepad-icon-hover))] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors duration-200 z-20"
          title={collapseTooltip}
        >
          <X className="w-4 h-4" />
        </button>
      )}
      
      {/* Content with padding to avoid close button - pr-12 ensures no overlap */}
      <div className={onClose ? "pr-12" : ""}>
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

        {/* Action Buttons Bar - After title/time, before selectors */}
        <div className="flex justify-start mb-3">
          <div className="bg-background/80 backdrop-blur-sm border border-border/30 rounded-full px-3 py-1.5 shadow-sm">
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
        
        {/* Controls Section - Selectors only */}
        <div className={controlsMarginTop}>
          {/* Mobile: Stack selectors with more space */}
          <div className="sm:hidden">
            <div className="flex items-center gap-3">
              <div className="w-24 shrink-0">
                <SimpleTypeSelector
                  noteId={note._id}
                  currentType={note.type || 'idea_bank'}
                  onTypeChange={(type) => onNoteUpdate(note._id, { type })}
                  isMobile={isMobile}
                  isReadOnly={isReadOnly}
                />
              </div>
              
              <div className="w-36 shrink-0">
                <NoteSelector
                  currentNoteId={currentNoteId}
                  availableNotes={availableNotes}
                  onCreateNew={onCreateNewNote}
                  onSwitchNote={onSwitchNote}
                  isMobile={isMobile}
                />
              </div>
            </div>
          </div>

          {/* Desktop: Selectors in a row with better spacing */}
          <div className="hidden sm:block">
            <div className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <SimpleTypeSelector
                  noteId={note._id}
                  currentType={note.type || 'idea_bank'}
                  onTypeChange={(type) => onNoteUpdate(note._id, { type })}
                  isMobile={false}
                  isReadOnly={isReadOnly}
                />
              </div>
              
              <div className="w-48 shrink-0">
                <NoteSelector
                  currentNoteId={currentNoteId}
                  availableNotes={availableNotes}
                  onCreateNew={onCreateNewNote}
                  onSwitchNote={onSwitchNote}
                  isMobile={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
