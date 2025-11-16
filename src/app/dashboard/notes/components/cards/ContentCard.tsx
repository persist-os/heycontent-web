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
      {/* Content with Figma typography hierarchy */}
      <div className="space-y-2">
        {/* Title - Figma H2: 24px, SemiBold, line-height 36px, tracking -0.72px */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[24px] font-semibold text-[hsl(var(--assignment-text-regular))] leading-[36px] tracking-[-0.72px] line-clamp-2 flex-1">
            {(note.title && note.title.trim()) || 'Untitled Idea'}
          </h3>
          {/* Timestamp - Figma H3: 16px, SemiBold, line-height 24px, tracking -0.48px */}
          <span className="text-[16px] font-semibold text-[hsl(var(--assignment-text-subtle))] leading-[24px] tracking-[-0.48px] whitespace-nowrap">
            {/* Will be populated by BaseCard date section */}
          </span>
        </div>
        
        {/* Content type indicator */}
        <div className="flex items-center gap-2">
          {hasMediaContent && (
            <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--assignment-text-subtle))]">
              {note.title?.toLowerCase().includes('vlog') ? (
                <Video className="w-3 h-3" />
              ) : (
                <Image className="w-3 h-3" />
              )}
              <span className="font-light">Media content</span>
            </div>
          )}
          {note.type === 'content_script' && (
            <span className="text-xs font-semibold text-[hsl(var(--assignment-primary-blue))] bg-[hsl(var(--assignment-primary-container))] px-2 py-0.5 rounded-[8px]">
              Script
            </span>
          )}
          {note.type === 'idea_bank' && (
            <span className="text-xs font-semibold text-[hsl(var(--assignment-accent-orange))] bg-[hsl(var(--assignment-primary-container))] px-2 py-0.5 rounded-[8px]">
              Idea
            </span>
          )}
        </div>

        {/* Content preview - Figma Body/L: 16px, Regular, line-height 20px */}
        {contentForRendering && (
          <div className="text-[16px] font-normal text-[hsl(var(--assignment-text-subtle))] leading-[20px] line-clamp-4">
            <NoteContentRenderer 
              content={contentForRendering} 
              availableNotes={availableNotes}
            />
          </div>
        )}

        {/* Hashtags - Figma: gap-[20px], rounded-[8px] */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-5">
            {hashtags.map((hashtag, index) => (
              <span 
                key={index} 
                className="text-[16px] font-semibold text-[hsl(var(--assignment-primary-blue))] leading-[24px] tracking-[-0.48px]"
              >
                {hashtag}
              </span>
            ))}
          </div>
        )}

        {/* OOTD media preview - Figma styling */}
        {note.title?.toLowerCase().includes('ootd') && (
          <div className="mt-2 h-20 bg-[hsl(var(--assignment-surface-container))] rounded-[12px] border border-[hsl(var(--assignment-outline))] flex items-center justify-center">
            <div className="flex items-center gap-2 text-[hsl(var(--assignment-text-subtle))]">
              <Image className="w-4 h-4" />
              <span className="text-xs font-light">Outfit inspiration</span>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
} 