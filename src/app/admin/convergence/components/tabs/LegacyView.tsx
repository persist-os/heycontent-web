'use client';

/**
 * Legacy Learning System View
 * Shows learning history from Convex storage backend
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function LegacyView() {
  const [selectedSystem, setSelectedSystem] = useState('context_enrichment');

  const topConfigs = useQuery(api.convergenceQueries.getTopConfigs, {
    system_name: selectedSystem,
    limit: 10,
    status: 'active',
  });

  const allConfigs = useQuery(api.convergenceQueries.getAllConfigs, {
    system_name: selectedSystem,
  });

  const stats = useQuery(api.convergenceQueries.getSystemStats, {
    system_name: selectedSystem,
  });
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-amber-400 uppercase tracking-wider">
            LEGACY_LEARNING_SYSTEM
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          Convex storage backend // Self-learning history // Continuous improvement loop
        </p>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
          <span className="text-amber-500">INFO:</span>
          <span>Every optimization automatically saved to Convex. Future runs build on past successes.</span>
        </div>
      </div>

      {/* System selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
          SYSTEM_SELECT
        </label>
        <select
          value={selectedSystem}
          onChange={(e) => setSelectedSystem(e.target.value)}
          className="w-full max-w-md bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
          aria-label="Select system"
        >
          <option value="context_enrichment">context_enrichment</option>
          <option value="crystal_thresholds">crystal_thresholds</option>
          <option value="intelligence_triggers">intelligence_triggers</option>
          <option value="reddit_tools">reddit_tools</option>
          <option value="search_tools">search_tools</option>
        </select>
      </div>

      {/* Stats banner */}
      {stats && (
        <div className="bg-black border border-amber-500/30 p-4">
          <div className="grid grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <div className="text-slate-600">TOTAL_CONFIGS:</div>
              <div className="text-amber-400 font-bold text-lg">{stats.total_configs}</div>
            </div>
            <div>
              <div className="text-slate-600">BEST_SCORE:</div>
              <div className="text-green-400 font-bold text-lg">{stats.best_score.toFixed(4)}</div>
            </div>
            <div>
              <div className="text-slate-600">TOTAL_USAGE:</div>
              <div className="text-cyan-400 font-bold text-lg">{stats.total_usage}</div>
            </div>
            <div>
              <div className="text-slate-600">SUCCESS_RATE:</div>
              <div className="text-purple-400 font-bold text-lg">{(stats.avg_success_rate * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Top configs */}
      <div className="space-y-3">
        <div className="text-sm font-mono font-bold text-amber-400 uppercase">
          TOP_PERFORMING_CONFIGS
        </div>

        {!topConfigs && (
          <div className="text-center py-12 font-mono text-slate-600">
            <div className="animate-pulse">LOADING_LEGACY_DATA...</div>
          </div>
        )}

        {topConfigs && topConfigs.length === 0 && (
          <div className="text-center py-12 font-mono text-slate-600">
            NO_CONFIGS_IN_SYSTEM
          </div>
        )}

        {topConfigs && topConfigs.map((record: any, i: number) => (
          <div
            key={i}
            className="bg-black border border-amber-500/30 rounded p-5 hover:border-amber-500/50 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-mono font-bold text-amber-400">
                    RANK_{record.rank.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {record.algorithm_used} // GEN_{record.generation}
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {new Date(record.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-950/50 border border-amber-500/20 p-3 font-mono text-xs">
                  <div className="text-slate-400 mb-1">PARAMS:</div>
                  <div className="text-cyan-400 pl-4">
                    {JSON.stringify(record.params, null, 2)}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">SCORE:</span>
                    <span className={`font-bold ${
                      record.score >= 0.9 ? 'text-green-400' :
                      record.score >= 0.7 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {record.score.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-amber-500/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">USES:</span>
                    <span className="text-amber-400 font-bold">{record.usage_count || 0}</span>
                  </div>
                  <div className="w-px h-4 bg-amber-500/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">SUCCESS_RATE:</span>
                    <span className="text-green-400">
                      {record.usage_count > 0 ? `${((record.success_rate || 0) * 100).toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-amber-500/20" />
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600">TESTS:</span>
                    <span className="text-cyan-400">
                      {record.test_cases_passed}/{record.test_cases_total}
                    </span>
                  </div>
                </div>
              </div>

              <button className="px-4 py-2 text-xs font-mono text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 transition-colors opacity-0 group-hover:opacity-100">
                DEPLOY_NOW
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-black border-l-4 border-amber-500 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-amber-400">
          <span>⚡</span>
          <span>SELF-LEARNING LOOP ACTIVE</span>
        </div>
        <div className="text-xs font-mono text-slate-400 space-y-2">
          <p>Every optimization run is automatically saved to Convex storage backend.</p>
          <p className="text-slate-500">
            Future runs start from proven winners, creating a continuous improvement loop that makes your API usage smarter over time.
          </p>
          <div className="pt-2 flex items-center gap-2 text-[10px] text-cyan-500">
            <span>STORAGE:</span>
            <span className="text-cyan-400">convergence_optimization_runs // convergence_optimization_experiments // convergence_rl_training_data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

