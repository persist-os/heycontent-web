import React from 'react';
import { BaseCard } from './BaseCard';
import { Note } from '../../types';
import { TrendingUp, BarChart3, Target } from 'lucide-react';
import { NoteContentRenderer } from '../NoteContentRenderer';

interface AnalyticsCardProps {
  note: Note;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onToggleImportant?: (noteId: string) => void;
  onShare?: (noteId: string) => void;
}

export function AnalyticsCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant,
  onShare 
}: AnalyticsCardProps) {
  // Extract real metrics from content
  const extractMetrics = (content: string) => {
    const growthMatch = content.match(/growth[:\s]+(\d+)%/i);
    const retentionMatch = content.match(/retention[:\s]+(\d+)%/i);
    const engagementMatch = content.match(/engagement[:\s]+(\d+)%/i);
    const viewsMatch = content.match(/views?[:\s]+(\d+[kKmM]?)/i);
    
    return {
      growth: growthMatch ? parseInt(growthMatch[1]) : null,
      retention: retentionMatch ? parseInt(retentionMatch[1]) : null,
      engagement: engagementMatch ? parseInt(engagementMatch[1]) : null,
      views: viewsMatch ? viewsMatch[1] : null
    };
  };

  const metrics = extractMetrics(note.content || '');
  const hasMetrics = Object.values(metrics).some(value => value !== null);

  return (
    <BaseCard
      note={note}
      className="border-l-2 border-l-purple-400/40"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
      onShare={onShare}
    >
      <div className="space-y-4">
        {/* Header with elegant typography */}
        <div className="space-y-2">
          <h3 className="text-lg font-light text-foreground leading-tight tracking-tight line-clamp-2">
            {(note.title && note.title.trim()) || 'Performance Insights'}
          </h3>
          
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-purple-600/70" />
            <span className="text-xs font-light text-purple-600/70 bg-purple-50/50 dark:bg-purple-950/20 px-2 py-0.5 rounded-md">
              Analytics
            </span>
          </div>
        </div>

        {/* Elegant metrics display */}
        {hasMetrics && (
          <div className="space-y-3">
            <h4 className="text-xs font-light text-muted-foreground/70 tracking-wide uppercase">
              Key Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {metrics.growth !== null && (
                <div className="space-y-1">
                  <div className="text-2xl font-light text-purple-600/90 tracking-tight">
                    {metrics.growth}%
                  </div>
                  <div className="text-xs font-light text-muted-foreground/70">Growth</div>
                </div>
              )}
              {metrics.retention !== null && (
                <div className="space-y-1">
                  <div className="text-2xl font-light text-purple-600/90 tracking-tight">
                    {metrics.retention}%
                  </div>
                  <div className="text-xs font-light text-muted-foreground/70">Retention</div>
                </div>
              )}
              {metrics.engagement !== null && (
                <div className="space-y-1">
                  <div className="text-2xl font-light text-purple-600/90 tracking-tight">
                    {metrics.engagement}%
                  </div>
                  <div className="text-xs font-light text-muted-foreground/70">Engagement</div>
                </div>
              )}
              {metrics.views !== null && (
                <div className="space-y-1">
                  <div className="text-2xl font-light text-purple-600/90 tracking-tight">
                    {metrics.views}
                  </div>
                  <div className="text-xs font-light text-muted-foreground/70">Views</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content with breathing space */}
        {note.content && (
          <div className="space-y-2">
            {hasMetrics && (
              <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
            )}
            <div className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-3 font-light">
              <NoteContentRenderer 
                content={note.content} 
                availableNotes={availableNotes}
              />
            </div>
          </div>
        )}

        {!note.content && (
          <div className="text-sm text-muted-foreground/60 italic font-light py-4 text-center">
            Add your performance insights here
          </div>
        )}
      </div>
    </BaseCard>
  );
} 