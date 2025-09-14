'use client'

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { MobileNotepadLayout } from './components/MobileNotepadLayout'
import { DesktopNotepadLayout } from './components/DesktopNotepadLayout'
import { useNotepadState } from './hooks/useNotepadState'
import { useNotepadHandlers } from './hooks/useNotepadHandlers'
import { useNotepadAI } from './hooks/useNotepadAI'
import type { MarkdownNotepadProps, MarkdownNotepadRef } from './types'
import type { Id } from "@/convex/_generated/dataModel"
import { ShareNoteModal } from '../../../notes/components/ShareNoteModal'

export const MarkdownNotepad = forwardRef<MarkdownNotepadRef, MarkdownNotepadProps>(function MarkdownNotepad({ 
  isOpen, 
  onClose, 
  quotedContent, 
  onClearQuoted, 
  width, 
  style,
  availableNotes = [],
  onLinkNote,
  isMobile = false,
  activeTab = 'notes',
  onScrollPositionChange,
  noteId,
  fromChat = false,
  canNavigateBack = false,
  onBack,
  sessionId
}, ref) {
  const { firebaseUser } = useAuth()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // Use our custom hooks for state and logic
  const { state, refs, setters, contextData, note, notePermission, isReadOnly } = useNotepadState({
    noteId,
    quotedContent,
    isOpen,
    onClearQuoted,
    sessionId
  })

  const noteHandlers = useNotepadHandlers({
    state,
    refs,
    setters,
    contextData,
    note,
    existingNote: contextData.existingNote
  })

  const aiHandlers = useNotepadAI({
    content: state.content,
    userId: firebaseUser?.uid ?? '',
    setContent: setters.setContent,
    setRefinementPreview: setters.setRefinementPreview,
    setIsRefining: setters.setIsRefining
  })

  // Share handler
  const handleShare = () => {
    if (note && !note.isTemporary) {
      setShowShareModal(true)
    }
  }

  // Listen for note reference clicks
  useEffect(() => {
    const handleNoteRefClick = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.noteId) {
        noteHandlers.handleSwitchToNote(customEvent.detail.noteId)
      }
    }

    const sidebarElement = refs.sidebarRef.current
    if (sidebarElement) {
      sidebarElement.addEventListener('noteRefClick', handleNoteRefClick)
      return () => {
        sidebarElement.removeEventListener('noteRefClick', handleNoteRefClick)
      }
    }
  }, [noteHandlers.handleSwitchToNote, refs.sidebarRef])

  // Expose enhanced note functionality to parent
  useImperativeHandle(ref, () => ({
    hasUnsavedContent: () => refs.lexicalEditorRef.current?.hasContent() || false,
    clearContent: () => {
      noteHandlers.handleCreateNewNote()
    },
    getContent: () => refs.lexicalEditorRef.current?.getContent() || '',
    saveNote: () => noteHandlers.handleSaveAsNote(),
    getCurrentNote: () => note,
    isNewNote: () => state.isNewNote,
    setNoteForEditing: (noteId: string | Id<"notes">) => {
      noteHandlers.handleSwitchToNote(String(noteId))
    },
    createNewNote: () => {
      noteHandlers.handleCreateNewNote()
    }
  }), [note, state.isNewNote, noteHandlers, refs.lexicalEditorRef]);

  // Don't render on mobile if not the active tab
  if (isMobile && activeTab !== 'notes') {
    return null;
  }

  // Render appropriate layout based on device type
  if (isMobile) {
    return (
      <>
        <MobileNotepadLayout
          note={note}
          content={state.content}
          currentNoteId={state.currentNoteId}
          availableNotes={availableNotes}
          noteTagData={contextData.noteTagData}
          shouldShowSmartButton={contextData.shouldShowSmartButton}
          isGeneratingMetadata={contextData.isGeneratingMetadata}
          isCreating={contextData.isCreating}
          firebaseUserId={firebaseUser?.uid}
          sidebarRef={refs.sidebarRef}
          lexicalEditorRef={refs.lexicalEditorRef}
          noteHandlers={noteHandlers}
          aiHandlers={aiHandlers}
          onEditingTitleChange={setIsEditingTitle}
          onLinkNote={onLinkNote}
          onShare={handleShare}
          isReadOnly={isReadOnly}
          notePermission={notePermission}
        />
        
        {/* Share Modal */}
        {note && !note.isTemporary && (
          <ShareNoteModal
            noteId={note._id as Id<'notes'>}
            noteTitle={note.title || 'Untitled Note'}
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <DesktopNotepadLayout
        note={note}
        content={state.content}
        currentNoteId={state.currentNoteId}
        availableNotes={availableNotes}
        noteTagData={contextData.noteTagData}
        shouldShowSmartButton={contextData.shouldShowSmartButton}
        isGeneratingMetadata={contextData.isGeneratingMetadata}
        isCreating={contextData.isCreating}
        firebaseUserId={firebaseUser?.uid}
        width={width}
        style={style}
        sidebarRef={refs.sidebarRef}
        lexicalEditorRef={refs.lexicalEditorRef}
        noteHandlers={noteHandlers}
        aiHandlers={aiHandlers}
        onEditingTitleChange={setIsEditingTitle}
        onLinkNote={onLinkNote}
        onShare={handleShare}
        isReadOnly={isReadOnly}
        notePermission={notePermission}
      />
      
      {/* Share Modal */}
      {note && !note.isTemporary && (
        <ShareNoteModal
          noteId={note._id as Id<'notes'>}
          noteTitle={note.title || 'Untitled Note'}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  )
});