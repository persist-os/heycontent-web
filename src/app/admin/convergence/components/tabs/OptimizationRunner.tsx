'use client';

/**
 * Context Enrichment Optimizer
 * 
 * Run Convergence optimization sessions for context enrichment MAB parameters.
 * Focuses on optimizing vector search thresholds, limits, content types, and shard parameters.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';

interface ContextEnrichmentTestCase {
  id: string;
  user_message: string;
  project_id?: string;
  expected_relevance?: number;
}

interface ContextEnrichmentParams {
  system_name: string;
  test_cases: ContextEnrichmentTestCase[];
  generations: number;
  population_size: number;
  algorithm: 'mab_evolution' | 'genetic' | 'mab_only';
  parallel_workers: number;
  mock_mode: boolean;
  mutation_rate: number;
  crossover_rate: number;
  elite_size: number;
  max_retries: number;
  timeout_seconds: number;
  early_stopping_enabled: boolean;
  early_stopping_patience: number;
}

const DEFAULT_TEST_CASES: ContextEnrichmentTestCase[] = [
  {
    id: "test_1",
    user_message: "What are my recent insights about product development?",
    expected_relevance: 0.8
  },
  {
    id: "test_2", 
    user_message: "Show me my notes about user research findings",
    expected_relevance: 0.8
  },
  {
    id: "test_3",
    user_message: "What did I write about AI and machine learning?",
    expected_relevance: 0.7
  },
  {
    id: "test_4",
    user_message: "Find my thoughts on team collaboration and communication",
    expected_relevance: 0.75
  },
  {
    id: "test_5",
    user_message: "What are my ideas about future product features?",
    expected_relevance: 0.8
  }
];

const DEFAULT_PARAMS: ContextEnrichmentParams = {
  system_name: 'context_enrichment',
  test_cases: DEFAULT_TEST_CASES,
  generations: 3,
  population_size: 10,
  algorithm: 'mab_evolution',
  parallel_workers: 2,
  mock_mode: false,
  mutation_rate: 0.1,
  crossover_rate: 0.5,
  elite_size: 2,
  max_retries: 2,
  timeout_seconds: 30,
  early_stopping_enabled: true,
  early_stopping_patience: 2,
};

export function OptimizationRunner() {
  const { firebaseUser } = useAuth();
  const [params, setParams] = useState<ContextEnrichmentParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showTestCases, setShowTestCases] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<number | null>(null);

  // Get current config for this user
  const currentConfig = useQuery(api.convergenceCurrentConfigQueries.getCurrentConfig, 
    firebaseUser?.uid ? { user_id: firebaseUser.uid } : "skip"
  );

  const addTestCase = () => {
    setParams(prev => ({
      ...prev,
      test_cases: [
        ...prev.test_cases,
        {
          id: `test_${prev.test_cases.length + 1}`,
          user_message: "",
          expected_relevance: 0.7
        }
      ]
    }));
  };

  const removeTestCase = (index: number) => {
    setParams(prev => ({
      ...prev,
      test_cases: prev.test_cases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index: number, field: keyof ContextEnrichmentTestCase, value: any) => {
    setParams(prev => ({
      ...prev,
      test_cases: prev.test_cases.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setJobId(null);
    setOutput([
      '> convergence optimize --system context_enrichment',
      '',
      '[INIT] Triggering context enrichment optimization...',
      '[INIT] Algorithm: ' + params.algorithm.toUpperCase(),
      '[INIT] Generations: ' + params.generations,
      '[INIT] Population: ' + params.population_size,
      '[INIT] Test Cases: ' + params.test_cases.length,
      '',
      '[INFO] Optimizing parameters:',
      '[INFO]   - threshold (0.25-0.5)',
      '[INFO]   - limit (5-15)',
      '[INFO]   - content_types (crystal, note, conversation)',
      '[INFO]   - shard_params.limit (5-25)',
      '[INFO]   - shard_params.min_confidence (high/medium/none)',
      '',
    ]);
    
    try {
      const idToken = await firebaseUser?.getIdToken();
      
      if (!idToken) {
        setOutput(prev => [...prev, '[ERROR] Authentication failed']);
        setIsRunning(false);
        return;
      }

      // Convert test cases to Convergence format
      const convergenceTestCases = params.test_cases.map(tc => ({
        id: tc.id,
        input: {
          user_id: firebaseUser?.uid,
          user_message: tc.user_message,
          project_id: tc.project_id || null,
          content_types: ["crystal", "shard"],
          shard_params: {
            min_relevance_score: 0.5,
            include_metadata: true
          }
        },
        expected: {
          score: tc.expected_relevance || 0.7
        }
      }));

      const response = await fetch('/api/convergence/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: firebaseUser?.uid,
          system_name: params.system_name,
          config_type: 'mab_params',
          generations: params.generations,
          population_size: params.population_size,
          algorithm: params.algorithm,
          top_n: 3,
          mock_mode: params.mock_mode,
          parallel_workers: params.parallel_workers,
          mutation_rate: params.mutation_rate,
          crossover_rate: params.crossover_rate,
          elite_size: params.elite_size,
          max_retries: params.max_retries,
          timeout_seconds: params.timeout_seconds,
          early_stopping_enabled: params.early_stopping_enabled,
          early_stopping_patience: params.early_stopping_patience,
          test_cases: convergenceTestCases,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setOutput(prev => [...prev, 
          '[ERROR] ' + (result.error || result.detail || 'Optimization trigger failed'),
          '',
          '$ _'
        ]);
        setIsRunning(false);
        return;
      }

      setJobId(result.job_id);
      setOutput(prev => [...prev,
        '[SUCCESS] Optimization job triggered!',
        '[JOB_ID] ' + result.job_id,
        '',
        '[INFO] Backend is now running optimization',
        '[INFO] Testing ' + params.test_cases.length + ' test cases',
        '[INFO] Results will appear in EXPERIMENTS and CONFIG_VAULT tabs',
        '[INFO] Estimated time: ' + (params.generations * params.population_size * 2) + '-' + (params.generations * params.population_size * 4) + ' seconds',
        '',
        '$ _'
      ]);
      setIsRunning(false);

    } catch (error) {
      setOutput(prev => [...prev,
        '[ERROR] ' + (error instanceof Error ? error.message : 'Unknown error'),
        '',
        '$ _'
      ]);
      setIsRunning(false);
    }
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
          <span className="text-xs text-slate-600">CONTEXT_ENRICHMENT_OPTIMIZER</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto space-y-1">
          {output.length > 0 ? (
            output.map((line, i) => (
              <div key={i} className={`
                ${line.startsWith('[INIT]') ? 'text-cyan-400' : ''}
                ${line.startsWith('[INFO]') ? 'text-emerald-400' : ''}
                ${line.startsWith('[SUCCESS]') ? 'text-green-400 font-bold' : ''}
                ${line.startsWith('[ERROR]') ? 'text-red-400 font-bold' : ''}
                ${line.startsWith('[JOB_ID]') ? 'text-purple-400' : ''}
                ${line.startsWith('>') ? 'text-slate-400' : ''}
                ${!line ? 'h-2' : ''}
              `}>
                {line || '\u00A0'}
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">
              Ready to optimize context enrichment parameters...
            </div>
          )}
        </div>
      </div>

      {/* Current Config Display */}
      {currentConfig ? (
        <div className="bg-black border-l-4 border-cyan-500 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-cyan-400">
            <span>⚡</span>
            <span>CURRENT_CONFIG</span>
            <span className="text-xs text-slate-500">({currentConfig.status})</span>
          </div>
          <div className="text-xs font-mono text-slate-400 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-cyan-400">Name:</span> {currentConfig.name}
              </div>
              <div>
                <span className="text-cyan-400">System:</span> {currentConfig.system_name}
              </div>
              <div>
                <span className="text-cyan-400">Algorithm:</span> {currentConfig.algorithm}
              </div>
              <div>
                <span className="text-cyan-400">Preset:</span> {currentConfig.preset_id || 'Custom'}
              </div>
            </div>
            <div className="text-slate-500">
              {currentConfig.description}
            </div>
            {currentConfig.config?.search_space?.parameters && (
              <div>
                <span className="text-cyan-400">Parameters:</span> {Object.keys(currentConfig.config.search_space.parameters).join(', ')}
              </div>
            )}
            {currentConfig.test_cases?.test_cases && (
              <div>
                <span className="text-cyan-400">Test Cases:</span> {currentConfig.test_cases.test_cases.length} cases
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-black border-l-4 border-yellow-500 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-yellow-400">
            <span>⚠️</span>
            <span>NO_CURRENT_CONFIG</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Go to <span className="text-yellow-400">CONFIG_GEN</span> tab to generate a configuration first.
          </div>
        </div>
      )}

      {/* Configuration form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overview Section */}
        <div className="bg-black border-l-4 border-green-500 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-green-400">
            <span>🎯</span>
            <span>CONTEXT_ENRICHMENT_OPTIMIZATION</span>
          </div>
          <div className="text-xs font-mono text-slate-400 space-y-2">
            <p>Optimizes MAB parameters for context enrichment:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><span className="text-green-400">threshold</span> (0.25-0.5): Vector search similarity threshold</li>
              <li><span className="text-green-400">limit</span> (5-15): Number of vector search results</li>
              <li><span className="text-green-400">content_types</span>: Types of content to include</li>
              <li><span className="text-green-400">shard_params.limit</span> (5-25): Number of shards to fetch</li>
              <li><span className="text-green-400">shard_params.min_confidence</span>: Quality filter</li>
            </ul>
          </div>
        </div>

        {/* Test Cases Section */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowTestCases(!showTestCases)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-green-400 transition-colors"
          >
            <span className="text-green-400">{showTestCases ? '▼' : '▶'}</span>
            TEST_CASES ({params.test_cases.length})
          </button>

          {showTestCases && (
            <div className="space-y-3 border border-green-500/20 rounded p-4 bg-black/30">
              {params.test_cases.map((testCase, index) => (
                <div key={index} className="border border-green-500/20 rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-green-400">TEST_CASE_{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-slate-400">USER_MESSAGE</label>
                    <textarea
                      value={testCase.user_message}
                      onChange={(e) => updateTestCase(index, 'user_message', e.target.value)}
                      rows={2}
                      className="w-full bg-black border border-green-500/30 rounded px-3 py-2 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 resize-none"
                      placeholder="What should the user be asking?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-slate-400">PROJECT_ID (optional)</label>
                      <input
                        type="text"
                        value={testCase.project_id || ''}
                        onChange={(e) => updateTestCase(index, 'project_id', e.target.value)}
                        className="w-full bg-black border border-green-500/30 rounded px-3 py-2 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                        placeholder="Leave empty for all projects"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="block text-xs font-mono text-slate-400">EXPECTED_RELEVANCE</label>
                      <input
                        type="number"
                        value={testCase.expected_relevance || 0.7}
                        onChange={(e) => updateTestCase(index, 'expected_relevance', parseFloat(e.target.value))}
                        min={0}
                        max={1}
                        step={0.1}
                        aria-label="Expected relevance score for test case"
                        className="w-full bg-black border border-green-500/30 rounded px-3 py-2 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addTestCase}
                className="w-full px-4 py-2 bg-green-500/10 border border-green-500/30 rounded text-xs font-mono text-green-400 hover:bg-green-500/20 transition-colors"
              >
                + ADD_TEST_CASE
              </button>
            </div>
          )}
        </div>

        {/* Main Parameters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-mono text-green-400 uppercase tracking-wider">
              ALGORITHM
            </label>
            <select
              value={params.algorithm}
              onChange={(e) => setParams(prev => ({ ...prev, algorithm: e.target.value as any }))}
              aria-label="Select optimization algorithm"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
            >
              <option value="mab_evolution">MAB_EVOLUTION (Recommended)</option>
              <option value="genetic">GENETIC (Evolution only)</option>
              <option value="mab_only">MAB_ONLY (Thompson Sampling)</option>
            </select>
          </div>

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
              aria-label="Number of evolution generations"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
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
              aria-label="Population size per generation"
              className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={params.mock_mode}
              onChange={(e) => setParams(prev => ({ ...prev, mock_mode: e.target.checked }))}
              aria-label="Enable mock mode for testing"
              className="w-4 h-4 bg-black border-yellow-500/30 text-yellow-500 rounded focus:ring-yellow-500/50"
            />
            <span className="text-xs font-mono text-slate-400 group-hover:text-yellow-400 transition-colors">
              MOCK_MODE (testing only)
            </span>
          </label>
        </div>

        {/* Advanced Parameters */}
        <div className="pt-6 space-y-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-green-400 transition-colors"
          >
            <span className="text-green-400">{showAdvanced ? '▼' : '▶'}</span>
            ADVANCED_PARAMETERS
          </button>

          {showAdvanced && (
            <div className="space-y-4 border border-green-500/20 rounded p-4 bg-black/30">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label htmlFor="workers-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    WORKERS
                  </label>
                  <input
                    id="workers-input"
                    type="number"
                    value={params.parallel_workers}
                    onChange={(e) => setParams(prev => ({ ...prev, parallel_workers: parseInt(e.target.value) }))}
                    min={1}
                    max={10}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mutation-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    MUTATION_RATE
                  </label>
                  <input
                    id="mutation-input"
                    type="number"
                    value={params.mutation_rate}
                    onChange={(e) => setParams(prev => ({ ...prev, mutation_rate: parseFloat(e.target.value) }))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="crossover-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    CROSSOVER_RATE
                  </label>
                  <input
                    id="crossover-input"
                    type="number"
                    value={params.crossover_rate}
                    onChange={(e) => setParams(prev => ({ ...prev, crossover_rate: parseFloat(e.target.value) }))}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="elite-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    ELITE_SIZE
                  </label>
                  <input
                    id="elite-input"
                    type="number"
                    value={params.elite_size}
                    onChange={(e) => setParams(prev => ({ ...prev, elite_size: parseInt(e.target.value) }))}
                    min={1}
                    max={10}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="retries-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    MAX_RETRIES
                  </label>
                  <input
                    id="retries-input"
                    type="number"
                    value={params.max_retries}
                    onChange={(e) => setParams(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
                    min={0}
                    max={10}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="timeout-input" className="block text-xs font-mono text-green-400 uppercase tracking-wider">
                    TIMEOUT_SECONDS
                  </label>
                  <input
                    id="timeout-input"
                    type="number"
                    value={params.timeout_seconds}
                    onChange={(e) => setParams(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                    min={10}
                    max={300}
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono text-green-400 uppercase tracking-wider">
                    EARLY_STOPPING
                    <input
                      type="checkbox"
                      checked={params.early_stopping_enabled}
                      onChange={(e) => setParams(prev => ({ ...prev, early_stopping_enabled: e.target.checked }))}
                      aria-label="Enable early stopping"
                      className="w-4 h-4 bg-black border-green-500/30 text-green-500 rounded focus:ring-green-500/50"
                    />
                  </label>
                  <input
                    type="number"
                    value={params.early_stopping_patience}
                    onChange={(e) => setParams(prev => ({ ...prev, early_stopping_patience: parseInt(e.target.value) }))}
                    min={1}
                    max={10}
                    disabled={!params.early_stopping_enabled}
                    placeholder="Patience"
                    aria-label="Early stopping patience"
                    className="w-full bg-black border border-green-500/30 rounded px-4 py-3 text-sm text-green-400 font-mono focus:outline-none focus:border-green-400 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center gap-4">
          <button
            type="submit"
            disabled={isRunning}
            className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-black font-mono font-bold text-sm tracking-wider rounded transition-all duration-300 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
          >
            {isRunning ? '>>> OPTIMIZING...' : '>>> RUN_OPTIMIZATION'}
          </button>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
              RUNNING...
            </div>
          )}

          {jobId && !isRunning && (
            <div className="flex items-center gap-2 text-sm text-green-400 font-mono">
              <span className="text-green-400">✓</span>
              JOB_QUEUED
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
