'use client'

/**
 * System Debug Info Component
 * 
 * Displays comprehensive system information about crystal formation,
 * formation runs, and debug data. Extracted for modularity.
 */

import React from 'react';
import { ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { CrystalStats, FormationStatus, FormationEligibility } from './types';

interface SystemDebugInfoProps {
  crystalStats?: CrystalStats;
  formationStatus?: FormationStatus;
  formationEligibility?: FormationEligibility;
  formationRuns?: any[];
}

export const SystemDebugInfo: React.FC<SystemDebugInfoProps> = ({
  crystalStats,
  formationStatus,
  formationEligibility,
  formationRuns = []
}) => {
  const [showDebugInfo, setShowDebugInfo] = React.useState(false);

  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden">
      <button
        onClick={() => setShowDebugInfo(!showDebugInfo)}
        className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-muted-foreground" />
          <div className="text-left">
            <div className="font-medium text-foreground">System Information</div>
            <div className="text-sm text-muted-foreground font-light">
              Formation logs, tracking metadata, eligibility, and debug data
            </div>
          </div>
        </div>
        {showDebugInfo ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      
      {showDebugInfo && (
        <div className="px-6 py-4 space-y-4 bg-background">
          
          {/* Current Status */}
          <div>
            <h4 className="font-medium text-sm text-foreground mb-3">Current Status</h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Total Shards</div>
                <div className="text-foreground font-medium">{formationEligibility?.shardCount || 0}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Total Crystals</div>
                <div className="text-foreground font-medium">{crystalStats?.crystalsCount || 0}</div>
              </div>
              <div className="bg-muted/20 rounded-lg p-3">
                <div className="text-muted-foreground mb-1">Formation Eligible</div>
                <div className="text-foreground font-medium">{formationEligibility?.eligible ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>

          {/* Formation Runs History */}
          {formationRuns.length > 0 && (
            <div className="pt-3 border-t border-border/20">
              <h4 className="font-medium text-sm text-foreground mb-3">Recent Formation Runs</h4>
              <div className="space-y-2">
                {formationRuns.slice(0, 3).map((run: any, idx: number) => (
                  <div key={run._id || idx} className="bg-muted/20 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                          run.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                          run.status === 'failed' ? 'bg-red-500/10 text-red-600' :
                          run.status === 'running' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {run.status}
                        </div>
                        <span className="text-muted-foreground">
                          {run.trigger_type?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {run.started_at ? new Date(run.started_at).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {run.crystals_created !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Created: </span>
                          <span className="text-foreground font-medium">{run.crystals_created}</span>
                        </div>
                      )}
                      {run.crystals_updated !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Updated: </span>
                          <span className="text-foreground font-medium">{run.crystals_updated}</span>
                        </div>
                      )}
                      {run.clusters_formed !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Clusters: </span>
                          <span className="text-foreground font-medium">{run.clusters_formed}</span>
                        </div>
                      )}
                      {run.duration_ms !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="text-foreground font-medium">{(run.duration_ms / 1000).toFixed(2)}s</span>
                        </div>
                      )}
                      {run.input_shard_count !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Input Shards: </span>
                          <span className="text-foreground font-medium">{run.input_shard_count}</span>
                        </div>
                      )}
                      {run.formation_version && (
                        <div>
                          <span className="text-muted-foreground">Version: </span>
                          <span className="text-foreground font-medium">{run.formation_version}</span>
                        </div>
                      )}
                    </div>

                    {run.error_message && (
                      <div className="mt-2 text-xs text-red-600 bg-red-500/5 p-2 rounded">
                        {run.error_message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formation History (legacy) */}
          {formationStatus?.history && formationStatus.history.length > 0 && (
            <div className="pt-3 border-t border-border/20">
              <h4 className="font-medium text-sm text-foreground mb-3">Legacy Formation History</h4>
              <div className="space-y-2">
                {formationStatus.history.map((entry: any, idx: number) => (
                  <div key={idx} className="bg-muted/20 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-foreground font-medium">
                        {entry.status || 'Unknown'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    {entry.crystalsCreated !== undefined && (
                      <div className="text-muted-foreground">
                        Created {entry.crystalsCreated} crystals from {entry.shardsProcessed || 0} shards
                      </div>
                    )}
                    {entry.error && (
                      <div className="text-destructive text-xs mt-1">{entry.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formation Eligibility Details */}
          <div className="pt-3 border-t border-border/20">
            <h4 className="font-medium text-sm text-foreground mb-3">Eligibility Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Days Since Last Run</span>
                <span className="text-foreground font-medium">
                  {formationEligibility?.daysSinceLastRun?.toFixed(2) || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Has Running Formation</span>
                <span className="text-foreground font-medium">
                  {formationEligibility?.hasRunningFormation ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Run Status</span>
                <span className="text-foreground font-medium">
                  {formationStatus?.lastRunStatus || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

