'use client'

import React from 'react'
import { NoteLink } from './rich-text-editor.types'

interface NoteLinkCardProps {
  note: NoteLink
  onClick: () => void
}

export const NoteLinkCard: React.FC<NoteLinkCardProps> = ({ note, onClick }) => {
  return (
    <span
      onClick={onClick}
      className="inline-flex items-center px-4 py-2 mx-1 my-1 rounded-lg border border-border bg-muted text-lg font-semibold text-foreground cursor-pointer align-middle min-h-[2.8em]"
      style={{ whiteSpace: 'normal', lineHeight: '1.4' }}
    >
      {note.title}
    </span>
  )
} 