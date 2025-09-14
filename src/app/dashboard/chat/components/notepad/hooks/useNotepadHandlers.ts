'use client'

import { useCallback, useEffect } from 'react'
import type { Note, NoteUpdate } from '../../../../notes/types/index'
import type { Id } from "@/convex/_generated/dataModel"
import type { NoteHandlers, NotepadState, NotepadRefs } from '../types'
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'

interface UseNotepadHandlersProps {
  state: NotepadState
  refs: NotepadRefs
  setters: {
    setIsNewNote: (isNew: boolean) => void
    setCurrentNoteId: (id: string | Id<"notes"> | null) => void
    setContent: (content: string) => void
  }
  contextData: {
    updateNote: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>
    createNote: (content: string, options?: any) => Promise<string | null>
    generateMetadataManually: (noteId: string, content: string) => Promise<any>
    isGeneratingMetadata: boolean
    shouldShowSmartButton: boolean
    sessionId?: string | null
  }
  note: Note
  existingNote?: Note | null
}

export function useNotepadHandlers({
  state,
  refs,
  setters,
  contextData,
  note,
  existingNote
}: UseNotepadHandlersProps): NoteHandlers {
  const { setIsNewNote, setCurrentNoteId, setContent } = setters
  const { updateNote, createNote, generateMetadataManually, isGeneratingMetadata, shouldShowSmartButton, sessionId } = contextData
  const { isNewNote, currentNoteId, content } = state
  const { lexicalEditorRef, metadataGenerationInProgress } = refs

  // Note update function
  const handleNoteUpdate = useCallback(async (noteId: string | Id<"notes">, updates: NoteUpdate): Promise<Note | null> => {
    if (isNewNote || !existingNote) {
      // For new notes, just update local state - this will be reflected when note is created
      console.log('📝 [MarkdownNotepad] Updating local note state for new note:', updates)
      return note
    }
    
    // For existing notes, use the notes context update mechanism
    // This will trigger the live query to update and reflect in the UI
    console.log('📝 [MarkdownNotepad] Updating existing note via context:', noteId, updates)
    try {
      const updatedNote = await updateNote(noteId, updates)
      return updatedNote
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to update note:', error)
      return null
    }
  }, [isNewNote, existingNote, note, updateNote])

  // Create or save note function
  const handleSaveAsNote = useCallback(async (): Promise<string | null> => {
    if (!content.trim()) return null
    
    if (isNewNote) {
      // Create new note with conversation link
      const newNoteId = await createNote(content.trim(), {
        redirect: false,
        customTitle: note.title !== 'Untitled Note' ? note.title : undefined,
        customType: note.type,
        sourceConversationId: sessionId || undefined
      })
      
      if (newNoteId) {
        setIsNewNote(false)
        setCurrentNoteId(newNoteId)
        console.log('✅ [MarkdownNotepad] New note created:', newNoteId)
        return newNoteId
      }
    } else {
      // Update existing note
      console.log('✅ [MarkdownNotepad] Note saved')
      return currentNoteId
    }
    return null
  }, [content, isNewNote, createNote, note, sessionId, setIsNewNote, setCurrentNoteId, currentNoteId])

  const handleGenerateMetadata = useCallback(async () => {
    if (!shouldShowSmartButton || isGeneratingMetadata || metadataGenerationInProgress.current) return
    
    metadataGenerationInProgress.current = true
    
    try {
      let noteIdToUse = currentNoteId
      
      // If it's a new note, save it first to get a real note ID
      if (isNewNote) {
        console.log('📝 [MarkdownNotepad] Saving new note before metadata generation')
        noteIdToUse = await handleSaveAsNote()
        if (!noteIdToUse) {
          console.error('❌ [MarkdownNotepad] Failed to save note before metadata generation')
          return
        }
      } else if (!noteIdToUse) {
        // If it's supposed to be an existing note but no ID, save it
        console.log('📝 [MarkdownNotepad] No note ID found, saving note first')
        noteIdToUse = await handleSaveAsNote()
        if (!noteIdToUse) {
          console.error('❌ [MarkdownNotepad] Failed to save note before metadata generation')
          return
        }
      }
      
      // Now generate metadata with the confirmed note ID
      console.log('🤖 [MarkdownNotepad] Generating metadata for note:', noteIdToUse)
      const result = await generateMetadataManually(String(noteIdToUse), content.trim())
      
      if (result && result.success) {
        // Check if a new note was created (different noteId returned)
        if (result.noteId && result.noteId !== String(noteIdToUse)) {
          console.log('✅ [MarkdownNotepad] New note created during metadata generation:', result.noteId)
          // Update to point to the new note
          setCurrentNoteId(result.noteId)
          setIsNewNote(false)
        }
        console.log('✅ [MarkdownNotepad] Metadata generation completed successfully')
      } else {
        console.error('❌ [MarkdownNotepad] Metadata generation failed:', result)
      }
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Exception during metadata generation:', error)
    } finally {
      // Always reset the flag
      metadataGenerationInProgress.current = false
    }
  }, [shouldShowSmartButton, isGeneratingMetadata, handleSaveAsNote, currentNoteId, isNewNote, generateMetadataManually, content, setCurrentNoteId, setIsNewNote, metadataGenerationInProgress])

  // Handle note switching
  const handleSwitchToNote = useCallback((noteId: string) => {
    setCurrentNoteId(noteId)
    setIsNewNote(false)
  }, [setCurrentNoteId, setIsNewNote])

  // Handle new note creation
  const handleCreateNewNote = useCallback(() => {
    setCurrentNoteId(null)
    setIsNewNote(true)
    setContent('')
    lexicalEditorRef.current?.clear()
  }, [setCurrentNoteId, setIsNewNote, setContent, lexicalEditorRef])

  // Content state changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [setContent])

  // Handle command palette trigger
  const handleTriggerCommandPalette = useCallback(() => {
    lexicalEditorRef.current?.triggerCommandPalette()
  }, [lexicalEditorRef])

  return {
    handleNoteUpdate,
    handleSaveAsNote,
    handleGenerateMetadata,
    handleCreateNewNote,
    handleSwitchToNote,
    handleContentChange,
    handleTriggerCommandPalette
  }
}
