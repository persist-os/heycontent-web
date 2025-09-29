/**
 * FLOATING WIDGET CARD COMPONENT
 * 
 * Individual widget card for constellation view with dynamic sizing,
 * zoom-responsive content, and interaction handling.
 */

'use client'

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'
import { getWidgetThemeClasses } from '../utils/widgetStyling'

interface FloatingWidgetCardProps {
  widget: WidgetConfig
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (widgetId: string | null) => void
}

/**
 * Floating widget card component for constellation view
 * Dynamically sized and styled based on zoom level and importance
 */
export function FloatingWidgetCard({
  widget,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onClick,
  onHover
}: FloatingWidgetCardProps) {
  // Dynamic sizing based on zoom level and content
  const getCardDimensions = () => {
    // Base sizes
    const baseSizes = {
      small: { width: 280, minHeight: 200 }, // Smaller for constellation
      medium: { width: 320, minHeight: 240 },
      large: { width: 360, minHeight: 280 }
    }
    
    // Default to medium if size is undefined
    const baseSize = baseSizes[size] || baseSizes.medium
    
    // Scale up dimensions based on zoom level for better readability
    const zoomMultiplier = Math.max(0.8, scale * 0.8) // Subtle scaling with zoom
    
    return {
      width: baseSize.width * zoomMultiplier,
      minHeight: baseSize.minHeight * zoomMultiplier
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Show different levels of detail based on zoom
  const showDescription = scale > 0.8
  const showMetadata = scale > 1.0
  const showFullDetails = scale > 1.4

  // Calculate opacity based on importance and scale
  const baseOpacity = Math.max(0.7, importance)
  const scaleOpacity = Math.min(1, Math.max(0.6, scale))
  const finalOpacity = baseOpacity * scaleOpacity

  return (
    <div
      className="absolute cursor-pointer group transition-all duration-300 ease-out will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - minHeight/2}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(widget.widget_id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Main Card */}
      <div className={`
        relative w-full rounded-xl border-2 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${getWidgetThemeClasses(widget.theme)}
        ${isHighlighted ? 'ring-2 ring-blue-400/60 scale-[1.01]' : 'ring-1 ring-border/50'}
      `} style={{ minHeight: `${minHeight}px` }}>
        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />

        {/* Content */}
        <div className="relative p-6 flex flex-col h-full">
          {/* Widget Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`
                font-semibold text-foreground leading-tight transition-colors duration-300
                group-hover:text-blue-600 dark:group-hover:text-blue-400 break-words
                ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
              `}>
                {widget.title}
              </h3>
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {widget.widget_type}
              </div>
            </div>
            {showDescription && (
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {widget.description}
              </p>
            )}
          </div>

          {/* Widget Content */}
          <div className="flex-grow space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium text-foreground">{widget.category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Priority:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(widget.priority / 10) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-foreground text-xs">{widget.priority}/10</span>
              </div>
            </div>
            {showMetadata && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium text-foreground capitalize">{widget.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium text-foreground capitalize">{widget.theme}</span>
                </div>
              </>
            )}
          </div>

          {/* Widget Footer */}
          {showFullDetails && (
            <div className="mt-4 pt-4 border-t border-current/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground/50">
                <span>ID: {widget.widget_id}</span>
                <span className="capitalize">{widget.update_frequency}</span>
              </div>
            </div>
          )}
        </div>

        {/* Importance indicator - subtle corner accent */}
        <div
          className={`
            absolute top-0 right-0 w-3 h-3 rounded-bl-lg rounded-tr-lg
            transition-opacity duration-300
            ${importance > 0.7 ? 'bg-blue-400/30' : importance > 0.4 ? 'bg-blue-400/20' : 'bg-blue-400/10'}
            ${isHighlighted ? 'opacity-100' : 'opacity-60'}
          `}
        />
      </div>
    </div>
  )
}
