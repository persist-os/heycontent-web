/**
 * Reflection Service
 * 
 * ✅ CONNECTED: Service layer for reflection/note operations following established patterns
 * 
 * This service handles validation, error formatting, and data coordination.
 * Actual Convex calls happen in hooks - this service provides clean async interfaces
 * that components can use alongside the Convex hooks.
 */

import type {
    ReflectionNote,
    CreateReflectionNoteParams,
    UpdateReflectionNoteParams,
    LoadReflectionNotesParams,
    LoadReflectionNotesResult
} from '../../types/api/reflectionApi'

// ✅ VALIDATION AND COORDINATION FUNCTIONS
// These work alongside Convex hooks for complete note operations

/**
 * Validate and prepare parameters for loading user notes
 * Used alongside useQuery hook for getUserNotes
 */
export function prepareLoadNotesParams(params: LoadReflectionNotesParams) {
    try {
        if (!params.userId) {
            throw new Error('User authentication required')
        }

        // Validate and sanitize parameters
        const sanitizedParams = {
            userId: params.userId,
            numItems: Math.min(Math.max(1, params.numItems || 20), 50), // Enforce 1-50 range
            cursor: params.cursor,
            sortField: params.sortField || '_creationTime',
            sortOrder: (params.sortOrder === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc',
            includeShared: params.includeShared !== false // Default true
        }

        console.log('prepareLoadNotesParams:', sanitizedParams)
        return sanitizedParams
    } catch (error) {
        console.error('Failed to prepare load params:', error)
        throw new Error('Unable to prepare note loading. Please check your parameters.')
    }
}

/**
 * Validate parameters for loading a specific note
 * Used alongside useQuery hook for getNote
 */
export function prepareLoadNoteParams(noteId: string, userId: string) {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }
        
        if (!noteId) {
            throw new Error('Note ID is required')
        }

        console.log('prepareLoadNoteParams:', { noteId, userId })
        
        return { noteId, userId }
    } catch (error) {
        console.error('Failed to prepare load note params:', error)
        throw new Error('Unable to load this note. Please check your parameters.')
    }
}

/**
 * Validate and prepare parameters for creating a new note
 * Used alongside useMutation hook for createNote
 */
export function prepareCreateNoteParams(params: CreateReflectionNoteParams, userId: string) {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }

        // Validate content
        const validation = validateNoteContent(params.content)
        if (!validation.isValid) {
            throw new Error(validation.error || 'Invalid note content')
        }

        // Generate title from content if not provided
        const title = params.title || generateTitleFromContent(params.content)
        
        // Prepare Convex-compatible parameters
        const convexParams = {
            userId,
            title,
            content: params.content,
            type: (params.type || 'reflection_journal') as any, // Will match Convex schema
            tags: params.tags || []
        }
        
        console.log('prepareCreateNoteParams:', convexParams)
        return convexParams
    } catch (error) {
        console.error('Failed to prepare create note params:', error)
        throw new Error('Unable to prepare note creation. Please check your inputs.')
    }
}

/**
 * Validate and prepare parameters for updating a note
 * Used alongside useMutation hook for updateNote
 */
export function prepareUpdateNoteParams(params: UpdateReflectionNoteParams, userId: string) {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }
        
        if (!params.noteId) {
            throw new Error('Note ID is required')
        }

        // Validate content if provided
        if (params.content !== undefined) {
            const validation = validateNoteContent(params.content)
            if (!validation.isValid) {
                throw new Error(validation.error || 'Invalid note content')
            }
        }

        // Build update object with only defined fields
        const updates: any = {}
        if (params.content !== undefined) updates.content = params.content
        if (params.title !== undefined) updates.title = params.title
        if (params.important !== undefined) updates.important = params.important
        if (params.tags !== undefined) updates.tags = params.tags

        const convexParams = {
            noteId: params.noteId as any, // Will be converted to proper ID type
            userId,
            updates
        }
        
        console.log('prepareUpdateNoteParams:', convexParams)
        return convexParams
    } catch (error) {
        console.error('Failed to prepare update note params:', error)
        throw new Error('Unable to prepare note update. Please check your inputs.')
    }
}

/**
 * Validate parameters for deleting a note
 * Used alongside useMutation hook for deleteNote
 */
export function prepareDeleteNoteParams(noteId: string, userId: string) {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }
        
        if (!noteId) {
            throw new Error('Note ID is required')
        }

        console.log('prepareDeleteNoteParams:', { noteId, userId })
        
        return {
            noteId: noteId as any, // Will be converted to proper ID type
            userId
        }
    } catch (error) {
        console.error('Failed to prepare delete note params:', error)
        throw new Error('Unable to prepare note deletion.')
    }
}

/**
 * Prepare parameters for toggling note importance
 * Used alongside useMutation hook for updateNote (with importance toggle)
 */
export function prepareToggleImportanceParams(noteId: string, currentImportance: boolean, userId: string) {
    try {
        if (!userId) {
            throw new Error('User authentication required')
        }
        
        if (!noteId) {
            throw new Error('Note ID is required')
        }

        const convexParams = {
            noteId: noteId as any,
            userId,
            updates: {
                important: !currentImportance
            }
        }
        
        console.log('prepareToggleImportanceParams:', convexParams)
        return convexParams
    } catch (error) {
        console.error('Failed to prepare importance toggle params:', error)
        throw new Error('Unable to update note importance.')
    }
}

// ✅ RESULT TRANSFORMATION FUNCTIONS
// Convert between Convex types and reflection types

/**
 * Transform Convex note result to ReflectionNote
 */
export function transformConvexNoteToReflection(convexNote: any): ReflectionNote {
    return {
        _id: String(convexNote._id),
        _creationTime: convexNote._creationTime,
        title: convexNote.title || '',
        content: convexNote.content || '', // Handle optional content from Convex
        createdAt: convexNote.createdAt || convexNote._creationTime,
        updatedAt: convexNote.updatedAt || convexNote._creationTime,
        type: convexNote.type || 'reflection_journal',
        important: convexNote.important || false,
        tags: convexNote.tags || [],
        userId: convexNote.userId
    }
}

/**
 * Transform Convex notes query result to LoadReflectionNotesResult
 */
export function transformConvexNotesResult(convexResult: any): LoadReflectionNotesResult {
    if (!convexResult) {
        return {
            notes: [],
            hasMore: false,
            cursor: undefined
        }
    }

    return {
        notes: convexResult.page.map(transformConvexNoteToReflection),
        hasMore: !convexResult.isDone,
        cursor: convexResult.continueCursor || convexResult.nextCursor
    }
}

// ✅ UTILITY FUNCTIONS

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
