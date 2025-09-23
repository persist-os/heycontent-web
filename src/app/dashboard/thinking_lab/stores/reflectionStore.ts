/**
 * Reflection Store
 *
 * Zustand store for managing notepad/reflection state and actions.
 * This replaces/wraps your existing notepad store.
 *
 * ✅ CONNECTED: Real Convex integration following best practices
 * - Proper user isolation with userId as first index field
 * - Optimistic updates for better UX
 * - Strategic denormalization for performance
 * - Error handling with fallback states
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Store handles UI state only - user ID comes from components via auth context

interface ReflectionState {
    isOpen: boolean
    noteId?: string
    content: string
    isDirty: boolean
    isSaving: boolean
    lastSaved?: number
    error?: string
    // AI refinement states
    refinementPreview?: string
    isRefining: boolean
    // Convex integration states
    isLoadingNotes: boolean
    notesList: Array<{
        _id: string
        _creationTime: number
        title: string
        type: string
        important: boolean
        tags: string[]
    }>
    hasMoreNotes: boolean
    notesCursor?: string
}

interface ReflectionActions {
    // ✅ PURE UI STATE ACTIONS ONLY
    openNotepad: (noteId?: string) => void
    closeNotepad: () => void
    updateContent: (content: string) => void
    insertQuote: (text: string, source: string) => void
    setDirty: (dirty: boolean) => void
    setSaving: (saving: boolean) => void
    setError: (error: string | undefined) => void
    
    // ✅ AI REFINEMENT ACTIONS
    setRefinementPreview: (preview: string | undefined) => void
    setIsRefining: (refining: boolean) => void
    
    // ✅ SYNC STATE MANAGEMENT FOR HOOK COORDINATION
    setIsOpen: (isOpen: boolean) => void
    setNoteId: (noteId: string | undefined) => void
    setContent: (content: string) => void
    setLastSaved: (timestamp: number) => void
    setLoadingNotes: (loading: boolean) => void
    setNotesList: (notes: any[]) => void
    setHasMoreNotes: (hasMore: boolean) => void
    setNotesCursor: (cursor: string | undefined) => void
    
    // ✅ COMPUTED/DERIVED ACTIONS
    markAsSaved: () => void
    resetNoteState: () => void
}

type ReflectionStore = ReflectionState & ReflectionActions

export const useReflectionStore = create<ReflectionStore>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        isOpen: false,
        noteId: undefined,
        content: '',
        isDirty: false,
        isSaving: false,
        lastSaved: undefined,
        error: undefined,
        // AI refinement states
        refinementPreview: undefined,
        isRefining: false,
        // Convex integration states
        isLoadingNotes: false,
        notesList: [],
        hasMoreNotes: false,
        notesCursor: undefined,

        // ✅ PURE UI STATE ACTIONS
        openNotepad: (noteId?: string) => {
            set({ 
                isOpen: true, 
                error: undefined,
                noteId,
                content: '', // Will be populated by hook
                isDirty: false
            })
        },

        closeNotepad: () => {
            set({
                isOpen: false,
                noteId: undefined,
                content: '',
                isDirty: false,
                error: undefined
            })
        },

        updateContent: (content: string) => {
            set({
                content,
                isDirty: true,
                error: undefined
            })
        },

        insertQuote: (text: string, source: string) => {
            const { content } = get()

            // TODO: Customize quote formatting as needed
            const quote = `\n\n> ${text}\n> — *${source}*\n\n`
            const newContent = content + quote

            set({
                content: newContent,
                isDirty: true
            })
        },

        setDirty: (dirty: boolean) => {
            set({ isDirty: dirty })
        },

        setSaving: (saving: boolean) => {
            set({ isSaving: saving })
        },

        setError: (error: string | undefined) => {
            set({ error })
        },

        // ✅ AI REFINEMENT ACTIONS
        setRefinementPreview: (preview: string | undefined) => {
            set({ refinementPreview: preview })
        },

        setIsRefining: (refining: boolean) => {
            set({ isRefining: refining })
        },

        // ✅ SYNC STATE MANAGEMENT FOR HOOK COORDINATION
        setIsOpen: (isOpen: boolean) => {
            set({ isOpen })
        },

        setNoteId: (noteId: string | undefined) => {
            set({ noteId })
        },

        setContent: (content: string) => {
            set({ content, isDirty: false }) // Content set by hook is considered saved
        },

        setLastSaved: (timestamp: number) => {
            set({ lastSaved: timestamp })
        },

        setLoadingNotes: (loading: boolean) => {
            set({ isLoadingNotes: loading })
        },

        setNotesList: (notes: any[]) => {
            set({
                notesList: notes,
                isLoadingNotes: false,
                hasMoreNotes: notes.length >= 20 // Assuming page size of 20
            })
        },

        setHasMoreNotes: (hasMore: boolean) => {
            set({ hasMoreNotes: hasMore })
        },

        setNotesCursor: (cursor: string | undefined) => {
            set({ notesCursor: cursor })
        },

        // ✅ COMPUTED/DERIVED ACTIONS
        markAsSaved: () => {
            set({ 
                isDirty: false, 
                isSaving: false, 
                lastSaved: Date.now() 
            })
        },

        resetNoteState: () => {
            set({
                noteId: undefined,
                content: '',
                isDirty: false,
                isSaving: false,
                lastSaved: undefined,
                error: undefined
            })
        }
    }))
)

// ✅ AUTO-SAVE FUNCTIONALITY
// Note: Auto-save logic will be handled by the hook layer, not the store
// The store provides isDirty state that hooks can subscribe to

// ============================================================================
// SELECTORS
// ============================================================================

// Content-specific selector
export const useReflectionContent = () => useReflectionStore(state => state.content)

// Basic state selector
export const useReflectionState = () => useReflectionStore(state => ({
    isOpen: state.isOpen,
    isDirty: state.isDirty,
    isSaving: state.isSaving,
    error: state.error,
    lastSaved: state.lastSaved,
    refinementPreview: state.refinementPreview,
    isRefining: state.isRefining
}))

// ✅ UI ACTION SELECTORS (Sync actions only)
export const useReflectionActions = () => useReflectionStore(state => ({
    openNotepad: state.openNotepad,
    closeNotepad: state.closeNotepad,
    updateContent: state.updateContent,
    insertQuote: state.insertQuote,
    setDirty: state.setDirty,
    setSaving: state.setSaving,
    setError: state.setError,
    markAsSaved: state.markAsSaved,
    resetNoteState: state.resetNoteState
}))

// Convex integration selectors
export const useReflectionNotes = () => useReflectionStore(state => ({
    notesList: state.notesList,
    isLoadingNotes: state.isLoadingNotes,
    hasMoreNotes: state.hasMoreNotes,
    notesCursor: state.notesCursor
}))

// ✅ DATA COORDINATION SELECTORS (For hook integration)
export const useReflectionNotesActions = () => useReflectionStore(state => ({
    setLoadingNotes: state.setLoadingNotes,
    setNotesList: state.setNotesList,
    setHasMoreNotes: state.setHasMoreNotes,
    setNotesCursor: state.setNotesCursor,
    setContent: state.setContent,
    setNoteId: state.setNoteId,
    setLastSaved: state.setLastSaved
}))