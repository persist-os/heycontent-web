import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Heart, Smile, Brain, Lightbulb, Target, TrendingUp } from 'lucide-react';
import { NoteContentRenderer } from '../NoteContentRenderer';

interface ReflectionCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
}

export function ReflectionCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant 
}: ReflectionCardProps) {
  // Extract mood or sentiment from content
  const extractMood = (content: string): 'positive' | 'reflective' | 'growth' | 'neutral' => {
    const lowerContent = content.toLowerCase();
    
    // Positive emotions
    if (lowerContent.includes('grateful') || lowerContent.includes('happy') || 
        lowerContent.includes('excited') || lowerContent.includes('proud') ||
        lowerContent.includes('accomplished') || lowerContent.includes('joy')) {
      return 'positive';
    }
    
    // Growth-oriented
    if (lowerContent.includes('learn') || lowerContent.includes('grow') || 
        lowerContent.includes('improve') || lowerContent.includes('progress') ||
        lowerContent.includes('goal') || lowerContent.includes('achievement')) {
      return 'growth';
    }
    
    // Reflective/thoughtful
    if (lowerContent.includes('think') || lowerContent.includes('reflect') || 
        lowerContent.includes('consider') || lowerContent.includes('realize') ||
        lowerContent.includes('understand') || lowerContent.includes('insight')) {
      return 'reflective';
    }
    
    return 'neutral';
  };

  const mood = extractMood(note.content || '');

  const getMoodIcon = () => {
    switch (mood) {
      case 'positive':
        return <Smile className="w-4 h-4 text-blue-600" />;
      case 'growth':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'reflective':
        return <Brain className="w-4 h-4 text-blue-600" />;
      default:
        return <Heart className="w-4 h-4 text-blue-600" />;
    }
  };

  const getMoodLabel = () => {
    switch (mood) {
      case 'positive':
        return 'Positive Reflection';
      case 'growth':
        return 'Growth & Goals';
      case 'reflective':
        return 'Deep Thinking';
      default:
        return 'Personal Journal';
    }
  };

  // Extract key insight or quote
  const extractKeyInsight = (content: string): string | null => {
    // Look for quoted text first
    const quotedMatch = content.match(/"([^"]+)"/);
    if (quotedMatch && quotedMatch[1].length > 10) return quotedMatch[1];
    
    // Look for sentences with key reflection words
    const sentences = content.split(/[.!?]/).filter(s => s.trim().length > 15);
    const insightSentence = sentences.find(s => {
      const lower = s.toLowerCase();
      return lower.includes('realize') || lower.includes('learned') || 
             lower.includes('understand') || lower.includes('insight') ||
             lower.includes('grateful') || lower.includes('feel');
    });
    
    if (insightSentence) {
      return insightSentence.trim().substring(0, 120);
    }
    
    return null;
  };

  // Extract reflection themes
  const extractThemes = (content: string): string[] => {
    const themes: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('grateful') || lowerContent.includes('gratitude')) {
      themes.push('Gratitude');
    }
    if (lowerContent.includes('goal') || lowerContent.includes('objective')) {
      themes.push('Goals');
    }
    if (lowerContent.includes('growth') || lowerContent.includes('develop')) {
      themes.push('Growth');
    }
    if (lowerContent.includes('challenge') || lowerContent.includes('difficult')) {
      themes.push('Challenges');
    }
    if (lowerContent.includes('relationship') || lowerContent.includes('people')) {
      themes.push('Relationships');
    }
    if (lowerContent.includes('work') || lowerContent.includes('career')) {
      themes.push('Career');
    }
    
    return themes.slice(0, 3);
  };

  const keyInsight = extractKeyInsight(note.content || '');
  const themes = extractThemes(note.content || '');

  return (
    <BaseCard
      note={note}
      className="border-blue-500/30 hover:border-blue-500/50"
      hoverBgClass="hover:bg-blue-500/10"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header with mood icon and type */}
        <div className="flex items-center gap-2 mb-3">
          {getMoodIcon()}
          <div className="flex-1 pr-8">
            <h3 className="font-semibold text-foreground line-clamp-1">
              {(note.title && note.title.trim()) || getMoodLabel()}
            </h3>
            <p className="text-xs text-muted-foreground">
              {getMoodLabel()}
            </p>
          </div>
        </div>

        {/* Key insight highlight */}
        {keyInsight && (
          <div className="mb-3 p-3 bg-muted/30 rounded-lg border-l-4 border-blue-500/50">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-foreground italic line-clamp-3">
                "{keyInsight}"
              </div>
            </div>
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-muted-foreground line-clamp-4 mb-3">
          {note.content ? (
            <NoteContentRenderer 
              content={note.content && keyInsight 
                ? note.content.replace(keyInsight, '').trim()
                : note.content
              }
              availableNotes={availableNotes}
            />
          ) : (
            'Start your reflection...'
          )}
        </div>

      </div>
    </BaseCard>
  );
} 