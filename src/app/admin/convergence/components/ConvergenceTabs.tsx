'use client';

/**
 * Convergence Terminal Navigation
 * Command-line style tabs with terminal aesthetics
 */

import { Tab, TabId } from '../types';

interface ConvergenceTabsProps {
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
}

export function ConvergenceTabs({ tabs, activeTab, onTabChange }: ConvergenceTabsProps) {
  return (
    <div className="bg-black border-b border-green-500/20">
      <div className="px-8">
        <div className="flex items-center gap-0">
          {tabs.map((tab, index) => {
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="group relative py-4 px-6 transition-all duration-200 border-r border-green-500/10 first:border-l hover:bg-green-500/5"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-mono transition-colors ${
                    isActive 
                      ? 'text-green-400' 
                      : 'text-slate-600 group-hover:text-green-600'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="space-y-0.5">
                    <div className={`text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                      isActive 
                        ? 'text-green-400' 
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}>
                      {tab.label}
                    </div>
                    <div className={`text-[10px] font-mono transition-colors ${
                      isActive 
                        ? 'text-cyan-500/70' 
                        : 'text-slate-700 group-hover:text-slate-600'
                    }`}>
                      $ {tab.cmd}
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-green-400 text-xs animate-pulse">█</span>
                  )}
                </div>
                
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

