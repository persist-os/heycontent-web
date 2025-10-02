/**
 * Notepad Store
 *
 * Zustand store for managing notepad state that can be accessed by other stores.
 * This allows the dialogue store to include notepad content in chat messages.
 */

import { create } from 'zustand'

interface NotepadState {
  // Current notepad content
  currentContent: string
  currentTitle: string
  currentNoteId: string | null
  
  // Toggle for including notepad in messages
  includeInMessages: boolean
  
  // Actions
  updateContent: (content: string) => void
  updateTitle: (title: string) => void
  setCurrentNoteId: (noteId: string | null) => void
  setIncludeInMessages: (include: boolean) => void
  clearNotepad: () => void
}

export const useNotepadStore = create<NotepadState>()((set) => ({
  // Initial state
  currentContent: '',
  currentTitle: 'Untitled',
  currentNoteId: null,
  includeInMessages: false,
  
  // Actions
  updateContent: (content: string) => {
    set({ currentContent: content })
  },
  
  updateTitle: (title: string) => {
    set({ currentTitle: title })
  },
  
  setCurrentNoteId: (noteId: string | null) => {
    set({ currentNoteId: noteId })
  },
  
  setIncludeInMessages: (include: boolean) => {
    set({ includeInMessages: include })
  },
  
  clearNotepad: () => {
    set({
      currentContent: '',
      currentTitle: 'Untitled',
      currentNoteId: null
    })
  }
}))

// Selectors for convenience
export const useNotepadContent = () => useNotepadStore(state => state.currentContent)
export const useNotepadTitle = () => useNotepadStore(state => state.currentTitle)
export const useIncludeNotepadInMessages = () => useNotepadStore(state => state.includeInMessages)

