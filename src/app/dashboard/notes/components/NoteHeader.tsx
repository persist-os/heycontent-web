import React, { useState } from 'react';
import type { Note, NoteType } from '../types/index';
import { Lightbulb, Star, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NoteHeaderProps {
  note: Note;
  onUpdate: (noteId: string, updates: Partial<Note>) => void;
  onSave: () => void;
  onBack: () => void;
  isMobile: boolean;
  currentContent?: string;
  fromChat?: boolean;
  canNavigateBack?: boolean;
  backButtonContext?: string;
  navigationStack?: Array<{ noteId: string; timestamp: number; fromLink: boolean }>;
  notes?: Array<{ _id: string; title: string }>;
  onShare?: () => void;
}

export function NoteHeader({ 
  note, 
  onUpdate, 
  onSave, 
  onBack, 
  isMobile, 
  currentContent, 
  fromChat,
  canNavigateBack = false,
  backButtonContext = "Back",
  navigationStack = [],
  notes = [],
  onShare
}: NoteHeaderProps) {
  const handleToggleType = () => {
    onUpdate(String(note._id), { 
      type: note.type === 'idea_bank' ? 'content_script' : 'idea_bank' as NoteType 
    });
  };

  const handleToggleImportant = () => {
    onUpdate(String(note._id), { important: !note.important });
  };

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/30">
      {/* Compact action bar */}
      <div className="px-4 sm:px-6 py-2 flex items-center justify-end gap-2">
        {/* Share button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onShare}
          disabled={!onShare}
          className="h-8 w-8 rounded-lg hover:bg-muted/50 transition-colors shrink-0"
          title="Share note"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Idea bank toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleType}
          className={`h-8 w-8 rounded-lg transition-colors shrink-0 ${
            note.type === 'idea_bank'
              ? 'text-blue-400/80 hover:text-blue-400 hover:bg-blue-400/10'
              : 'text-muted-foreground hover:text-blue-400/60 hover:bg-muted/50'
          }`}
          title={note.type === 'idea_bank' ? 'Idea Bank' : 'Make Idea Bank'}
        >
          <Lightbulb className="h-4 w-4" />
        </Button>

        {/* Important/star toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleImportant}
          className={`h-8 w-8 rounded-lg transition-colors shrink-0 ${
            note.important
              ? 'text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/10'
              : 'text-muted-foreground hover:text-amber-400/60 hover:bg-muted/50'
          }`}
          title={note.important ? 'Important' : 'Mark as important'}
        >
          <Star className={`h-4 w-4 ${note.important ? 'fill-current' : ''}`} />
        </Button>
      </div>
    </div>
  );
}