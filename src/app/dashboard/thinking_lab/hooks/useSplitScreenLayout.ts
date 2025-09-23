'use client'

import { useState, useCallback, useEffect } from 'react'

export type PanelState = 'split' | 'dialogue-full' | 'reflection-full'

interface UseSplitScreenLayoutResult {
  panelState: PanelState
  dialogueWidth: string
  reflectionWidth: string
  isAnimating: boolean
  
  // Panel control methods
  setDialogueFullScreen: () => void
  setReflectionFullScreen: () => void
  restoreSplitView: () => void
  
  // Style getters
  getDialogueContainerStyle: () => React.CSSProperties
  getReflectionContainerStyle: () => React.CSSProperties
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

  const setDialogueFullScreen = useCallback(() => {
    if (panelState !== 'dialogue-full') {
      startAnimation()
      setPanelState('dialogue-full')
    }
  }, [panelState, startAnimation])

  const setReflectionFullScreen = useCallback(() => {
    if (panelState !== 'reflection-full') {
      startAnimation()
      setPanelState('reflection-full')
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
          setDialogueFullScreen()
          break
        case '2':
          e.preventDefault()
          setReflectionFullScreen()
          break
        case '0':
          e.preventDefault()
          restoreSplitView()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setDialogueFullScreen, setReflectionFullScreen, restoreSplitView])

  // Calculate widths based on panel state  
  const { dialogueWidth, reflectionWidth } = (() => {
    switch (panelState) {
      case 'dialogue-full':
        return { dialogueWidth: '100%', reflectionWidth: '0%' }
      case 'reflection-full':
        return { dialogueWidth: '0%', reflectionWidth: '100%' }
      case 'split':
      default:
        // Simple 2-panel layout: dialogue 60%, reflection 40%
        return { dialogueWidth: '60%', reflectionWidth: '40%' }
    }
  })()

  const getDialogueContainerStyle = useCallback((): React.CSSProperties => ({
    width: dialogueWidth,
    transition: `width ${ANIMATION_DURATION}ms ${TRANSITION_EASE}, opacity ${ANIMATION_DURATION}ms ${TRANSITION_EASE}`,
    overflow: panelState === 'reflection-full' ? 'hidden' : 'visible',
    opacity: panelState === 'reflection-full' ? 0 : 1,
    pointerEvents: panelState === 'reflection-full' ? 'none' : 'auto',
  }), [dialogueWidth, panelState])

  const getReflectionContainerStyle = useCallback((): React.CSSProperties => ({
    width: reflectionWidth,
    transition: `width ${ANIMATION_DURATION}ms ${TRANSITION_EASE}, opacity ${ANIMATION_DURATION}ms ${TRANSITION_EASE}`,
    overflow: panelState === 'dialogue-full' ? 'hidden' : 'visible',
    opacity: panelState === 'dialogue-full' ? 0 : 1,
    pointerEvents: panelState === 'dialogue-full' ? 'none' : 'auto',
  }), [reflectionWidth, panelState])

  return {
    panelState,
    dialogueWidth,
    reflectionWidth,
    isAnimating,
    setDialogueFullScreen,
    setReflectionFullScreen,
    restoreSplitView,
    getDialogueContainerStyle,
    getReflectionContainerStyle,
  }
}
