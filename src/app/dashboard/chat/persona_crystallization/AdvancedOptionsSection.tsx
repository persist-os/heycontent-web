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

  const handleForceProcess = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { triggerInsightCrystallization } = await import('@/app/lib/persona-api');
      await triggerInsightCrystallization(data.debugInfo?.userId || '', [], 0.3);
      data.refreshData();
    } catch (error) {
      console.error('Force crystallization failed:', error);
    }
  };

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
          count={data.debugInfo?.triggerCount || 0}
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
                  <span className="text-muted-foreground">Processing:</span>
                  <span className={`font-medium ${data.isProcessing ? 'text-yellow-600' : 'text-green-600'}`}>
                    {data.debugInfo?.processingStatus || 'idle'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Triggers:</span>
                  <span className="font-medium">{data.debugInfo?.triggerCount || 0}</span>
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
          
          {/* Action Buttons Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/20 pb-1">Actions</h4>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  data.refreshData();
                }}
                className="w-full px-3 py-2 bg-accent text-accent-foreground rounded-lg text-sm hover:bg-accent/80 transition-colors font-medium"
              >
                Refresh All Data
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={handleForceProcess}
                  className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors font-medium"
                >
                  Force Crystallization
                </button>
              )}
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
              {data.debugInfo?.userId && (
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono text-xs">{data.debugInfo.userId.slice(-12)}</span>
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
