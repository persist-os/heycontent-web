'use client'

import React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export type PanelMode = 'notepad' | 'artifacts' | 'widgets'

interface PanelModeSwitcherProps {
  mode: PanelMode
  onModeChange: (mode: PanelMode) => void
  availableModes?: PanelMode[]
  className?: string
}

const ALL_MODES: PanelMode[] = ['notepad', 'artifacts', 'widgets']

const MODE_LABELS: Record<PanelMode, string> = {
  notepad: 'Notepad',
  artifacts: 'Artifacts',
  widgets: 'Widgets',
}

/**
 * Panel Mode Switcher Component
 * 
 * Compact dropdown/select for switching between panel modes (Notepad, Artifacts, Widgets).
 * Replaces cluttered tab buttons with elegant, space-efficient switcher.
 * 
 * PATTERN COMPLIANCE:
 * - Uses <Select> from components/ui/select.tsx (re-use existing components)
 * - Semantic colors (bg-card, text-foreground, etc.)
 * - Mobile-responsive (full-width on mobile, compact on desktop)
 * - Accessible (ARIA labels, keyboard navigation via Radix UI)
 * - Centralized component (single source of truth for mode switching)
 */
export function PanelModeSwitcher({
  mode,
  onModeChange,
  availableModes = ALL_MODES,
  className,
}: PanelModeSwitcherProps) {
  return (
    <Select value={mode} onValueChange={onModeChange}>
      <SelectTrigger
        className={cn(
          // Mobile: Compact width to avoid overlap with navigation, 44px minimum height
          'w-auto min-w-[120px] max-w-[calc(100%-1rem)] min-h-[44px] px-3 py-2',
          // Desktop: Compact width, right-aligned
          'md:w-32 md:max-w-none',
          // Semantic colors
          'bg-card border-border text-foreground',
          // Remove blue focus ring - clean, minimalistic
          'focus:ring-0 focus:ring-offset-0',
          // Subtle focus feedback (border color change instead of ring)
          'focus:border-border/60',
          // Hover state
          'hover:bg-accent/10',
          className
        )}
        aria-label="Switch panel mode"
      >
        <SelectValue>
          <span className="font-medium">{MODE_LABELS[mode]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className="bg-popover/95 backdrop-blur-sm border-border"
        position="popper"
      >
        {availableModes.map((availableMode) => (
          <SelectItem
            key={availableMode}
            value={availableMode}
            className={cn(
              'text-foreground',
              mode === availableMode && 'bg-primary/10 text-primary font-medium'
            )}
            aria-label={`Switch to ${MODE_LABELS[availableMode]} view`}
          >
            {MODE_LABELS[availableMode]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

