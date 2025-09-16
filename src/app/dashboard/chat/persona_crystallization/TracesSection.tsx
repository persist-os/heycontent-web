import React from 'react';
import { ExpandableSection, ExpandableContent } from './ExpandableSection';
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import { formatTimestamp } from './utils';
import type { PersonaTrace } from './types';

interface TracesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  showAdvanced?: boolean;
}

/**
 * Reusable component for displaying recent persona traces
 */
export function TracesSection({ 
  isExpanded, 
  onToggle, 
  onCopy,
  showAdvanced = false
}: TracesSectionProps) {
  const data = usePersonaCrystallizationData();

  const renderTrace = (trace: PersonaTrace, index: number) => {
    // Safe fallbacks for new fields
    const verbatimQuote = trace.verbatim_quote || trace.context;
    const traceId = trace.trace_id || `trace_${trace.created_at}`;
    
    return (
      <div key={index} className="space-y-3 pb-4">
        {/* Verbatim Quote - Always First */}
        <blockquote className="text-sm leading-relaxed text-foreground italic border-l-2 border-border pl-3">
          "{verbatimQuote}"
        </blockquote>

        {/* Type and Confidence */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{trace.trace_type.replace(/_/g, ' ')}</span>
          <span>{Math.round(trace.confidence * 100)}% confident</span>
        </div>

        {/* Psychological Insight */}
        <p className="text-sm text-foreground/80 leading-relaxed">
          {trace.extracted_insight}
        </p>

        {/* Core Metrics */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Relevance: {Math.round(trace.temporal_weight * 100)}%</span>
          <span>Intensity: {Math.round(trace.preference_strength * 100)}%</span>
          <span>{formatTimestamp(trace.created_at, { relative: true })}</span>
        </div>

        {/* Advanced Details */}
        {showAdvanced && (
          <div className="space-y-2 border-t border-border/20 pt-3">
            {/* Psychological Dimensions */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {trace.emotional_intensity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emotional</span>
                  <span>{Math.round(trace.emotional_intensity * 100)}%</span>
                </div>
              )}
              {trace.decision_context !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Decision</span>
                  <span>{Math.round(trace.decision_context * 100)}%</span>
                </div>
              )}
              {trace.consistency_indicator !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consistent</span>
                  <span>{Math.round(trace.consistency_indicator * 100)}%</span>
                </div>
              )}
              {trace.value_alignment !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Values</span>
                  <span>{Math.round(trace.value_alignment * 100)}%</span>
                </div>
              )}
              {trace.cognitive_pattern !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cognitive</span>
                  <span>{Math.round(trace.cognitive_pattern * 100)}%</span>
                </div>
              )}
              {trace.behavioral_trigger !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger</span>
                  <span>{Math.round(trace.behavioral_trigger * 100)}%</span>
                </div>
              )}
            </div>

            {/* Technical Details */}
            <div className="text-xs text-muted-foreground/60 space-y-1">
              <div>ID: {traceId.slice(-8)}</div>
              {trace.metadata?.conversation_id && (
                <div>Source: {trace.metadata.conversation_id.slice(-8)}</div>
              )}
              {trace.metadata?.linguistic_markers && trace.metadata.linguistic_markers.length > 0 && (
                <div>Markers: {trace.metadata.linguistic_markers.slice(0, 2).join(', ')}</div>
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
        title="Recent Traces"
        count={data.totalTraces} // Show total count from database
        copyTitle="Copy traces to clipboard"
      />
      
      <ExpandableContent isExpanded={isExpanded} maxHeight="max-h-96">
        {data.recentTraces.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm italic mb-2">No traces have been extracted yet</p>
            <p className="text-xs text-muted-foreground">
              Traces will appear as you have conversations that reveal persona insights
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.recentTraces.slice(0, 25).map(renderTrace)} {/* Show up to 25 traces */}
            </div>
            {data.recentTraces.length > 25 && (
              <div className="mt-4 p-3 text-center bg-muted/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground">
                  Showing 25 of {data.totalTraces} total traces
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.totalTraces - 25} more traces available in database
                </p>
              </div>
            )}
          </>
        )}
      </ExpandableContent>
    </div>
  );
}
