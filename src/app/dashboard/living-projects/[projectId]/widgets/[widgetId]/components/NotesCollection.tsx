/**
 * NOTES COLLECTION
 * 
 * Elegant display of connected notes
 */

'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import type { ConnectedNote } from '../types'

interface NotesCollectionProps {
  notes: ConnectedNote[]
  onNoteClick: (noteId: string) => void
}

export function NotesCollection({ notes, onNoteClick }: NotesCollectionProps) {
  if (notes.length === 0) {
    return null
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-teal-500" />
        <h3 className="text-lg font-light text-foreground">
          Notes
          <span className="text-muted-foreground ml-2 text-sm">
            {notes.length}
          </span>
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {notes.map((note) => (
          <Card
            key={note._id}
            className="border-border/30 hover:border-teal-400/40 transition-colors duration-300"
          >
            <button
              onClick={() => onNoteClick(note._id)}
              className="w-full text-left p-4 hover:bg-muted/20 transition-colors duration-300"
            >
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">
                  {note.title}
                </h4>
                
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(note.createdAt)}</span>
                  {note.tags && note.tags.length > 0 && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{note.tags.join(', ')}</span>
                    </>
                  )}
                </div>
              </div>
            </button>
          </Card>
        ))}
      </div>
    </div>
  )
}

