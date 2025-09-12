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
      className="border-l-2 border-l-indigo-400/40"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="space-y-4">
        {/* Header with elegant mood indication */}
        <div className="space-y-2">
          <h3 className="text-lg font-light text-foreground leading-tight tracking-tight line-clamp-2">
            {(note.title && note.title.trim()) || getMoodLabel()}
          </h3>
          
          <div className="flex items-center gap-2">
            {getMoodIcon()}
            <span className="text-xs font-light text-indigo-600/70 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md">
              {getMoodLabel()}
            </span>
          </div>
        </div>

        {/* Key insight with subtle highlighting */}
        {keyInsight && (
          <div className="space-y-2">
            <h4 className="text-xs font-light text-muted-foreground/70 tracking-wide uppercase">
              Key Insight
            </h4>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400/60 to-transparent" />
              <div className="pl-4 text-sm text-foreground/90 leading-relaxed font-light italic line-clamp-3">
                "{keyInsight}"
              </div>
            </div>
          </div>
        )}

        {/* Reflection themes */}
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {themes.map((theme, index) => (
              <span 
                key={index} 
                className="text-xs font-light text-indigo-600/70 bg-indigo-50/30 dark:bg-indigo-950/20 px-2 py-1 rounded-md border border-indigo-200/30 dark:border-indigo-800/30"
              >
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Content with breathing space */}
        {note.content && (
          <div className="space-y-2">
            {(keyInsight || themes.length > 0) && (
              <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            )}
            <div className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-4 font-light">
              <NoteContentRenderer 
                content={note.content && keyInsight 
                  ? note.content.replace(keyInsight, '').trim()
                  : note.content
                }
                availableNotes={availableNotes}
              />
            </div>
          </div>
        )}

        {!note.content && (
          <div className="text-sm text-muted-foreground/60 italic font-light py-4 text-center">
            Begin your reflection journey here
          </div>
        )}
      </div>
    </BaseCard>
  );
} 