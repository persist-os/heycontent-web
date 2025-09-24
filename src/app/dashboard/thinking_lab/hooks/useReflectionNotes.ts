/**
 * Reflection Notes Hook
 * 
 * ✅ CONNECTED: Proper Convex integration following established patterns
 * 
 * This hook handles all Convex operations for reflection notes, following the same
 * pattern as useSmartNotes but specifically for the thinking lab reflection system.
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

import {
    prepareLoadNotesParams,
    prepareLoadNoteParams,
    prepareCreateNoteParams,
    prepareUpdateNoteParams,
    prepareDeleteNoteParams,
    prepareToggleImportanceParams,
    transformConvexNoteToReflection,
    transformConvexNotesResult,
} from '../modules/api/reflectionService'

import type {
    ReflectionNote,
    CreateReflectionNoteParams,
    UpdateReflectionNoteParams,
    LoadReflectionNotesParams,
    LoadReflectionNotesResult
} from '../types/api/reflectionApi'

interface UseReflectionNotesResult {
    // Query states
    notes: ReflectionNote[]
    isLoadingNotes: boolean
    notesError: string | null
    hasMoreNotes: boolean
    notesCursor?: string
    
    // Single note states
    currentNote: ReflectionNote | null
    isLoadingNote: boolean
    noteError: string | null
    
    // Mutation states
    isSaving: boolean
    isDeleting: boolean
    saveError: string | null
    
    // Actions
    loadNotes: (params: LoadReflectionNotesParams) => Promise<LoadReflectionNotesResult>
    loadNote: (noteId: string, userId: string) => Promise<ReflectionNote | null>
    createNote: (params: CreateReflectionNoteParams, userId: string) => Promise<ReflectionNote | null>
    updateNote: (params: UpdateReflectionNoteParams, userId: string) => Promise<ReflectionNote | null>
    deleteNote: (noteId: string, userId: string) => Promise<boolean>
    toggleImportance: (noteId: string, currentImportance: boolean, userId: string) => Promise<boolean>
    
    // Helper actions
    refreshNotes: () => void
    clearErrors: () => void
}

export function useReflectionNotes(userId?: string): UseReflectionNotesResult {
    // Internal state for managing operations
    const [currentNoteId, setCurrentNoteId] = useState<string | undefined>()
    const [notesParams, setNotesParams] = useState<LoadReflectionNotesParams | null>(null)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // ✅ Convex Query Hooks
    const notesFromConvex = useQuery(
        api.noteQueries.getUserNotes,
        notesParams && userId ? prepareLoadNotesParams(notesParams) : "skip"
    )

    const currentNoteFromConvex = useQuery(
        api.noteQueries.getNote,
        currentNoteId && userId ? prepareLoadNoteParams(currentNoteId, userId) : "skip"
    )

    // ✅ Convex Mutation Hooks
    const convexCreateNote = useMutation(api.noteMutations.createNote)
    const convexUpdateNote = useMutation(api.noteMutations.updateNote)
    const convexDeleteNote = useMutation(api.noteMutations.deleteNote)

    // ✅ Transform and derive states
    const notes = notesFromConvex ? transformConvexNotesResult(notesFromConvex).notes : []
    const hasMoreNotes = notesFromConvex ? !notesFromConvex.isDone : false
    const notesCursor = notesFromConvex?.continueCursor || notesFromConvex?.nextCursor

    const currentNote = currentNoteFromConvex ? transformConvexNoteToReflection(currentNoteFromConvex) : null

    // ✅ Loading and error states
    const isLoadingNotes = notesFromConvex === undefined && notesParams !== null
    const isLoadingNote = currentNoteFromConvex === undefined && currentNoteId !== undefined
    
    const notesError = notesFromConvex === null ? 'Failed to load notes' : null
    const noteError = currentNoteFromConvex === null && currentNoteId ? 'Failed to load note' : null

    // ✅ Action implementations
    const loadNotes = useCallback(async (params: LoadReflectionNotesParams): Promise<LoadReflectionNotesResult> => {
        try {
            if (!userId) throw new Error('User authentication required')
            
            setNotesParams(params)
            
            // Wait for the query to complete
            // In practice, the component will reactively get the results via the notes state
            return transformConvexNotesResult(notesFromConvex)
        } catch (error) {
            console.error('Failed to load notes:', error)
            throw new Error('Unable to load your notes. Please try again.')
        }
    }, [userId, notesFromConvex])

    const loadNote = useCallback(async (noteId: string, userIdParam: string): Promise<ReflectionNote | null> => {
        try {
            if (!userIdParam) throw new Error('User authentication required')
            
            setCurrentNoteId(noteId)
            
            // Component will reactively get the result via currentNote state
            return currentNote
        } catch (error) {
            console.error('Failed to load note:', error)
            throw new Error('Unable to load this note. Please try again.')
        }
    }, [currentNote])

    const createNote = useCallback(async (params: CreateReflectionNoteParams, userIdParam: string): Promise<ReflectionNote | null> => {
        try {
            if (!userIdParam) throw new Error('User authentication required')
            
            setIsSaving(true)
            setSaveError(null)
            
            const convexParams = prepareCreateNoteParams(params, userIdParam)
            const result = await convexCreateNote(convexParams)
            
            if (result) {
                return transformConvexNoteToReflection(result)
            }
            
            return null
        } catch (error) {
            console.error('Failed to create note:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unable to save your note. Please try again.'
            setSaveError(errorMessage)
            throw new Error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }, [convexCreateNote])

    const updateNote = useCallback(async (params: UpdateReflectionNoteParams, userIdParam: string): Promise<ReflectionNote | null> => {
        try {
            if (!userIdParam) throw new Error('User authentication required')
            
            setIsSaving(true)
            setSaveError(null)
            
            const convexParams = prepareUpdateNoteParams(params, userIdParam)
            const result = await convexUpdateNote(convexParams)
            
            if (result) {
                return transformConvexNoteToReflection(result)
            }
            
            return null
        } catch (error) {
            console.error('Failed to update note:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unable to save your changes. Please try again.'
            setSaveError(errorMessage)
            throw new Error(errorMessage)
        } finally {
            setIsSaving(false)
        }
    }, [convexUpdateNote])

    const deleteNote = useCallback(async (noteId: string, userIdParam: string): Promise<boolean> => {
        try {
            if (!userIdParam) throw new Error('User authentication required')
            
            setIsDeleting(true)
            
            const convexParams = prepareDeleteNoteParams(noteId, userIdParam)
            await convexDeleteNote(convexParams)
            
            // Clear current note if it was deleted
            if (currentNoteId === noteId) {
                setCurrentNoteId(undefined)
            }
            
            return true
        } catch (error) {
            console.error('Failed to delete note:', error)
            throw new Error('Unable to delete this note. Please try again.')
        } finally {
            setIsDeleting(false)
        }
    }, [convexDeleteNote, currentNoteId])

    const toggleImportance = useCallback(async (noteId: string, currentImportance: boolean, userIdParam: string): Promise<boolean> => {
        try {
            if (!userIdParam) throw new Error('User authentication required')
            
            const convexParams = prepareToggleImportanceParams(noteId, currentImportance, userIdParam)
            await convexUpdateNote(convexParams)
            
            return !currentImportance
        } catch (error) {
            console.error('Failed to toggle note importance:', error)
            throw new Error('Unable to update this note. Please try again.')
        }
    }, [convexUpdateNote])

    // ✅ Helper actions
    const refreshNotes = useCallback(() => {
        if (notesParams) {
            setNotesParams({ ...notesParams })
        }
    }, [notesParams])

    const clearErrors = useCallback(() => {
        setSaveError(null)
    }, [])

    return {
        // Query states
        notes,
        isLoadingNotes,
        notesError,
        hasMoreNotes,
        notesCursor,
        
        // Single note states
        currentNote,
        isLoadingNote,
        noteError,
        
        // Mutation states
        isSaving,
        isDeleting,
        saveError,
        
        // Actions
        loadNotes,
        loadNote,
        createNote,
        updateNote,
        deleteNote,
        toggleImportance,
        
        // Helper actions
        refreshNotes,
        clearErrors
    }
}
