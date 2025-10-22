'use client';

/**
 * Configuration Vault
 * Deploy winners, archive losers, dominate the parameter space
 */

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function ConfigsView() {
  const [selectedSystem, setSelectedSystem] = useState('context_enrichment');
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'candidate' | 'archived'>('active');

  const configs = useQuery(api.convergenceQueries.getConfigs, {
    system_name: selectedSystem,
    operation: 'by_status',
    status: selectedStatus,
  });

  const stats = useQuery(api.convergenceQueries.getSystemStats, {
    system_name: selectedSystem,
  });

  const promoteConfigs = useMutation(api.convergenceMutations.promoteConfigs);
  const updateStatus = useMutation(api.convergenceMutations.updateConfigStatus);

  const handlePromote = async (configIds: string[]) => {
    try {
      await promoteConfigs({
        system_name: selectedSystem,
        new_config_ids: configIds as any[],
      });
    } catch (error) {
      console.error('Promotion failed:', error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-purple-400 uppercase tracking-wider">
            CONFIG_VAULT
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          Deploy winners // Archive losers // Dominate parameter space
        </p>
      </div>

      {/* System selector */}
      <div className="grid grid-cols-3 gap-4">
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

        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            STATUS_FILTER
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
            aria-label="Select status"
          >
            <option value="active">ACTIVE</option>
            <option value="candidate">CANDIDATE</option>
            <option value="archived">ARCHIVED</option>
          </select>
        </div>

        {stats && (
          <div className="bg-black border border-purple-500/30 p-4 space-y-2">
            <div className="text-xs font-mono text-purple-400 uppercase">SYSTEM_STATS</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="text-slate-500">ACTIVE:</div>
              <div className="text-green-400 text-right">{stats.active_configs}</div>
              <div className="text-slate-500">CANDIDATES:</div>
              <div className="text-cyan-400 text-right">{stats.candidate_configs}</div>
              <div className="text-slate-500">BEST_SCORE:</div>
              <div className="text-amber-400 text-right">{stats.best_score.toFixed(3)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Configs list */}
      <div className="space-y-3">
        {!configs && (
          <div className="text-center py-12 font-mono text-slate-600">
            <div className="animate-pulse">LOADING_CONFIGS...</div>
          </div>
        )}

        {configs && configs.length === 0 && (
          <div className="text-center py-12 font-mono text-slate-600">
            NO_CONFIGS_FOUND
          </div>
        )}

        {configs && configs.map((config: any, i: number) => (
          <div
            key={config._id}
            className="bg-black border border-purple-500/20 hover:border-purple-500/50 transition-all"
          >
            <div className="p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-purple-500">
                      RANK_{String(config.rank).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-mono font-bold text-purple-400">
                      SCORE: {config.score.toFixed(4)}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 border ${
                      config.status === 'active' 
                        ? 'text-green-400 border-green-500/50'
                        : config.status === 'candidate'
                        ? 'text-cyan-400 border-cyan-500/50'
                        : 'text-slate-500 border-slate-700'
                    }`}>
                      {config.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {config.algorithm_used} // GEN_{config.generation} // {config.test_cases_passed}/{config.test_cases_total} passed
                  </div>
                </div>

                {config.status === 'candidate' && (
                  <button
                    onClick={() => handlePromote([config._id])}
                    className="px-3 py-1 text-xs font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-all"
                  >
                    DEPLOY
                  </button>
                )}

                {config.status === 'active' && (
                  <button
                    onClick={() => updateStatus({ configId: config._id, status: 'archived' })}
                    className="px-3 py-1 text-xs font-mono font-bold bg-slate-500/10 text-slate-400 border border-slate-700 hover:bg-slate-500/20 transition-all"
                  >
                    ARCHIVE
                  </button>
                )}
              </div>

              {/* Params preview */}
              <div className="bg-slate-950 border border-slate-800 p-3">
                <div className="text-[10px] font-mono text-slate-500 mb-2">PARAMETERS:</div>
                <pre className="text-xs font-mono text-green-400 overflow-x-auto">
                  {JSON.stringify(config.params, null, 2)}
                </pre>
              </div>

              {/* Usage stats */}
              {config.usage_count > 0 && (
                <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
                  <span>USES: {config.usage_count}</span>
                  <span>SUCCESS_RATE: {((config.success_rate || 0) * 100).toFixed(1)}%</span>
                  {config.last_used && (
                    <span>LAST_USED: {new Date(config.last_used).toISOString().split('T')[0]}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action zone */}
      <div className="bg-black border-l-4 border-purple-500 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-purple-400">
          <span>⚡</span>
          <span>POWER_MOVES</span>
        </div>
        <div className="text-xs font-mono text-slate-400 space-y-2">
          <p>Deploy candidates to production with atomic promotion. Old actives auto-archived.</p>
          <p className="text-slate-500">
            Warning: Deployment is immediate. Test candidates thoroughly before promoting.
          </p>
        </div>
      </div>
    </div>
  );
}

