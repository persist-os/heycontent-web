'use client';

/**
 * Convergence Terminal Header
 * Full hacker mode - glitch effects, scan lines, terminal aesthetic
 */

interface ConvergenceHeaderProps {
  totalSessions: number;
  activeExperiments: number;
  legacyEntries: number;
}

export function ConvergenceHeader({ totalSessions, activeExperiments, legacyEntries }: ConvergenceHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-black border-b border-green-500/30">
      {/* Scan lines effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 0, 0.03) 2px, rgba(0, 255, 0, 0.03) 4px)',
        }}
      />
      
      {/* Glitch overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent animate-pulse" />
      
      <div className="relative px-8 py-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-baseline gap-4">
              <div className="flex items-center gap-3">
                <span className="text-green-400 font-mono text-sm animate-pulse">█</span>
                <h1 className="text-3xl font-mono font-bold tracking-wider text-green-400 glitch-text">
                  THE_CONVERGENCE
                </h1>
              </div>
              <span className="text-xs font-mono text-green-600 tracking-widest">
                v0.1.0_BETA
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-cyan-400">$</span>
              <span className="text-slate-400">
                Self-learning API optimization engine // MAB + Evolution + RL Meta-Optimizer // Convex storage
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 font-mono">
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-green-400 tabular-nums">
                {totalSessions.toString().padStart(3, '0')}
              </div>
              <div className="text-[10px] text-green-600 tracking-widest uppercase">
                SESSIONS
              </div>
            </div>
            
            <div className="h-10 w-px bg-green-500/30" />
            
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-cyan-400 tabular-nums">
                {activeExperiments.toString().padStart(3, '0')}
              </div>
              <div className="text-[10px] text-cyan-600 tracking-widest uppercase">
                ACTIVE
              </div>
            </div>
            
            <div className="h-10 w-px bg-green-500/30" />
            
            <div className="text-right space-y-1">
              <div className="text-2xl font-bold text-amber-400 tabular-nums">
                {legacyEntries.toString().padStart(4, '0')}
              </div>
              <div className="text-[10px] text-amber-600 tracking-widest uppercase">
                CONVEX_DB
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glitch-text {
          text-shadow: 
            0.05em 0 0 rgba(255, 0, 0, 0.3),
            -0.05em -0.025em 0 rgba(0, 255, 0, 0.3),
            0.025em 0.05em 0 rgba(0, 255, 255, 0.3);
          animation: glitch 2s infinite;
        }

        @keyframes glitch {
          0%, 100% {
            text-shadow: 
              0.05em 0 0 rgba(255, 0, 0, 0.3),
              -0.05em -0.025em 0 rgba(0, 255, 0, 0.3),
              0.025em 0.05em 0 rgba(0, 255, 255, 0.3);
          }
          25% {
            text-shadow: 
              -0.05em -0.025em 0 rgba(255, 0, 0, 0.3),
              0.025em 0.05em 0 rgba(0, 255, 0, 0.3),
              -0.05em 0 0 rgba(0, 255, 255, 0.3);
          }
          50% {
            text-shadow: 
              0.025em 0.05em 0 rgba(255, 0, 0, 0.3),
              0.05em 0 0 rgba(0, 255, 0, 0.3),
              0 -0.05em 0 rgba(0, 255, 255, 0.3);
          }
          75% {
            text-shadow: 
              -0.025em 0 0 rgba(255, 0, 0, 0.3),
              -0.025em -0.025em 0 rgba(0, 255, 0, 0.3),
              -0.025em -0.05em 0 rgba(0, 255, 255, 0.3);
          }
        }
      `}</style>
    </div>
  );
}

