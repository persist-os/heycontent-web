import { useState, useCallback, useEffect } from 'react'

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
  // Mobile tab bar functionality
  isMobile: boolean
  activeTab: 'chat' | 'notes' | 'fingerprint'
  chatScrollPosition: number
  notepadScrollPosition: number
  fingerprintScrollPosition: number
  hasUnreadNotepadChanges: boolean
  switchToTab: (tab: 'chat' | 'notes' | 'fingerprint') => void
  insertTextToNotepad: (text: string) => void
  clearNotepadBadge: () => void
  saveScrollPosition: (tab: 'chat' | 'notes' | 'fingerprint', position: number) => void
}

const DEFAULT_WIDTH = 400 // pixels
const MIN_WIDTH = 300
const MAX_WIDTH = 800
const TRANSITION_DURATION = 0.2 // seconds, increased for a smoother feel
const MOBILE_BREAKPOINT = 640 // sm breakpoint

export function useNotepadUI(): UseNotepadUIResult {
  const [isOpen, setIsOpen] = useState(false)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  
  // Mobile tab bar state
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'fingerprint'>('chat')
  const [chatScrollPosition, setChatScrollPosition] = useState(0)
  const [notepadScrollPosition, setNotepadScrollPosition] = useState(0)
  const [fingerprintScrollPosition, setFingerprintScrollPosition] = useState(0)
  const [hasUnreadNotepadChanges, setHasUnreadNotepadChanges] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleNotepad = useCallback(() => {
    if (isMobile) {
      // On mobile, cycle through tabs: chat -> notes -> fingerprint -> chat
      setActiveTab(prev => {
        switch (prev) {
          case 'chat':
            return 'notes'
          case 'notes':
            return 'fingerprint'
          case 'fingerprint':
          default:
            return 'chat'
        }
      })
      // Clear badge when user manually switches to notes
      if (activeTab === 'chat') {
        setHasUnreadNotepadChanges(false)
      }
    } else {
      // On desktop, toggle notepad visibility
      setIsOpen(prev => !prev)
    }
  }, [isMobile, activeTab])

  const updateWidth = useCallback((newWidth: number) => {
    const clampedWidth = Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH)
    setWidth(clampedWidth)
  }, [])

  const switchToTab = useCallback((tab: 'chat' | 'notes' | 'fingerprint') => {
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

  const saveScrollPosition = useCallback((tab: 'chat' | 'notes' | 'fingerprint', position: number) => {
    if (tab === 'chat') {
      setChatScrollPosition(position)
    } else if (tab === 'notes') {
      setNotepadScrollPosition(position)
    } else if (tab === 'fingerprint') {
      setFingerprintScrollPosition(position)
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
      // On desktop, use the existing logic
      return {
        width: isOpen ? `calc(100% - ${width}px)` : '100%',
        transition: `width ${TRANSITION_DURATION}s ease-out`
      }
    }
  }, [isOpen, width, isMobile])

  const getNotepadStyle = useCallback(() => {
    if (isMobile) {
      // On mobile, notepad is part of the main layout, not fixed positioned
      return {
        transform: 'none',
        visibility: (activeTab === 'notes' ? 'visible' : 'hidden') as 'visible' | 'hidden',
        transition: `visibility ${TRANSITION_DURATION}s ease-out`
      }
    } else {
      // On desktop, use the existing fixed positioning logic
      return {
        transform: isOpen ? 'translateX(0%)' : 'translateX(100%)',
        visibility: (isOpen ? 'visible' : 'hidden') as 'visible' | 'hidden',
        transition: `transform ${TRANSITION_DURATION}s ease-out, visibility ${TRANSITION_DURATION}s ease-out`
      }
    }
  }, [isOpen, isMobile, activeTab])

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
    getNotepadStyle,
    // Mobile tab bar functionality
    isMobile,
    activeTab,
    chatScrollPosition,
    notepadScrollPosition,
    fingerprintScrollPosition,
    hasUnreadNotepadChanges,
    switchToTab,
    insertTextToNotepad,
    clearNotepadBadge,
    saveScrollPosition
  }
} 