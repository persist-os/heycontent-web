/**
 * Reflection API Types
 * 
 * Type definitions for reflection service operations.
 * Centralized types for note operations in thinking lab.
 */

// Import existing types to maintain compatibility
import type { Note, NoteUpdate } from '../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"

// Core note interface for reflection - compatible with existing Note interface
export interface ReflectionNote {
    _id: string
    _creationTime: number
    title: string
    content: string
    createdAt: number
    updatedAt: number
    type: string
    important: boolean
    tags: string[]
    userId: string
}

// Note creation parameters
export interface CreateReflectionNoteParams {
    content: string
    title?: string
    type?: string
    tags?: string[]
}

// Note update parameters
export interface UpdateReflectionNoteParams {
    noteId: string
    content?: string
    title?: string
    important?: boolean
    tags?: string[]
}

// Note loading parameters
export interface LoadReflectionNotesParams {
    userId: string
    numItems?: number
    cursor?: string
    sortField?: string
    sortOrder?: 'asc' | 'desc'
    includeShared?: boolean
}

// Note loading result
export interface LoadReflectionNotesResult {
    notes: ReflectionNote[]
    hasMore: boolean
    cursor?: string
}

// AI handlers interface for reflection
export interface ReflectionAIHandlers {
    handleAskAI: (prompt: string) => Promise<void>
    handleRequestAnalysis: (noteType: string) => Promise<void>
    handleRequestIdeas: () => Promise<void>
    handleRefineText: (refinementType: string, selectedText: string) => Promise<string>
    handleAcceptRefinement: () => Promise<void>
    handleRejectRefinement: () => Promise<void>
    handleRetryRefinement: () => Promise<void>
    isLoading: boolean
    error: string | null
}

// Note handlers interface for reflection - compatible with existing NoteHandlers
export interface ReflectionNoteHandlers {
    handleNoteUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>
    handleSaveAsNote: () => Promise<string | null>
    handleGenerateMetadata: () => Promise<void>
    handleCreateNewNote: () => void
    handleSwitchToNote: (noteId: string) => void
    handleContentChange: (newContent: string) => void
    handleTriggerCommandPalette: () => void
}
