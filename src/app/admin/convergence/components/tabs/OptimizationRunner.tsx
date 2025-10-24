'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/auth-context';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';

export function OptimizationRunner() {
  const { firebaseUser } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  // Get current config for this user
  const currentConfig = useQuery(api.convergenceCurrentConfigQueries.getCurrentConfig, 
    firebaseUser?.uid ? { user_id: firebaseUser.uid } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setOutput([]);
    setJobId(null);

    try {
      setOutput(prev => [...prev, 
        '[INIT] Starting optimization...',
        `[INFO] System: ${currentConfig?.system_name || 'Unknown'}`,
        `[INFO] Config: ${currentConfig?.name || 'Unknown'}`,
        '[INFO] Sending request to backend...',
        ''
      ]);

      const idToken = await firebaseUser?.getIdToken();
      if (!idToken) {
        throw new Error('No authentication token');
      }

      const response = await fetch('/api/convergence/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          user_id: firebaseUser?.uid,
          system_name: currentConfig?.system_name || '',
          config_type: 'mab_params',
          algorithm: currentConfig?.algorithm || 'mab_evolution',
          generations: currentConfig?.config?.optimization?.evolution?.generations || 3,
          population_size: currentConfig?.config?.optimization?.evolution?.population_size || 10,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start optimization');
      }

      setOutput(prev => [...prev, 
        '[SUCCESS] Optimization job started!',
        `[JOB_ID] ${result.job_id}`,
        '[INFO] Job is running in background...',
        '[INFO] Check job status in JOBS tab',
        ''
      ]);
      
      setJobId(result.job_id);
    } catch (error) {
      setOutput(prev => [...prev, 
        '[ERROR] Failed to start optimization',
        `[ERROR] ${error instanceof Error ? error.message : 'Unknown error'}`,
        ''
      ]);
    } finally {
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
          <span className="text-xs text-slate-600">OPTIMIZATION_RUNNER</span>
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
              {currentConfig 
                ? 'Ready to run optimization...' 
                : 'Load a config from CONFIG_GEN tab first...'}
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
          <div className="text-xs font-mono text-slate-400 space-y-2">
            <p>Optimization requires a loaded configuration.</p>
            <p>Go to <span className="text-yellow-400">CONFIG_GEN</span> tab to:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Generate a preset configuration</li>
              <li>Load it as current config</li>
              <li>Then return here to run optimization</li>
            </ul>
          </div>
        </div>
      )}

      {/* Simple Run Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={isRunning || !currentConfig}
          className={`px-8 py-3 font-mono font-bold text-sm tracking-wider rounded transition-all duration-300 ${
            currentConfig 
              ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]' 
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          } ${isRunning ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : ''}`}
        >
          {isRunning ? '>>> OPTIMIZING...' : 
           !currentConfig ? '>>> LOAD_CONFIG_FIRST' : 
           '>>> RUN_OPTIMIZATION'}
        </button>
        
        {isRunning && (
          <div className="flex items-center gap-2 text-sm text-green-400 font-mono ml-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
            RUNNING...
          </div>
        )}

        {jobId && !isRunning && (
          <div className="flex items-center gap-2 text-sm text-green-400 font-mono ml-4">
            <span className="text-green-400">✓</span>
            JOB_ID: {jobId}
          </div>
        )}
      </div>
    </div>
  );
}