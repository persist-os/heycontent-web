/**
 * CONNECTED NOTE CARD COMPONENT
 * 
 * Displays a connected note with preview, metadata, and navigation
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { truncateContent } from '../utils'
import type { ConnectedNote } from '../types'
import { T } from '@/components/translation'

interface ConnectedNoteCardProps {
  note: ConnectedNote
  onNoteClick: (noteId: string) => void
}

export function ConnectedNoteCard({ note, onNoteClick }: ConnectedNoteCardProps) {
  const [showMetadata, setShowMetadata] = useState(false)
  
  const createdDate = new Date(note.createdAt)
  const updatedDate = new Date(note.updatedAt)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div
      className="border border-border/50 hover:border-border transition-all duration-300 cursor-pointer group"
      onClick={() => onNoteClick(note._id)}
    >
      <div className="p-6 space-y-4">
        {/* Title and Preview */}
        <div className="space-y-3">
          <h3 className="text-xl font-light tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
            <T context="widget.note_title">{note.title || 'Untitled Note'}</T>
          </h3>
          
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {truncateContent(note.content || '', 200)}
          </p>
        </div>

        {/* Metadata Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <div className="flex items-baseline gap-4 text-xs text-muted-foreground">
            <span>{formatDate(createdDate)}</span>
            {note.tags && note.tags.length > 0 && (
              <span><T context="widget.tags_count">{note.tags.length} tags</T></span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowMetadata(!showMetadata)
            }}
            className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
          >
            {showMetadata ? <T context="button.hide_details">Hide Details</T> : <T context="button.show_details">Show Details</T>}
          </Button>
        </div>

        {/* Expandable Metadata */}
        {showMetadata && (
          <div className="pt-4 space-y-3 border-t border-border/30">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-muted-foreground"><T context="widget.created">Created</T></span>
                <p className="text-foreground font-light">{formatDate(createdDate)}</p>
              </div>
              
              <div>
                <span className="text-muted-foreground"><T context="widget.updated">Updated</T></span>
                <p className="text-foreground font-light">{formatDate(updatedDate)}</p>
              </div>
              
              {note.type && (
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <p className="text-foreground font-light">{note.type.replace(/_/g, ' ')}</p>
                </div>
              )}
              
              {note.platform && (
                <div>
                  <span className="text-muted-foreground">Platform</span>
                  <p className="text-foreground font-light">{note.platform}</p>
                </div>
              )}
            </div>

            {note.tags && note.tags.length > 0 && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">Tags</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 border border-border/50 text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {note.references && note.references.length > 0 && (
              <div className="pt-2">
                <span className="text-sm text-muted-foreground">References</span>
                <p className="text-xs text-foreground/60 mt-1">{note.references.length} linked items</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

