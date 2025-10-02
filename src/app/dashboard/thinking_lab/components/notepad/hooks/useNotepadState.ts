'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useNotes } from '@/app/context/notes-context'
import { useCreateNote } from '@/app/dashboard/notes/hooks/useCreateNote'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useNotepadStore } from '../../../stores/notepadStore'
import type { Note, NoteUpdate } from '../../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import type { NotepadState, NotepadRefs } from '../types'

interface UseNotepadStateProps {
  noteId?: string | Id<"notes">
  quotedContent?: string
  isOpen?: boolean
  onClearQuoted?: () => void
  sessionId?: string | null
}

export function useNotepadState({
  noteId,
  quotedContent,
  isOpen,
  onClearQuoted,
  sessionId
}: UseNotepadStateProps) {
  const { firebaseUser } = useAuth()
  const { notes, generateMetadataManually, isGeneratingMetadata, updateNote } = useNotes()
  const { createNote, isCreating } = useCreateNote()

  // State management - SIMPLIFIED to remove cascading re-renders
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [content, setContent] = useState('')
  const [refinementPreview, setRefinementPreview] = useState<string | null>(null)
  const [isRefining, setIsRefining] = useState(false)
  
  // Debug logging only when we have a noteId and it might be invalid
  if (process.env.NODE_ENV === 'development' && noteId) {
    const isLikelyPersonaId = noteId.length > 20 && noteId.startsWith('jh7b')
    if (isLikelyPersonaId) {
      console.warn('[useNotepadState] Warning: Received persona ID instead of note ID:', {
        noteId: noteId.substring(0, 20) + '...',
        isPersonaId: true
      })
    } else {
      console.debug('[useNotepadState] Opening note:', noteId.substring(0, 15) + '...')
    }
  }

  // Internal state for note management (controlled by handlers, not props)
  const [isNewNote, setIsNewNote] = useState(!noteId)
  const [currentNoteId, setCurrentNoteId] = useState<string | Id<"notes"> | null>(noteId || null)

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null)
  const lexicalEditorRef = useRef<LexicalNotepadEditorRef>(null)
  const metadataGenerationInProgress = useRef(false)

  // Fetch existing note if editing (with proper shared note support and permissions)
  const noteWithPermissions = useQuery(
    api.noteQueries.getNoteWithPermissions, 
    currentNoteId && !isNewNote
      ? {
          noteId: currentNoteId as string, 
          userId: firebaseUser?.uid || ''
        }
      : "skip"
  )

  // Extract note and permission info
  const existingNote = noteWithPermissions?.note || null
  const notePermission = noteWithPermissions?.permission || null
  const isReadOnly = noteWithPermissions?.isReadOnly || false
  

  // Create a note object for components that expect it
  const note: Note = useMemo(() => {
    if (existingNote && !isNewNote) {
      // For existing notes, use the live data from Convex
      return {
        ...existingNote,
        content: content || existingNote.content, // Use local content if editing
        isTemporary: false
      } as Note
    } else {
      // For new notes, use local state
      return {
        _id: currentNoteId || 'temp',
        _creationTime: Date.now(),
        userId: firebaseUser?.uid || '',
        title: 'Untitled Note',
        content: content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        type: 'idea_bank' as const,
        isTemporary: isNewNote
      }
    }
  }, [existingNote, isNewNote, content, currentNoteId, firebaseUser?.uid])

  // Initialize content from existing note only when note actually loads
  useEffect(() => {
    if (existingNote && existingNote.content !== undefined) {
      setContent(existingNote.content)
    }
    // REMOVED: Premature content clearing that caused erratic behavior
    // Only set content when we actually have note data, never clear preemptively
  }, [existingNote?._id]) // Simplified dependencies - only re-run when note ID changes

  // Sync note title to notepad store for cross-component access
  useEffect(() => {
    const title = note.title || 'Untitled Note'
    useNotepadStore.getState().updateTitle(title)
    useNotepadStore.getState().setCurrentNoteId(currentNoteId as string)
  }, [note.title, currentNoteId])

  // Handle quoted content insertion
  useEffect(() => {
    if (quotedContent && isOpen) {
      // Remove only leading/trailing quotes while preserving all markdown formatting (bold, italics, etc.) and newlines
      let cleanedContent = quotedContent.replace(/^['"]|['"]$/g, '').trim()
      // Remove leading '>' and whitespace from each line
      cleanedContent = cleanedContent
        .split('\n')
        .map(line => line.replace(/^\s*>\s?/, ''))
        .join('\n')
      const quotedText = `${cleanedContent}\n\n`
      setContent(prev => prev + quotedText)
      onClearQuoted?.()
    }
  }, [quotedContent, isOpen, onClearQuoted])

  // Tag data for suggestions
  const noteTagData = useMemo(() => 
    notes
      .filter(n => String(n._id) !== String(note._id))
      .map(n => ({
        tags: n.tags || [],
        updatedAt: n.updatedAt || n._creationTime || 0
      }))
  , [notes, note._id])

  // Smart metadata generation - always show the button
  const shouldShowSmartButton = useMemo(() => {
    return !isGeneratingMetadata
  }, [isGeneratingMetadata])

  const state: NotepadState = {
    isEditingTitle,
    isNewNote,
    currentNoteId,
    content,
    refinementPreview,
    isRefining
  }

  const refs: NotepadRefs = {
    sidebarRef,
    lexicalEditorRef,
    metadataGenerationInProgress
  }

  // FIXED: Memoize setters to prevent handlers recreation
  const setters = useMemo(() => ({
    setIsEditingTitle,
    setIsNewNote,
    setCurrentNoteId,
    setContent,
    setRefinementPreview,
    setIsRefining
  }), [setIsEditingTitle, setIsNewNote, setCurrentNoteId, setContent, setRefinementPreview, setIsRefining])

  // FIXED: Memoize contextData to prevent handlers recreation
  const contextData = useMemo(() => ({
    firebaseUser,
    notes,
    generateMetadataManually,
    isGeneratingMetadata,
    updateNote,
    createNote,
    isCreating,
    existingNote,
    noteTagData,
    shouldShowSmartButton,
    sessionId,
    notePermission,
    isReadOnly
  }), [firebaseUser, notes, generateMetadataManually, isGeneratingMetadata, updateNote, createNote, isCreating, existingNote, noteTagData, shouldShowSmartButton, sessionId, notePermission, isReadOnly])

  return {
    state,
    refs,
    setters,
    contextData,
    note,
    notePermission,
    isReadOnly
  }
}
