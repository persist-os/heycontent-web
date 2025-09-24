/**
 * Reflection Store
 *
 * ✅ CONNECTED: Zustand store for reflection UI state and coordination
 * 
 * This store manages UI state and coordinates with useReflectionNotes hook.
 * Follows established patterns:
 * - Store manages UI state (open/closed, content, saving states)
 * - Hook manages Convex operations
 * - Store provides selectors for optimized re-renders
 * - Clean separation of concerns
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { ReflectionNote } from '../types/api/reflectionApi'

// Store handles UI state and coordination with hook layer

interface ReflectionState {
    // ✅ NOTEPAD UI STATE
    isOpen: boolean
    noteId?: string
    content: string
    title?: string
    isDirty: boolean
    lastSaved?: number
    error?: string
    
    // ✅ AI REFINEMENT STATE
    refinementPreview?: string
    isRefining: boolean
    
    // ✅ HOOK COORDINATION STATE
    // These help coordinate between the store and hook
    selectedNotesList: ReflectionNote[]
    notesListCursor?: string
    notesListError?: string
}

interface ReflectionActions {
    // ✅ NOTEPAD UI ACTIONS
    openNotepad: (noteId?: string, content?: string, title?: string) => void
    closeNotepad: () => void
    updateContent: (content: string) => void
    updateTitle: (title: string) => void
    insertQuote: (text: string, source: string) => void
    setDirty: (dirty: boolean) => void
    setError: (error: string | undefined) => void
    markAsSaved: () => void
    resetNoteState: () => void
    
    // ✅ AI REFINEMENT ACTIONS
    setRefinementPreview: (preview: string | undefined) => void
    setIsRefining: (refining: boolean) => void
    
    // ✅ HOOK COORDINATION ACTIONS
    // These sync data between hook and store
    syncNotesFromHook: (notes: ReflectionNote[]) => void
    syncNotesListCursor: (cursor: string | undefined) => void
    syncNotesListError: (error: string | undefined) => void
    syncNoteFromHook: (note: ReflectionNote | null) => void
}

type ReflectionStore = ReflectionState & ReflectionActions

export const useReflectionStore = create<ReflectionStore>()(
    subscribeWithSelector((set, get) => ({
        // ✅ INITIAL STATE
        isOpen: false,
        noteId: undefined,
        content: '',
        title: undefined,
        isDirty: false,
        lastSaved: undefined,
        error: undefined,
        
        // AI refinement states
        refinementPreview: undefined,
        isRefining: false,
        
        // Hook coordination states
        selectedNotesList: [],
        notesListCursor: undefined,
        notesListError: undefined,

        // ✅ NOTEPAD UI ACTIONS
        openNotepad: (noteId?: string, content?: string, title?: string) => {
            set({ 
                isOpen: true, 
                error: undefined,
                noteId,
                content: content || '',
                title: title || undefined,
                isDirty: false
            })
        },

        closeNotepad: () => {
            set({
                isOpen: false,
                noteId: undefined,
                content: '',
                title: undefined,
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

        updateTitle: (title: string) => {
            set({
                title,
                isDirty: true,
                error: undefined
            })
        },

        insertQuote: (text: string, source: string) => {
            const { content } = get()
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

        setError: (error: string | undefined) => {
            set({ error })
        },

        markAsSaved: () => {
            set({ 
                isDirty: false, 
                lastSaved: Date.now() 
            })
        },

        resetNoteState: () => {
            set({
                noteId: undefined,
                content: '',
                title: undefined,
                isDirty: false,
                lastSaved: undefined,
                error: undefined
            })
        },

        // ✅ AI REFINEMENT ACTIONS
        setRefinementPreview: (preview: string | undefined) => {
            set({ refinementPreview: preview })
        },

        setIsRefining: (refining: boolean) => {
            set({ isRefining: refining })
        },

        // ✅ HOOK COORDINATION ACTIONS
        syncNotesFromHook: (notes: ReflectionNote[]) => {
            set({
                selectedNotesList: notes,
                notesListError: undefined
            })
        },

        syncNotesListCursor: (cursor: string | undefined) => {
            set({ notesListCursor: cursor })
        },

        syncNotesListError: (error: string | undefined) => {
            set({ notesListError: error })
        },

        syncNoteFromHook: (note: ReflectionNote | null) => {
            if (note && get().noteId === note._id) {
                // Only sync if this is the currently selected note
                set({
                    content: note.content,
                    title: note.title,
                    isDirty: false, // Content from hook is considered saved
                    error: undefined
                })
            }
        }
    }))
)

// ============================================================================
// ✅ SELECTORS
// ============================================================================

// Content and basic state selectors
export const useReflectionContent = () => useReflectionStore(state => state.content)
export const useReflectionTitle = () => useReflectionStore(state => state.title)

export const useReflectionState = () => useReflectionStore(state => ({
    isOpen: state.isOpen,
    noteId: state.noteId,
    content: state.content,
    title: state.title,
    isDirty: state.isDirty,
    lastSaved: state.lastSaved,
    error: state.error
}))

// AI refinement selectors
export const useReflectionRefinement = () => useReflectionStore(state => ({
    refinementPreview: state.refinementPreview,
    isRefining: state.isRefining
}))

// ✅ UI ACTION SELECTORS
export const useReflectionActions = () => useReflectionStore(state => ({
    openNotepad: state.openNotepad,
    closeNotepad: state.closeNotepad,
    updateContent: state.updateContent,
    updateTitle: state.updateTitle,
    insertQuote: state.insertQuote,
    setDirty: state.setDirty,
    setError: state.setError,
    markAsSaved: state.markAsSaved,
    resetNoteState: state.resetNoteState
}))

// AI refinement actions
export const useReflectionRefinementActions = () => useReflectionStore(state => ({
    setRefinementPreview: state.setRefinementPreview,
    setIsRefining: state.setIsRefining
}))

// ✅ HOOK COORDINATION SELECTORS
export const useReflectionNotesData = () => useReflectionStore(state => ({
    selectedNotesList: state.selectedNotesList,
    notesListCursor: state.notesListCursor,
    notesListError: state.notesListError
}))

export const useReflectionHookActions = () => useReflectionStore(state => ({
    syncNotesFromHook: state.syncNotesFromHook,
    syncNotesListCursor: state.syncNotesListCursor,
    syncNotesListError: state.syncNotesListError,
    syncNoteFromHook: state.syncNoteFromHook
}))