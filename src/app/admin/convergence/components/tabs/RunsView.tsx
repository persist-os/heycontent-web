'use client';

/**
 * Optimization Run History
 * Track every evolution session, analyze convergence patterns
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function RunsView() {
  const [selectedSystem, setSelectedSystem] = useState('context_enrichment');
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const runs = useQuery(api.convergenceStorageQueries.getRunsForSystem, {
    system_name: selectedSystem,
    limit: 20,
  });

  const stats = useQuery(api.convergenceStorageQueries.getSystemOptimizationStats, {
    system_name: selectedSystem,
  });

  const expandedRunData = expandedRun 
    ? useQuery(api.convergenceStorageQueries.getEvolutionProgress, {
        optimization_run_id: expandedRun,
      })
    : null;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-amber-400 uppercase tracking-wider">
            OPTIMIZATION_ARCHIVES
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          Evolution history // Convergence analysis // Performance tracking
        </p>
      </div>

      {/* System selector and stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            TARGET_SYSTEM
          </label>
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="w-full bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
            aria-label="Select system"
          >
            <option value="context_enrichment">context_enrichment</option>
            <option value="crystal_thresholds">crystal_thresholds</option>
            <option value="intelligence_triggers">intelligence_triggers</option>
            <option value="reddit_tools">reddit_tools</option>
            <option value="search_tools">search_tools</option>
          </select>
        </div>

        {stats && (
          <div className="bg-black border border-amber-500/30 p-4 space-y-2">
            <div className="text-xs font-mono text-amber-400 uppercase">LIFETIME_STATS</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-500">TOTAL_RUNS:</div>
              <div className="text-green-400 text-right">{stats.total_runs}</div>
              <div className="text-slate-500">COMPLETED:</div>
              <div className="text-cyan-400 text-right">{stats.completed_runs}</div>
              <div className="text-slate-500">BEST_EVER:</div>
              <div className="text-amber-400 text-right">{stats.best_score_ever.toFixed(4)}</div>
              <div className="text-slate-500">AVG_SCORE:</div>
              <div className="text-purple-400 text-right">{stats.avg_best_score.toFixed(4)}</div>
              <div className="text-slate-500">EXPERIMENTS:</div>
              <div className="text-green-400 text-right">{stats.total_experiments}</div>
              <div className="text-slate-500">CONVERGENCE:</div>
              <div className="text-cyan-400 text-right">{(stats.convergence_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        )}
      </div>

      {/* Runs list */}
      <div className="space-y-3">
        {!runs && (
          <div className="text-center py-12 font-mono text-slate-600">
            <div className="animate-pulse">LOADING_RUN_HISTORY...</div>
          </div>
        )}

        {runs && runs.length === 0 && (
          <div className="text-center py-12 font-mono text-slate-600">
            NO_RUNS_FOUND_FOR_SYSTEM
          </div>
        )}

        {runs && runs.map((run: any) => {
          const isExpanded = expandedRun === run.run_id;
          const duration = run.total_duration_ms 
            ? `${(run.total_duration_ms / 1000).toFixed(1)}s`
            : 'in_progress';

          return (
            <div
              key={run._id}
              className="bg-black border border-amber-500/20 hover:border-amber-500/40 transition-all"
            >
              <button
                onClick={() => setExpandedRun(isExpanded ? null : run.run_id)}
                className="w-full text-left p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-amber-500">
                        {run.run_id.substring(0, 12)}...
                      </span>
                      <span className="text-sm font-mono font-bold text-amber-400">
                        BEST: {run.best_experiment_score.toFixed(4)}
                      </span>
                      <span className="text-xs font-mono text-slate-600">
                        AVG: {run.avg_experiment_score.toFixed(4)}
                      </span>
                      {run.convergence_achieved && (
                        <span className="text-xs font-mono text-green-400 border border-green-500/50 px-2 py-0.5">
                          CONVERGED
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-600">
                      {run.algorithm_name} // {run.total_experiments_run} experiments // {duration} // {new Date(run.run_started_at).toISOString().split('T')[0]}
                    </div>
                  </div>

                  <span className="text-xs font-mono text-slate-600">
                    {isExpanded ? '[-]' : '[+]'}
                  </span>
                </div>

                {/* Generation breakdown */}
                {run.experiments_by_generation && run.experiments_by_generation.length > 0 && (
                  <div className="flex items-center gap-2">
                    {run.experiments_by_generation.map((gen: any) => (
                      <div
                        key={gen.generation}
                        className="bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] font-mono"
                      >
                        <span className="text-slate-600">G{gen.generation}:</span>
                        <span className="text-green-400 ml-1">{gen.best_score.toFixed(3)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && expandedRunData && (
                <div className="border-t border-amber-500/20 p-4 space-y-3">
                  <div className="text-xs font-mono font-bold text-amber-400 uppercase">
                    EVOLUTION_TRACE
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {expandedRunData.map((exp: any, i: number) => (
                      <div
                        key={exp._id}
                        className="bg-slate-950 border border-slate-800 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-mono">
                            <span className="text-slate-600">GEN_{exp.generation_number || 0}</span>
                            <span className="text-slate-700 mx-2">//</span>
                            <span className="text-green-400">SCORE: {exp.experiment_score.toFixed(4)}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-600">
                            {exp.test_case_id}
                          </div>
                        </div>
                        {exp.experiment_config && (
                          <pre className="text-[10px] font-mono text-slate-500 mt-2">
                            {JSON.stringify(exp.experiment_config, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-black border-l-4 border-amber-500 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-amber-400">
          <span>⚡</span>
          <span>CONTINUOUS_OPTIMIZATION</span>
        </div>
        <div className="text-xs font-mono text-slate-400 space-y-2">
          <p>Every optimization run is tracked. Click any run to see its evolutionary trace.</p>
          <p className="text-slate-500">
            Convergence rate shows how often the algorithm finds stable optimal solutions.
          </p>
        </div>
      </div>
    </div>
  );
}

