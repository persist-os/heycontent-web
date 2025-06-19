import { useState, useCallback } from 'react'

interface UseNotepadUIResult {
  isOpen: boolean
  width: number
  transition: {
    duration: number
    ease: string
  }
  toggleNotepad: () => void
  updateWidth: (newWidth: number) => void
  getMainContentStyle: () => {
    width: string
    transition: string
  }
  getNotepadStyle: () => {
    transform: string
    visibility: 'visible' | 'hidden'
    transition: string
  }
}

const DEFAULT_WIDTH = 400 // pixels
const MIN_WIDTH = 300
const MAX_WIDTH = 800
const TRANSITION_DURATION = 0.2 // seconds, increased for a smoother feel

export function useNotepadUI(): UseNotepadUIResult {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)

  const toggleNotepad = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const updateWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH)
    setWidth(clampedWidth)
  }, [])

  const getMainContentStyle = useCallback(() => ({
    width: isOpen ? `calc(100% - ${width}px)` : '100%',
    transition: `width ${TRANSITION_DURATION}s ease-out`
  }), [isOpen, width])

  const getNotepadStyle = useCallback(() => ({
    transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
    visibility: (isOpen ? 'visible' : 'hidden') as 'visible' | 'hidden',
    transition: `transform ${TRANSITION_DURATION}s ease-out, visibility ${TRANSITION_DURATION}s ease-out`
  }), [isOpen])

  return {
    isOpen,
    width,
    transition: {
      duration: TRANSITION_DURATION,
      ease: 'ease-out'
    },
    toggleNotepad,
    updateWidth,
    getMainContentStyle,
    getNotepadStyle
  }
} 