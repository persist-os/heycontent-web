'use client'

import { Sparkles, X, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { LanguageToggle } from '@/components/language-toggle'
import { T } from '@/components/translation'
import { cn } from '@/lib/utils'

interface CommandPaletteHeaderProps {
  onClose: () => void;
  onSettingsClick: () => void;
  isSettingsActive: boolean;
}

export function CommandPaletteHeader({ 
  onClose, 
  onSettingsClick,
  isSettingsActive 
}: CommandPaletteHeaderProps) {
  return (
    <div className="p-6 border-b border-border/30 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Sparkles className="w-6 h-6 text-white/90" />
          </div>
          <div>
            <h2 className="text-xl font-light tracking-tight text-white">
              <T context="dashboard_nav.command_palette.title">Command Palette</T>
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onSettingsClick}
            className={cn(
              "p-1.5 hover:bg-white/10 rounded-lg transition-colors",
              isSettingsActive && "bg-white/20"
            )}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-white/90" />
          </button>
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Close command palette"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4 text-white/90" />
          </button>
        </div>
      </div>
    </div>
  );
}

