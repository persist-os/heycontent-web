'use client';

/**
 * Terminal View - Raw command output
 * Live streaming terminal for debugging
 */

import { useState, useEffect, useRef } from 'react';

const MOCK_LOG_LINES = [
  { time: '22:59:06', level: 'INFO', msg: 'Convergence optimizer initialized' },
  { time: '22:59:06', level: 'INFO', msg: 'Loading configuration from ./optimization.yaml' },
  { time: '22:59:06', level: 'DEBUG', msg: 'API endpoint: https://api.openai.com/v1/chat/completions' },
  { time: '22:59:07', level: 'INFO', msg: '[MAB] Thompson Sampling initialized with prior alpha=1.0, beta=1.0' },
  { time: '22:59:07', level: 'INFO', msg: '[EVOLUTION] Genetic algorithm ready: population=10, generations=3' },
  { time: '22:59:08', level: 'INFO', msg: '[RL_META] Meta-optimizer enabled, loading legacy data...' },
  { time: '22:59:09', level: 'SUCCESS', msg: 'Convex storage connected: 156 historical configs loaded' },
  { time: '22:59:10', level: 'INFO', msg: 'Starting Generation 1/3...' },
  { time: '22:59:15', level: 'DEBUG', msg: 'Testing config: {temperature: 0.7, max_tokens: 500}' },
  { time: '22:59:18', level: 'SUCCESS', msg: 'Test passed: score=0.92, latency=1234ms' },
  { time: '22:59:20', level: 'DEBUG', msg: 'Testing config: {temperature: 0.5, max_tokens: 1000}' },
  { time: '22:59:23', level: 'SUCCESS', msg: 'Test passed: score=0.89, latency=2341ms' },
  { time: '22:59:25', level: 'INFO', msg: 'Generation 1 complete: best_score=0.92, avg_score=0.87' },
  { time: '22:59:26', level: 'INFO', msg: 'Applying mutations and crossover...' },
  { time: '22:59:27', level: 'INFO', msg: 'Starting Generation 2/3...' },
  { time: '22:59:45', level: 'SUCCESS', msg: 'Generation 2 complete: best_score=0.94, avg_score=0.91' },
  { time: '23:00:15', level: 'SUCCESS', msg: 'Generation 3 complete: best_score=0.94, avg_score=0.92' },
  { time: '23:00:16', level: 'INFO', msg: 'Optimization complete! Best config found with score 0.94' },
  { time: '23:00:16', level: 'INFO', msg: 'Saving results to ./results/optimization_run/' },
  { time: '23:00:17', level: 'SUCCESS', msg: 'Results saved: best_config.json, detailed_results.csv' },
  { time: '23:00:17', level: 'INFO', msg: 'Convex storage updated with winning config' },
];

export function TerminalView() {
  const [lines, setLines] = useState<typeof MOCK_LOG_LINES>([]);
  const [isLive, setIsLive] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLive && lines.length < MOCK_LOG_LINES.length) {
      const timer = setTimeout(() => {
        setLines(MOCK_LOG_LINES.slice(0, lines.length + 1));
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isLive, lines]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handlePlayback = () => {
    setLines([]);
    setIsLive(true);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-cyan-400';
      case 'SUCCESS': return 'text-green-400';
      case 'DEBUG': return 'text-slate-500';
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-8 space-y-4">
      {/* Control bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-mono font-bold text-green-400 uppercase tracking-wider">
            TERMINAL_OUTPUT
          </h2>
          <p className="text-xs font-mono text-slate-500">
            Live optimization logs // Real-time monitoring // Debug mode
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlayback}
            disabled={isLive && lines.length < MOCK_LOG_LINES.length}
            className="px-4 py-2 text-xs font-mono text-green-400 border border-green-500/30 hover:bg-green-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLive && lines.length < MOCK_LOG_LINES.length ? 'STREAMING...' : 'REPLAY_LOG'}
          </button>
          <button
            onClick={() => setLines(MOCK_LOG_LINES)}
            className="px-4 py-2 text-xs font-mono text-slate-400 border border-slate-600/30 hover:bg-slate-500/10 rounded transition-colors"
          >
            SHOW_ALL
          </button>
          <button className="px-4 py-2 text-xs font-mono text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded transition-colors">
            CLEAR
          </button>
        </div>
      </div>

      {/* Terminal window */}
      <div className="bg-black border border-green-500/30 rounded font-mono text-sm overflow-hidden">
        <div className="bg-green-900/20 px-4 py-2 border-b border-green-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-4 text-xs text-green-400">root@convergence:/opt/optimization#</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && lines.length < MOCK_LOG_LINES.length && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-green-400">LIVE</span>
              </div>
            )}
          </div>
        </div>
        <div
          ref={terminalRef}
          className="p-4 h-[600px] overflow-y-auto space-y-1 bg-black"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.02) 2px, rgba(0, 255, 0, 0.02) 4px)',
          }}
        >
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-3 hover:bg-green-500/5">
              <span className="text-slate-600 text-xs tabular-nums">{line.time}</span>
              <span className={`text-xs font-bold w-16 ${getLevelColor(line.level)}`}>
                [{line.level}]
              </span>
              <span className="text-slate-300 text-xs flex-1">{line.msg}</span>
            </div>
          ))}
          {lines.length > 0 && (
            <div className="flex items-center gap-2 pt-2">
              <span className="text-green-400 animate-pulse">█</span>
              <span className="text-slate-600 text-xs">_</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

