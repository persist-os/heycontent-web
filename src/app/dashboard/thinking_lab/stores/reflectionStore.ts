/**
 * Reflection Store
 *
 * Zustand store for managing notepad/reflection state and actions.
 * This replaces/wraps your existing notepad store.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// TODO: Import your existing API functions
// import { saveNote, loadNote, createNote } from '../api/notes' // TODO: What are your actual API functions?

interface ReflectionState {
    isOpen: boolean
    noteId?: string
    content: string
    isDirty: boolean
    isSaving: boolean
    lastSaved?: number
    error?: string
}

interface ReflectionActions {
    openNotepad: (noteId?: string) => Promise<void>
    closeNotepad: () => void
    updateContent: (content: string) => void
    saveNote: () => Promise<void>
    insertQuote: (text: string, source: string) => void
    setDirty: (dirty: boolean) => void
    setSaving: (saving: boolean) => void
    setError: (error: string | undefined) => void
    autoSave: () => Promise<void>
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

        // Actions
        openNotepad: async (noteId?: string) => {
            set({ isOpen: true, error: undefined })

            if (noteId) {
                try {
                    // TODO: Replace with your actual API call
                    // const note = await loadNote(noteId)

                    // TODO: Mock note loading - replace with actual API
                    const mockContent = `# Note ${noteId}\n\nThis is the content of note ${noteId}.`

                    set({
                        noteId,
                        content: mockContent,
                        isDirty: false,
                        lastSaved: Date.now()
                    })

                } catch (error) {
                    console.error('Failed to load note:', error)
                    set({
                        error: error instanceof Error ? error.message : 'Failed to load note',
                        noteId,
                        content: '',
                        isDirty: false
                    })
                }
            } else {
                // New note
                set({
                    noteId: undefined,
                    content: '',
                    isDirty: false
                })
            }
        },

        closeNotepad: () => {
            const { isDirty } = get()

            // TODO: Should we auto-save before closing if dirty?
            if (isDirty) {
                // TODO: Show confirmation dialog or auto-save?
                console.warn('Closing notepad with unsaved changes')
            }

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

        saveNote: async () => {
            const { content, noteId, isSaving } = get()

            if (isSaving) return // Prevent concurrent saves

            set({ isSaving: true, error: undefined })

            try {
                // TODO: Replace with your actual API call
                // if (noteId) {
                //   await saveNote(noteId, content)
                // } else {
                //   const newNote = await createNote(content)
                //   noteId = newNote.id
                // }

                // TODO: Mock save - replace with actual API
                const finalNoteId = noteId || `note-${Date.now()}`
                console.log('Saving note:', finalNoteId, content)

                set({
                    noteId: finalNoteId,
                    isDirty: false,
                    isSaving: false,
                    lastSaved: Date.now()
                })

            } catch (error) {
                console.error('Failed to save note:', error)
                set({
                    isSaving: false,
                    error: error instanceof Error ? error.message : 'Failed to save note'
                })
            }
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

        autoSave: async () => {
            const { isDirty, isSaving } = get()

            if (isDirty && !isSaving) {
                await get().saveNote()
            }
        }
    }))
)

// Auto-save functionality
let autoSaveTimeout: NodeJS.Timeout | null = null

// Subscribe to content changes for auto-save
useReflectionStore.subscribe(
    (state) => state.isDirty,
    (isDirty) => {
        if (isDirty) {
            // Clear existing timeout
            if (autoSaveTimeout) {
                clearTimeout(autoSaveTimeout)
            }

            // Set new auto-save timeout
            autoSaveTimeout = setTimeout(() => {
                useReflectionStore.getState().autoSave()
            }, 2000) // Auto-save after 2 seconds of inactivity
        }
    }
)

// TODO: Add any additional selectors you need
export const useReflectionContent = () => useReflectionStore(state => state.content)
export const useReflectionState = () => useReflectionStore(state => ({
    isOpen: state.isOpen,
    isDirty: state.isDirty,
    isSaving: state.isSaving
}))
export const useReflectionActions = () => useReflectionStore(state => ({
    openNotepad: state.openNotepad,
    closeNotepad: state.closeNotepad,
    updateContent: state.updateContent,
    saveNote: state.saveNote,
    insertQuote: state.insertQuote
}))