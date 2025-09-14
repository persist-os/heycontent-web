'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  analyzeFingerprintForWidgets,
  getWidgetThemeColors,
  getWidgetSizeClasses,
  type ProjectFingerprint
} from './WidgetFactory'
import { WidgetConfig } from '@/types/projectWidgets'
import { Sparkles, Heart, Coffee, BookOpen, Target, Users } from 'lucide-react'

// TODO: Replace all sample data imports with real backend queries
// TODO: Implement widget persistence - currently all widget state is ephemeral
// TODO: Add widget interaction logging for personalization
// TODO: Implement widget collaboration features for multi-user projects

// Reuse existing components and hooks
import { usePanZoom } from '../../hooks/usePanZoom'
import { ConnectionLines } from '../ConnectionLines'
import { ConstellationControls } from '../ConstellationControls'
import { ConstellationMinimap } from '../ConstellationMinimap'
import { LoadingState } from '../LoadingState'

// Create a widget-specific layout hook
function useWidgetLayout(widgets: WidgetConfig[]): {
  positions: Array<{
    id: string
    x: number
    y: number
    size: 'small' | 'medium' | 'large'
    importance: number
    cluster?: number
  }>
  canvasWidth: number
  canvasHeight: number
  connections: Array<{ from: string; to: string; strength: number }>
} {
  return useMemo(() => {
    // Check if we're running in the browser to avoid SSR issues
    const isClient = typeof window !== 'undefined'
    const defaultWidth = isClient ? window.innerWidth * 3 : 2400
    const defaultHeight = isClient ? window.innerHeight * 2.5 : 1600

    if (!widgets.length) {
      return {
        positions: [],
        canvasWidth: defaultWidth,
        canvasHeight: defaultHeight,
        connections: []
      }
    }

    const canvasWidth = Math.max(defaultWidth, 2400)
    const canvasHeight = Math.max(defaultHeight, 1600)

    // Calculate widget importance scores
    const widgetsWithImportance = widgets.map(widget => {
      const isHighPriority = widget.priority > 7
      const isLarge = widget.size === 'large'
      const isRecent = true // Widgets are always "current"

      let importance = 0.3 // Base importance

      if (isHighPriority) importance += 0.4
      if (isLarge) importance += 0.2
      if (isRecent) importance += 0.3

      importance = Math.min(importance, 1)

      return { ...widget, importance }
    })

    // Sort by importance for cluster generation
    const sortedWidgets = [...widgetsWithImportance].sort((a, b) => b.importance - a.importance)

    // Generate cluster centers for important widgets
    const numClusters = Math.min(Math.ceil(widgets.length / 4), 6)
    const clusterCenters: Array<{ x: number; y: number; radius: number }> = []

    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2
      const distance = Math.min(canvasWidth, canvasHeight) * 0.3
      const centerX = canvasWidth / 2 + Math.cos(angle) * distance
      const centerY = canvasHeight / 2 + Math.sin(angle) * distance

      // Add some randomness to break perfect symmetry
      const randomOffsetX = (Math.random() - 0.5) * 150
      const randomOffsetY = (Math.random() - 0.5) * 150

      clusterCenters.push({
        x: centerX + randomOffsetX,
        y: centerY + randomOffsetY,
        radius: 120 + Math.random() * 80
      })
    }

    // Position widgets using force-directed algorithm
    const positions: Array<{
      id: string
      x: number
      y: number
      size: 'small' | 'medium' | 'large'
      importance: number
      cluster?: number
    }> = []
    const minDistance = 200 // Minimum distance between widgets

    sortedWidgets.forEach((widget, index) => {
      let bestPosition = { x: 0, y: 0 }
      let bestScore = -Infinity
      const maxAttempts = 40

      // Try multiple positions and pick the best one
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x: number, y: number

        if (index < clusterCenters.length) {
          // Important widgets get cluster centers
          const cluster = clusterCenters[index]
          x = cluster.x + (Math.random() - 0.5) * cluster.radius
          y = cluster.y + (Math.random() - 0.5) * cluster.radius
        } else {
          // Other widgets are placed near existing clusters
          const nearestCluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
          const angle = Math.random() * Math.PI * 2
          const distance = nearestCluster.radius + Math.random() * 150
          x = nearestCluster.x + Math.cos(angle) * distance
          y = nearestCluster.y + Math.sin(angle) * distance
        }

        // Ensure position is within canvas bounds
        x = Math.max(150, Math.min(canvasWidth - 150, x))
        y = Math.max(120, Math.min(canvasHeight - 120, y))

        // Check distance from other widgets
        let validPosition = true
        let score = 0

        for (const existingPos of positions) {
          const distance = Math.sqrt(
            Math.pow(x - existingPos.x, 2) + Math.pow(y - existingPos.y, 2)
          )

          if (distance < minDistance) {
            validPosition = false
            break
          }

          // Prefer positions that create interesting visual patterns
          score += Math.min(distance, 400) / 400
        }

        if (validPosition && score > bestScore) {
          bestScore = score
          bestPosition = { x, y }
        }
      }

      positions.push({
        id: widget.widget_id,
        x: bestPosition.x,
        y: bestPosition.y,
        size: widget.size === 'xlarge' ? 'large' : widget.size as 'small' | 'medium' | 'large',
        importance: widget.importance,
        cluster: Math.floor(index / Math.ceil(widgets.length / numClusters))
      })
    })

    // Generate connections between related widgets
    const connections: Array<{ from: string; to: string; strength: number }> = []

    positions.forEach((pos1, i) => {
      positions.slice(i + 1).forEach(pos2 => {
        const widget1 = widgetsWithImportance.find(w => w.widget_id === pos1.id)!
        const widget2 = widgetsWithImportance.find(w => w.widget_id === pos2.id)!

        let connectionStrength = 0

        // Same cluster = stronger connection
        if (pos1.cluster === pos2.cluster) {
          connectionStrength += 0.3
        }

        // Same theme = related
        if (widget1.theme === widget2.theme) {
          connectionStrength += 0.2
        }

        // Similar priority = related
        if (Math.abs(widget1.priority - widget2.priority) <= 2) {
          connectionStrength += 0.2
        }

        // Distance-based connection (closer = more likely to connect)
        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )
        if (distance < 300) {
          connectionStrength += 0.2 * (1 - distance / 300)
        }

        // Only create connection if strength is above threshold
        if (connectionStrength > 0.25) {
          connections.push({
            from: pos1.id,
            to: pos2.id,
            strength: Math.min(connectionStrength, 1)
          })
        }
      })
    })

    return {
      positions,
      canvasWidth,
      canvasHeight,
      connections
    }
  }, [widgets])
}

