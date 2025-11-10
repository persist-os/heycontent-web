'use client'

import React, { useMemo } from 'react'
import { T } from '@/components/translation/T'

interface ProjectPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
}

interface ConstellationMinimapProps {
  positions: ProjectPosition[]
  canvasWidth: number
  canvasHeight: number
  viewportWidth: number
  viewportHeight: number
  currentTransform: {
    x: number
    y: number
    scale: number
  }
  onViewportClick: (x: number, y: number) => void
  className?: string
}

export function ConstellationMinimap({
  positions,
  canvasWidth,
  canvasHeight,
  viewportWidth,
  viewportHeight,
  currentTransform,
  onViewportClick,
  className = ''
}: ConstellationMinimapProps) {
  // Minimap dimensions
  const minimapWidth = 160
  const minimapHeight = 120
  
  // Calculate scale factors to fit canvas in minimap
  const scaleX = minimapWidth / canvasWidth
  const scaleY = minimapHeight / canvasHeight
  const minimapScale = Math.min(scaleX, scaleY)
  
  // Actual minimap content dimensions
  const contentWidth = canvasWidth * minimapScale
  const contentHeight = canvasHeight * minimapScale
  
  // Calculate current viewport position and size in minimap coordinates
  const viewportInMinimap = useMemo(() => {
    // Current viewport bounds in canvas coordinates
    const viewportLeft = -currentTransform.x / currentTransform.scale
    const viewportTop = -currentTransform.y / currentTransform.scale
    const viewportRight = viewportLeft + viewportWidth / currentTransform.scale
    const viewportBottom = viewportTop + viewportHeight / currentTransform.scale
    
    // Convert to minimap coordinates
    return {
      x: viewportLeft * minimapScale,
      y: viewportTop * minimapScale,
      width: (viewportRight - viewportLeft) * minimapScale,
      height: (viewportBottom - viewportTop) * minimapScale
    }
  }, [currentTransform, viewportWidth, viewportHeight, minimapScale])

  // Handle click on minimap to pan to that location
  const handleMinimapClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top
    
    // Convert minimap click to canvas coordinates
    const canvasX = clickX / minimapScale
    const canvasY = clickY / minimapScale
    
    onViewportClick(canvasX, canvasY)
  }

  // Group projects by importance for rendering
  const projectGroups = useMemo(() => {
    const groups = {
      high: positions.filter(p => p.importance > 0.7),
      medium: positions.filter(p => p.importance > 0.4 && p.importance <= 0.7),
      low: positions.filter(p => p.importance <= 0.4)
    }
    return groups
  }, [positions])

  if (positions.length === 0) {
    return null
  }

  return (
    <div className={`${className}`}>
      <div className="bg-background/90 backdrop-blur-sm border border-border/50 rounded-lg p-2 shadow-lg max-w-[180px] max-h-[160px]">
        {/* Minimap Header */}
        <div className="mb-2 px-1">
          <div className="text-xs font-medium text-foreground/80">
            <T context="constellation.minimap.title">Constellation</T>
          </div>
        </div>

        {/* Minimap Canvas */}
        <div 
          className="relative bg-muted/20 rounded border border-border/30 cursor-pointer overflow-hidden"
          style={{ width: minimapWidth, height: minimapHeight }}
          onClick={handleMinimapClick}
        >
          {/* Background grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="minimapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#minimapGrid)" className="text-muted-foreground" />
            </svg>
          </div>

          {/* Project dots */}
          <svg 
            width={minimapWidth} 
            height={minimapHeight}
            className="absolute inset-0"
          >
            {/* Low importance projects */}
            {projectGroups.low.map(position => (
              <circle
                key={`low-${position.id}`}
                cx={position.x * minimapScale}
                cy={position.y * minimapScale}
                r="1.5"
                className="fill-muted-foreground/40"
              />
            ))}
            
            {/* Medium importance projects */}
            {projectGroups.medium.map(position => (
              <circle
                key={`medium-${position.id}`}
                cx={position.x * minimapScale}
                cy={position.y * minimapScale}
                r="2"
                className="fill-blue-400/60 dark:fill-blue-300/60"
              />
            ))}
            
            {/* High importance projects */}
            {projectGroups.high.map(position => (
              <g key={`high-${position.id}`}>
                {/* Glow effect */}
                <circle
                  cx={position.x * minimapScale}
                  cy={position.y * minimapScale}
                  r="4"
                  className="fill-blue-400/20 dark:fill-blue-300/20"
                />
                {/* Main dot */}
                <circle
                  cx={position.x * minimapScale}
                  cy={position.y * minimapScale}
                  r="2.5"
                  className="fill-blue-500/80 dark:fill-blue-400/80"
                />
              </g>
            ))}
          </svg>

          {/* Current viewport indicator */}
          <div
            className="absolute border-2 border-foreground/60 bg-foreground/10 rounded-sm pointer-events-none"
            style={{
              left: Math.max(0, Math.min(minimapWidth - viewportInMinimap.width, viewportInMinimap.x)),
              top: Math.max(0, Math.min(minimapHeight - viewportInMinimap.height, viewportInMinimap.y)),
              width: Math.min(viewportInMinimap.width, minimapWidth),
              height: Math.min(viewportInMinimap.height, minimapHeight)
            }}
          />

          {/* Viewport center indicator */}
          <div
            className="absolute w-1 h-1 bg-foreground rounded-full pointer-events-none"
            style={{
              left: Math.max(0, Math.min(minimapWidth, viewportInMinimap.x + viewportInMinimap.width / 2)) - 2,
              top: Math.max(0, Math.min(minimapHeight, viewportInMinimap.y + viewportInMinimap.height / 2)) - 2
            }}
          />
        </div>

        {/* Legend */}
        <div className="mt-2 px-1 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
            <div className="w-2 h-2 rounded-full bg-blue-500/80 dark:bg-blue-400/80" />
            <span>
              <T context="constellation.minimap.legend.important">Important</T>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 dark:bg-blue-300/60" />
            <span>
              <T context="constellation.minimap.legend.active">Active</T>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>
              <T context="constellation.minimap.legend.others">Others</T>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
