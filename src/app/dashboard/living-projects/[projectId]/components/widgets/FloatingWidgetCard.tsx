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
import { Clock } from 'lucide-react'
import { WidgetScheduleControls } from './WidgetScheduleControls'
import { type FamilyStatus, FAMILY_STATUS_CONFIG } from '@/app/types/family-status'

interface FloatingWidgetCardProps {
  widget: WidgetConfig & {
    _id: string
    scheduleEnabled?: boolean
    nextScheduledRun?: number | null
    scheduleFrequency?: string
  }
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (widgetId: string | null) => void
  status: FamilyStatus
  projectId?: string
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
  onHover,
  status,
  projectId = ''
}: FloatingWidgetCardProps) {
  // Get status badge configuration
  const statusBadge = FAMILY_STATUS_CONFIG[status]
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
    
    // Round to nearest pixel to prevent subpixel blur
    return {
      width: Math.round(baseSize.width * zoomMultiplier),
      minHeight: Math.round(baseSize.minHeight * zoomMultiplier)
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Counter-scale to maintain native resolution when parent canvas is scaled
  const counterScale = 1 / Math.max(0.5, Math.min(2, scale)) // Clamp for safety

  // Show different levels of detail based on zoom
  const showDescription = scale > 0.8
  const showMetadata = scale > 1.0
  const showFullDetails = scale > 1.4

  // Calculate opacity based on importance and scale - use discrete steps to reduce GPU compositing
  const baseOpacity = importance > 0.8 ? 1 : importance > 0.5 ? 0.9 : 0.8
  const scaleOpacity = scale > 1.2 ? 1 : scale > 0.8 ? 0.95 : 0.9
  const finalOpacity = Math.round(baseOpacity * scaleOpacity * 100) / 100 // Round to 2 decimals

  return (
    <div
      className="absolute cursor-pointer group transition-all duration-300 ease-out will-change-transform"
      style={{
        left: `${Math.round(x - width/2)}px`,
        top: `${Math.round(y - minHeight/2)}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity,
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        transformOrigin: 'center center'
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(widget.widget_id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Main Card */}
      <div className={`
        relative w-full rounded-xl bg-card/90
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${isHighlighted ? 'ring-2 ring-blue-400/60 scale-[1.01]' : ''}
      `} style={{ 
        minHeight: `${minHeight}px`,
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)'
      }}>
        {/* Counter-scale wrapper to maintain native resolution */}
        <div style={{
          transform: `scale(${counterScale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%'
        }}>
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
            
            {/* Status Badge - shown at medium zoom and above */}
            {scale > 0.8 && (
              <div className="space-y-2">
                <div className={`
                  w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                  text-sm font-medium border transition-all duration-200
                  ${statusBadge.color}
                  ${statusBadge.animate ? 'animate-pulse' : ''}
                `}>
                  <span className="text-base">{statusBadge.icon}</span>
                  <span>{statusBadge.label}</span>
                </div>

                {scale > 0.9 && projectId && (
                  <WidgetScheduleControls 
                    widgetId={widget._id}
                    projectId={projectId}
                    isScheduled={widget.scheduleEnabled}
                    nextScheduledRun={widget.nextScheduledRun}
                    frequency={widget.scheduleFrequency}
                    className="justify-center"
                  />
                )}
              </div>
            )}
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
    </div>
  )
}
