import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Image, Video, Mic } from 'lucide-react';
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
      return 'bg-purple-50 border-purple-200 hover:border-purple-300';
    }
    if (note.title?.toLowerCase().includes('vlog')) {
      return 'bg-red-50 border-red-200 hover:border-red-300';
    }
    if (note.title?.toLowerCase().includes('inspiration') || note.title?.toLowerCase().includes('ootd')) {
      return 'bg-orange-50 border-orange-200 hover:border-orange-300';
    }
    return 'bg-blue-50 border-blue-200 hover:border-blue-300';
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
                <Video className="w-4 h-4 text-red-500" />
              ) : (
                <Image className="w-4 h-4 text-blue-500" />
              )}
            </div>
          )}
          <h3 className="font-semibold text-gray-900 flex-1 pr-8 line-clamp-2">
            {note.title || 'Content Idea'}
          </h3>
        </div>

        {/* Hashtags */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {hashtags.map((hashtag, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-background/60 rounded-full text-gray-600 font-medium"
              >
                {hashtag}
              </span>
            ))}
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-gray-700 line-clamp-4">
          {contentPreview}
        </div>

        {/* Media placeholder for certain content types */}
        {note.title?.toLowerCase().includes('ootd') && (
          <div className="mt-3 h-24 bg-gradient-to-r from-orange-100 to-pink-100 rounded border border-orange-200 flex items-center justify-center">
            <Image className="w-6 h-6 text-orange-400" />
          </div>
        )}

        {/* Audio waveform for script content */}
        {note.type === 'content_script' && (
          <div className="mt-3 flex items-center gap-1 h-8">
            <Mic className="w-4 h-4 text-purple-500" />
            <div className="flex items-end gap-0.5 flex-1">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-purple-300 rounded-full"
                  style={{
                    width: '2px',
                    height: `${Math.random() * 20 + 4}px`
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">0:35</span>
          </div>
        )}
      </div>
    </BaseCard>
  );
} 