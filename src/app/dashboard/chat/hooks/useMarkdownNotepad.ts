import { useState, useCallback } from 'react'

// Calculate 50% of viewport width for proper split screen, with constraints
const getDefaultWidth = () => {
  if (typeof window === 'undefined') return 400 // SSR fallback
  const halfViewport = Math.floor(window.innerWidth / 2)
  return Math.min(Math.max(halfViewport, 300), 1200)
}

export function useMarkdownNotepad() {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(getDefaultWidth) // Use 50% split screen width

  const openNotepad = () => setIsOpen(true)
  const closeNotepad = () => setIsOpen(false)
  const toggleNotepad = () => setIsOpen(prev => !prev)
  
  const updateWidth = useCallback((newWidth: number) => {
    // Constrain width between 300px and 1200px for consistency
    const constrainedWidth = Math.max(300, Math.min(1200, newWidth))
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