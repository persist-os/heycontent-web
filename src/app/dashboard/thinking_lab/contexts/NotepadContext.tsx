/**
 * Notepad Context - Lightweight bidirectional communication
 * 
 * Allows chat to read notepad content and write to it when requested.
 * Only updates when explicitly needed, not on every keystroke.
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

interface NotepadContextData {
  // Read notepad content (called only when sending message)
  getNotepadContent: () => { content: string; title: string } | null
  
  // Write to notepad (called when chat wants to add content)
  writeToNotepad: (content: string, title?: string) => void
  
  // Toggle for including notepad in messages
  includeInMessages: boolean
  setIncludeInMessages: (include: boolean) => void
  
  // Internal methods for notepad registration
  setNotepadRef: (ref: any) => void
}

const NotepadContext = createContext<NotepadContextData | null>(null)

export function NotepadProvider({ children }: { children: React.ReactNode }) {
  const [includeInMessages, setIncludeInMessages] = useState(false)
  
  // Refs to store notepad data without causing re-renders
  const notepadContentRef = useRef('')
  const notepadTitleRef = useRef('Untitled')
  const notepadRef = useRef<any>(null) // Will store the notepad component ref

  const getNotepadContent = useCallback(() => {
    if (!includeInMessages || !notepadRef.current) {
      return null
    }
    
    // Get fresh content directly from the notepad component when needed
    const currentContent = notepadRef.current.getContent?.() || ''
    const currentTitle = notepadRef.current.getCurrentNote?.()?.title || 'Untitled'
    
    if (!currentContent.trim()) {
      return null
    }
    
    return {
      content: currentContent,
      title: currentTitle
    }
  }, [includeInMessages])

  const writeToNotepad = useCallback((content: string, title?: string) => {
    if (notepadRef.current) {
      // Use the notepad's ref methods to add content
      const currentContent = notepadRef.current.getContent()
      const newContent = currentContent + (currentContent ? '\n\n' : '') + content
      notepadRef.current.setContent?.(newContent)
      
      if (title && notepadRef.current.setTitle) {
        notepadRef.current.setTitle(title)
      }
    }
  }, [])

  // Function to set notepad ref (called by notepad component)
  const setNotepadRef = useCallback((ref: any) => {
    notepadRef.current = ref
  }, [])

  const value: NotepadContextData = {
    getNotepadContent,
    writeToNotepad,
    includeInMessages,
    setIncludeInMessages,
    setNotepadRef
  }

  return (
    <NotepadContext.Provider value={value}>
      {children}
    </NotepadContext.Provider>
  )
}

export function useNotepadContext() {
  const context = useContext(NotepadContext)
  if (!context) {
    throw new Error('useNotepadContext must be used within a NotepadProvider')
  }
  return context
}

// Convenience hooks
export function useNotepadContent() {
  const { getNotepadContent } = useNotepadContext()
  return getNotepadContent
}

export function useNotepadWriter() {
  const { writeToNotepad } = useNotepadContext()
  return writeToNotepad
}

export function useIncludeNotepadInMessages() {
  const { includeInMessages, setIncludeInMessages } = useNotepadContext()
  return { includeInMessages, setIncludeInMessages }
}