'use client'

/**
 * Thinking Lab Page
 *
 * Main page for the integrated thinking lab experience.
 * Provides dialogue, reflection, and insight capabilities in one interface.
 */

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { FullThinkingLab } from './compositions/LabCompositions'

export default function ThinkingLabPage() {
  const searchParams = useSearchParams()
  
  // DEBUGGING: Log all URL parameters to trace persona ID issue
  const noteId = searchParams.get('noteId')
  const chatId = searchParams.get('chatId')
  const query = searchParams.get('query')
  const widgetOutputId = searchParams.get('widgetOutputId')
  
  console.log('🚨 [THINKING LAB PAGE] URL Parameters:', {
    noteId,
    chatId,
    query,
    widgetOutputId,
    allParams: Object.fromEntries(searchParams.entries()),
    url: typeof window !== 'undefined' ? window.location.href : 'SSR'
  })
  
  // VALIDATION: Check if noteId looks like a persona ID (deprecated system)
  if (noteId) {
      return (
        <FullThinkingLab 
          chatId={chatId || undefined}
          noteId={undefined} // Don't pass persona ID
          askQuery={query || undefined}
          widgetOutputId={widgetOutputId || undefined}
        />
      )
  }
  
  return (
    <FullThinkingLab 
      chatId={chatId || undefined}
      noteId={noteId || undefined}
      askQuery={query || undefined}
      widgetOutputId={widgetOutputId || undefined}
    />
  )
}
