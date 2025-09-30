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
  
  console.log('🚨 [THINKING LAB PAGE] URL Parameters:', {
    noteId,
    chatId,
    query,
    allParams: Object.fromEntries(searchParams.entries()),
    url: window?.location?.href
  })
  
  // VALIDATION: Check if noteId looks like a persona ID (deprecated system)
  if (noteId) {
    const isLikelyPersonaId = noteId.length > 20 && noteId.startsWith('jh7b')
    if (isLikelyPersonaId) {
      console.error('🚨 [PERSONA ID DETECTED] Deprecated persona ID passed as noteId:', {
        noteId,
        stackTrace: new Error().stack
      })
      // Don't pass the persona ID - let the component handle the invalid ID gracefully
      return (
        <FullThinkingLab 
          chatId={chatId || undefined}
          noteId={undefined} // Don't pass persona ID
          askQuery={query || undefined}
        />
      )
    }
  }
  
  return (
    <FullThinkingLab 
      chatId={chatId || undefined}
      noteId={noteId || undefined}
      askQuery={query || undefined}
    />
  )
}
