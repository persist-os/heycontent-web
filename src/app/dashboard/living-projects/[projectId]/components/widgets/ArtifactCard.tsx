/**
 * ARTIFACT CARD COMPONENT
 * 
 * Beautiful cards for displaying widget output artifacts in constellation view.
 * Each artifact type has unique, elegant styling that reflects its purpose.
 * 
 * Supported types: structured_list, report, analysis, summary, tracker, timeline
 */

'use client'

import React from 'react'
import { 
  List,
  FileText,
  TrendingUp,
  BarChart,
  Activity,
  Clock,
  FileStack,
  Calendar,
  CheckSquare,
  Brain,
  Zap
} from 'lucide-react'

interface ArtifactCardProps {
  artifact: any
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  scale: number
  isHighlighted?: boolean
  onClick: () => void
}

/**
 * Get card dimensions based on size
 */
const getCardDimensions = (size: 'small' | 'medium' | 'large') => {
  const dimensions = {
    small: { width: 320, height: 220 },
    medium: { width: 360, height: 260 },
    large: { width: 400, height: 300 }
  }
  return dimensions[size]
}

/**
 * Get styling based on artifact type
 */
const getArtifactStyling = (artifactType: string) => {
  const styles = {
    structured_list: {
      icon: List,
      name: 'Structured List',
      // Clean blue for organized data
      bgGradient: 'from-blue-500/10 via-blue-400/5 to-blue-500/10',
      borderColor: 'border-blue-500/30',
      glowColor: 'shadow-blue-500/20',
      activeGlow: 'shadow-xl shadow-blue-500/40',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-500',
      accentColor: 'bg-blue-500/10'
    },
    report: {
      icon: FileText,
      name: 'Report',
      // Professional emerald for documents
      bgGradient: 'from-emerald-500/10 via-emerald-400/5 to-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      glowColor: 'shadow-emerald-500/20',
      activeGlow: 'shadow-xl shadow-emerald-500/40',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      accentColor: 'bg-emerald-500/10'
    },
    analysis: {
      icon: TrendingUp,
      name: 'Analysis',
      // Sophisticated purple for insights
      bgGradient: 'from-purple-500/10 via-purple-400/5 to-purple-500/10',
      borderColor: 'border-purple-500/30',
      glowColor: 'shadow-purple-500/20',
      activeGlow: 'shadow-xl shadow-purple-500/40',
      iconBg: 'bg-purple-500/15',
      iconColor: 'text-purple-500',
      accentColor: 'bg-purple-500/10'
    },
    summary: {
      icon: BarChart,
      name: 'Summary',
      // Warm amber for metrics
      bgGradient: 'from-amber-500/10 via-amber-400/5 to-amber-500/10',
      borderColor: 'border-amber-500/30',
      glowColor: 'shadow-amber-500/20',
      activeGlow: 'shadow-xl shadow-amber-500/40',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      accentColor: 'bg-amber-500/10'
    },
    tracker: {
      icon: Activity,
      name: 'Tracker',
      // Vibrant cyan for activity
      bgGradient: 'from-cyan-500/10 via-cyan-400/5 to-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      glowColor: 'shadow-cyan-500/20',
      activeGlow: 'shadow-xl shadow-cyan-500/40',
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-500',
      accentColor: 'bg-cyan-500/10'
    },
    timeline: {
      icon: Clock,
      name: 'Timeline',
      // Deep indigo for chronology
      bgGradient: 'from-indigo-500/10 via-indigo-400/5 to-indigo-500/10',
      borderColor: 'border-indigo-500/30',
      glowColor: 'shadow-indigo-500/20',
      activeGlow: 'shadow-xl shadow-indigo-500/40',
      iconBg: 'bg-indigo-500/15',
      iconColor: 'text-indigo-500',
      accentColor: 'bg-indigo-500/10'
    }
  }
  
  // Default styling for unknown types
  return styles[artifactType as keyof typeof styles] || {
    icon: FileStack,
    name: 'Artifact',
    bgGradient: 'from-foreground/5 via-foreground/2 to-foreground/5',
    borderColor: 'border-border/40',
    glowColor: 'shadow-foreground/10',
    activeGlow: 'shadow-xl shadow-foreground/20',
    iconBg: 'bg-foreground/10',
    iconColor: 'text-foreground',
    accentColor: 'bg-foreground/5'
  }
}

/**
 * Extract readable preview from artifact data
 */
