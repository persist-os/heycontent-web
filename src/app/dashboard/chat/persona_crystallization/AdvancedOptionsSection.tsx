import React from 'react';
import { Settings2 } from 'lucide-react';
import { ExpandableSectionHeader, ExpandableContent } from './ExpandableSection';
import { usePersonaCrystallizationData } from './PersonaCrystallizationContext';
import { formatTimeOnly } from './utils';

interface AdvancedOptionsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

/**
 * Reusable component for advanced debug options and controls
 */
export function AdvancedOptionsSection({ 
  isExpanded, 
  onToggle,
  showAdvanced,
  onToggleAdvanced
}: AdvancedOptionsSectionProps) {
  const data = usePersonaCrystallizationData();

  // No more force processing - backend handles all triggers

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
		  <button
			  title="Toggle Advanced Options"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors flex items-center justify-between text-left border-b border-border/10"
      >
        <ExpandableSectionHeader
          isExpanded={isExpanded}
          title="Advanced Options"
          count={0}
        />
        <Settings2 className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <ExpandableContent isExpanded={isExpanded} maxHeight="max-h-none">
        <div className="space-y-4">
          {/* System Status Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/20 pb-1">System Status</h4>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-green-600">Display Only</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traces:</span>
                  <span className="font-medium">{data.totalTraces}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completeness:</span>
                  <span className="font-medium">{Math.round(data.profileCompleteness * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confidence:</span>
                  <span className="font-medium">{Math.round(data.overallConfidence * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/20 pb-1">Configuration</h4>
            
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <span className="text-sm font-medium">Show metadata details</span>
                <p className="text-xs text-muted-foreground">Display additional context and debugging information</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleAdvanced();
                }}
                className={`w-10 h-5 rounded-full transition-colors ${
                  showAdvanced ? 'bg-blue-500' : 'bg-muted'
                }`}
                title={`${showAdvanced ? 'Hide' : 'Show'} metadata`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  showAdvanced ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Display Only - No Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/20 pb-1">Info</h4>
            <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              This is a read-only display. All processing is handled by the backend.
            </div>
          </div>
          
          {/* Status Information */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/20 pb-1">Status Information</h4>
            
            <div className="space-y-2 text-xs">
              {data.lastUpdate && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">Last Update:</span>
                  <span className="font-medium">{formatTimeOnly(data.lastUpdate)}</span>
                </div>
              )}
              <div className="flex justify-between p-2 bg-muted/30 rounded">
                <span className="text-muted-foreground">Environment:</span>
                <span className="font-medium">{process.env.NODE_ENV || 'unknown'}</span>
              </div>
            </div>
          </div>
        </div>
      </ExpandableContent>
    </div>
  );
}
