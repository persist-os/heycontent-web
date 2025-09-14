'use client'

import { useCallback, useEffect, useRef } from 'react'
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

  // Auto-save refs to prevent race conditions and memory leaks
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedContentRef = useRef<string>('')
  
  // DEFENSIVE: Prevent recursive note switching
  const isSwitchingRef = useRef(false)
  const lastSwitchTimeRef = useRef(0)

  // Debounced auto-save function for existing notes (optimized with defensive guards)
  const autoSaveContent = useCallback(async (contentToSave: string) => {
    // DEFENSIVE: Don't auto-save during note switching
    if (isSwitchingRef.current) {
      console.log('📝 [MarkdownNotepad] Skipped auto-save during note switch')
      return
    }
    
    // Early returns for invalid save conditions
    if (isNewNote || !existingNote || !currentNoteId || isSavingRef.current) {
      return
    }

    const trimmedContent = contentToSave.trim()
    
    // Don't save if content hasn't actually changed or is empty
    if (!trimmedContent || trimmedContent === lastSavedContentRef.current.trim()) {
      return
    }

    isSavingRef.current = true
    console.log('💾 [MarkdownNotepad] Auto-saving content...', { noteId: currentNoteId })
    
    try {
      const updatedNote = await updateNote(currentNoteId, { content: trimmedContent })
      if (updatedNote) {
        lastSavedContentRef.current = trimmedContent
        console.log('✅ [MarkdownNotepad] Auto-save successful')
      } else {
        console.warn('⚠️ [MarkdownNotepad] Auto-save returned null - note may have been deleted')
      }
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Auto-save error:', error)
      // Note: Don't retry automatically to avoid infinite loops
    } finally {
      isSavingRef.current = false
    }
  }, [isNewNote, existingNote, currentNoteId, updateNote])

  // Initialize lastSavedContentRef when existingNote content changes
  useEffect(() => {
    if (existingNote && existingNote.content !== undefined) {
      lastSavedContentRef.current = existingNote.content
    }
  }, [existingNote?.content])

  // Cleanup auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
      }
    }
  }, [])

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

  // Create or save note function with auto-save coordination
  const handleSaveAsNote = useCallback(async (): Promise<string | null> => {
    if (!content.trim()) return null
    
    // Cancel any pending auto-save to prevent race conditions
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
      console.log('📝 [MarkdownNotepad] Cancelled pending auto-save for manual save')
    }
    
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
        lastSavedContentRef.current = content.trim() // Update last saved content
        console.log('✅ [MarkdownNotepad] New note created:', newNoteId)
        return newNoteId
      }
    } else {
      // Update existing note - FIXED: Actually save the content
      if (currentNoteId) {
        console.log('📝 [MarkdownNotepad] Manual save: Saving existing note content:', currentNoteId)
        const updatedNote = await handleNoteUpdate(currentNoteId, { content: content.trim() })
        if (updatedNote) {
          lastSavedContentRef.current = content.trim() // Update last saved content
          console.log('✅ [MarkdownNotepad] Manual save: Note content saved successfully')
          return String(currentNoteId)
        } else {
          console.error('❌ [MarkdownNotepad] Manual save: Failed to save note content')
          return null
        }
      }
    }
    return null
  }, [content, isNewNote, createNote, note, sessionId, setIsNewNote, setCurrentNoteId, currentNoteId, handleNoteUpdate])

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
      } else {
        // For existing notes, check if metadata has already been generated
        if (existingNote) {
          // PROTECTION: Don't overwrite existing titles or regenerate if already done
          if (existingNote.titleGenerated && existingNote.typeGenerated) {
            console.log('🚫 [MarkdownNotepad] Metadata already generated for this note, skipping')
            return
          }
          
          // PROTECTION: Don't overwrite user-created titles (unless it's still "Untitled Note")
          if (existingNote.title && 
              existingNote.title.trim() !== '' && 
              existingNote.title !== 'Untitled Note' && 
              !existingNote.titleGenerated) {
            console.log('🚫 [MarkdownNotepad] Note has custom title, skipping title generation')
          }
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
  }, [shouldShowSmartButton, isGeneratingMetadata, handleSaveAsNote, currentNoteId, isNewNote, generateMetadataManually, content, setCurrentNoteId, setIsNewNote, metadataGenerationInProgress, existingNote])

  // Handle note switching with proper cleanup and defensive guards
  const handleSwitchToNote = useCallback((noteId: string) => {
    const now = Date.now()
    
    // DEFENSIVE: Prevent rapid successive switches and infinite loops
    if (isSwitchingRef.current) {
      console.log('⚠️ [MarkdownNotepad] Blocked recursive note switch to:', noteId)
      return
    }
    
    // DEFENSIVE: Prevent switches within 100ms (debounce)
    if (now - lastSwitchTimeRef.current < 100) {
      console.log('⚠️ [MarkdownNotepad] Blocked rapid switch to:', noteId)
      return
    }
    
    // DEFENSIVE: Don't switch to same note
    if (String(noteId) === String(currentNoteId)) {
      console.log('⚠️ [MarkdownNotepad] Blocked switch to same note:', noteId)
      return
    }
    
    isSwitchingRef.current = true
    lastSwitchTimeRef.current = now
    
    try {
      // Cancel any pending auto-save to prevent saving to wrong note
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
        autoSaveTimeoutRef.current = null
        console.log('📝 [MarkdownNotepad] Cancelled auto-save during note switch')
      }
      
      // Reset saving state
      isSavingRef.current = false
      
      // Switch to the new note
      setCurrentNoteId(noteId)
      setIsNewNote(false)
      
      console.log('🔄 [MarkdownNotepad] Switched to note:', noteId)
    } finally {
      // Always reset the switching flag
      setTimeout(() => {
        isSwitchingRef.current = false
      }, 50)
    }
  }, [setCurrentNoteId, setIsNewNote, currentNoteId])

  // Handle new note creation with proper cleanup
  const handleCreateNewNote = useCallback(() => {
    // Cancel any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
      console.log('📝 [MarkdownNotepad] Cancelled auto-save for new note creation')
    }
    
    // Reset saving state and refs
    isSavingRef.current = false
    lastSavedContentRef.current = ''
    
    // Create new note state
    setCurrentNoteId(null)
    setIsNewNote(true)
    setContent('')
    lexicalEditorRef.current?.clear()
    
    console.log('✨ [MarkdownNotepad] Created new note')
  }, [setCurrentNoteId, setIsNewNote, setContent, lexicalEditorRef])

  // Content state changes with debounced auto-save (defensive)
  const handleContentChange = useCallback((newContent: string) => {
    // DEFENSIVE: Don't process content changes during note switching
    if (isSwitchingRef.current) {
      console.log('📝 [MarkdownNotepad] Skipped content change during note switch')
      return
    }
    
    setContent(newContent)
    
    // Clear existing auto-save timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
      autoSaveTimeoutRef.current = null
    }
    
    // DEFENSIVE: Only schedule auto-save for existing notes with actual changes
    if (!isNewNote && newContent.trim() !== lastSavedContentRef.current.trim()) {
      // Set new debounced auto-save timeout (500ms delay)
      autoSaveTimeoutRef.current = setTimeout(() => {
        autoSaveContent(newContent)
        autoSaveTimeoutRef.current = null
      }, 500)
    }
  }, [setContent, autoSaveContent, isNewNote])

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
