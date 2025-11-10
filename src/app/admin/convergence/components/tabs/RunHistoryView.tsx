'use client';

/**
 * Run History View
 * Displays all optimization runs, filterable by system type
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { OptimizationRunDetailView } from './OptimizationRunDetailView';

export function RunHistoryView() {
  const [selectedSystem, setSelectedSystem] = useState<string>('openai');
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  // Query runs for the selected system
  const runs = useQuery(
    api.convergenceStorageQueries.getRunsForSystem,
    selectedSystem ? { system_name: selectedSystem, limit: 50 } : "skip"
  );

  // If a run is selected, show detail view
  if (selectedRunId) {
    return (
      <OptimizationRunDetailView
        runId={selectedRunId}
        onBack={() => setSelectedRunId(null)}
      />
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-amber-400 uppercase tracking-wider">
            RUN_HISTORY
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          All optimization runs // Filterable by system type
        </p>
      </div>

      {/* System Filter */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
          FILTER_BY_SYSTEM
        </label>
        <select
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
          className="w-full bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
          aria-label="Select system"
        >
          <option value="openai">OpenAI</option>
          <option value="groq">Groq</option>
          <option value="azure_multi_model">Azure Multi-Model</option>
          <option value="reddit_agent">Reddit Agent</option>
          <option value="browserbase">Browserbase</option>
        </select>
      </div>

      {/* Runs List */}
      {!runs ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">Loading runs...</div>
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">
            No runs found
          </div>
          <div className="text-xs font-mono text-slate-600 mt-2">
            No runs found for system: {selectedSystem}. Run an optimization to see history here.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run: any) => (
            <div
              key={run.run_id}
              onClick={() => setSelectedRunId(run.run_id)}
              className="bg-black border border-amber-500/30 p-6 rounded cursor-pointer hover:border-amber-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider">
                    {run.system_name}
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    Run ID: {run.run_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
                    BEST_SCORE
                  </div>
                  <div className="text-xl font-mono font-bold text-green-400">
                    {run.best_experiment_score?.toFixed(4) || 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    ALGORITHM
                  </div>
                  <div className="text-xs font-mono text-cyan-400">
                    {run.algorithm_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    EXPERIMENTS
                  </div>
                  <div className="text-xs font-mono text-white">
                    {run.total_experiments_run || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    DURATION
                  </div>
                  <div className="text-xs font-mono text-white">
                    {run.total_duration_ms ? `${(run.total_duration_ms / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <div className="text-xs font-mono text-slate-600">
                  Started: {new Date(run.run_started_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