interface LivingProjectViewProps {
  fingerprint: ProjectFingerprint
  sampleWidgets?: WidgetConfig[]
}

// TODO: Replace hardcoded personality theme system with backend-configured themes
// TODO: Implement dynamic theme generation based on user preferences
// TODO: Add theme customization and user-defined color schemes
// Personality-driven theme system based on fingerprint
function getPersonalityTheme(fingerprint: ProjectFingerprint) {
  const { domain, primary_pattern, base_personality } = fingerprint

  // TODO: Load theme configurations from backend database
  // TODO: Implement theme inheritance and customization
  // Base theme from domain
  let theme = {
    primary: 'blue',
    secondary: 'indigo',
    accent: 'purple',
    gradient: 'from-blue-50/30 via-indigo-50/20 to-purple-50/10',
    icon: Sparkles
  }

  // Override based on personality and patterns
  if (domain === 'creative') {
    theme = {
      primary: 'orange',
      secondary: 'yellow',
      accent: 'red',
      gradient: 'from-orange-50/40 via-yellow-50/25 to-red-50/15',
      icon: Heart
    }
  } else if (domain === 'academic') {
    theme = {
      primary: 'slate',
      secondary: 'gray',
      accent: 'emerald',
      gradient: 'from-slate-50/40 via-gray-50/25 to-emerald-50/15',
      icon: BookOpen
    }
  } else if (domain === 'business' || domain === 'professional') {
    theme = {
      primary: 'blue',
      secondary: 'indigo',
      accent: 'cyan',
      gradient: 'from-blue-50/40 via-indigo-50/25 to-cyan-50/15',
      icon: Target
    }
  }

  // Personality text adjustments
  const personalityText = base_personality?.toLowerCase() || ''
  if (personalityText.includes('warm') || personalityText.includes('friendly')) {
    theme.gradient = theme.gradient.replace('50/', '60/').replace('25/', '35/').replace('15/', '25/')
  }
  if (personalityText.includes('mystical') || personalityText.includes('creative')) {
    theme.accent = 'violet'
  }

  return theme
}

