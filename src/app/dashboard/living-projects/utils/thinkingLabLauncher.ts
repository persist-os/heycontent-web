/**
 * THINKING LAB LAUNCHER UTILITY
 * 
 * Unified, foolproof routing for launching the Thinking Lab from widget outputs.
 * This ensures consistent behavior across all widget components.
 */

import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export interface WidgetOutputReference {
  noteId: string
  outputId?: string
  _id?: string
}

/**
 * Launch the Thinking Lab with a widget output context
 * 
 * @param router - Next.js router instance
 * @param output - Widget output containing noteId and outputId
 */
export function launchThinkingLabWithOutput(
  router: AppRouterInstance,
  output: WidgetOutputReference
): void {
  if (!output.noteId) {
    console.error('[ThinkingLabLauncher] Cannot launch: noteId is missing from output', output)
    return
  }

  // Use outputId if available, otherwise fall back to _id
  const widgetOutputId = output.outputId || output._id

  if (!widgetOutputId) {
    console.warn('[ThinkingLabLauncher] No outputId found, launching with noteId only')
    router.push(`/dashboard/thinking_lab?noteId=${output.noteId}`)
    return
  }

  // Build the full URL with both noteId and widgetOutputId
  const url = `/dashboard/thinking_lab?noteId=${output.noteId}&widgetOutputId=${widgetOutputId}`
  
  console.log('[ThinkingLabLauncher] Launching Thinking Lab:', { 
    noteId: output.noteId, 
    widgetOutputId,
    url 
  })

  router.push(url)
}

/**
 * Launch the Thinking Lab with just a note ID
 * 
 * @param router - Next.js router instance
 * @param noteId - The note ID to open
 */
export function launchThinkingLabWithNote(
  router: AppRouterInstance,
  noteId: string
): void {
  if (!noteId) {
    console.error('[ThinkingLabLauncher] Cannot launch: noteId is missing')
    return
  }

  const url = `/dashboard/thinking_lab?noteId=${noteId}`
  
  console.log('[ThinkingLabLauncher] Launching Thinking Lab with note:', { noteId, url })

  router.push(url)
}

