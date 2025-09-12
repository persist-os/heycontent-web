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
      className={cn(
        "relative",
        // Subtle type-based accent on left edge
        note.type === 'content_script' && "border-l-2 border-l-blue-400/40",
        note.type === 'idea_bank' && "border-l-2 border-l-amber-400/40"
      )}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      {/* Content with improved typography hierarchy */}
      <div className="space-y-4">
        {/* Title with breathing space */}
        <div className="space-y-2">
          <h3 className="text-lg font-light text-foreground leading-tight tracking-tight line-clamp-3">
            {(note.title && note.title.trim()) || 'Untitled Idea'}
          </h3>
          
          {/* Content type indicator */}
          <div className="flex items-center gap-2">
            {hasMediaContent && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                {note.title?.toLowerCase().includes('vlog') ? (
                  <Video className="w-3 h-3" />
                ) : (
                  <Image className="w-3 h-3" />
                )}
                <span className="font-light">Media content</span>
              </div>
            )}
            {note.type === 'content_script' && (
              <span className="text-xs font-light text-blue-600/70 bg-blue-50/50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md">
                Script
              </span>
            )}
            {note.type === 'idea_bank' && (
              <span className="text-xs font-light text-amber-600/70 bg-amber-50/50 dark:bg-amber-950/20 px-2 py-0.5 rounded-md">
                Idea
              </span>
            )}
          </div>
        </div>

        {/* Content preview with better typography */}
        {contentForRendering && (
          <div className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-4 font-light">
            <NoteContentRenderer 
              content={contentForRendering} 
              availableNotes={availableNotes}
            />
          </div>
        )}

        {/* Hashtags with subtle styling */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((hashtag, index) => (
              <span 
                key={index} 
                className="text-xs font-light text-primary/70 bg-primary/5 px-2 py-1 rounded-md"
              >
                {hashtag}
              </span>
            ))}
          </div>
        )}

        {/* OOTD media preview with elegant styling */}
        {note.title?.toLowerCase().includes('ootd') && (
          <div className="mt-4 h-20 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200/30 dark:border-amber-800/30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-amber-600/70">
              <Image className="w-4 h-4" />
              <span className="text-xs font-light">Outfit inspiration</span>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
} 