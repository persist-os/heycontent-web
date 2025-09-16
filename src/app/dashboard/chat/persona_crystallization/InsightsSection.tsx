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

  const renderInsight = (insight: PersonaInsight, index: number) => (
    <div key={index} className="border-l-4 border-blue-500/40 pl-4 py-3 bg-background/30 rounded-r-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          {insight.insight_type}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full">
            {Math.round(insight.confidence * 100)}%
          </span>
          {showAdvanced && (
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(insight.last_observed, { relative: true })}
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-foreground leading-relaxed mb-2 font-medium">
        {insight.crystallized_insight}
      </p>
      {showAdvanced && (
        <div className="space-y-1 text-xs text-muted-foreground border-t border-border/20 pt-2">
          {insight.contexts && insight.contexts.length > 0 && (
            <div>
              <span className="font-medium">Contexts:</span> {insight.contexts.slice(0, 3).join(', ')}
              {insight.contexts.length > 3 && ` (+${insight.contexts.length - 3} more)`}
            </div>
          )}
          <div>
            <span className="font-medium">Stability:</span> {Math.round(insight.temporal_stability * 100)}%
          </div>
        </div>
      )}
    </div>
  );

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
