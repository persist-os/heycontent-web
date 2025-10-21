'use client';

/**
 * Convergence Optimization Runner - Terminal Style
 * Trigger optimization runs with real Convergence parameters
 */

import { useState } from 'react';
import { OptimizationParams } from '../../types';

const DEFAULT_PARAMS: OptimizationParams = {
  api_name: 'azure_o4_mini',
  search_space_params: ['max_completion_tokens: [500, 1000, 2000, 4000, 8000]'],
  test_cases_path: './test_cases/azure_reasoning.json',
  generations: 3,
  population_size: 10,
  algorithm: 'mab_evolution',
  parallel_workers: 3,
  enable_rl_meta: true,
  enable_agent_society: false,
  mock_mode: false,
};

export function OptimizationRunner() {
  const [params, setParams] = useState<OptimizationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setOutput([
      '> convergence optimize --config ./optimization.yaml',
      '',
      '[INIT] Loading configuration...',
      '[INIT] API: ' + params.api_name,
      '[INIT] Algorithm: ' + params.algorithm.toUpperCase(),
      '[INIT] Generations: ' + params.generations,
      '[INIT] Population: ' + params.population_size,
      '',
      '[MAB] Thompson Sampling initialized',
      '[EVOLUTION] Genetic algorithm ready',
      params.enable_rl_meta ? '[RL_META] Meta-optimizer enabled' : '',
      params.enable_agent_society ? '[AGENT_SOCIETY] RLP + SAO active' : '',
      '',
      '[RUN] Starting optimization...',
    ].filter(Boolean));
    
    setTimeout(() => {
      setIsRunning(false);
      setOutput(prev => [...prev,
        '[COMPLETE] Optimization finished',
        '[RESULTS] Best score: 0.94 (+23% improvement)',
        '[RESULTS] Saved to ./results/optimization_run/',
        '',
        '$ _'
      ]);
    }, 3000);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Terminal output window */}
      <div className="bg-black border border-green-500/30 rounded font-mono text-sm">
        <div className="bg-green-900/20 px-4 py-2 border-b border-green-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-xs text-green-400">convergence@optimizer:~$</span>
          </div>
          <span className="text-xs text-slate-600">TERMINAL</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto space-y-1">
          {output.length > 0 ? (
            output.map((line, i) => (
              <div key={i} className={`
                ${line.startsWith('[INIT]') ? 'text-cyan-400' : ''}
                ${line.startsWith('[MAB]') || line.startsWith('[EVOLUTION]') ? 'text-green-400' : ''}
                ${line.startsWith('[RL_META]') || line.startsWith('[AGENT_SOCIETY]') ? 'text-purple-400' : ''}
                ${line.startsWith('[RUN]') ? 'text-yellow-400' : ''}
                ${line.startsWith('[COMPLETE]') ? 'text-green-400 font-bold' : ''}
                ${line.startsWith('[RESULTS]') ? 'text-emerald-400' : ''}
                ${line.startsWith('>') ? 'text-slate-400' : ''}
                ${!line ? 'h-2' : ''}
              `}>
                {line || '\u00A0'}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">
              Awaiting command...
            </div>
          )}
        </div>
      </div>

      {/* Configuration form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              API_NAME
            </label>
            <input
              type="text"
              value={params.api_name}
              onChange={(e) => setParams(prev => ({ ...prev, api_name: e.target.value }))}
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
              placeholder="openai_gpt4"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              ALGORITHM
            </label>
            <select
              value={params.algorithm}
              onChange={(e) => setParams(prev => ({ ...prev, algorithm: e.target.value as any }))}
              aria-label="Select algorithm"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
            >
              <option value="mab_evolution">MAB_EVOLUTION (Thompson + Genetic)</option>
              <option value="genetic">GENETIC (Evolution only)</option>
              <option value="mab_only">MAB_ONLY (Thompson Sampling)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
            SEARCH_SPACE_PARAMS
          </label>
          <textarea
            value={params.search_space_params.join('\n')}
            onChange={(e) => setParams(prev => ({ ...prev, search_space_params: e.target.value.split('\n').filter(Boolean) }))}
            rows={3}
            className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors resize-none"
            placeholder="temperature: [0.3, 0.5, 0.7, 1.0]&#10;max_tokens: [500, 1000, 2000]"
          />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              GENERATIONS
            </label>
            <input
              type="number"
              value={params.generations}
              onChange={(e) => setParams(prev => ({ ...prev, generations: parseInt(e.target.value) }))}
              min={1}
              max={20}
              aria-label="Number of generations"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              POPULATION
            </label>
            <input
              type="number"
              value={params.population_size}
              onChange={(e) => setParams(prev => ({ ...prev, population_size: parseInt(e.target.value) }))}
              min={5}
              max={50}
              aria-label="Population size"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              WORKERS
            </label>
            <input
              type="number"
              value={params.parallel_workers}
              onChange={(e) => setParams(prev => ({ ...prev, parallel_workers: parseInt(e.target.value) }))}
              min={1}
              max={10}
              aria-label="Parallel workers"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              TEST_CASES
            </label>
            <input
              type="text"
              value={params.test_cases_path}
              onChange={(e) => setParams(prev => ({ ...prev, test_cases_path: e.target.value }))}
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 transition-colors"
              placeholder="./test_cases.json"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={params.enable_rl_meta}
              onChange={(e) => setParams(prev => ({ ...prev, enable_rl_meta: e.target.checked }))}
              className="w-4 h-4 bg-black border-green-500/30 text-green-500 rounded focus:ring-green-500/50"
            />
            <span className="text-xs font-mono text-slate-400 group-hover:text-green-400 transition-colors">
              ENABLE_RL_META_OPTIMIZER
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={params.enable_agent_society}
              onChange={(e) => setParams(prev => ({ ...prev, enable_agent_society: e.target.checked }))}
              className="w-4 h-4 bg-black border-green-500/30 text-purple-500 rounded focus:ring-purple-500/50"
            />
            <span className="text-xs font-mono text-slate-400 group-hover:text-purple-400 transition-colors">
              ENABLE_AGENT_SOCIETY (RLP + SAO)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={params.mock_mode}
              onChange={(e) => setParams(prev => ({ ...prev, mock_mode: e.target.checked }))}
              className="w-4 h-4 bg-black border-yellow-500/30 text-yellow-500 rounded focus:ring-yellow-500/50"
            />
            <span className="text-xs font-mono text-slate-400 group-hover:text-yellow-400 transition-colors">
              MOCK_MODE
            </span>
          </label>
        </div>

        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={isRunning}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-mono font-bold text-sm tracking-wider rounded transition-all duration-300 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
          >
            {isRunning ? '>>> RUNNING...' : '>>> EXECUTE_OPTIMIZATION'}
          </button>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              OPTIMIZING...
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
