'use client'

import React from 'react'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
}

interface ProjectStarProps {
  project: Project
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (projectId: string | null) => void
}

// Simple date formatting utility
const formatDistanceToNow = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ProjectStar({
  project,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onClick,
  onHover
}: ProjectStarProps) {
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000

  // Calculate card dimensions based on size
  const cardSizes = {
    small: { width: 192, height: 128 }, // w-48 h-32
    medium: { width: 256, height: 160 }, // w-64 h-40  
    large: { width: 320, height: 192 } // w-80 h-48
  }
  
  const { width, height } = cardSizes[size]

  // Determine status and styling
  const getProjectStatus = () => {
    if (!hasFingerprint) {
      return {
        label: 'discovering',
        borderColor: 'border-amber-400/40',
        glowColor: 'ring-amber-400/30',
        activeGlow: 'ring-amber-500/60',
        bgGradient: 'bg-gradient-to-br from-amber-50/10 via-transparent to-amber-100/5 dark:from-amber-950/10 dark:to-amber-900/5'
      }
    }
    
    if (isRecent) {
      return {
        label: 'active',
        borderColor: 'border-blue-400/40',
        glowColor: 'ring-blue-400/30',
        activeGlow: 'ring-blue-500/60',
        bgGradient: 'bg-gradient-to-br from-blue-50/10 via-transparent to-blue-100/5 dark:from-blue-950/10 dark:to-blue-900/5'
      }
    }
    
    return {
      label: 'living',
      borderColor: 'border-muted-foreground/30',
      glowColor: 'ring-muted-foreground/20',
      activeGlow: 'ring-muted-foreground/40',
      bgGradient: 'bg-gradient-to-br from-muted/10 via-transparent to-muted/5'
    }
  }

  const status = getProjectStatus()

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
        top: `${y - height/2}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: finalOpacity
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(project._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Main Card */}
      <div className={`
        relative w-full h-full rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${status.borderColor} ${status.bgGradient}
        ${isHighlighted ? status.activeGlow : status.glowColor}
        ${isHighlighted ? 'ring-2 scale-[1.01]' : 'ring-1'}
      `}>
        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />

        {/* Content */}
        <div className="relative p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className={`
                font-medium text-foreground leading-tight transition-colors duration-300
                group-hover:text-blue-600 dark:group-hover:text-blue-400
                ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
              `}>
                {project.name}
              </h3>
              <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors text-xs">
                →
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
                {status.label}
              </span>
              {isRecent && hasFingerprint && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Description - shown at medium zoom and above */}
          {showDescription && project.description && (
            <div className="flex-1 mb-3">
              <p className={`
                text-muted-foreground/80 leading-relaxed
                ${size === 'large' ? 'text-sm' : 'text-xs'}
                ${showFullDetails ? 'line-clamp-none' : 'line-clamp-2'}
              `}>
                {project.description}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer metadata - shown at high zoom */}
          {showMetadata && (
            <div className="flex-shrink-0 pt-2 border-t border-border/20">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    {hasFingerprint ? 'Intelligence active' : 'Awaiting discovery'}
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(hasFingerprint ? project.updatedAt : project.createdAt))}
                  </div>
                </div>
                {showFullDetails && (
                  <div className="text-right space-y-1">
                    <div className="text-muted-foreground/80">
                      {hasFingerprint ? 'Explore' : 'Begin'}
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
            <div className="flex-shrink-0 pt-2">
              <div className="text-xs text-muted-foreground/50 font-mono">
                {formatDistanceToNow(new Date(hasFingerprint ? project.updatedAt : project.createdAt))}
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
