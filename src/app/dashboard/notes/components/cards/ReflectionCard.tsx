import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Heart, Smile, User } from 'lucide-react';

interface ReflectionCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function ReflectionCard({ 
  note, 
  onEdit, 
  onDelete, 
  onToggleImportant 
}: ReflectionCardProps) {
  // Extract mood or sentiment from content
  const extractMood = (content: string): 'positive' | 'neutral' | 'thoughtful' => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('grateful') || lowerContent.includes('happy') || lowerContent.includes('excited')) {
      return 'positive';
    }
    if (lowerContent.includes('think') || lowerContent.includes('reflect') || lowerContent.includes('consider')) {
      return 'thoughtful';
    }
    return 'neutral';
  };

  const mood = extractMood(note.content || '');
  
  // Get card styling based on mood
  const getCardStyle = () => {
    switch (mood) {
      case 'positive':
        return 'bg-green-50 border-green-200 hover:border-green-300';
      case 'thoughtful':
        return 'bg-blue-50 border-blue-200 hover:border-blue-300';
      default:
        return 'bg-gray-50 border-gray-200 hover:border-gray-300';
    }
  };

  const getMoodIcon = () => {
    switch (mood) {
      case 'positive':
        return <Smile className="w-4 h-4 text-green-500" />;
      case 'thoughtful':
        return <User className="w-4 h-4 text-blue-500" />;
      default:
        return <Heart className="w-4 h-4 text-gray-500" />;
    }
  };

  // Extract key phrases or quotes
  const extractHighlight = (content: string): string => {
    // Look for quoted text or sentences with emotional words
    const quotedMatch = content.match(/"([^"]+)"/);
    if (quotedMatch) return quotedMatch[1];
    
    // Look for sentences with reflection keywords
    const sentences = content.split('.').filter(s => s.trim());
    const reflectionSentence = sentences.find(s => 
      s.toLowerCase().includes('feel') || 
      s.toLowerCase().includes('think') || 
      s.toLowerCase().includes('realize')
    );
    
    if (reflectionSentence) {
      return reflectionSentence.trim().substring(0, 100);
    }
    
    return content.substring(0, 100);
  };

  const highlight = extractHighlight(note.content || '');

  return (
    <BaseCard
      note={note}
      className={getCardStyle()}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header with mood icon */}
        <div className="flex items-center gap-2 mb-3">
          {getMoodIcon()}
          <h3 className="font-semibold text-gray-900 flex-1 pr-8 line-clamp-1">
            {note.title || 'Self Check-in'}
          </h3>
        </div>

        {/* Highlighted quote or key phrase */}
        {highlight && (
          <div className="mb-3 p-3 bg-background/60 rounded-lg border-l-4 border-primary/30">
            <div className="text-sm text-gray-700 italic line-clamp-3">
              "{highlight}"
            </div>
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-gray-600 line-clamp-4">
          {note.content && note.content.length > highlight.length 
            ? note.content.replace(highlight, '').substring(0, 150)
            : note.content?.substring(0, 150)
          }
        </div>

        {/* Reflection tags/categories */}
        <div className="mt-3 flex flex-wrap gap-1">
          {mood === 'positive' && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
              Positive
            </span>
          )}
          {note.content?.toLowerCase().includes('growth') && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              Growth
            </span>
          )}
          {note.content?.toLowerCase().includes('goal') && (
            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
              Goals
            </span>
          )}
        </div>
      </div>
    </BaseCard>
  );
} 