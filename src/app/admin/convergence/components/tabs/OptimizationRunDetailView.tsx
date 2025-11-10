'use client';

/**
 * Optimization Run Detail View
 * Displays all experiments for a specific optimization run
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { ArrowLeft } from 'lucide-react';

interface OptimizationRunDetailViewProps {
  runId: string;
  onBack: () => void;
}

export function OptimizationRunDetailView({ runId, onBack }: OptimizationRunDetailViewProps) {
  // Query experiments for this run
  const experiments = useQuery(
    api.convergenceStorageQueries.getExperimentsForRun,
    runId ? { optimization_run_id: runId, limit: 1000 } : "skip"
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-mono text-sm uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          BACK
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <h2 className="text-lg font-mono font-bold text-green-400 uppercase tracking-wider">
              RUN_DETAILS
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-500">
            Run ID: {runId} // All experiments from this run
          </p>
        </div>
      </div>

      {/* Experiments List */}
      {!experiments ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">Loading experiments...</div>
        </div>
      ) : experiments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-sm font-mono text-slate-500">
            No experiments found
          </div>
          <div className="text-xs font-mono text-slate-600 mt-2">
            No experiments have been saved for this run yet.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="bg-black border border-green-500/30 p-6 rounded">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  TOTAL_EXPERIMENTS
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {experiments.length}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  BEST_SCORE
                </div>
                <div className="text-2xl font-mono font-bold text-green-400">
                  {Math.max(...experiments.map(e => e.experiment_score)).toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  AVG_SCORE
                </div>
                <div className="text-2xl font-mono font-bold text-cyan-400">
                  {(experiments.reduce((sum, e) => sum + e.experiment_score, 0) / experiments.length).toFixed(4)}
                </div>
              </div>
            </div>
          </div>

          {/* Experiments */}
          {experiments.map((exp: any, idx: number) => (
            <div
              key={exp.experiment_id || idx}
              className={`bg-black border p-6 rounded ${
                exp.test_passed ? 'border-green-500/30' : 'border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      exp.test_passed ? 'bg-green-400' : 'bg-red-400'
                    }`} />
                    <div className="text-sm font-mono font-bold text-white">
                      EXPERIMENT #{idx + 1}
                    </div>
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-1">
                    {exp.test_case_id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
                    SCORE
                  </div>
                  <div className="text-xl font-mono font-bold text-purple-400">
                    {exp.experiment_score.toFixed(4)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    GENERATION
                  </div>
                  <div className="text-xs font-mono text-white">
                    {exp.generation_number ?? 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    STATUS
                  </div>
                  <div className={`text-xs font-mono font-bold ${
                    exp.test_passed ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {exp.test_passed ? 'PASS' : 'FAIL'}
                  </div>
                </div>
              </div>

              {/* Config preview */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  TESTED_CONFIG
                </div>
                <pre className="text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(exp.tested_config, null, 2)}
                </pre>
              </div>

              {/* Metrics */}
              {(exp.latency_ms || exp.cost_usd) && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {exp.latency_ms && (
                    <div>
                      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                        LATENCY
                      </div>
                      <div className="text-xs font-mono text-white">
                        {exp.latency_ms.toFixed(2)}ms
                      </div>
                    </div>
                  )}
                  {exp.cost_usd && (
                    <div>
                      <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                        COST
                      </div>
                      <div className="text-xs font-mono text-white">
                        ${exp.cost_usd.toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

