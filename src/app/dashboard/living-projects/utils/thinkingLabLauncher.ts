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
  projectId?: string
  widgetId?: string
}

/**
 * Launch the Thinking Lab with a widget output context
 * 
 * @param router - Next.js router instance
 * @param output - Widget output containing noteId and outputId
 * @param projectId - Optional project context (can also be in output)
 * @param widgetId - Optional widget context (can also be in output)
 */
export function launchThinkingLabWithOutput(
  router: AppRouterInstance,
  output: WidgetOutputReference,
  projectId?: string,
  widgetId?: string
): void {
  if (!output.noteId) {
    console.error('[ThinkingLabLauncher] Cannot launch: noteId is missing from output', output)
    return
  }

  // Use outputId if available, otherwise fall back to _id
  const widgetOutputId = output.outputId || output._id
  
  // Use provided IDs or fall back to output properties
  const finalProjectId = projectId || output.projectId
  const finalWidgetId = widgetId || output.widgetId

  if (!widgetOutputId) {
    console.warn('[ThinkingLabLauncher] No outputId found, launching with noteId only')
    const baseUrl = `/dashboard/thinking_lab?noteId=${output.noteId}`
    const urlWithContext = finalProjectId 
      ? `${baseUrl}&projectId=${finalProjectId}${finalWidgetId ? `&widgetId=${finalWidgetId}` : ''}`
      : baseUrl
    router.push(urlWithContext)
    return
  }

  // Build the full URL with all context parameters
  let url = `/dashboard/thinking_lab?noteId=${output.noteId}&widgetOutputId=${widgetOutputId}`
  if (finalProjectId) {
    url += `&projectId=${finalProjectId}`
  }
  if (finalWidgetId) {
    url += `&widgetId=${finalWidgetId}`
  }
  
  console.log('[ThinkingLabLauncher] Launching Thinking Lab:', { 
    noteId: output.noteId, 
    widgetOutputId,
    projectId: finalProjectId,
    widgetId: finalWidgetId,
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

