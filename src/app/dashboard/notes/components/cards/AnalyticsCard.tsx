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
}

export function AnalyticsCard({ 
  note, 
  availableNotes = [],
  onEdit, 
  onDelete, 
  onToggleImportant 
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
      className="bg-pink-500/10 border-pink-500/30 hover:border-pink-500/50"
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleImportant={onToggleImportant}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-pink-600" />
          <h3 className="font-semibold text-foreground flex-1 pr-8 line-clamp-1">
            {note.title || 'Analytics Insight'}
          </h3>
        </div>

        {/* Metrics - only show if we have real data */}
        {hasMetrics && (
          <div className="grid grid-cols-2 gap-3 mb-3">
            {metrics.growth !== null && (
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-lg font-bold text-pink-600">
                  {metrics.growth}%
                </div>
                <div className="text-xs text-muted-foreground">Growth</div>
              </div>
            )}
            {metrics.retention !== null && (
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-lg font-bold text-pink-600">
                  {metrics.retention}%
                </div>
                <div className="text-xs text-muted-foreground">Retention</div>
              </div>
            )}
            {metrics.engagement !== null && (
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-lg font-bold text-pink-600">
                  {metrics.engagement}%
                </div>
                <div className="text-xs text-muted-foreground">Engagement</div>
              </div>
            )}
            {metrics.views !== null && (
              <div className="text-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="text-lg font-bold text-pink-600">
                  {metrics.views}
                </div>
                <div className="text-xs text-muted-foreground">Views</div>
              </div>
            )}
          </div>
        )}

        {/* Content preview */}
        <div className="text-sm text-muted-foreground line-clamp-3">
          {note.content ? (
            <NoteContentRenderer 
              content={note.content} 
              availableNotes={availableNotes}
            />
          ) : (
            'No content yet...'
          )}
        </div>
      </div>
    </BaseCard>
  );
} 