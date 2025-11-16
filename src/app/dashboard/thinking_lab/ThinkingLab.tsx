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
    conversationId?: string
    noteId?: string
    askQuery?: string
    contentContext?: any
    className?: string
}

function ThinkingLab({
                         conversationId,
                         noteId,
                         askQuery,
                         contentContext,
                         className
                     }: ThinkingLabProps) {
    return (
        <FullThinkingLab
            className={className}
            conversationId={conversationId}
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
// Removed dialogueStore export - using conversation hooks instead
export { useLayoutStore } from './stores/layoutStore'

// Type exports
export type { ThinkingLabProps, LabCompositionProps }