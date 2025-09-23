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
  
  return (
    <FullThinkingLab 
      chatId={searchParams.get('chatId') || undefined}
      noteId={searchParams.get('noteId') || undefined}
      askQuery={searchParams.get('query') || undefined}
    />
  )
}
