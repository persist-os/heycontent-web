/**
 * FLOATING CONTENT CARD COMPONENT
 * 
 * Living intelligence cards for constellation view - notes, conversations,
 * crystals, and shards represented as quantum states in the knowledge field.
 * 
 * Inspired by: Quantum learning states, temporal intelligence, holographic encoding
 */

'use client'

import React from 'react'
import { 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  ExternalLink,
  Calendar,
  Tag,
  Zap,
  Brain,
  Clock,
  TrendingUp,
  AlertCircle,
  Star,
  Layers
} from 'lucide-react'

interface FloatingContentCardProps {
  item: any
  itemType: 'note' | 'conversation' | 'crystal' | 'shard'
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onOpen: (id: string, type: string) => void
  widgetId?: string // If linked to a widget
}

/**
 * Floating content card - Living knowledge particles in the constellation
 */
export function FloatingContentCard({
  item,
  itemType,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onOpen,
  widgetId
}: FloatingContentCardProps) {
  // Dynamic sizing based on zoom level (larger for better visibility)
  const getCardDimensions = () => {
    const baseSizes = {
      small: { width: 320, minHeight: 220 },
      medium: { width: 360, minHeight: 260 },
      large: { width: 400, minHeight: 300 }
    }
    
    const baseSize = baseSizes[size] || baseSizes.medium
    const zoomMultiplier = Math.max(0.85, scale * 0.85)
    
    // Round to nearest pixel to prevent subpixel blur
    return {
      width: Math.round(baseSize.width * zoomMultiplier),
      minHeight: Math.round(baseSize.minHeight * zoomMultiplier)
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Counter-scale to maintain native resolution when parent canvas is scaled
  const counterScale = 1 / Math.max(0.5, Math.min(2, scale)) // Clamp for safety

  // Progressive detail revelation based on zoom (quantum observation)
  const showPreview = scale > 0.7
  const showMetadata = scale > 0.9
  const showRichData = scale > 1.2

  // Calculate opacity with discrete steps to reduce GPU compositing overhead
  const baseOpacity = (importance || 0.5) > 0.7 ? 0.95 : (importance || 0.5) > 0.4 ? 0.85 : 0.75
  const scaleOpacity = scale > 1.0 ? 1 : scale > 0.7 ? 0.9 : 0.85
  const finalOpacity = Math.round(baseOpacity * scaleOpacity * 100) / 100 // Round to 2 decimals

  // Type-specific quantum styling with consciousness themes - using globals.css colors
  const getTypeStyling = () => {
    switch (itemType) {
      case 'note':
        return {
          icon: FileText,
          // Knowledge crystallization - blue quantum field
          bgGradient: 'from-[hsl(var(--note-bg))]/60 via-[hsl(var(--note-bg))]/30 to-[hsl(var(--note-bg))]/60',
          borderGradient: 'from-[hsl(var(--note-border))]/60 via-[hsl(var(--note-primary))]/40 to-[hsl(var(--note-border))]/60',
          glowColor: 'shadow-[hsl(var(--note-glow))]/30',
          accentColor: 'bg-[hsl(var(--note-primary))]/20',
          textColor: 'text-[hsl(var(--note-text))]',
          metaColor: 'text-[hsl(var(--note-text))]/80',
          iconColor: 'text-[hsl(var(--note-primary))]',
          pulseColor: 'bg-[hsl(var(--note-primary))]',
          quantum: 'knowledge'
        }
      case 'conversation':
        return {
          icon: MessageCircle,
          // Temporal dialogue streams - emerald consciousness
          bgGradient: 'from-[hsl(var(--conversation-bg))]/60 via-[hsl(var(--conversation-bg))]/30 to-[hsl(var(--conversation-bg))]/60',
          borderGradient: 'from-[hsl(var(--conversation-border))]/60 via-[hsl(var(--conversation-primary))]/40 to-[hsl(var(--conversation-border))]/60',
          glowColor: 'shadow-[hsl(var(--conversation-glow))]/30',
          accentColor: 'bg-[hsl(var(--conversation-primary))]/20',
          textColor: 'text-[hsl(var(--conversation-text))]',
          metaColor: 'text-[hsl(var(--conversation-text))]/80',
          iconColor: 'text-[hsl(var(--conversation-primary))]',
          pulseColor: 'bg-[hsl(var(--conversation-primary))]',
          quantum: 'dialogue'
        }
      case 'crystal':
        return {
          icon: Gem,
          // Crystallized intelligence - violet consciousness
          bgGradient: 'from-[hsl(var(--crystal-bg))]/60 via-[hsl(var(--crystal-bg))]/30 to-[hsl(var(--crystal-bg))]/60',
          borderGradient: 'from-[hsl(var(--crystal-border))]/60 via-[hsl(var(--crystal-primary))]/40 to-[hsl(var(--crystal-border))]/60',
          glowColor: 'shadow-[hsl(var(--crystal-glow))]/30',
          accentColor: 'bg-[hsl(var(--crystal-primary))]/20',
          textColor: 'text-[hsl(var(--crystal-text))]',
          metaColor: 'text-[hsl(var(--crystal-text))]/80',
          iconColor: 'text-[hsl(var(--crystal-primary))]',
          pulseColor: 'bg-[hsl(var(--crystal-primary))]',
          quantum: 'crystal'
        }
      case 'shard':
        return {
          icon: Sparkles,
          // Quantum fragments - amber energy
          bgGradient: 'from-[hsl(var(--shard-bg))]/60 via-[hsl(var(--shard-bg))]/30 to-[hsl(var(--shard-bg))]/60',
          borderGradient: 'from-[hsl(var(--shard-border))]/60 via-[hsl(var(--shard-primary))]/40 to-[hsl(var(--shard-border))]/60',
          glowColor: 'shadow-[hsl(var(--shard-glow))]/30',
          accentColor: 'bg-[hsl(var(--shard-primary))]/20',
          textColor: 'text-[hsl(var(--shard-text))]',
          metaColor: 'text-[hsl(var(--shard-text))]/80',
          iconColor: 'text-[hsl(var(--shard-primary))]',
          pulseColor: 'bg-[hsl(var(--shard-primary))]',
          quantum: 'shard'
        }
    }
  }

  const styling = getTypeStyling()
  const Icon = styling.icon

  // Extract rich metadata from content
  const getRichContent = () => {
    switch (itemType) {
      case 'note':
        return {
          title: item.title || 'Untitled Note',
          preview: item.content?.substring(0, 120) || 'Empty note',
          primaryMeta: item.type || 'note',
          secondaryMeta: item.tags?.slice(0, 2).join(', ') || null,
          indicator: item.important ? 'important' : null,
          count: item.references?.length || 0,
          temporal: item.updatedAt
        }
      case 'conversation':
        return {
          title: item.title || 'Thinking Session',
          preview: item.messages?.[0]?.content?.substring(0, 100) || 'No messages yet',
          primaryMeta: item.conversationType || 'general',
          secondaryMeta: item.messageCount ? `${item.messageCount} exchanges` : null,
          indicator: item.starred ? 'starred' : null,
          count: item.messageCount || 0,
          temporal: item.lastMessageAt || item.updatedAt
        }
      case 'crystal':
        return {
          title: item.name || 'Unnamed Pattern',
          preview: item.core_insight || item.detailed_analysis?.substring(0, 100) || 'Forming...',
          primaryMeta: item.crystal_type || 'pattern',
          secondaryMeta: item.dimension,
          indicator: item.confidence_score || item.evidence_strength,
          count: item.observation_count || item.usage_count || 0,
          temporal: item.last_evolution || item.updatedAt,
          quantum: {
            stability: item.stability_trend,
            evidence: item.evidence_strength,
            consistency: item.consistency_rating
          }
        }
      case 'shard':
        return {
          title: `${item.dimension || 'Dimension'} Shard`,
          preview: item.exact_quote?.substring(0, 60) + '...' || 'No quote'
        }
    }
  }

  const content = getRichContent()

  // Handle card click - opens side panel for user control
  const handleCardClick = () => {
    onOpen(item._contentId || item._id, itemType);
  };
   // Format temporal data for display
   const formatTemporal = (timestamp: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = Date.now()
    const diff = now - timestamp
    
    // Show relative time for recent items
    if (diff < 86400000) return 'Today' // < 24 hours
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago` // < 7 days
    return date.toLocaleDateString()
  }
  return (
    <div
      className="absolute cursor-pointer group will-change-transform"
      style={{
        left: `${Math.round(x - width/2)}px`,
        top: `${Math.round(y - minHeight/2)}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        transformOrigin: 'center center'
      }}
      onClick={handleCardClick}
    >
      {/* Quantum field container */}
      {/* <div 
        className={`
          relative w-full h-full rounded-xl
          transition-all duration-500 ease-out
          hover:scale-[1.04] hover:z-20
          bg-gradient-to-br ${styling.bgGradient}
          ${isHighlighted ? 'ring-2 ring-white/40 dark:ring-white/30 scale-[1.02]' : ''}
          ${styling.glowColor} shadow-lg
        `}
        style={{
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
      > */}
        {/* Counter-scale wrapper to maintain native resolution */}
        <div style={{
          transform: `scale(${counterScale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%'
        }}>
        
        {/* Animated gradient border */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-br ${styling.borderGradient}
          opacity-60 group-hover:opacity-100 transition-opacity duration-500
        `} style={{ padding: '1.5px' }}>
          <div className={`
            w-full h-full rounded-xl bg-gradient-to-br ${styling.bgGradient}
          `} />
        </div>

        {/* Quantum pulse indicator (top-right) */}
        <div className="absolute -top-1 -right-1 flex items-center gap-1">
          {widgetId && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" 
                 title="Linked to widget" />
          )}
          {content.indicator && (
            <div className={`
              px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider
              ${styling.accentColor} ${styling.textColor}
              border border-current/20
            `}>
              {content.indicator}
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="relative p-4 h-full flex flex-col gap-3" style={{ zIndex: 1 }}>
          
          {/* Header with icon and title */}
          <div className="flex items-start gap-3">
            {/* Quantum icon container */}
            <div className={`
              relative p-2 rounded-lg ${styling.accentColor}
              group-hover:scale-110 transition-transform duration-300
            `}>
              <Icon className={`w-4 h-4 ${styling.iconColor}`} />
              {/* Subtle pulse animation */}
              <div className={`
                absolute inset-0 rounded-lg ${styling.pulseColor} opacity-0
                group-hover:opacity-20 group-hover:animate-ping
              `} />
            </div>
            
            {/* Title and type */}
            <div className="flex-1 min-w-0">
              <h3 className={`
                font-semibold text-sm leading-snug ${styling.textColor}
                line-clamp-2 tracking-tight
              `}>
                {content.title}
              </h3>
              {showMetadata && content.primaryMeta && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`
                    text-[10px] font-medium uppercase tracking-wider
                    ${styling.metaColor}
                  `}>
                    {content.primaryMeta.replace(/_/g, ' ')}
                  </span>
                  {content.secondaryMeta && (
                    <>
                      <span className={`text-[10px] ${styling.metaColor}`}>•</span>
                      <span className={`text-[10px] ${styling.metaColor} truncate`}>
                        {content.secondaryMeta}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content preview with better readability */}
          {showPreview && (
            <div className="flex-1 min-h-0">
              <p className={`
                text-xs leading-relaxed ${styling.textColor} opacity-90
                line-clamp-${showRichData ? '4' : '3'}
                font-normal
              `}>
                {content.preview}
              </p>
            </div>
          )}

          {/* Rich metadata footer */}
          {showMetadata && (
            <div className="flex items-center justify-between pt-2 border-t border-current/10">
              {/* Left: Stats and indicators */}
              <div className="flex items-center gap-2">
                {content.count > 0 && (
                  <div className={`
                    flex items-center gap-1 px-1.5 py-0.5 rounded
                    ${styling.accentColor}
                  `}>
                    <Layers className={`w-3 h-3 ${styling.iconColor}`} />
                    <span className={`text-[10px] font-medium ${styling.textColor}`}>
                      {content.count}
                    </span>
                  </div>
                )}
                
                {/* Quantum state indicators for crystals/shards */}
                {showRichData && content.quantum && (
                  <div className="flex items-center gap-1">
                    {content.quantum.stability && (
                      <div title={`Stability: ${content.quantum.stability}`}>
                        <TrendingUp className={`w-3 h-3 ${styling.iconColor} opacity-60`} />
                      </div>
                    )}
                    {content.quantum.evidence && (
                      <div title={`Evidence: ${content.quantum.evidence}`}>
                        <Brain className={`w-3 h-3 ${styling.iconColor} opacity-60`} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Temporal indicator */}
              <div className="flex items-center gap-1.5">
                {content.temporal && (
                  <div className="flex items-center gap-1">
                    <Clock className={`w-3 h-3 ${styling.iconColor} opacity-50`} />
                    <span className={`text-[10px] ${styling.metaColor}`}>
                      {formatTemporal(content.temporal)}
                    </span>
                  </div>
                )}
                <ExternalLink className={`
                  w-3 h-3 ${styling.iconColor} opacity-0 
                  group-hover:opacity-60 transition-opacity duration-300
                `} />
              </div>
            </div>
          )}
        </div>

        {/* Holographic interference pattern on hover */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
          transition-opacity duration-500 pointer-events-none
          bg-gradient-to-br from-white/5 via-transparent to-white/10
        `} style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(255,255,255,0.03) 70%)'
        }} />

        {/* Quantum glow effect */}
        {/* <div className={`
          absolute -inset-1 rounded-xl blur-xl ${styling.glowColor}
          opacity-0 group-hover:opacity-30 transition-opacity duration-700
          pointer-events-none -z-10
        `} /> */}
        </div>
      </div>
  )
}
