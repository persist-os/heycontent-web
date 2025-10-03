/**
 * CONNECTED NOTE CARD COMPONENT
 * 
 * Displays a connected note with preview, metadata, and navigation
 */

'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ExternalLink, Clock, Hash, Star } from 'lucide-react'
import { truncateContent } from '../utils'
import type { ConnectedNote } from '../types'

interface ConnectedNoteCardProps {
  note: ConnectedNote
  onNoteClick: (noteId: string) => void
}

export function ConnectedNoteCard({ note, onNoteClick }: ConnectedNoteCardProps) {
  const createdDate = new Date(note.createdAt)
  const updatedDate = new Date(note.updatedAt)

  return (
    <Card 
      className="border-border/50 hover:border-border transition-colors cursor-pointer"
      onClick={() => onNoteClick(note._id)}
    >
      <CardContent className="p-6">
        <div className="space-y-3">
          {/* Note Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-foreground mb-2 truncate">
                {note.title || 'Untitled Note'}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{createdDate.toLocaleDateString()}</span>
                </div>
                {note.type && (
                  <Badge variant="outline" className="text-xs">
                    {note.type.replace(/_/g, ' ')}
                  </Badge>
                )}
                {note.important && (
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onNoteClick(note._id)
              }}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Preview */}
          <div className="bg-muted/20 rounded-lg p-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              {truncateContent(note.content || '')}
            </p>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {note.tags.map((tag, idx) => (
                <Badge 
                  key={idx} 
                  variant="outline"
                  className="text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/30">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {updatedDate.toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" />
              <code className="font-mono">{note._id.slice(0, 8)}</code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

