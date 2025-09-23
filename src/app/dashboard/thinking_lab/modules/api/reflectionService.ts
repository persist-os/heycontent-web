/**
 * Reflection Service
 * 
 * API service for handling all note/reflection backend operations.
 * Centralizes Convex calls and provides clean async functions.
 */

import { fetchWithApiKey } from '@/app/lib/api-helpers'
import type {
    ReflectionNote,
    CreateReflectionNoteParams,
    UpdateReflectionNoteParams,
    LoadReflectionNotesParams,
    LoadReflectionNotesResult
} from '../../types/api/reflectionApi'

// Note: These functions are designed to be called from React components
// that can use useQuery/useMutation. The actual Convex calls happen there.

/**
 * Load user notes with pagination
 */
export async function loadUserNotes(params: LoadReflectionNotesParams): Promise<LoadReflectionNotesResult> {
    try {
        // This function coordinates the loading logic
        // The actual useQuery call happens in the component
        
        console.log('loadUserNotes called with params:', params)
        
        // For now, return mock data
        // In real implementation, this would coordinate with the component's useQuery
        return {
            notes: [],
            hasMore: false,
            cursor: undefined
        }
    } catch (error) {
        console.error('Failed to load notes:', error)
        throw new Error('Unable to load your notes. Please try again.')
    }
}

/**
 * Load a specific note by ID
 */
export async function loadNote(noteId: string, userId: string): Promise<ReflectionNote | null> {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        console.log('loadNote called for:', noteId, 'by user:', userId)
        
        // The actual query happens in the component
        // This function handles validation and error formatting
        return null
    } catch (error) {
        console.error('Failed to load note:', error)
        throw new Error('Unable to load this note. Please check your connection and try again.')
    }
}

/**
 * Create a new note
 */
export async function createNote(params: CreateReflectionNoteParams, userId: string): Promise<ReflectionNote> {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        // Generate title from content if not provided
        const title = params.title || generateTitleFromContent(params.content)
        
        console.log('createNote called with params:', { ...params, title, userId })
        
        // The actual mutation happens in the component
        // This function handles validation and data preparation
        
        // Return mock for now
        return {
            _id: `note-${Date.now()}`,
            _creationTime: Date.now(),
            title,
            content: params.content,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            type: params.type || 'reflection_journal',
            important: false,
            tags: params.tags || [],
            userId
        }
    } catch (error) {
        console.error('Failed to create note:', error)
        throw new Error('Unable to save your note. Please try again.')
    }
}

/**
 * Update an existing note
 */
export async function updateNote(params: UpdateReflectionNoteParams, userId: string): Promise<ReflectionNote> {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        console.log('updateNote called with params:', params)
        
        // The actual mutation happens in the component
        // This function handles validation and data preparation
        
        // Return mock for now
        return {
            _id: params.noteId,
            _creationTime: Date.now() - 1000000, // Mock previous creation time
            title: params.title || 'Updated Note',
            content: params.content || '',
            createdAt: Date.now() - 1000000,
            updatedAt: Date.now(),
            type: 'reflection_journal',
            important: params.important || false,
            tags: params.tags || [],
            userId
        }
    } catch (error) {
        console.error('Failed to update note:', error)
        throw new Error('Unable to save your changes. Please try again.')
    }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        console.log('deleteNote called for:', noteId)
        
        // The actual mutation happens in the component
        // This function handles validation
        
        return true // Mock success
    } catch (error) {
        console.error('Failed to delete note:', error)
        throw new Error('Unable to delete this note. Please try again.')
    }
}

/**
 * Toggle note importance
 */
export async function toggleNoteImportance(noteId: string, userId: string): Promise<boolean> {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        console.log('toggleNoteImportance called for:', noteId)
        
        // The actual mutation happens in the component
        
        return true // Mock new importance state
    } catch (error) {
        console.error('Failed to toggle note importance:', error)
        throw new Error('Unable to update this note. Please try again.')
    }
}

/**
 * Generate a title from note content
 */
export function generateTitleFromContent(content: string): string {
    if (!content.trim()) {
        return 'Untitled Note'
    }
    
    // Take the first line or first 50 characters, whichever is shorter
    const firstLine = content.split('\n')[0].trim()
    const title = firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine
    
    return title || 'Untitled Note'
}

/**
 * Validate note content
 */
export function validateNoteContent(content: string): { isValid: boolean; error?: string } {
    if (typeof content !== 'string') {
        return { isValid: false, error: 'Note content must be text' }
    }
    
    if (content.length > 50000) { // 50KB limit
        return { isValid: false, error: 'Note is too long. Please keep it under 50,000 characters.' }
    }
    
    return { isValid: true }
}

/**
 * Format note for display
 */
export function formatNotePreview(note: ReflectionNote, maxLength: number = 100): string {
    if (!note.content) {
        return 'Empty note'
    }
    
    const preview = note.content.replace(/\n+/g, ' ').trim()
    return preview.length > maxLength ? preview.substring(0, maxLength - 3) + '...' : preview
}