const getArtifactPreview = (artifact: any) => {
  const type = artifact.artifactType
  const data = artifact.data
  
  if (!data) return 'No data'
  
  switch (type) {
    case 'structured_list':
      const itemCount = data.length || 0
      return `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`
      
    case 'report':
      if (data.content) {
        // Extract first line or first 60 chars
        const firstLine = data.content.split('\n')[0]
        return firstLine.substring(0, 60) + (firstLine.length > 60 ? '...' : '')
      }
      return 'No content'
      
    case 'analysis':
      const insightCount = data.insights?.length || 0
      return `${insightCount} ${insightCount === 1 ? 'insight' : 'insights'}`
      
    case 'summary':
      const metricCount = data.metrics?.length || 0
      return `${metricCount} ${metricCount === 1 ? 'metric' : 'metrics'}`
      
    case 'tracker':
      const eventCount = data.events?.length || 0
      return `${eventCount} ${eventCount === 1 ? 'event' : 'events'}`
      
    case 'timeline':
      const timelineEvents = data.events?.length || 0
      return `${timelineEvents} ${timelineEvents === 1 ? 'milestone' : 'milestones'}`
      
    default:
      return 'Widget output'
  }
}

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: number) => {
  if (!timestamp) return ''
  
  const date = new Date(timestamp)
  const now = Date.now()
  const diff = now - timestamp
  
  // Show relative time for recent items
  if (diff < 86400000) return 'Today' // < 24 hours
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago` // < 7 days
  
  return date.toLocaleDateString()
}

/**
 * Artifact Card Component
 */
export function ArtifactCard({
  artifact,
  x,
  y,
  size,
  scale,
  isHighlighted = false,
  onClick
}: ArtifactCardProps) {
  
  const { width, height } = getCardDimensions(size)
  const styling = getArtifactStyling(artifact.artifactType)
  const Icon = styling.icon
  const preview = getArtifactPreview(artifact)
  
  // Progressive disclosure based on zoom
  const showMetadata = scale > 0.9
  const showPreview = scale > 0.7
  
  // Calculate opacity
  const baseOpacity = 0.95
  const scaleOpacity = scale > 1.0 ? 1 : scale > 0.7 ? 0.9 : 0.85
  const finalOpacity = Math.round(baseOpacity * scaleOpacity * 100) / 100
  
  return (
    <div
      className="absolute cursor-pointer group will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - height/2}px`,
        width: `${width}px`,
        minHeight: `${height}px`,
        opacity: finalOpacity,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased'
      }}
      onClick={onClick}
    >
      {/* Main Card Container */}
      <div className={`
        relative w-full h-full rounded-xl
        backdrop-blur-md border shadow-lg
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-20
        bg-gradient-to-br ${styling.bgGradient}
        ${styling.borderColor}
        ${isHighlighted ? styling.activeGlow : styling.glowColor}
        ${isHighlighted ? 'ring-2 ring-offset-2 ring-offset-background scale-[1.01]' : ''}
      `}>
        
        {/* Artifact Type Indicator */}
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center
            shadow-lg border border-background/20
            ${styling.iconBg}
          `}>
            <Icon className={`w-5 h-5 ${styling.iconColor}`} />
          </div>
        </div>
        
        {/* Card Content */}
        <div className="relative p-5 h-full flex flex-col">
          
          {/* Header */}
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-semibold text-foreground leading-tight
                  transition-colors duration-300
                  ${styling.iconColor.replace('text-', 'group-hover:text-')}
                  ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
                `}>
                  {styling.name}
                </h3>
                
                {/* Version Badge */}
                {artifact.metadata?.version && showMetadata && (
                  <div className="mt-1">
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium
                      ${styling.accentColor} ${styling.iconColor}
                      border ${styling.borderColor}
                    `}>
                      v{artifact.metadata.version}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Preview Content */}
          {showPreview && (
            <div className="flex-1 min-h-0 mb-3">
              <div className={`
                p-3 rounded-lg ${styling.accentColor}
                border ${styling.borderColor}
              `}>
                <p className={`
                  text-xs leading-relaxed text-muted-foreground
                  line-clamp-2 font-medium
                `}>
                  {preview}
                </p>
              </div>
            </div>
          )}
          
          {/* Spacer */}
          <div className="flex-1" />
          
          {/* Footer Metadata */}
          {showMetadata && (
            <div className="flex-shrink-0 pt-3 border-t border-border/20">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-muted-foreground/70">
                  <Calendar className="w-3 h-3" />
                  <span className="font-mono">
                    {formatTimestamp(artifact.metadata?.lastUpdatedAt || artifact.createdAt)}
                  </span>
                </div>
                
                {artifact.widgetId && (
                  <div className="flex items-center gap-1 text-muted-foreground/60">
                    <Zap className="w-3 h-3" />
                    <span className="text-[10px] font-mono">Widget</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Hover Glow Effect */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
          transition-opacity duration-300 pointer-events-none
          bg-gradient-to-br from-white/5 via-transparent to-white/10
        `} style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(255,255,255,0.03) 70%)'
        }} />
      </div>
    </div>
  )
}

