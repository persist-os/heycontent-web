'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'

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

  const { text: zoomOutText } = useTranslation('Zoom out', { targetLang: 'en', context: 'constellation.controls.zoom_out' })
  const { text: zoomInText } = useTranslation('Zoom in', { targetLang: 'en', context: 'constellation.controls.zoom_in' })
  const { text: resetText } = useTranslation('Reset view', { targetLang: 'en', context: 'constellation.controls.reset' })

  return (
    <div className={`${className}`}>
      {/* Compact Zoom Controls */}
      <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg p-1 shadow-lg">
        <div className="flex items-center gap-1">
          {/* Zoom Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomOut}
            disabled={scale <= 0.2}
            className="h-6 w-6 p-0 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={zoomOutText}
          >
            <span className="text-xs font-light leading-none">−</span>
          </Button>
          
          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-6 px-2 text-xs font-medium text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={resetText}
          >
            <T context="constellation.controls.reset_button">Reset</T>
          </Button>
          
          {/* Zoom In */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onZoomIn}
            disabled={scale >= 3.0}
            className="h-6 w-6 p-0 text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={zoomInText}
          >
            <span className="text-xs font-light leading-none">+</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
