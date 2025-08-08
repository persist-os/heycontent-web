'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Tag } from 'lucide-react';

// Constants
const MAX_DISPLAYED_NOTES = 3;
const MAX_DISPLAYED_TAGS = 2;

// Utility Functions
const formatTimeAgo = (timestamp: number): string => {
  const now = typeof window !== 'undefined' ? Date.now() : timestamp;
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Just now';
};

const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

interface Note {
  readonly _id: string;
  readonly title?: string;
  readonly content?: string;
  readonly type?: string;
  readonly tags?: readonly string[];
  readonly updatedAt?: number;
  readonly _creationTime: number;
}

interface AssociatedNotesProps {
  readonly notes: readonly Note[];
  readonly onViewNote: (noteId: string) => void;
}

export function AssociatedNotes({
  notes,
  onViewNote
}: AssociatedNotesProps) {
  return (
    <div className="pt-0">
      <Card className="p-4 shadow-none border-0">
        <div className="space-y-3 md:space-y-4">
          <h3 className="font-medium text-foreground flex items-center text-sm md:text-base">
            <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
            Associated Notes ({notes.length})
          </h3>
          
          {notes.length > 0 ? (
            <div className="space-y-2">
              {notes.slice(0, MAX_DISPLAYED_NOTES).map((note) => (
                <div key={String(note._id)} className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {note.title || 'Untitled Note'}
                      </p>
                      {note.type && (
                        <span className="text-xs font-medium text-muted-foreground">
                          {note.type.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                        {truncateText(note.content, 80)}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatTimeAgo(note.updatedAt || note._creationTime)}</span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>{note.tags.slice(0, MAX_DISPLAYED_TAGS).join(', ')}</span>
                          {note.tags.length > MAX_DISPLAYED_TAGS && (
                            <span>+{note.tags.length - MAX_DISPLAYED_TAGS}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewNote(String(note._id))}
                    className="ml-3 shrink-0"
                  >
                    View
                  </Button>
                </div>
              ))}
              {notes.length > MAX_DISPLAYED_NOTES && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    +{notes.length - MAX_DISPLAYED_NOTES} more notes
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Perfect canvas for your next masterpiece</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create notes about this partnership and watch your collaboration strategy come to life right here
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
