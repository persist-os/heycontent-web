'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

interface ConstellationControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  className?: string
}

export function ConstellationControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
  className = ''
}: ConstellationControlsProps) {
  const formatScale = (value: number) => {
    return `${Math.round(value * 100)}%`
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Zoom Controls */}
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
        <div className="flex flex-col gap-1">
          {/* Zoom In */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={scale >= 3.0}
            className="h-8 w-8 p-0 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Zoom in"
          >
            <span className="text-lg font-light leading-none">+</span>
          </Button>
          
          {/* Scale Display */}
          <div className="px-2 py-1 text-xs font-mono text-center text-muted-foreground/80 min-w-[3rem]">
            {formatScale(scale)}
          </div>
          
          {/* Zoom Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={scale <= 0.2}
            className="h-8 w-8 p-0 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Zoom out"
          >
            <span className="text-lg font-light leading-none">−</span>
          </Button>
        </div>
      </div>

      {/* Reset View */}
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-8 w-full px-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Reset view"
        >
          Reset
        </Button>
      </div>

      {/* Instructions - shown at low zoom */}
      {scale < 0.8 && (
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg max-w-[200px]">
          <div className="text-xs text-muted-foreground/80 space-y-2 leading-relaxed">
            <p className="font-medium">Navigate:</p>
            <div className="space-y-1 text-muted-foreground/60">
              <p>• Drag to pan</p>
              <p>• Scroll to zoom</p>
              <p>• Click projects to open</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
