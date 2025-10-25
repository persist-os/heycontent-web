'use client'

/**
 * Thinking Lab Page
 *
 * Main page for the integrated thinking lab experience.
 * Provides dialogue, reflection, and insight capabilities in one interface.
 */

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { FullThinkingLab } from './compositions/LabCompositions'
// Removed dialogueStore import - using conversation hooks instead

/**
 * Validates that a URL parameter is a valid non-empty string
 */
function isValidParam(value: string | null): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export default function ThinkingLabPage() {
  const searchParams = useSearchParams()
  
  const noteId = searchParams.get('noteId')
  const chatId = searchParams.get('chatId')
  const query = searchParams.get('query')
  const widgetOutputId = searchParams.get('widgetOutputId')
  const projectId = searchParams.get('projectId')
  const widgetId = searchParams.get('widgetId')
  
  // Initialize context container from URL params (survives refresh per tab)
  useEffect(() => {
    // Validate and normalize context parameters
    const validProjectId = isValidParam(projectId) ? projectId : undefined
    const validWidgetId = isValidParam(widgetId) ? widgetId : undefined
    const validWidgetOutputId = isValidParam(widgetOutputId) ? widgetOutputId : undefined
    
    // Only set context if at least one valid context param exists
    if (validProjectId || validWidgetId || validWidgetOutputId) {
      console.log('[THINKING LAB] Initializing context container from URL:', {
        projectId: validProjectId,
        widgetId: validWidgetId,
        widgetOutputId: validWidgetOutputId
      });
      // Note: Project context now handled by conversation hooks
      console.log('Project context:', { validProjectId, validWidgetId, validWidgetOutputId });
    } else if (projectId !== null || widgetId !== null || widgetOutputId !== null) {
      // Context params exist but are invalid/empty - clear context
      console.log('[THINKING LAB] Invalid context params detected - clearing context');
      // Note: Project context clearing now handled by conversation hooks
      console.log('Clearing project context');
    }
    // Note: If no context params at all, we don't clear (might be navigating within lab)
  }, [projectId, widgetId, widgetOutputId]);
  
  return (
    <FullThinkingLab 
      chatId={chatId || undefined}
      noteId={noteId || undefined}
      askQuery={query || undefined}
      widgetOutputId={widgetOutputId || undefined}
      projectId={projectId || undefined}
      widgetId={widgetId || undefined}
    />
  )
}
