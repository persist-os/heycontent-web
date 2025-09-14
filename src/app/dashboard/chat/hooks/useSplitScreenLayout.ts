'use client'

import { useState, useCallback, useEffect } from 'react'

export type PanelState = 'split' | 'chat-full' | 'notepad-full'

interface UseSplitScreenLayoutResult {
  panelState: PanelState
  chatWidth: string
  notepadWidth: string
  isAnimating: boolean
  
  // Panel control methods
  setChatFullScreen: () => void
  setNotepadFullScreen: () => void
  restoreSplitView: () => void
  
  // Style getters
  getChatContainerStyle: () => React.CSSProperties
  getNotepadContainerStyle: () => React.CSSProperties
}

const ANIMATION_DURATION = 300 // ms
const TRANSITION_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)' // ease-out

export function useSplitScreenLayout(): UseSplitScreenLayoutResult {
  const [panelState, setPanelState] = useState<PanelState>('split')
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback(() => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
  }, [])

  const setChatFullScreen = useCallback(() => {
    if (panelState !== 'chat-full') {
      startAnimation()
      setPanelState('chat-full')
    }
  }, [panelState, startAnimation])

  const setNotepadFullScreen = useCallback(() => {
    if (panelState !== 'notepad-full') {
      startAnimation()
      setPanelState('notepad-full')
    }
  }, [panelState, startAnimation])

  const restoreSplitView = useCallback(() => {
    if (panelState !== 'split') {
      startAnimation()
      setPanelState('split')
    }
  }, [panelState, startAnimation])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when Cmd/Ctrl is pressed
      if (!(e.metaKey || e.ctrlKey)) return
      
      switch (e.key) {
        case '1':
          e.preventDefault()
          setChatFullScreen()
          break
        case '2':
          e.preventDefault()
          setNotepadFullScreen()
          break
        case '0':
          e.preventDefault()
          restoreSplitView()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setChatFullScreen, setNotepadFullScreen, restoreSplitView])

  // Calculate widths based on panel state
  const { chatWidth, notepadWidth } = (() => {
    switch (panelState) {
      case 'chat-full':
        return { chatWidth: '100%', notepadWidth: '0%' }
      case 'notepad-full':
        return { chatWidth: '0%', notepadWidth: '100%' }
      case 'split':
      default:
        return { chatWidth: '50%', notepadWidth: '50%' }
    }
  })()

  const getChatContainerStyle = useCallback((): React.CSSProperties => ({
    width: chatWidth,
    transition: `width ${ANIMATION_DURATION}ms ${TRANSITION_EASE}`,
    overflow: panelState === 'notepad-full' ? 'hidden' : 'visible',
    opacity: panelState === 'notepad-full' ? 0 : 1,
  }), [chatWidth, panelState])

  const getNotepadContainerStyle = useCallback((): React.CSSProperties => ({
    width: notepadWidth,
    transition: `width ${ANIMATION_DURATION}ms ${TRANSITION_EASE}`,
    overflow: panelState === 'chat-full' ? 'hidden' : 'visible',
    opacity: panelState === 'chat-full' ? 0 : 1,
  }), [notepadWidth, panelState])

  return {
    panelState,
    chatWidth,
    notepadWidth,
    isAnimating,
    setChatFullScreen,
    setNotepadFullScreen,
    restoreSplitView,
    getChatContainerStyle,
    getNotepadContainerStyle,
  }
}
