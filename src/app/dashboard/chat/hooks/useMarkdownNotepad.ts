import { useState, useCallback } from 'react'

export function useMarkdownNotepad() {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(320) // Default width in pixels

  const openNotepad = () => setIsOpen(true)
  const closeNotepad = () => setIsOpen(false)
  const toggleNotepad = () => setIsOpen(prev => !prev)
  
  const updateWidth = useCallback((newWidth: number) => {
    // Constrain width between 280px and 600px
    const constrainedWidth = Math.max(280, Math.min(600, newWidth))
    setWidth(constrainedWidth)
  }, [])

  return {
    isOpen,
    width,
    openNotepad,
    closeNotepad,
    toggleNotepad,
    updateWidth,
  }
} 