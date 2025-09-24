/**
 * Reflection Provider
 * 
 * ✅ CONNECTED: Bridge component that connects useReflectionNotes hook with reflectionStore
 * 
 * This provider handles the coordination between:
 * - Convex data (via useReflectionNotes hook)
 * - UI state (via reflectionStore)  
 * - Auto-save functionality
 * - Error handling and recovery
 */

'use client'

import { useEffect, useCallback } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useReflectionNotes } from '../../hooks/useReflectionNotes'
import {
    useReflectionState,
    useReflectionActions,
    useReflectionHookActions,
    useReflectionNotesData
} from '../../stores/reflectionStore'

interface ReflectionProviderProps {
    children: React.ReactNode
}

export function ReflectionProvider({ children }: ReflectionProviderProps) {
    const { firebaseUser } = useAuth()
    const userId = firebaseUser?.uid

    // Hook for Convex operations
    const {
        notes,
        currentNote,
        isLoadingNotes,
        isLoadingNote,
        isSaving,
        notesError,
        noteError,
        saveError,
        hasMoreNotes,
        notesCursor,
        loadNotes,
        loadNote,
        createNote,
        updateNote,
        deleteNote,
        toggleImportance,
        clearErrors
    } = useReflectionNotes(userId)

    // Store selectors
    const { isOpen, noteId, content, title, isDirty } = useReflectionState()
    const { markAsSaved, setError } = useReflectionActions()
    const { syncNotesFromHook, syncNotesListCursor, syncNotesListError, syncNoteFromHook } = useReflectionHookActions()

    // ✅ SYNC HOOK DATA TO STORE
    useEffect(() => {
        syncNotesFromHook(notes)
    }, [notes, syncNotesFromHook])

    useEffect(() => {
        syncNotesListCursor(notesCursor)
    }, [notesCursor, syncNotesListCursor])

    useEffect(() => {
        syncNotesListError(notesError)
    }, [notesError, syncNotesListError])

    useEffect(() => {
        syncNoteFromHook(currentNote)
    }, [currentNote, syncNoteFromHook])

    // ✅ SYNC ERRORS TO STORE
    useEffect(() => {
        if (saveError) {
            setError(saveError)
        }
    }, [saveError, setError])

    // ✅ AUTO-SAVE FUNCTIONALITY
    useEffect(() => {
        if (!isDirty || !noteId || !userId || !content) return

        const autoSaveTimer = setTimeout(async () => {
            try {
                await updateNote({
                    noteId,
                    content,
                    title
                }, userId)
                markAsSaved()
                clearErrors()
            } catch (error) {
                console.warn('Auto-save failed:', error)
                // Don't show error UI for auto-save failures
            }
        }, 2000) // 2 second debounce

        return () => clearTimeout(autoSaveTimer)
    }, [isDirty, noteId, userId, content, title, updateNote, markAsSaved, clearErrors])

    // ✅ LOAD NOTE WHEN NOTEPAD OPENS
    useEffect(() => {
        if (isOpen && noteId && userId && !currentNote) {
            loadNote(noteId, userId).catch(error => {
                console.error('Failed to load note on open:', error)
                setError('Failed to load note')
            })
        }
    }, [isOpen, noteId, userId, currentNote, loadNote, setError])

    // ✅ INITIAL NOTES LOAD
    useEffect(() => {
        if (userId) {
            loadNotes({
                userId,
                numItems: 20,
                sortOrder: 'desc'
            }).catch(error => {
                console.warn('Failed to load initial notes:', error)
                // Non-critical error, don't show UI error
            })
        }
    }, [userId, loadNotes])

    return <>{children}</>
}

// ✅ EXPORT HOOK ACTIONS FOR COMPONENTS
// These provide a clean interface for components to use

export function useReflectionNotesActions() {
    const { firebaseUser } = useAuth()
    const userId = firebaseUser?.uid

    const {
        loadNotes,
        loadNote,
        createNote,
        updateNote,
        deleteNote,
        toggleImportance,
        clearErrors
    } = useReflectionNotes(userId)

    return {
        loadNotes: useCallback((params: any) => {
            if (!userId) throw new Error('Authentication required')
            return loadNotes({ ...params, userId })
        }, [userId, loadNotes]),

        loadNote: useCallback((noteId: string) => {
            if (!userId) throw new Error('Authentication required')
            return loadNote(noteId, userId)
        }, [userId, loadNote]),

        createNote: useCallback((params: any) => {
            if (!userId) throw new Error('Authentication required')
            return createNote(params, userId)
        }, [userId, createNote]),

        updateNote: useCallback((params: any) => {
            if (!userId) throw new Error('Authentication required')
            return updateNote(params, userId)
        }, [userId, updateNote]),

        deleteNote: useCallback((noteId: string) => {
            if (!userId) throw new Error('Authentication required')
            return deleteNote(noteId, userId)
        }, [userId, deleteNote]),

        toggleImportance: useCallback((noteId: string, currentImportance: boolean) => {
            if (!userId) throw new Error('Authentication required')
            return toggleImportance(noteId, currentImportance, userId)
        }, [userId, toggleImportance]),

        clearErrors
    }
}

// ✅ EXPORT LOADING STATES FOR COMPONENTS
export function useReflectionLoadingStates() {
    const {
        isLoadingNotes,
        isLoadingNote,
        isSaving,
        isDeleting,
        notesError,
        noteError,
        saveError
    } = useReflectionNotes()

    return {
        isLoadingNotes,
        isLoadingNote,
        isSaving,
        isDeleting,
        hasError: !!(notesError || noteError || saveError),
        error: notesError || noteError || saveError
    }
}
