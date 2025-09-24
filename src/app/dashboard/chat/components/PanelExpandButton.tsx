'use client'

import React from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PanelState } from '../../thinking_lab/components/notepad/hooks/useSplitScreenLayout'

interface PanelExpandButtonProps {
  panelType: 'chat' | 'notepad'
  panelState: PanelState
  onExpand: () => void
  onRestore: () => void
  className?: string
}

export function PanelExpandButton({
  panelType,
  panelState,
  onExpand,
  onRestore,
  className
}: PanelExpandButtonProps) {
  const isFullScreen = 
    (panelType === 'chat' && panelState === 'chat-full') ||
    (panelType === 'notepad' && panelState === 'notepad-full')
  
  const isVisible = panelState === 'split' || isFullScreen
  
  const handleClick = () => {
    if (isFullScreen) {
      onRestore()
    } else {
      onExpand()
    }
  }

  const getTooltipText = () => {
    if (isFullScreen) {
      return `Restore split view (⌘0)`
    }
    const shortcut = panelType === 'chat' ? '⌘1' : '⌘2'
    return `Expand ${panelType} panel (${shortcut})`
  }

  if (!isVisible) return null

  return (
    <button
      onClick={handleClick}
      title={getTooltipText()}
      className={cn(
        "absolute top-3 right-3 z-10",
        "w-8 h-8 rounded-lg",
        "bg-background/80 backdrop-blur-sm",
        "border border-border/40",
        "flex items-center justify-center",
        "opacity-0 group-hover:opacity-100",
        "hover:opacity-100 hover:scale-105",
        "transition-all duration-200 ease-out",
        "hover:bg-background/90 hover:border-border/60",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {isFullScreen ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
    </button>
  )
}
