/**
 * Thinking Lab Main Export
 *
 * Clean, modern lab interface with no legacy compatibility.
 * Designed for the future, not the past.
 */

import React from 'react'
import { FullThinkingLab, type LabCompositionProps } from './compositions/LabCompositions'

// =============================================================================
// MAIN EXPORT - CLEAN & MODERN
// =============================================================================

interface ThinkingLabProps extends LabCompositionProps {
    // Clean, purposeful props only
    chatId?: string
    noteId?: string
    askQuery?: string
    contentContext?: any
    className?: string
}

function ThinkingLab({
                         chatId,
                         noteId,
                         askQuery,
                         contentContext,
                         className
                     }: ThinkingLabProps) {
    return (
        <FullThinkingLab
            className={className}
            chatId={chatId}
            noteId={noteId}
            askQuery={askQuery}
            contentContext={contentContext}
        />
    )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default ThinkingLab

// Named exports for building blocks
export { FullThinkingLab } from './compositions/LabCompositions'
export { useDialogueStore } from './stores/dialogueStore'
export { useLayoutStore } from './stores/layoutStore'

// Type exports
export type { ThinkingLabProps, LabCompositionProps }