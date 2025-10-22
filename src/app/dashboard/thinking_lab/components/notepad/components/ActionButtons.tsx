'use client'

import React from 'react'
import { Sparkles, Wand2, Loader2, Save, Share2 } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'

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
  // Smaller buttons for compact header layout
  const buttonSize = isMobile ? "p-2" : "p-2" // Smaller padding (p-2 = 8px padding * 2 + 16px icon = 32px)
  const iconSize = isMobile ? "w-4 h-4" : "w-4 h-4" // 16px icons
  const gap = isMobile ? "gap-1" : "gap-2"
  
  // Translations for button titles
  const { text: aiAssistantTitle } = useTranslation('AI Assistant (⌘K)', {
    context: 'notepad.actions.ai_assistant'
  })
  const { text: generateSmartTagsTitle } = useTranslation('Generate smart tags', {
    context: 'notepad.actions.generate_tags'
  })
  const { text: saveNoteTitle } = useTranslation('Save note', {
    context: 'notepad.actions.save'
  })
  const { text: shareNoteTitle } = useTranslation('Share note', {
    context: 'notepad.actions.share'
  })
  const { text: readOnlyTitle } = useTranslation('Read-only note', {
    context: 'notepad.status.read_only'
  })

  return (
    <div className={`flex items-center ${gap} flex-shrink-0 h-8`}>
      {/* AI Assistant Button (Sparkles) */}
      <button
        onClick={isReadOnly ? undefined : onTriggerCommandPalette}
        disabled={isReadOnly}
        className={`${buttonSize} text-[hsl(var(--notepad-icon))] hover:text-[hsl(var(--notepad-icon-hover))] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isReadOnly ? readOnlyTitle : aiAssistantTitle}
      >
        <Sparkles className={iconSize} />
      </button>
      
      {/* Smart Metadata Generation Button (Wand) */}
      {shouldShowSmartButton && (
        <button
          onClick={() => !isGeneratingMetadata && !isReadOnly && onGenerateMetadata()}
          disabled={isGeneratingMetadata || isReadOnly}
          className={`${buttonSize} text-[hsl(var(--notepad-icon))] hover:text-[hsl(var(--notepad-icon-hover))] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isReadOnly ? readOnlyTitle : generateSmartTagsTitle}
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
        className={`${buttonSize} text-[hsl(var(--notepad-icon))] hover:text-[hsl(var(--notepad-icon-hover))] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isReadOnly ? readOnlyTitle : saveNoteTitle}
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
          className={`${buttonSize} text-[hsl(var(--notepad-icon))] hover:text-[hsl(var(--notepad-icon-hover))] hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-all duration-200 group`}
          title={shareNoteTitle}
        >
          <Share2 className={iconSize} />
        </button>
      )}
    </div>
  )
}
