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
    
    return {
      width: baseSize.width * zoomMultiplier,
      minHeight: baseSize.minHeight * zoomMultiplier
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Progressive detail revelation based on zoom (quantum observation)
  const showPreview = scale > 0.7
  const showMetadata = scale > 0.9
  const showRichData = scale > 1.2

  // Calculate opacity with quantum superposition effect
  const baseOpacity = Math.max(0.65, (importance || 0.5) * 0.85)
  const scaleOpacity = Math.min(1, Math.max(0.55, scale || 1))
  const finalOpacity = Math.max(0.15, Math.min(1, baseOpacity * scaleOpacity))

  // Type-specific quantum styling with consciousness themes
  const getTypeStyling = () => {
    switch (itemType) {
      case 'note':
        return {
          icon: FileText,
          // Knowledge crystallization - blue quantum field
          bgGradient: 'from-blue-500/10 via-sky-400/5 to-cyan-500/10',
          borderGradient: 'from-blue-400/40 via-sky-300/30 to-cyan-400/40',
          glowColor: 'shadow-blue-500/20',
          accentColor: 'bg-blue-500/20',
          textColor: 'text-blue-900 dark:text-blue-100',
          metaColor: 'text-blue-700/80 dark:text-blue-300/80',
          iconColor: 'text-blue-600 dark:text-blue-400',
          pulseColor: 'bg-blue-400',
          quantum: 'knowledge'
        }
      case 'conversation':
        return {
          icon: MessageCircle,
          // Temporal dialogue streams - emerald consciousness
          bgGradient: 'from-emerald-500/10 via-green-400/5 to-teal-500/10',
          borderGradient: 'from-emerald-400/40 via-green-300/30 to-teal-400/40',
          glowColor: 'shadow-emerald-500/20',
          accentColor: 'bg-emerald-500/20',
          textColor: 'text-emerald-900 dark:text-emerald-100',
          metaColor: 'text-emerald-700/80 dark:text-emerald-300/80',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          pulseColor: 'bg-emerald-400',
          quantum: 'dialogue'
        }
      case 'crystal':
        return {
          icon: Gem,
          // Crystallized intelligence - violet consciousness
          bgGradient: 'from-violet-500/10 via-purple-400/5 to-fuchsia-500/10',
          borderGradient: 'from-violet-400/40 via-purple-300/30 to-fuchsia-400/40',
          glowColor: 'shadow-violet-500/20',
          accentColor: 'bg-violet-500/20',
          textColor: 'text-violet-900 dark:text-violet-100',
          metaColor: 'text-violet-700/80 dark:text-violet-300/80',
          iconColor: 'text-violet-600 dark:text-violet-400',
          pulseColor: 'bg-violet-400',
          quantum: 'crystal'
        }
      case 'shard':
        return {
          icon: Sparkles,
          // Quantum fragments - amber energy
          bgGradient: 'from-amber-500/10 via-orange-400/5 to-yellow-500/10',
          borderGradient: 'from-amber-400/40 via-orange-300/30 to-yellow-400/40',
          glowColor: 'shadow-amber-500/20',
          accentColor: 'bg-amber-500/20',
          textColor: 'text-amber-900 dark:text-amber-100',
          metaColor: 'text-amber-700/80 dark:text-amber-300/80',
          iconColor: 'text-amber-600 dark:text-amber-400',
          pulseColor: 'bg-amber-400',
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

  const content = getContentPreview()

  // Handle card click
  const handleCardClick = async () => {
    try {
      // Navigate to appropriate content page based on type
      switch (itemType) {
        case 'note':
          router.push(`/dashboard/thinking_lab?noteId=${item._id || item._contentId}`);
          break;
        case 'conversation':
          router.push(`/dashboard/thinking_lab?conversationId=${item._id || item._contentId}`);
          break;
        case 'crystal':
          router.push(`/dashboard/crystals?crystalId=${item.crystal_id || item._contentId}`);
          break;
        case 'shard':
          router.push(`/dashboard/crystals?shardId=${item._id || item._contentId}`);
          break;
      }
      
      // Call the onOpen callback for any additional handling
      onOpen(item._contentId || item._id, itemType);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div
      className="absolute cursor-pointer group will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - minHeight/2}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={handleCardClick}
    >
      {/* Quantum field container */}
      <div className={`
        relative w-full h-full rounded-xl backdrop-blur-md
        transition-all duration-500 ease-out
        hover:scale-[1.04] hover:z-20
        bg-gradient-to-br ${styling.bgGradient}
        ${isHighlighted ? 'ring-2 ring-white/40 dark:ring-white/30 scale-[1.02]' : ''}
        ${styling.glowColor} shadow-lg
      `}>
        
        {/* Animated gradient border */}
        <div className={`
          absolute inset-0 rounded-xl bg-gradient-to-br ${styling.borderGradient}
          opacity-60 group-hover:opacity-100 transition-opacity duration-500
        `} style={{ padding: '1.5px' }}>
          <div className={`
            w-full h-full rounded-xl bg-gradient-to-br ${styling.bgGradient}
            backdrop-blur-md
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
                    {content.quantum.intensity && (
                      <div title={`Intensity: ${content.quantum.intensity}`}>
                        <Zap className={`w-3 h-3 ${styling.iconColor} opacity-60`} />
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
        <div className={`
          absolute -inset-1 rounded-xl blur-xl ${styling.glowColor}
          opacity-0 group-hover:opacity-30 transition-opacity duration-700
          pointer-events-none -z-10
        `} />
      </div>
    </div>
  )
}
