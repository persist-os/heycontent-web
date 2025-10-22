'use client';

/**
 * Experiments View - CSV-style audit data display
 * Shows real experiment entries with live Convex data
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function ExperimentsView() {
  const [selectedSystem, setSelectedSystem] = useState('context_enrichment');
  const [minScore, setMinScore] = useState(0.0);

  const experiments = useQuery(api.convergenceStorageQueries.getExperimentsBySystem, {
    system_name: selectedSystem,
    min_score: minScore,
    limit: 100,
  });

  const topExperiments = useQuery(api.convergenceStorageQueries.getTopExperimentsByScore, {
    system_name: selectedSystem,
    limit: 5,
  });

  const avgScore = experiments && experiments.length > 0
    ? experiments.reduce((sum, e: any) => sum + e.experiment_score, 0) / experiments.length
    : 0;

  const successRate = experiments && experiments.length > 0
    ? (experiments.filter((e: any) => e.experiment_success).length / experiments.length) * 100
    : 0;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-mono font-bold text-green-400 uppercase tracking-wider">
            EXPERIMENT_AUDIT_LOG
          </h2>
          <p className="text-xs font-mono text-slate-500">
            Raw experiment data // CSV format // Live Convex queries
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedSystem}
            onChange={(e) => setSelectedSystem(e.target.value)}
            className="px-3 py-2 text-xs font-mono bg-black text-green-400 border border-green-500/30 hover:border-green-400 focus:outline-none"
            aria-label="Select system"
          >
            <option value="context_enrichment">context_enrichment</option>
            <option value="crystal_thresholds">crystal_thresholds</option>
            <option value="intelligence_triggers">intelligence_triggers</option>
            <option value="reddit_tools">reddit_tools</option>
            <option value="search_tools">search_tools</option>
          </select>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            placeholder="MIN_SCORE"
            className="w-24 px-3 py-2 text-xs font-mono bg-black text-green-400 border border-green-500/30 hover:border-green-400 focus:outline-none"
            aria-label="Minimum score"
          />
        </div>
      </div>

      {/* Top performers */}
      {topExperiments && topExperiments.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-mono font-bold text-green-400 uppercase">
            TOP_5_HALL_OF_FAME
          </div>
          <div className="grid grid-cols-5 gap-2">
            {topExperiments.map((exp: any, i: number) => (
              <div
                key={exp._id}
                className="bg-black border border-green-500/50 p-3 space-y-1"
              >
                <div className="text-xs font-mono text-green-500">RANK_{i + 1}</div>
                <div className="text-lg font-mono font-bold text-green-400">
                  {exp.experiment_score.toFixed(4)}
                </div>
                <div className="text-[10px] font-mono text-slate-600 truncate">
                  {exp.test_case_id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-black border border-green-500/30 overflow-hidden">
        <div className="overflow-x-auto">
          {!experiments && (
            <div className="text-center py-12 font-mono text-slate-600">
              <div className="animate-pulse">LOADING_EXPERIMENTS...</div>
            </div>
          )}

          {experiments && experiments.length === 0 && (
            <div className="text-center py-12 font-mono text-slate-600">
              NO_EXPERIMENTS_FOUND
            </div>
          )}

          {experiments && experiments.length > 0 && (
            <table className="w-full font-mono text-xs">
              <thead>
                <tr className="bg-green-900/20 border-b border-green-500/30">
                  <th className="px-4 py-3 text-left text-green-400 font-bold uppercase tracking-wider">TIMESTAMP</th>
                  <th className="px-4 py-3 text-left text-green-400 font-bold uppercase tracking-wider">RUN_ID</th>
                  <th className="px-4 py-3 text-left text-green-400 font-bold uppercase tracking-wider">TEST_CASE</th>
                  <th className="px-4 py-3 text-left text-green-400 font-bold uppercase tracking-wider">CONFIG</th>
                  <th className="px-4 py-3 text-right text-green-400 font-bold uppercase tracking-wider">SCORE</th>
                  <th className="px-4 py-3 text-center text-green-400 font-bold uppercase tracking-wider">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {experiments.map((exp: any, i: number) => (
                  <tr
                    key={exp._id}
                    className="border-b border-green-500/10 hover:bg-green-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {new Date(exp.experiment_timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-cyan-400 font-mono">
                      {exp.optimization_run_id.substring(0, 12)}...
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {exp.test_case_id}
                    </td>
                    <td className="px-4 py-3 text-purple-400">
                      {JSON.stringify(exp.experiment_config).substring(0, 40)}...
                    </td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${
                      exp.experiment_score >= 0.9 ? 'text-green-400' :
                      exp.experiment_score >= 0.7 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {exp.experiment_score.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-16 px-2 py-1 text-[10px] font-bold ${
                        exp.experiment_success
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {exp.experiment_success ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stats footer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black border border-green-500/30 p-4">
          <div className="text-[10px] font-mono text-green-600 uppercase tracking-widest mb-2">
            TOTAL_EXPERIMENTS
          </div>
          <div className="text-2xl font-mono font-bold text-green-400 tabular-nums">
            {experiments ? experiments.length.toString().padStart(4, '0') : '----'}
          </div>
        </div>
        <div className="bg-black border border-cyan-500/30 p-4">
          <div className="text-[10px] font-mono text-cyan-600 uppercase tracking-widest mb-2">
            AVG_SCORE
          </div>
          <div className="text-2xl font-mono font-bold text-cyan-400 tabular-nums">
            {avgScore.toFixed(4)}
          </div>
        </div>
        <div className="bg-black border border-yellow-500/30 p-4">
          <div className="text-[10px] font-mono text-yellow-600 uppercase tracking-widest mb-2">
            SUCCESS_RATE
          </div>
          <div className="text-2xl font-mono font-bold text-yellow-400 tabular-nums">
            {successRate.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
