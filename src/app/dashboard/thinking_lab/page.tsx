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
  
  const noteId = searchParams.get('noteId')
  const chatId = searchParams.get('chatId')
  const query = searchParams.get('query')
  const widgetOutputId = searchParams.get('widgetOutputId')
  
  return (
    <FullThinkingLab 
      chatId={chatId || undefined}
      noteId={noteId || undefined}
      askQuery={query || undefined}
      widgetOutputId={widgetOutputId || undefined}
    />
  )
}
