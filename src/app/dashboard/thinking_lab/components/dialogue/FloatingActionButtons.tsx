/**
 * FloatingActionButtons - Extracted from LabCompositions
 * 
 * Handles floating action buttons for full-screen mode transitions.
 * Clean, reusable component for different full-screen modes.
 */

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FloatingActionButtonsProps {
  isChatFullScreen: boolean
  isNotepadFullScreen: boolean
  onRestoreNotepad: () => void
}

export const FloatingActionButtons = React.memo<FloatingActionButtonsProps>(({
  isChatFullScreen,
  isNotepadFullScreen,
  onRestoreNotepad
}) => {
  return (
    <>
      {/* Floating Restore Notepad Button - appears when chat is full screen */}
      {isChatFullScreen && (
        <button
          onClick={onRestoreNotepad}
          className="fixed top-1/2 right-4 transform -translate-y-1/2 z-50 p-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-xl hover:shadow-2xl hover:bg-muted/40 hover:border-border transition-all duration-200 group"
          title="Restore notepad"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
      
      {/* Floating Expand Chat Button - appears when notepad is full screen */}
      {isNotepadFullScreen && (
        <button
          onClick={onRestoreNotepad}
          className="fixed top-1/2 left-4 transform -translate-y-1/2 z-50 p-3 bg-card/90 backdrop-blur-xl border border-border/50 rounded-full shadow-xl hover:shadow-2xl hover:bg-muted/40 hover:border-border transition-all duration-200 group"
          title="Expand chat"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      )}
    </>
  )
})

FloatingActionButtons.displayName = 'FloatingActionButtons'
