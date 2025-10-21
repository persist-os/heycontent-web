'use client';

/**
 * RL Meta-Optimizer Intelligence
 * Agent learning trajectories and reward optimization
 */

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';

export function RLMetaView() {
  const [selectedAgent, setSelectedAgent] = useState('context_enrichment_agent');
  const [minReward, setMinReward] = useState(0.8);

  const episodes = useQuery(api.convergenceStorageQueries.queryRLEpisodesForTraining, {
    agent_id: selectedAgent,
    min_reward_score: minReward,
    limit: 50,
  });

  const topPerformers = useQuery(api.convergenceStorageQueries.getTopRLPerformers, {
    agent_id: selectedAgent,
    limit: 10,
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          <h2 className="text-lg font-mono font-bold text-cyan-400 uppercase tracking-wider">
            RL_META_OPTIMIZER
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-500">
          Agent learning trajectories // Reward optimization // Policy evolution
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            AGENT_ID
          </label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="w-full bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
            aria-label="Select agent"
          >
            <option value="context_enrichment_agent">context_enrichment_agent</option>
            <option value="crystal_formation_agent">crystal_formation_agent</option>
            <option value="intelligence_trigger_agent">intelligence_trigger_agent</option>
            <option value="tool_selection_agent">tool_selection_agent</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
            MIN_REWARD_THRESHOLD
          </label>
          <input
            type="number"
            value={minReward}
            onChange={(e) => setMinReward(parseFloat(e.target.value))}
            min="0"
            max="1"
            step="0.1"
            className="w-full bg-black border border-green-500/30 text-green-400 font-mono text-sm px-3 py-2 focus:outline-none focus:border-green-400"
            aria-label="Minimum reward threshold"
          />
        </div>
      </div>

      {/* Top performers */}
      {topPerformers && topPerformers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-400 uppercase">
            <span className="text-cyan-500">HALL_OF_FAME</span>
            <span className="text-slate-600">//</span>
            <span className="text-slate-500">Top {topPerformers.length} episodes</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {topPerformers.map((ep: any, i: number) => (
              <div
                key={ep._id}
                className="bg-black border border-cyan-500/30 p-3 space-y-1 hover:border-cyan-400/50 transition-all"
              >
                <div className="text-xs font-mono text-cyan-500">#{i + 1}</div>
                <div className="text-lg font-mono font-bold text-cyan-400">
                  {ep.reward_score.toFixed(3)}
                </div>
                <div className="text-[10px] font-mono text-slate-600">
                  {ep.rl_record_type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Episode list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-green-400 uppercase">
          <span>TRAINING_EPISODES</span>
          <span className="text-slate-600">//</span>
          <span className="text-slate-500">
            {episodes ? episodes.length : '...'} records
          </span>
        </div>

        {!episodes && (
          <div className="text-center py-12 font-mono text-slate-600">
            <div className="animate-pulse">LOADING_EPISODES...</div>
          </div>
        )}

        {episodes && episodes.length === 0 && (
          <div className="text-center py-12 font-mono text-slate-600">
            NO_EPISODES_ABOVE_THRESHOLD
          </div>
        )}

        {episodes && episodes.map((ep: any) => (
          <div
            key={ep._id}
            className="bg-black border border-green-500/20 hover:border-green-500/40 transition-all"
          >
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-green-400">
                      REWARD: {ep.reward_score.toFixed(4)}
                    </span>
                    <span className="text-xs font-mono text-cyan-400">
                      FITNESS: {(ep.fitness_score || 0).toFixed(4)}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 border ${
                      ep.success 
                        ? 'text-green-400 border-green-500/50'
                        : 'text-red-400 border-red-500/50'
                    }`}>
                      {ep.success ? 'SUCCESS' : 'FAILURE'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    {ep.rl_record_type} // {ep.station || 'unknown_station'} // {new Date(ep.episode_timestamp).toISOString()}
                  </div>
                </div>
              </div>

              {/* Episode data preview */}
              {ep.rl_episode_data && (
                <div className="bg-slate-950 border border-slate-800 p-3">
                  <div className="text-[10px] font-mono text-slate-500 mb-2">EPISODE_DATA:</div>
                  <pre className="text-[10px] font-mono text-green-400 overflow-x-auto max-h-32 overflow-y-auto">
                    {JSON.stringify(ep.rl_episode_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-black border-l-4 border-cyan-500 p-6 space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-400">
          <span>⚡</span>
          <span>META_LEARNING_ACTIVE</span>
        </div>
        <div className="text-xs font-mono text-slate-400 space-y-2">
          <p>RL agents learn from production feedback loops. Every interaction saved for policy updates.</p>
          <p className="text-slate-500">
            High-reward episodes used to initialize future optimization runs. The system gets smarter over time.
          </p>
        </div>
      </div>
    </div>
  );
}

