'use client'

import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { MobileNotepadLayout } from './components/MobileNotepadLayout'
import { DesktopNotepadLayout } from './components/DesktopNotepadLayout'
import { useNotepadState } from './hooks/useNotepadState'
import { useNotepadHandlers } from './hooks/useNotepadHandlers'
import { useNotepadAI } from './hooks/useNotepadAI'
import type { MarkdownNotepadProps, MarkdownNotepadRef } from './types'
import type { Id } from "@/convex/_generated/dataModel"
import { ShareNoteModal } from '../../../notes/components/ShareNoteModal'
import { FeedbackDialog } from './components/FeedbackDialog'

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
  sessionId,
  panelState
}, ref) {
  const { firebaseUser } = useAuth()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showRatingButton, setShowRatingButton] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [lastGenerationTimestamp, setLastGenerationTimestamp] = useState<number | null>(null)

  // Fetch user notes for the note selector
  const userNotesQuery = useQuery(
    api.noteQueries.getUserNotes, 
    firebaseUser?.uid ? {
      userId: firebaseUser.uid,
      numItems: 20,
      sortField: '_creationTime',
      sortOrder: 'desc',
      includeShared: true
    } : "skip"
  )

  // Transform notes for the selector (only include essential fields)
  const fetchedAvailableNotes = React.useMemo(() => {
    if (!userNotesQuery?.page) return []
    
    return userNotesQuery.page.map(note => ({
      _id: note._id,
      title: note.title || 'Untitled',
      type: note.type || 'idea_bank'
    }))
  }, [userNotesQuery?.page])

  // Use fetched notes if available, fallback to prop
  const finalAvailableNotes = fetchedAvailableNotes.length > 0 ? fetchedAvailableNotes : availableNotes

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

  // Wrap callback in useCallback to maintain stable reference
  const handleGenerationComplete = useCallback(() => {
    setShowRatingButton(true)
    setLastGenerationTimestamp(Date.now())
  }, [])

  const aiHandlers = useNotepadAI({
    content: state.content,
    userId: firebaseUser?.uid ?? '',
    setContent: setters.setContent,
    setRefinementPreview: setters.setRefinementPreview,
    setIsRefining: setters.setIsRefining,
    onGenerationComplete: handleGenerationComplete
  })

  // Share handler
  const handleShare = () => {
    if (note && !note.isTemporary) {
      setShowShareModal(true)
    }
  }

  // Rating handler - shows rating dialog
  const handleRateLastGeneration = () => {
    setShowFeedbackDialog(true)
  }

  // Handle feedback dialog close
  const handleFeedbackDialogClose = () => {
    setShowFeedbackDialog(false)
    setShowRatingButton(false) // Hide the star button after feedback is submitted/dismissed
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

  // Expose enhanced note functionality to parent - FIXED: Removed state.currentNoteId dependency
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
          availableNotes={finalAvailableNotes}
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
          showRatingButton={showRatingButton}
          onRateLastGeneration={handleRateLastGeneration}
          isReadOnly={isReadOnly}
          notePermission={notePermission}
          panelState={panelState}
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

        {/* Feedback Dialog */}
        <FeedbackDialog
          isOpen={showFeedbackDialog}
          onClose={handleFeedbackDialogClose}
          generationTimestamp={lastGenerationTimestamp}
          noteId={note?.isTemporary ? undefined : (note?._id as string)}
          noteContent={state.content}
        />
      </>
    )
  }

  return (
    <>
      <DesktopNotepadLayout
        note={note}
        content={state.content}
        currentNoteId={state.currentNoteId}
        availableNotes={finalAvailableNotes}
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
        onClose={onClose}
        showRatingButton={showRatingButton}
        onRateLastGeneration={handleRateLastGeneration}
        isReadOnly={isReadOnly}
        notePermission={notePermission}
        panelState={panelState}
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

      {/* Feedback Dialog */}
      <FeedbackDialog
        isOpen={showFeedbackDialog}
        onClose={handleFeedbackDialogClose}
        generationTimestamp={lastGenerationTimestamp}
        noteId={note?.isTemporary ? undefined : (note?._id as string)}
        noteContent={state.content}
      />
    </>
  )
});