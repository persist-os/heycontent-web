'use client'

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

// Drag state and visual effects interface
export interface DragVisualState {
  isDragging: boolean
  opacity: number
  glowIntensity: number
  isHovered: boolean
  isValidDrop: boolean
  errorAnimation: boolean
  swapPreview: boolean
}

interface WidgetCardProps {
  widget: WidgetConfig
  x: number
  y: number
  scale: number
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
  onMouseDown?: (event: React.MouseEvent) => void
  dragState?: DragVisualState
  className?: string
}

/**
 * Enhanced widget card with title and update frequency.
 * Supports drag states, visual effects, and smooth animations.
 * Rendered as a rectangle that scales with zoom level.
 * 
 * @example
 * // Basic usage (backward compatible)
 * <WidgetCard 
 *   widget={widget} 
 *   x={100} 
 *   y={100} 
 *   scale={1.0} 
 *   onClick={() => console.log('clicked')} 
 * />
 * 
 * @example
 * // Enhanced usage with drag states
 * <WidgetCard 
 *   widget={widget} 
 *   x={100} 
 *   y={100} 
 *   scale={1.0} 
 *   onClick={() => console.log('clicked')}
 *   onMouseDown={(e) => startDrag(widget, e)}
 *   dragState={{
 *     isDragging: true,
 *     opacity: 0.5,
 *     glowIntensity: 0.8,
 *     isValidDrop: true,
 *     swapPreview: false,
 *     errorAnimation: false
 *   }}
 * />
 */
export function WidgetCard({ 
  widget, 
  x, 
  y, 
  scale, 
  onClick, 
  onHover, 
  onMouseDown,
  dragState,
  className = ''
}: WidgetCardProps) {
  const width = 140 / Math.max(scale, 0.001) // Increased width for better readability
  const height = 70 / Math.max(scale, 0.001) // Increased height for better readability
  const left = x - width / 2
  const top = y - height / 2

  // Default drag state if not provided
  const defaultDragState: DragVisualState = {
    isDragging: false,
    opacity: 1,
    glowIntensity: 0,
    isHovered: false,
    isValidDrop: true,
    errorAnimation: false,
    swapPreview: false
  }

  const visualState = dragState || defaultDragState

  // Calculate dynamic styles based on drag state
  const getCardStyles = () => {
    const baseStyles = {
      left,
      top,
      width,
      height,
      borderColor: 'hsl(var(--border))',
      opacity: visualState.opacity,
      transform: visualState.isDragging ? 'scale(1.05)' : 'scale(1)',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }

    // Add glow effect for drag states
    if (visualState.glowIntensity > 0) {
      const glowColor = visualState.isValidDrop 
        ? 'hsl(var(--primary))' 
        : 'hsl(var(--destructive))'
      const glowSize = 8 * visualState.glowIntensity
      
      return {
        ...baseStyles,
        boxShadow: `0 0 ${glowSize}px ${glowColor}40, 0 0 ${glowSize * 2}px ${glowColor}20`,
        borderColor: glowColor,
      }
    }

    return baseStyles
  }

  // Get dynamic CSS classes based on state
  const getCardClasses = () => {
    const baseClasses = [
      'absolute rounded-lg border shadow-md cursor-pointer z-20 bg-card/40 border-border backdrop-blur-sm',
      className
    ]

    if (visualState.isDragging) {
      baseClasses.push('cursor-grabbing')
    } else {
      baseClasses.push('hover:shadow-xl hover:border-primary hover:scale-105')
    }

    if (visualState.errorAnimation) {
      baseClasses.push('animate-pulse')
    }

    if (visualState.swapPreview) {
      baseClasses.push('border-dashed border-primary/60')
    }

    return baseClasses.join(' ')
  }

  return (
    <div
      className={getCardClasses()}
      style={getCardStyles()}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <div
        className="absolute inset-0 p-2 flex flex-col justify-between"
        style={{ transform: `scale(${1 / Math.max(scale, 0.001)})` }}
      >
        {/* Top row: Title and Status dot */}
        <div className="flex items-center justify-between">
          <h3 className={`font-medium text-sm truncate flex-1 mr-2 transition-colors duration-200 ${
            visualState.isDragging 
              ? 'text-primary' 
              : visualState.errorAnimation 
                ? 'text-destructive' 
                : 'text-foreground'
          }`}>
            {widget.title}
          </h3>
          <div 
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              visualState.isDragging 
                ? 'bg-primary animate-pulse' 
                : widget.status === 'active' 
                  ? 'bg-green-500' 
                  : widget.status === 'generating' 
                    ? 'bg-yellow-500' 
                    : 'bg-gray-500'
            }`}
          />
        </div>

        {/* Bottom row: Update frequency as bullet */}
        <div className={`text-xs transition-colors duration-200 ${
          visualState.isDragging 
            ? 'text-primary/80' 
            : visualState.errorAnimation 
              ? 'text-destructive/80' 
              : 'text-muted-foreground'
        }`}>
          • {widget.update_frequency}
        </div>
      </div>

      {/* Drop zone indicator overlay */}
      {visualState.swapPreview && (
        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/60 bg-primary/5 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-primary/80 font-medium">
              Drop to swap
            </div>
          </div>
        </div>
      )}

      {/* Error state overlay */}
      {visualState.errorAnimation && (
        <div className="absolute inset-0 rounded-lg border-2 border-destructive/60 bg-destructive/5 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs text-destructive/80 font-medium">
              Invalid drop
            </div>
          </div>
        </div>
      )}

      {/* Drag handle indicator */}
      {visualState.isDragging && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-primary/60 rounded-full animate-pulse" />
      )}
    </div>
  )
}
