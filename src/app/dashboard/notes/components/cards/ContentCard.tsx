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
  onShare?: (noteId: string) => void;
}

export function ContentCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant,
  onShare 
}: ContentCardProps) {
  // Extract hashtags and mentions from content
  const extractHashtags = (content: string): string[] => {
    const hashtags = content.match(/#\w+/g) || [];
    return hashtags.slice(0, 3);
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
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
      onShare={onShare}
    >
      {/* Title - AssignmentArtifactCard style */}
      <h3 className="text-[24px] font-semibold leading-[36px] tracking-[-0.72px] text-[hsl(var(--assignment-text-regular))] line-clamp-1 overflow-hidden">
        {(note.title && note.title.trim()) || 'Untitled Idea'}
      </h3>
      {/* Subtitle - Content preview */}
      {contentForRendering && (
        <p className="text-[16px] font-normal leading-[20px] text-[hsl(var(--assignment-text-subtle))] line-clamp-1 overflow-hidden">
          {contentForRendering}
        </p>
      )}
    </BaseCard>
  );
} 