// Widget Star Component (similar to ProjectStar but for widgets)
function WidgetStar({
  widget,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onClick,
  onHover
}: {
  widget: WidgetConfig
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (widgetId: string | null) => void
}) {
  const themeColors = getWidgetThemeColors(widget.theme)
  
  // Dynamic sizing based on zoom level and content
  const getCardDimensions = () => {
    // Base sizes
    const baseSizes = {
      small: { width: 192, minHeight: 128 }, // w-48 min-h-32
      medium: { width: 256, minHeight: 160 }, // w-64 min-h-40
      large: { width: 320, minHeight: 192 } // w-80 min-h-48
    }
    
    const baseSize = baseSizes[size]
    
    // Scale up dimensions based on zoom level for better readability
    const zoomMultiplier = Math.max(1, scale * 0.8) // Subtle scaling with zoom
    
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
  const showAllContent = scale > 1.2 // Remove text truncation at higher zoom

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
      {/* Main Card - Now uses min-height instead of fixed height */}
      <div className={`
        relative w-full rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${themeColors.border} ${themeColors.bg}
        ${isHighlighted ? 'ring-2 ring-blue-400/60 scale-[1.01]' : 'ring-1 ring-border/50'}
      `} style={{ minHeight: `${minHeight}px` }}>
        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />

        {/* Content - Now allows natural height expansion */}
        <div className="relative p-4 flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className={`
                font-medium text-foreground leading-tight transition-colors duration-300
                group-hover:text-blue-600 dark:group-hover:text-blue-400 break-words
                ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
              `}>
                {widget.title}
              </h3>
              <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors text-xs flex-shrink-0 ml-2">
                →
              </div>
            </div>

            {/* Priority indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
                priority {widget.priority}/10
              </span>
              {widget.priority > 7 && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Widget content preview - Dynamic height based on zoom */}
          <div className="flex-grow mb-3">
            <div className={`
              text-muted-foreground/80 leading-relaxed break-words
              ${size === 'large' ? 'text-sm' : 'text-xs'}
              ${showAllContent ? '' : showFullDetails ? 'line-clamp-4' : showDescription ? 'line-clamp-3' : 'line-clamp-2'}
            `}>
              {renderWidgetContent(widget, showAllContent)}
            </div>
          </div>

          {/* Footer metadata */}
          {showMetadata && (
            <div className="flex-shrink-0 pt-2 border-t border-border/20 mt-auto">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    {widget.theme} theme
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {widget.widget_type}
                  </div>
                </div>
                {showFullDetails && (
                  <div className="text-right space-y-1">
                    <div className="text-muted-foreground/80">
                      Interact
                    </div>
                    <div className="text-muted-foreground/50 font-mono text-xs">
                      v{importance.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Minimal footer for low zoom */}
          {!showMetadata && (
            <div className="flex-shrink-0 pt-2 mt-auto">
              <div className="text-xs text-muted-foreground/50 font-mono">
                {widget.widget_type}
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

// TODO: Replace hardcoded widget rendering with backend-driven widget system
// TODO: Implement dynamic widget component loading from registry
// TODO: Add widget data validation and type safety
// TODO: Implement widget-specific interaction handlers from backend configuration
// Render actual widget content from sample data
function renderWidgetContent(config: any, showAllContent: boolean = false) {
  const { type, data } = config

  if (!data) {
    // TODO: Implement proper error handling and loading states from backend
    return (
      <div className="text-center text-xs text-muted-foreground/60">
        No data available
      </div>
    )
  }

  switch (type) {
    case 'world_building_tracker':
      const maxLocations = showAllContent ? (data.locations?.length || 0) : 3
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">World Building Progress</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Completion:</span> {data.completion}%
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Locations:</div>
              {data.locations?.slice(0, maxLocations).map((loc: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2 break-words">
                  • {loc.name} ({loc.status})
                </div>
              ))}
              {!showAllContent && data.locations?.length > 3 && (
                <div className="text-xs text-muted-foreground/50 pl-2">
                  +{data.locations.length - 3} more locations...
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Magic System:</div>
              <div className="text-xs text-muted-foreground/70 pl-2 break-words">
                Death Magic: {data.magic_system?.death_magic_rules}
              </div>
            </div>
          </div>
        </div>
      )

    case 'character_arc_tracker':
      const maxMoments = showAllContent ? (data.protagonist?.key_moments?.length || 0) : 2
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Character Development</div>
          <div className="space-y-1">
            {data.protagonist && (
              <div className="text-xs break-words">
                <span className="font-medium">{data.protagonist.name}:</span> {data.protagonist.current_arc}
              </div>
            )}
            <div className="text-xs">
              <span className="font-medium">Progress:</span> {data.protagonist?.progress}%
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Key Moments:</div>
              {data.protagonist?.key_moments?.slice(0, maxMoments).map((moment: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2 break-words">
                  • {moment}
                </div>
              ))}
              {!showAllContent && data.protagonist?.key_moments?.length > 2 && (
                <div className="text-xs text-muted-foreground/50 pl-2">
                  +{data.protagonist.key_moments.length - 2} more moments...
                </div>
              )}
            </div>
          </div>
        </div>
      )

    case 'atmospheric_inspiration':
      const maxSources = showAllContent ? (data.inspiration_sources?.length || 0) : 2
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Current Mood</div>
          <div className="text-xs text-muted-foreground/70 break-words">
            {data.current_mood}
          </div>
          <div className="text-xs break-words">
            <span className="font-medium">Seasonal:</span> {data.seasonal_energy}
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Inspiration:</div>
            {data.inspiration_sources?.slice(0, maxSources).map((source: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2 break-words">
                • {source.title}
              </div>
            ))}
            {!showAllContent && data.inspiration_sources?.length > 2 && (
              <div className="text-xs text-muted-foreground/50 pl-2">
                +{data.inspiration_sources.length - 2} more sources...
              </div>
            )}
          </div>
        </div>
      )

    case 'writing_streak_tracker':
      const maxSessions = showAllContent ? (data.recent_sessions?.length || 0) : 2
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Writing Stats</div>
          <div className="space-y-1">
            <div className="text-xs break-words">
              <span className="font-medium">Streak:</span> {data.current_streak} days
            </div>
            <div className="text-xs break-words">
              <span className="font-medium">Total Words:</span> {data.total_words?.toLocaleString()}
            </div>
            <div className="text-xs break-words">
              <span className="font-medium">Goal:</span> {data.weekly_goal} words/week
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Recent Sessions:</div>
              {data.recent_sessions?.slice(0, maxSessions).map((session: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2 break-words">
                  • {session.words} words ({session.quality})
                </div>
              ))}
              {!showAllContent && data.recent_sessions?.length > 2 && (
                <div className="text-xs text-muted-foreground/50 pl-2">
                  +{data.recent_sessions.length - 2} more sessions...
                </div>
              )}
            </div>
          </div>
        </div>
      )

    case 'creative_flow_meter':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Flow State</div>
          <div className="space-y-1">
            <div className="text-xs break-words">
              <span className="font-medium">Current Flow:</span> {data.current_flow}/10
            </div>
            <div className="text-xs break-words">
              <span className="font-medium">Energy:</span> {data.energy_level}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Flow Boosters:</div>
              {data.flow_boosters?.slice(0, 2).map((booster: string, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2 break-words">
                • {booster}
              </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'data_visualizer':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Research Data</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Datasets:</div>
            {data.datasets?.slice(0, 2).map((dataset: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {dataset.name} ({dataset.samples} samples)
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Latest Findings:</div>
              {data.latest_findings?.slice(0, 2).map((finding: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {finding}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'hypothesis_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Research Hypothesis</div>
          <div className="text-xs text-muted-foreground/70 leading-tight">
            {data.primary_hypothesis}
          </div>
          <div className="text-xs">
            <span className="font-medium">Confidence:</span> {data.confidence_level}%
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Key Evidence:</div>
            {data.supporting_evidence?.slice(0, 2).map((evidence: string, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {evidence}
              </div>
            ))}
          </div>
        </div>
      )

    case 'publication_pipeline':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Publication Pipeline</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Manuscripts:</div>
            {data.manuscripts?.slice(0, 2).map((ms: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {ms.title} ({ms.status})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Conferences:</div>
              {data.conferences?.slice(0, 2).map((conf: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {conf.name} ({conf.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'research_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Field Research</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Field Sites:</div>
            {data.field_sites?.slice(0, 2).map((site: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {site.name} ({site.visits} visits)
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Recent Discoveries:</div>
              {data.recent_discoveries?.slice(0, 2).map((discovery: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {discovery}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'milestone_timeline':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Project Timeline</div>
          <div className="space-y-1">
            {data.phases?.slice(0, 3).map((phase: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70">
                <div className="font-medium">{phase.name}</div>
                <div className="pl-2">{phase.progress}% complete</div>
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Critical Dates:</div>
              {data.critical_dates?.slice(0, 2).map((date: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {date.event} ({date.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'market_sentiment_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Market Analysis</div>
          <div className="text-xs">
            <span className="font-medium">Sentiment:</span> {data.current_sentiment} ({data.confidence}%)
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Key Metrics:</div>
            {data.key_metrics?.slice(0, 2).map((metric: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {metric.metric}: {metric.value} ({metric.change})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Opportunities:</div>
              {data.market_opportunities?.slice(0, 2).map((opp: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {opp}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'tvl_growth_chart':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">TVL Growth</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Current TVL:</span> {data.current_tvl}
            </div>
            <div className="text-xs">
              <span className="font-medium">Target TVL:</span> {data.target_tvl}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Growth Phases:</div>
              {data.growth_phases?.slice(0, 2).map((phase: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {phase.phase}: {phase.target} ({phase.timeline})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'security_audit_status':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Security Status</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Audit Firms:</div>
            {data.audit_firms?.slice(0, 2).map((firm: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {firm.firm} ({firm.status})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Security Checklist:</div>
              {data.security_checklist?.slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {item.item} ({item.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'code_commits':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Development Activity</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Weekly Commits:</span> {data.weekly_commits}
            </div>
            <div className="text-xs">
              <span className="font-medium">Code Coverage:</span> {data.code_coverage}%
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Active Branches:</div>
              {data.active_branches?.slice(0, 2).map((branch: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {branch.name} ({branch.commits} commits)
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'vendor_coordination_board':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Vendor Coordination</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Confirmed Vendors:</div>
            {data.confirmed_vendors?.slice(0, 2).map((vendor: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {vendor.type}: {vendor.name}
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Pending Vendors:</div>
              {data.pending_vendors?.slice(0, 2).map((vendor: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {vendor.type}: {vendor.name} ({vendor.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'guest_rsvp_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Guest Responses</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Total Invited:</span> {data.total_invited}
            </div>
            <div className="text-xs">
              <span className="font-medium">Responses:</span> {data.responses_received}
            </div>
            <div className="text-xs">
              <span className="font-medium">Attending:</span> {data.attending}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Categories:</div>
              {data.categories?.slice(0, 2).map((cat: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {cat.group}: {cat.attending}/{cat.invited} attending
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'budget_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Budget Overview</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Total Budget:</span> ${data.total_budget?.toLocaleString()}
            </div>
            <div className="text-xs">
              <span className="font-medium">Spent:</span> ${data.spent?.toLocaleString()}
            </div>
            <div className="text-xs">
              <span className="font-medium">Remaining:</span> ${data.remaining?.toLocaleString()}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Top Categories:</div>
              {data.categories?.slice(0, 2).map((cat: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {cat.category}: ${cat.spent?.toLocaleString()}/{cat.budgeted?.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'filming_schedule':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Filming Schedule</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Locations:</div>
            {data.locations?.slice(0, 2).map((loc: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {loc.name} ({loc.status})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Equipment:</div>
              {data.equipment_needs?.slice(0, 2).map((equip: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {equip.item} ({equip.status})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'interview_pipeline':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Interview Pipeline</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Subjects:</div>
            {data.subjects?.slice(0, 2).map((subject: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {subject.name} ({subject.status})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Themes:</div>
              {data.interview_themes?.slice(0, 2).map((theme: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {theme}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'editing_progress':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Editing Progress</div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Total Footage:</span> {data.total_footage}
            </div>
            <div className="text-xs">
              <span className="font-medium">Current Assembly:</span> {data.current_assembly}
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Rough Cuts:</div>
              {data.rough_cuts?.slice(0, 2).map((cut: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {cut.sequence} ({cut.duration})
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'publication_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Festival Pipeline</div>
          <div className="space-y-1">
            <div className="text-xs font-medium">Target Festivals:</div>
            {data.target_festivals?.slice(0, 2).map((fest: any, i: number) => (
              <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                • {fest.name} (Deadline: {fest.deadline})
              </div>
            ))}
            <div className="space-y-1">
              <div className="text-xs font-medium">Requirements:</div>
              {data.submission_requirements?.slice(0, 2).map((req: string, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {req}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    case 'mood_tracker':
      return (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground/80">Current Mood</div>
          <div className="text-xs text-muted-foreground/70">
            {data.current_mood}
          </div>
          <div className="space-y-1">
            <div className="text-xs">
              <span className="font-medium">Stress Level:</span> {data.stress_level}/10
            </div>
            <div className="text-xs">
              <span className="font-medium">Joy Level:</span> {data.joy_level}/10
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium">Recent Emotions:</div>
              {data.recent_emotions?.slice(0, 2).map((emotion: any, i: number) => (
                <div key={i} className="text-xs text-muted-foreground/70 pl-2">
                  • {emotion.mood}: {emotion.note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center text-xs text-muted-foreground/60">
          {/* Empty widget */}
        </div>
      )
  }
}


export function LivingProjectView({ fingerprint, sampleWidgets }: LivingProjectViewProps) {
  const [highlightedWidget, setHighlightedWidget] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  const widgets = useMemo(() => {
    // TODO: Replace with backend widget query - currently uses hardcoded sample data
    // TODO: Implement widget caching and sync with Convex database
    // TODO: Add widget versioning and conflict resolution for collaborative editing
    if (sampleWidgets && sampleWidgets.length > 0) {
      return sampleWidgets
    }
    return analyzeFingerprintForWidgets(fingerprint)
  }, [fingerprint, sampleWidgets])

  // Generate constellation layout
  const layout = useWidgetLayout(widgets)

  // Pan and zoom functionality
  const {
    transform,
    containerRef,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint
  } = usePanZoom(layout.canvasWidth, layout.canvasHeight, viewportSize.width, viewportSize.height)

  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent page scroll when constellation is active
  useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow
    const originalHeight = document.body.style.height
    const originalPosition = document.body.style.position

    // Lock body scroll
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    // Prevent wheel events on document
    const preventWheel = (e: WheelEvent) => {
      if (e.target instanceof Element) {
        // Only prevent if the event target is within our constellation container
        const constellationElement = containerRef.current
        if (constellationElement && constellationElement.contains(e.target as Node)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    // Prevent touch scrolling on mobile
    const preventTouch = (e: TouchEvent) => {
      if (e.target instanceof Element) {
        const constellationElement = containerRef.current
        if (constellationElement && constellationElement.contains(e.target as Node)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    document.addEventListener('wheel', preventWheel, { passive: false })
    document.addEventListener('touchmove', preventTouch, { passive: false })

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.height = originalHeight
      document.body.style.position = originalPosition
      document.body.style.width = ''
      document.removeEventListener('wheel', preventWheel)
      document.removeEventListener('touchmove', preventTouch)
    }
  }, [containerRef])

  // Virtual rendering - only render widgets visible in viewport + buffer
  const visibleWidgets = useMemo(() => {
    const buffer = 400 // Buffer zone around viewport
    const viewportLeft = -transform.x / transform.scale - buffer
    const viewportTop = -transform.y / transform.scale - buffer
    const viewportRight = viewportLeft + (viewportSize.width / transform.scale) + (buffer * 2)
    const viewportBottom = viewportTop + (viewportSize.height / transform.scale) + (buffer * 2)

    return layout.positions.filter(position =>
      position.x >= viewportLeft &&
      position.x <= viewportRight &&
      position.y >= viewportTop &&
      position.y <= viewportBottom
    )
  }, [layout.positions, transform, viewportSize])

  // Handle widget click
  const handleWidgetClick = useCallback((widget: WidgetConfig) => {
    // TODO: Implement real widget interaction system
    // TODO: Add widget usage analytics and personalization data collection
    // TODO: Implement widget-specific navigation and state management
    // TODO: Add widget collaboration features (comments, shared views, etc.)
    console.log('Widget clicked:', widget.title, widget.widget_type)
  }, [])

  // Handle minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  // Handle widget hover for connection highlighting
  const handleWidgetHover = useCallback((widgetId: string | null) => {
    setHighlightedWidget(widgetId)
  }, [])

  // Create widget lookup for performance
  const widgetMap = useMemo(() => {
    const map = new Map<string, WidgetConfig>()
    widgets.forEach(widget => map.set(widget.widget_id, widget))
    return map
  }, [widgets])

  // Handle wheel events to prevent page scroll conflicts
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleWheel(e)
  }, [handleWheel])

  // Handle mouse events to prevent conflicts
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleMouseDown(e)
  }, [handleMouseDown])

  const personalityTheme = useMemo(() => getPersonalityTheme(fingerprint), [fingerprint])
  const ThemeIcon = personalityTheme.icon

  // TODO: Replace hardcoded status mapping with backend status configuration
  // TODO: Implement status progression logic and automated status updates
  // TODO: Add status-specific actions and workflows from backend
  // Get project status with personality
  const getProjectStatus = () => {
    const status = fingerprint.status || 'discovering'
    // TODO: Load status configurations and labels from backend
    // TODO: Implement status-based feature unlocking
    switch (status) {
      case 'active': return { label: 'actively growing', color: 'text-green-600 dark:text-green-400' }
      case 'evolving': return { label: 'evolving beautifully', color: 'text-blue-600 dark:text-blue-400' }
      case 'discovering': return { label: 'discovering itself', color: 'text-amber-600 dark:text-amber-400' }
      case 'completing': return { label: 'coming to completion', color: 'text-purple-600 dark:text-purple-400' }
      default: return { label: status, color: 'text-muted-foreground' }
    }
  }

  const projectStatus = getProjectStatus()

  if (widgets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-muted/20 flex items-center justify-center">
              <ThemeIcon size={40} className="text-muted-foreground/40" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-light text-foreground">No widgets yet</h2>
              <p className="text-muted-foreground/80 leading-relaxed">
                Your project's intelligence is still developing. Widgets will appear as your project evolves.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden" style={{ overscrollBehavior: 'none' }}>
      {/* Personality-driven background overlay */}
      <div className={`
        fixed inset-0 bg-gradient-to-br ${personalityTheme.gradient}
        dark:from-background dark:via-background dark:to-background
        pointer-events-none opacity-30
      `} />

      {/* Widget Constellation Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        onWheel={handleCanvasWheel}
        onMouseDown={handleCanvasMouseDown}
        onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
        style={{
          willChange: 'transform',
          overscrollBehavior: 'none', // Prevent scroll chaining
          touchAction: 'none' // Prevent touch scrolling on mobile
        }}
      >
        {/* Canvas Container */}
        <div
          className="relative transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            willChange: 'transform'
          }}
        >
          {/* Connection Lines */}
          <ConnectionLines
            connections={layout.connections}
            positions={layout.positions}
            canvasWidth={layout.canvasWidth}
            canvasHeight={layout.canvasHeight}
            scale={transform.scale}
            translateX={transform.x}
            translateY={transform.y}
            highlightedProject={highlightedWidget}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
          />

          {/* Widget Stars - Virtual Rendering */}
          {visibleWidgets.map(position => {
            const widget = widgetMap.get(position.id)
            if (!widget) return null

            return (
              <WidgetStar
                key={position.id}
                widget={widget}
                x={position.x}
                y={position.y}
                size={position.size}
                importance={position.importance}
                isHighlighted={highlightedWidget === position.id}
                scale={transform.scale}
                onClick={() => handleWidgetClick(widget)}
                onHover={handleWidgetHover}
              />
            )
          })}

          {/* Canvas bounds indicator (subtle) */}
          <div
            className="absolute inset-0 border border-border/10 rounded-lg pointer-events-none"
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight
            }}
          />
        </div>
      </div>


      {/* Navigation Controls */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="absolute bottom-6 left-6 z-10"
      />

      {/* Minimap */}
      <ConstellationMinimap
        positions={layout.positions}
        canvasWidth={layout.canvasWidth}
        canvasHeight={layout.canvasHeight}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        currentTransform={transform}
        onViewportClick={handleMinimapClick}
        className="absolute bottom-6 right-6 z-10"
      />

      {/* Stats Overlay - Subtle */}
      <div className="absolute top-16 right-6 left-1/2 z-10 pointer-events-none">
        <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm max-w-xs">
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
            <span>
              Active: {widgets.filter(w => w.priority > 7).length}
            </span>
            <span>•</span>
            <span>
              {Math.round(transform.scale * 100)}% zoom
            </span>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-6 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground/70 text-center">
              Drag to explore • Scroll to zoom • Click widgets to interact
            </div>
          </div>
        </div>
      )}

      {/* Version footer */}
      <div className="absolute bottom-6 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
        <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm">
          <div className="text-xs text-muted-foreground/50 font-mono text-center">
            v{fingerprint.intelligence_version || '1.0'} •
            Last evolved {fingerprint.last_evolution ?
              new Date(fingerprint.last_evolution).toLocaleDateString() :
              'never'}
          </div>
        </div>
      </div>
    </div>
  )
}
