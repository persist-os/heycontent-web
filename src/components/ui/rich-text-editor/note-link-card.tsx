'use client'

import React from 'react'
import { NoteLink } from './rich-text-editor.types'

interface NoteLinkCardProps {
  note: NoteLink
  onClick: () => void
}

export const NoteLinkCard: React.FC<NoteLinkCardProps> = ({ note, onClick }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <span
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Open note: ${note.title || 'Untitled Note'}`}
      className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 mx-1 my-1 rounded-lg border border-border bg-muted text-base md:text-lg font-semibold text-foreground cursor-pointer align-middle min-h-[44px] md:min-h-[2.8em] break-words focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      style={{ whiteSpace: 'normal', lineHeight: '1.4' }}
    >
      {note.title || 'Untitled Note'}
    </span>
  )
} 