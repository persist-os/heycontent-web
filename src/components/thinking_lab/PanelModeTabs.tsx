/**
 * Panel Mode Tabs Component
 * 
 * Reusable tab switcher for panel modes (notepad, artifacts, widgets).
 * Uses design system Button component with semantic colors.
 * 
 * PATTERN COMPLIANCE:
 * - Uses <Button> from components/ui/button.tsx (not custom buttons)
 * - Semantic colors (bg-primary, text-primary-foreground, etc.)
 * - Accessible (aria-selected, proper labels)
 * - Pure UI component (no hooks, no state)
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PanelMode = 'notepad' | 'artifacts' | 'widgets'

export interface PanelModeTabsProps {
  mode: PanelMode
  onModeChange: (mode: PanelMode) => void
  availableModes?: PanelMode[]
}

const ALL_MODES: PanelMode[] = ['notepad', 'artifacts', 'widgets']

const MODE_LABELS: Record<PanelMode, string> = {
  notepad: 'Notepad',
  artifacts: 'Artifacts',
  widgets: 'Widgets',
}

export function PanelModeTabs({
  mode,
  onModeChange,
  availableModes = ALL_MODES,
}: PanelModeTabsProps) {
  return (
    <div className="border-b border-border/20 p-2 flex gap-2 bg-card/50 backdrop-blur-sm flex-shrink-0 min-w-[200px]">
      {availableModes.map((tabMode) => {
        const isActive = mode === tabMode
        return (
          <Button
            key={tabMode}
            onClick={() => onModeChange(tabMode)}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className={cn(
              'px-3 py-1 rounded text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground font-semibold'
                : 'hover:bg-accent text-muted-foreground'
            )}
            aria-selected={isActive}
            aria-label={`Switch to ${MODE_LABELS[tabMode]} view`}
          >
            {MODE_LABELS[tabMode]}
          </Button>
        )
      })}
    </div>
  )
}

