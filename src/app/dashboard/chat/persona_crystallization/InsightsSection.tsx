import React from 'react';
import { ExpandableSection, ExpandableContent } from './ExpandableSection';
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import { formatTimestamp } from './utils';
import type { PersonaInsight } from './types';

interface InsightsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  showAdvanced?: boolean;
}

/**
 * Reusable component for displaying crystallized insights
 */
export function InsightsSection({ 
  isExpanded, 
  onToggle, 
  onCopy,
  showAdvanced = false
}: InsightsSectionProps) {
  const data = usePersonaCrystallizationData();

  const renderInsight = (insight: PersonaInsight, index: number) => {
    // Safe fallbacks for new fields
    const insightId = insight.insight_id || `insight_${insight.last_observed}`;
    const supportingCount = insight.supporting_traces?.length || 0;
    const contradictionCount = insight.contradiction_flags?.length || 0;
    const evolutionEvents = insight.evolution_history?.length || 0;
    const correlations = insight.cross_pattern_correlations?.length || 0;
    
    return (
      <div key={index} className="space-y-3 pb-4">
        {/* Main Crystallized Insight - Always First */}
        <p className="text-sm text-foreground leading-relaxed font-medium">
          {insight.crystallized_insight}
        </p>

        {/* Type and Confidence */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{insight.insight_type.replace(/_/g, ' ')}</span>
          <span>{Math.round(insight.confidence * 100)}% crystallized</span>
        </div>

        {/* Core Evidence */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{supportingCount} supporting</span>
          <span>{Math.round(insight.temporal_stability * 100)}% stable</span>
          {correlations > 0 && <span>{correlations} patterns</span>}
          <span>{formatTimestamp(insight.last_observed, { relative: true })}</span>
        </div>

        {/* Advanced Details */}
        {showAdvanced && (
          <div className="space-y-2 border-t border-border/20 pt-3">
            {/* Evidence Foundation */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supporting</span>
                <span>{supportingCount} traces</span>
              </div>
              {contradictionCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contradictions</span>
                  <span className="text-orange-600">{contradictionCount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stability</span>
                <span>{Math.round(insight.temporal_stability * 100)}%</span>
              </div>
              {correlations > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patterns</span>
                  <span>{correlations} linked</span>
                </div>
              )}
            </div>

            {/* Evolution History */}
            {evolutionEvents > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Recent Changes:</div>
                {insight.evolution_history?.slice(0, 2).map((event, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground/80">
                    {event.event_type.replace(/_/g, ' ')} ({event.confidence_change > 0 ? '+' : ''}{Math.round(event.confidence_change * 100)}%) - {formatTimestamp(event.timestamp, { relative: true })}
                  </div>
                ))}
                {insight.evolution_history && insight.evolution_history.length > 2 && (
                  <div className="text-xs text-muted-foreground/60">
                    +{insight.evolution_history.length - 2} more changes
                  </div>
                )}
              </div>
            )}

            {/* Technical Details */}
            <div className="text-xs text-muted-foreground/60 space-y-1">
              <div>ID: {insightId.slice(-8)}</div>
              {insight.creation_timestamp && (
                <div>Created: {formatTimestamp(insight.creation_timestamp, { relative: true })}</div>
              )}
              {insight.metadata?.generation_method && (
                <div>Method: {insight.metadata.generation_method}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <ExpandableSection
        isExpanded={isExpanded}
        onToggle={onToggle}
        onCopy={onCopy}
        title="Crystallized Insights"
        count={data.totalInsights} // Show total count from database
        copyTitle="Copy insights to clipboard"
      />
      
      <ExpandableContent isExpanded={isExpanded} maxHeight="max-h-96">
        {data.crystallizedInsights.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm italic mb-2">No insights have been crystallized yet</p>
            <p className="text-xs text-muted-foreground">
              Insights will appear as conversations provide more data
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.crystallizedInsights.slice(0, 15).map(renderInsight)} {/* Show up to 15 insights */}
            </div>
            {data.crystallizedInsights.length > 15 && (
              <div className="mt-4 p-3 text-center bg-muted/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground">
                  Showing 15 of {data.totalInsights} total insights
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totalInsights - 15} more insights available in database
                </p>
              </div>
            )}
          </>
        )}
      </ExpandableContent>
    </div>
  );
}
