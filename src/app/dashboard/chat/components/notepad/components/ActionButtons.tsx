'use client'

import React from 'react'
import { Sparkles, Wand2, Loader2, Save } from 'lucide-react'

interface ActionButtonsProps {
  onTriggerCommandPalette: () => void
  onGenerateMetadata: () => void
  onSaveNote: () => void
  shouldShowSmartButton: boolean
  isGeneratingMetadata: boolean
  isCreating: boolean
  isMobile?: boolean
}

export function ActionButtons({
  onTriggerCommandPalette,
  onGenerateMetadata,
  onSaveNote,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  isMobile = false
}: ActionButtonsProps) {
  const buttonSize = isMobile ? "p-1.5" : "p-2"
  const iconSize = isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
  const gap = isMobile ? "gap-1" : "gap-2"

  return (
    <div className={`flex items-center ${gap}`}>
      {/* AI Assistant Button (Sparkles) */}
      <button
        onClick={onTriggerCommandPalette}
        className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200`}
        title="AI Assistant (⌘K)"
      >
        <Sparkles className={iconSize} />
      </button>
      
      {/* Smart Metadata Generation Button (Wand) */}
      {shouldShowSmartButton && (
        <button
          onClick={() => !isGeneratingMetadata && onGenerateMetadata()}
          disabled={isGeneratingMetadata}
          className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 disabled:opacity-50`}
          title="Generate smart tags"
        >
          {isGeneratingMetadata ? (
            <Loader2 className={`${iconSize} animate-spin`} />
          ) : (
            <Wand2 className={iconSize} />
          )}
        </button>
      )}
      
      {/* Save Note Button */}
      <button
        onClick={() => !isCreating && onSaveNote()}
        disabled={isCreating}
        className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 disabled:opacity-50`}
        title="Save note"
      >
        {isCreating ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <Save className={iconSize} />
        )}
      </button>
    </div>
  )
}
