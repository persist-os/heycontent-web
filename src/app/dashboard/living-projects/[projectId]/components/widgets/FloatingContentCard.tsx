/**
 * FLOATING CONTENT CARD COMPONENT
 * 
 * Polymorphic content card for constellation view supporting notes, conversations,
 * crystals, and shards. Smaller than widget cards with type-specific styling.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  ExternalLink,
  Calendar,
  User
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
 * Floating content card component for constellation view
 * Polymorphic component handling all content types with unified styling
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
  const router = useRouter()

  // Dynamic sizing based on zoom level (smaller than widgets)
  const getCardDimensions = () => {
    const baseSizes = {
      small: { width: 240, minHeight: 160 }, // Smaller than widgets
      medium: { width: 280, minHeight: 200 },
      large: { width: 320, minHeight: 240 }
    }
    
    const baseSize = baseSizes[size] || baseSizes.medium
    const zoomMultiplier = Math.max(0.85, scale * 0.85) // 0.85x multiplier for content cards
    
    return {
      width: baseSize.width * zoomMultiplier,
      minHeight: baseSize.minHeight * zoomMultiplier
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Show different levels of detail based on zoom
  const showPreview = scale > 0.8
  const showMetadata = scale > 1.0
  const showFullDetails = scale > 1.4

  // Calculate opacity based on importance and scale
  const baseOpacity = Math.max(0.6, (importance || 0.5) * 0.8) // Slightly more transparent than widgets
  const scaleOpacity = Math.min(1, Math.max(0.5, scale || 1))
  const finalOpacity = Math.max(0.1, Math.min(1, baseOpacity * scaleOpacity)) // Ensure valid opacity range

  // Get type-specific styling
  const getTypeStyling = () => {
    switch (itemType) {
      case 'note':
        return {
          icon: FileText,
          bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          textColor: 'text-blue-700 dark:text-blue-300',
          iconColor: 'text-blue-600'
        }
      case 'conversation':
        return {
          icon: MessageCircle,
          bgGradient: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          textColor: 'text-green-700 dark:text-green-300',
          iconColor: 'text-green-600'
        }
      case 'crystal':
        return {
          icon: Gem,
          bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          textColor: 'text-purple-700 dark:text-purple-300',
          iconColor: 'text-purple-600'
        }
      case 'shard':
        return {
          icon: Sparkles,
          bgGradient: 'from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20',
          borderColor: 'border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-700 dark:text-amber-300',
          iconColor: 'text-amber-600'
        }
    }
  }

  const styling = getTypeStyling()
  const Icon = styling.icon

  // Get content preview based on type
  const getContentPreview = () => {
    switch (itemType) {
      case 'note':
        return {
          title: item.title || 'Untitled Note',
          preview: item.content ? item.content.substring(0, 80) + '...' : 'No content'
        }
      case 'conversation':
        return {
          title: item.title || 'Conversation',
          preview: item.messages?.[0]?.content?.substring(0, 60) + '...' || 'No messages'
        }
      case 'crystal':
        return {
          title: item.name || 'Crystal',
          preview: item.core_insight?.substring(0, 70) + '...' || item.supporting_quote?.substring(0, 70) + '...' || 'No insight'
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
      className="absolute cursor-pointer group transition-all duration-300 ease-out will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - minHeight/2}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity
      }}
      onClick={handleCardClick}
    >
      {/* Main Card */}
      <div className={`
        relative w-full rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.03] hover:z-10
        bg-gradient-to-br ${styling.bgGradient}
        ${styling.borderColor}
        ${isHighlighted ? 'ring-2 ring-blue-400/60 scale-[1.02]' : 'ring-1 ring-border/30'}
      `} style={{ minHeight: `${minHeight}px` }}>
        
        {/* Widget link indicator */}
        {widgetId && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background" 
               title="Linked to widget" />
        )}

        {/* Content */}
        <div className="relative p-3 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className={`p-1.5 rounded-md bg-background/50 ${styling.iconColor}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm ${styling.textColor} truncate`}>
                {content.title}
              </h3>
              {showMetadata && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-0.5">
                  {itemType === 'conversation' && item.messageCount && (
                    <span>{item.messageCount} messages</span>
                  )}
                  {item.createdAt && (
                    <>
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          {showPreview && (
            <div className="flex-1">
              <p className={`text-xs ${styling.textColor}/80 leading-relaxed line-clamp-3`}>
                {content.preview}
              </p>
            </div>
          )}

          {/* Footer */}
          {showMetadata && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
              <div className="flex items-center gap-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${styling.bgGradient} ${styling.textColor}`}>
                  {itemType}
                </span>
                {itemType === 'crystal' && item.confidence && (
                  <span className="text-xs text-muted-foreground">
                    {Math.round(item.confidence * 100)}%
                  </span>
                )}
              </div>
              <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
          )}
        </div>

        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />
      </div>
    </div>
  )
}
