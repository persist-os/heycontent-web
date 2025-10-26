'use client';

/**
 * Best Configs View
 * Displays the best configuration for each system type
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function BestConfigsView() {
  const bestConfigs = useQuery(api.convergenceBestConfigQueries.getAllBestConfigs);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-purple-400 uppercase tracking-wider">
            BEST_CONFIGURATIONS
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          Optimal configs per system // Updated when better configs are found
        </p>
      </div>

      {/* Content */}
      {!bestConfigs ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">Loading best configs...</div>
        </div>
      ) : bestConfigs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">
            No best configs yet
          </div>
          <div className="text-xs font-mono text-slate-600 mt-2">
            Run an optimization to generate best configs
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {bestConfigs.map((config: any) => (
            <div
              key={config._id}
              className="bg-black border border-purple-500/30 p-6 rounded"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-mono font-bold text-purple-400 uppercase tracking-wider">
                    SYSTEM: {config.system_name}
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    Run ID: {config.optimization_run_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
                    BEST_SCORE
                  </div>
                  <div className="text-2xl font-mono font-bold text-green-400">
                    {config.score.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  CONFIGURATION_PARAMETERS
                </div>
                <pre className="text-xs font-mono text-white overflow-x-auto">
                  {JSON.stringify(config.config_params, null, 2)}
                </pre>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                <div className="text-xs font-mono text-slate-600">
                  Updated: {new Date(config.updated_at).toLocaleString()}
                </div>
                <div className="text-xs font-mono text-purple-400">
                  🏆 BEST CONFIGURATION
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
