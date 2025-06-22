import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Image, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function ContentCard({ 
  note, 
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
      return 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50';
    }
    if (note.type === 'idea_bank') {
      return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50';
    }
    if (note.title?.toLowerCase().includes('vlog')) {
      return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50';
    }
    if (note.title?.toLowerCase().includes('inspiration') || note.title?.toLowerCase().includes('ootd')) {
      return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50';
    }
    return 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/50';
  };

  // Get icon color based on type
  const getIconColor = () => {
    if (note.type === 'content_script') {
      return 'text-purple-600';
    }
    if (note.type === 'idea_bank') {
      return 'text-red-600';
    }
    return 'text-purple-600';
  };

  // Determine if this is a media-heavy content
  const hasMediaContent = note.content?.includes('visual') || 
                          note.content?.includes('photo') || 
                          note.content?.includes('video') ||
                          note.title?.toLowerCase().includes('vlog');

  const hashtags = extractHashtags(note.content || '');
  const contentPreview = note.content?.replace(/#\w+/g, '').trim().substring(0, 150) || '';

  return (
    <BaseCard
      note={note}
      className={getCardColor()}
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
            {note.title || 'Content Idea'}
          </h3>
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hashtags.map((hashtag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-muted/60 rounded-full text-muted-foreground font-medium"
              >
                {hashtag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-muted-foreground line-clamp-4">
          {contentPreview}
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