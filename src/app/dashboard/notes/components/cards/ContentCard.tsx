import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NoteContentRenderer } from '../NoteContentRenderer';

interface ContentCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function ContentCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant 
}: ContentCardProps) {
  // Extract hashtags and mentions from content
  const extractHashtags = (content: string): string[] => {
    const hashtags = content.match(/#\w+/g) || [];
    return hashtags.slice(0, 3);
  };

  // Get card color based on note type or content
  const getCardColor = () => {
    if (note.type === 'content_script') {
      return 'border-accent/30 hover:border-accent/50';
    }
    if (note.type === 'idea_bank') {
      return 'border-red-500/30 hover:border-red-500/50';
    }
    if (note.title?.toLowerCase().includes('vlog')) {
      return 'border-red-500/30 hover:border-red-500/50';
    }
    if (note.title?.toLowerCase().includes('inspiration') || note.title?.toLowerCase().includes('ootd')) {
      return 'border-red-500/30 hover:border-red-500/50';
    }
    return 'border-accent/30 hover:border-accent/50';
  };

  // Get hover background class based on note type or content
  const getHoverBgClass = () => {
    if (note.type === 'content_script') {
      return 'hover:bg-accent/10';
    }
    if (note.type === 'idea_bank') {
      return 'hover:bg-red-500/10';
    }
    if (note.title?.toLowerCase().includes('vlog')) {
      return 'hover:bg-red-500/10';
    }
    if (note.title?.toLowerCase().includes('inspiration') || note.title?.toLowerCase().includes('ootd')) {
      return 'hover:bg-red-500/10';
    }
    return 'hover:bg-accent/10';
  };

  // Get icon color based on type
  const getIconColor = () => {
    if (note.type === 'content_script') {
      return 'text-accent';
    }
    if (note.type === 'idea_bank') {
      return 'text-red-600';
    }
    return 'text-accent';
  };

  // Determine if this is a media-heavy content
  const hasMediaContent = note.content?.includes('visual') || 
                          note.content?.includes('photo') || 
                          note.content?.includes('video') ||
                          note.title?.toLowerCase().includes('vlog');

  const hashtags = extractHashtags(note.content || '');
  // Don't truncate content before parsing - let CSS handle visual truncation
  const contentForRendering = note.content?.replace(/#\w+/g, '').trim() || '';

  return (
    <BaseCard
      note={note}
      className={getCardColor()}
      hoverBgClass={getHoverBgClass()}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header with icon */}
        <div className="flex items-start gap-2 mb-3">
          {hasMediaContent && (
            <div className="mt-1">
              {note.title?.toLowerCase().includes('vlog') ? (
                <Video className={cn("w-4 h-4", getIconColor())} />
              ) : (
                <Image className={cn("w-4 h-4", getIconColor())} />
              )}
            </div>
          )}
          <h3 className="font-semibold text-foreground flex-1 pr-8 line-clamp-2">
            {(note.title && note.title.trim()) || 'Content Idea'}
          </h3>
        </div>

        {/* Content preview - CSS handles truncation after note links are rendered */}
        <div className="text-sm text-muted-foreground line-clamp-4">
          <NoteContentRenderer 
            content={contentForRendering} 
            availableNotes={availableNotes}
          />
        </div>

        {/* Media placeholder for certain content types */}
        {note.title?.toLowerCase().includes('ootd') && (
          <div className="mt-3 h-24 bg-gradient-to-r from-red-500/20 to-purple-500/20 rounded border border-red-500/30 flex items-center justify-center">
            <Image className="w-6 h-6 text-red-600" />
          </div>
        )}
      </div>
    </BaseCard>
  );
} 