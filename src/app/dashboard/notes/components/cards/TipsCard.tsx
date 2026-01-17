import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { T } from '@/components/translation/T';

interface TipsCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  onShare?: (noteId: string) => void;
}

export function TipsCard({ 
  note, 
  onEdit, 
  onDelete, 
  onToggleImportant,
  onShare 
}: TipsCardProps) {
  // Parse tips from note content
  const parseTips = (content: string): string[] => {
    const lines = content.split('\n');
    const tips: string[] = [];
    
    lines.forEach(line => {
      const trimmed = line.trim();
      // Look for bullet points, numbered lists, or tip markers
      if (trimmed.match(/^[-*•]\s/) || trimmed.match(/^\d+\.\s/) || trimmed.match(/^tip[:\s]/i)) {
        const tipText = trimmed
          .replace(/^[-*•]\s/, '')
          .replace(/^\d+\.\s/, '')
          .replace(/^tip[:\s]/i, '');
        
        if (tipText.length > 0) {
          tips.push(tipText);
        }
      } else if (trimmed && !trimmed.startsWith('#') && tips.length === 0) {
        // If no bullet points found, treat each line as a tip
        tips.push(trimmed);
      }
    });
    
    return tips.slice(0, 4); // Show max 4 tips
  };

  const tips = parseTips(note.content || '');

  // Determine if this is a HeyContext tip or general tip
  const isHeyContextTip = note.title?.toLowerCase().includes('heycontext') || 
                          note.content?.toLowerCase().includes('heycontext');

  return (
    <BaseCard
      note={note}
      className="border-yellow-500/30 hover:border-yellow-500/50"
      hoverBgClass="hover:bg-yellow-500/10"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
      onShare={onShare}
    >
      <div className="p-4">
        {/* Header with HeyContext icon */}
        <div className="flex items-center gap-2 mb-3">
          {isHeyContextTip ? (
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">HC</span>
            </div>
          ) : (
            <Lightbulb className="w-4 h-4 text-yellow-600" />
          )}
          <h3 className="font-semibold text-foreground flex-1 pr-8 line-clamp-1">
            {note.title || <T context="tips.default_title">Tips & Advice</T>}
          </h3>
        </div>

        {/* Tips list */}
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <span className="text-sm text-foreground line-clamp-2">
                {tip}
              </span>
            </div>
          ))}
          
          {tips.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              <T context="tips.empty_state">No tips yet</T>
            </div>
          )}
          
          {note.content && note.content.split('\n').length > tips.length && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <span>
                +{note.content.split('\n').length - tips.length} <T context="tips.more_count">more tips</T>
              </span>
            </div>
          )}
        </div>

        {/* Footer with category or source */}
        {isHeyContextTip && (
          <div className="mt-3 pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-yellow-600" />
              <span className="text-xs text-muted-foreground">
                <T context="tips.heycontext_brand">HeyContext Tips</T>
              </span>
            </div>
          </div>
        )}
      </div>
    </BaseCard>
  );
} 