'use client'

import React from 'react'
import { Sparkles, Wand2, Loader2, Save, Share2 } from 'lucide-react'

interface ActionButtonsProps {
  onTriggerCommandPalette: () => void
  onGenerateMetadata: () => void
  onSaveNote: () => void
  onShare?: () => void
  shouldShowSmartButton: boolean
  isGeneratingMetadata: boolean
  isCreating: boolean
  isMobile?: boolean
  isReadOnly?: boolean
  notePermission?: "owner" | "read" | "edit" | null
}

export function ActionButtons({
  onTriggerCommandPalette,
  onGenerateMetadata,
  onSaveNote,
  onShare,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  isMobile = false,
  isReadOnly = false,
  notePermission = null
}: ActionButtonsProps) {
  // Minimum 44px touch targets for accessibility
  const buttonSize = isMobile ? "p-3" : "p-3" // 44px minimum (p-3 = 12px padding * 2 + 20px icon = 44px)
  const iconSize = isMobile ? "w-5 h-5" : "w-5 h-5" // 20px icons
  const gap = isMobile ? "gap-2" : "gap-3"

  return (
    <div className={`flex items-center ${gap} flex-shrink-0 h-12`}>
      {/* AI Assistant Button (Sparkles) */}
      <button
        onClick={isReadOnly ? undefined : onTriggerCommandPalette}
        disabled={isReadOnly}
        className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isReadOnly ? "Read-only note" : "AI Assistant (⌘K)"}
      >
        <Sparkles className={iconSize} />
      </button>
      
      {/* Smart Metadata Generation Button (Wand) */}
      {shouldShowSmartButton && (
        <button
          onClick={() => !isGeneratingMetadata && !isReadOnly && onGenerateMetadata()}
          disabled={isGeneratingMetadata || isReadOnly}
          className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isReadOnly ? "Read-only note" : "Generate smart tags"}
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
        onClick={() => !isCreating && !isReadOnly && onSaveNote()}
        disabled={isCreating || isReadOnly}
        className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isReadOnly ? "Read-only note" : "Save note"}
      >
        {isCreating ? (
          <Loader2 className={`${iconSize} animate-spin`} />
        ) : (
          <Save className={iconSize} />
        )}
      </button>

      {/* Share Note Button */}
      {onShare && (
        <button
          onClick={onShare}
          className={`${buttonSize} text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors duration-200 group`}
          title="Share note"
        >
          <Share2 className={`${iconSize} group-hover:text-primary transition-colors duration-200`} />
        </button>
      )}
    </div>
  )
}
