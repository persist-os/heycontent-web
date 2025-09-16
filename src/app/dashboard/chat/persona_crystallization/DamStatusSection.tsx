import React from 'react';
import { ExpandableSection, ExpandableContent } from './ExpandableSection';
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import type { TokenDam } from './types';

interface DamStatusSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Reusable component for displaying token dam status (development only)
 */
export function DamStatusSection({ 
  isExpanded, 
  onToggle
}: DamStatusSectionProps) {
  const data = usePersonaCrystallizationData();

  // Only show in development and when dam status exists
  if (!data.damStatus || process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'threshold_reached': return 'bg-green-100 text-green-700';
      case 'accumulating': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const renderDam = (dam: TokenDam) => (
    <div key={dam.conversation_id} className="border-l-4 border-orange-500/40 pl-4 py-4 bg-background/30 rounded-r-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm text-foreground">Conv: {dam.conversation_id.slice(-8)}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dam.status)}`}>
            {dam.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        {dam.is_processing && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-yellow-600 font-medium">Processing</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm font-bold text-foreground">{dam.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 border border-border/20 relative overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(dam.progress_percentage)}`}
              style={{ width: `${Math.min(dam.progress_percentage, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground font-medium mb-1">Token Usage</div>
            <div className="font-semibold">{dam.accumulated_tokens.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">of {dam.token_limit.toLocaleString()}</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-2">
            <div className="text-xs text-muted-foreground font-medium mb-1">Messages</div>
            <div className="font-semibold">{dam.message_count}</div>
            <div className="text-xs text-muted-foreground">total</div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground border-t border-border/20 pt-2">
          <div className="flex justify-between">
            <span>Remaining tokens:</span>
            <span className="font-medium">{(dam.token_limit - dam.accumulated_tokens).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <ExpandableSection
        isExpanded={isExpanded}
        onToggle={onToggle}
        title="Token Dams"
        count={data.damStatus.totalDams}
      />
      
      <ExpandableContent isExpanded={isExpanded} maxHeight="max-h-96">
        {data.damStatus.dams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm italic mb-2">No active token dams</p>
            <p className="text-xs text-muted-foreground">
              Token dams accumulate conversation data for efficient processing
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {data.damStatus.dams.map(renderDam)}
            </div>
            {data.damStatus.dams.length > 0 && (
              <div className="mt-4 p-3 text-center bg-muted/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">
                  Total active dams: {data.damStatus.totalDams}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Dams automatically process when reaching token limits
                </p>
              </div>
            )}
          </>
        )}
      </ExpandableContent>
    </div>
  );
}
