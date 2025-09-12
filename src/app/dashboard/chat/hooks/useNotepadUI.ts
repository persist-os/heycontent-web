import { useState, useCallback, useEffect } from 'react'

interface UseNotepadUIResult {
  isOpen: boolean
  width: string
  transition: {
    duration: number
    ease: string
  }
  toggleNotepad: () => void
  getMainContentStyle: () => {
    width: string
    transition: string
  }
  getNotepadStyle: () => {
    transform: string
    visibility: 'visible' | 'hidden'
    transition: string
  }
  // Mobile tab bar functionality
  isMobile: boolean
  activeTab: 'chat' | 'notes'
  chatScrollPosition: number
  notepadScrollPosition: number
  hasUnreadNotepadChanges: boolean
  switchToTab: (tab: 'chat' | 'notes') => void
  insertTextToNotepad: (text: string) => void
  clearNotepadBadge: () => void
  saveScrollPosition: (tab: 'chat' | 'notes', position: number) => void
}

const TRANSITION_DURATION = 0.2 // seconds, increased for a smoother feel
const MOBILE_BREAKPOINT = 640 // sm breakpoint

// Always use 50% of viewport width for perfect split screen

export function useNotepadUI(): UseNotepadUIResult {
  const [isOpen, setIsOpen] = useState(true) // Always true for desktop - notepad always visible
  const width = '50%' // Fixed 50% width for perfect split screen
  
  // Mobile tab bar state
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat')
  const [chatScrollPosition, setChatScrollPosition] = useState(0)
  const [notepadScrollPosition, setNotepadScrollPosition] = useState(0)
  const [hasUnreadNotepadChanges, setHasUnreadNotepadChanges] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(newIsMobile)
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleNotepad = useCallback(() => {
    if (isMobile) {
      // On mobile, toggle between chat and notes
      setActiveTab(prev => prev === 'chat' ? 'notes' : 'chat')
      // Clear badge when user manually switches to notes
      if (activeTab === 'chat') {
        setHasUnreadNotepadChanges(false)
      }
    } else {
      // On desktop, notepad is always open - do nothing
      // setIsOpen(prev => !prev) // Disabled: notepad should always be visible
    }
  }, [isMobile, activeTab])


  const switchToTab = useCallback((tab: 'chat' | 'notes') => {
    if (isMobile) {
      setActiveTab(tab)
      // Clear badge when user switches to notes
      if (tab === 'notes') {
        setHasUnreadNotepadChanges(false)
      }
    }
  }, [isMobile])

  const insertTextToNotepad = useCallback((text: string) => {
    if (isMobile) {
      // Switch to notes tab and set badge
      setActiveTab('notes')
      setHasUnreadNotepadChanges(true)
    } else {
      // On desktop, just open notepad
      setIsOpen(true)
    }
    // Note: The actual text insertion will be handled by the parent component
    // This function just manages the UI state
  }, [isMobile])

  const clearNotepadBadge = useCallback(() => {
    setHasUnreadNotepadChanges(false)
  }, [])

  const saveScrollPosition = useCallback((tab: 'chat' | 'notes', position: number) => {
    if (tab === 'chat') {
      setChatScrollPosition(position)
    } else if (tab === 'notes') {
      setNotepadScrollPosition(position)
    }
  }, [])

  const getMainContentStyle = useCallback(() => {
    if (isMobile) {
      // On mobile, always use full width
      return {
        width: '100%',
        transition: `width ${TRANSITION_DURATION}s ease-out`
      }
    } else {
      // On desktop, always use 50% for perfect split with notepad
      return {
        width: '50%',
        transition: `width ${TRANSITION_DURATION}s ease-out`
      }
    }
  }, [isMobile])

  const getNotepadStyle = useCallback(() => {
    if (isMobile) {
      // On mobile, notepad is part of the main layout, not fixed positioned
      return {
        transform: 'none',
        visibility: (activeTab === 'notes' ? 'visible' : 'hidden') as 'visible' | 'hidden',
        transition: `visibility ${TRANSITION_DURATION}s ease-out`
      }
    } else {
      // On desktop, notepad is always visible
      return {
        transform: 'translateX(0%)', // Always visible
        visibility: 'visible' as 'visible' | 'hidden',
        transition: `transform ${TRANSITION_DURATION}s ease-out, visibility ${TRANSITION_DURATION}s ease-out`
      }
    }
  }, [isMobile, activeTab])

  return {
    isOpen,
    width,
    transition: {
      duration: TRANSITION_DURATION,
      ease: 'ease-out'
    },
    toggleNotepad,
    getMainContentStyle,
    getNotepadStyle,
    // Mobile tab bar functionality
    isMobile,
    activeTab,
    chatScrollPosition,
    notepadScrollPosition,
    hasUnreadNotepadChanges,
    switchToTab,
    insertTextToNotepad,
    clearNotepadBadge,
    saveScrollPosition
  }
} 