import React from 'react';
import { ExpandableSection, ExpandableContent } from './ExpandableSection';
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import { formatTimestamp } from './utils';
import type { PersonaTrace } from './types';

interface TracesSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}

/**
 * Reusable component for displaying recent persona traces
 */
export function TracesSection({ 
  isExpanded, 
  onToggle, 
  onCopy
}: TracesSectionProps) {
  const data = usePersonaCrystallizationData();

  const renderTrace = (trace: PersonaTrace, index: number) => (
    <div key={index} className="border-l-4 border-purple-500/40 pl-4 py-3 bg-background/30 rounded-r-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          {trace.trace_type}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
            {Math.round(trace.confidence * 100)}%
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(trace.created_at, { relative: true })}
          </span>
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed font-medium mb-2">
        {trace.extracted_insight}
      </p>
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/20 pt-2">
        <div className="flex items-center gap-3">
          <span>
            <span className="font-medium">Context:</span> {trace.context.substring(0, 30)}...
          </span>
          <span>
            <span className="font-medium">Weight:</span> {Math.round(trace.temporal_weight * 100)}%
          </span>
          <span>
            <span className="font-medium">Strength:</span> {Math.round(trace.preference_strength * 100)}%
          </span>
        </div>
      </div>
    </div>
  );

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
      
      <ExpandableContent isExpanded={isExpanded} maxHeight="max-h-[500px]">
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
