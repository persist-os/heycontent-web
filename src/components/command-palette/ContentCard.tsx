/**
 * Centralized Content Card Component
 * 
 * Material Design 3 card for all content types (notes, conversations, crystals, shards, widgets).
 * Features glassmorphism, semantic colors, and sophisticated visual hierarchy.
 * Reusable across search results, grid views, and content sections.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText, MessageCircle, Gem, Sparkles, PlayCircle, Clock, Star, Tag, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface ContentCardData {
  id: string
  type: 'note' | 'conversation' | 'crystal' | 'shard' | 'widget'
  title: string
  content?: string
  description?: string
  preview?: string
  metadata?: {
    createdAt?: number
    updatedAt?: number
    messageCount?: number
    dimension?: string
    confidence_score?: number
    confidence_level?: string
    important?: boolean
    starred?: boolean
    priority?: number
    size?: string
    theme?: string
  }
  score?: number
  importance?: number
}

interface ContentCardProps {
  content: ContentCardData
  onClick?: (content: ContentCardData) => void
  onAction?: (content: ContentCardData) => void
  actionIcon?: React.ComponentType<{ className?: string }>
  actionLabel?: string
  showScore?: boolean
  showMetadata?: boolean
  className?: string
  variant?: 'default' | 'compact' | 'detailed'
}

export function ContentCard({
  content,
  onClick,
  onAction,
  actionIcon: ActionIcon,
  actionLabel,
  showScore = false,
  showMetadata = true,
  className,
  variant = 'default'
}: ContentCardProps) {
  const router = useRouter()

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'note':
        return {
          label: 'Note',
          icon: FileText,
          // Blue quantum field - knowledge crystallization
          iconColor: 'text-[hsl(var(--note-primary))]',
          bgGradient: 'bg-gradient-to-br from-[hsl(var(--note-bg))] to-[hsl(var(--note-bg))]/60',
          bgColor: 'bg-[hsl(var(--note-bg))]',
          borderColor: 'border-[hsl(var(--note-border))]',
          textColor: 'text-[hsl(var(--note-text))]',
          accentColor: 'bg-[hsl(var(--note-accent))]/20',
          glowColor: 'hover:shadow-[hsl(var(--note-primary))]/20'
        }
      case 'crystal':
        return {
          label: 'Crystal',
          icon: Gem,
          // Violet consciousness - crystallized intelligence
          iconColor: 'text-[hsl(var(--crystal-primary))]',
          bgGradient: 'bg-gradient-to-br from-[hsl(var(--crystal-bg))] to-[hsl(var(--crystal-bg))]/60',
          bgColor: 'bg-[hsl(var(--crystal-bg))]',
          borderColor: 'border-[hsl(var(--crystal-border))]',
          textColor: 'text-[hsl(var(--crystal-text))]',
          accentColor: 'bg-[hsl(var(--crystal-accent))]/20',
          glowColor: 'hover:shadow-[hsl(var(--crystal-primary))]/20'
        }
      case 'shard':
        return {
          label: 'Shard',
          icon: Sparkles,
          // Amber energy - quantum fragments
          iconColor: 'text-[hsl(var(--shard-primary))]',
          bgGradient: 'bg-gradient-to-br from-[hsl(var(--shard-bg))] to-[hsl(var(--shard-bg))]/60',
          bgColor: 'bg-[hsl(var(--shard-bg))]',
          borderColor: 'border-[hsl(var(--shard-border))]',
          textColor: 'text-[hsl(var(--shard-text))]',
          accentColor: 'bg-[hsl(var(--shard-accent))]/20',
          glowColor: 'hover:shadow-[hsl(var(--shard-primary))]/20'
        }
      case 'conversation':
        return {
          label: 'Chat',
          icon: MessageCircle,
          // Emerald consciousness - temporal dialogue
          iconColor: 'text-[hsl(var(--conversation-primary))]',
          bgGradient: 'bg-gradient-to-br from-[hsl(var(--conversation-bg))] to-[hsl(var(--conversation-bg))]/60',
          bgColor: 'bg-[hsl(var(--conversation-bg))]',
          borderColor: 'border-[hsl(var(--conversation-border))]',
          textColor: 'text-[hsl(var(--conversation-text))]',
          accentColor: 'bg-[hsl(var(--conversation-accent))]/20',
          glowColor: 'hover:shadow-[hsl(var(--conversation-primary))]/20'
        }
      case 'widget':
        return {
          label: 'Widget',
          icon: PlayCircle,
          // Sky blue - AI tools and actions
          iconColor: 'text-[hsl(var(--widget-primary))]',
          bgGradient: 'bg-gradient-to-br from-[hsl(var(--widget-bg))] to-[hsl(var(--widget-bg))]/60',
          bgColor: 'bg-[hsl(var(--widget-bg))]',
          borderColor: 'border-[hsl(var(--widget-border))]',
          textColor: 'text-[hsl(var(--widget-text))]',
          accentColor: 'bg-[hsl(var(--widget-accent))]/20',
          glowColor: 'hover:shadow-[hsl(var(--widget-primary))]/20'
        }
      default:
        return {
          label: 'Content',
          icon: FileText,
          iconColor: 'text-muted-foreground',
          bgGradient: 'bg-gradient-to-br from-muted/30 to-muted/10',
          bgColor: 'bg-muted/20',
          borderColor: 'border-border/50',
          textColor: 'text-foreground',
          accentColor: 'bg-muted/30',
          glowColor: 'hover:shadow-muted/20'
        }
    }
  }

  const config = getTypeConfig(content.type)
  const Icon = config.icon

  const displayContent = content.content || content.description || content.preview || ''

  const handleClick = () => {
    if (onClick) {
      onClick(content)
    } else {
      // Default navigation
      switch (content.type) {
        case 'note':
          router.push(`/dashboard/thinking_lab?noteId=${content.id}`)
          break
        case 'conversation':
          router.push(`/dashboard/thinking_lab?conversationId=${content.id}`)
          break
        case 'crystal':
          router.push(`/dashboard/crystals?crystalId=${content.id}`)
          break
        case 'shard':
          router.push(`/dashboard/crystals?shardId=${content.id}`)
          break
        case 'widget':
          break
      }
    }
  }

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAction) {
      onAction(content)
    }
  }

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  const getMetadataTags = () => {
    const tags = []
    const meta = content.metadata

    if (!meta) return tags

    if (meta.important || meta.starred) {
      tags.push({ icon: Star, text: 'Important', color: 'text-[hsl(38_92%_50%)]' })
    }

    if (meta.dimension) {
      tags.push({ icon: Tag, text: meta.dimension, color: config.iconColor })
    }

    if (meta.messageCount) {
      tags.push({ icon: MessageCircle, text: `${meta.messageCount} msgs`, color: config.iconColor })
    }

    if (meta.priority && meta.priority > 7) {
      tags.push({ icon: TrendingUp, text: `P${meta.priority}`, color: config.iconColor })
    }

    return tags
  }

  const metadataTags = showMetadata ? getMetadataTags() : []

  if (variant === 'compact') {
    return (
      <motion.div
        onClick={handleClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'w-full cursor-pointer text-left px-4 py-3 rounded-xl border transition-all duration-200',
          'backdrop-blur-md shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          config.bgGradient,
          config.borderColor,
          config.glowColor,
          className
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-lg', config.accentColor)}>
            <Icon className={cn('w-4 h-4', config.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={cn('font-semibold truncate', config.textColor)}>
              {content.title}
            </div>
            {displayContent && (
              <div className={cn('text-sm line-clamp-1 mt-1 opacity-90', config.textColor)}>
                {displayContent}
              </div>
            )}
          </div>
          {ActionIcon && (
            <button
              onClick={handleAction}
              className={cn('p-1.5 hover:bg-background/30 rounded-lg transition-colors', config.accentColor)}
              title={actionLabel}
            >
              <ActionIcon className={cn('w-4 h-4', config.iconColor)} />
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      onClick={handleClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'group relative w-full cursor-pointer text-left px-4 py-3.5 rounded-xl border transition-all duration-300',
        'backdrop-blur-md shadow-lg',
        'hover:shadow-xl',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
        config.bgGradient,
        config.borderColor,
        config.glowColor,
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon with accent background */}
        <div className={cn(
          'relative p-2.5 rounded-lg flex items-center justify-center flex-shrink-0',
          'transition-transform duration-300 group-hover:scale-110',
          config.accentColor
        )}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
          {/* Pulse effect on hover */}
          <div className={cn(
            'absolute inset-0 rounded-lg opacity-0 group-hover:opacity-20 group-hover:animate-ping',
            config.accentColor
          )} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Title with proper contrast */}
          <div className={cn('font-semibold text-sm leading-snug mb-1.5', config.textColor)}>
            {content.title}
          </div>

          {/* Content/Description with better readability */}
          {displayContent && (
            <div className={cn('text-sm leading-relaxed line-clamp-2 mb-2 opacity-90', config.textColor)}>
              {displayContent}
            </div>
          )}

          {/* Metadata Tags with vibrant colors */}
          {metadataTags.length > 0 && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {metadataTags.slice(0, 3).map((tag, idx) => {
                const TagIcon = tag.icon
                return (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium',
                      tag.color,
                      config.accentColor
                    )}
                  >
                    <TagIcon className="w-3 h-3" />
                    <span>{tag.text}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer with proper spacing */}
          <div className="flex items-center justify-between pt-2 border-t border-current/10">
            <div className={cn('flex items-center gap-2 text-xs', config.textColor, 'opacity-70')}>
              {content.metadata?.createdAt && (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(content.metadata.createdAt)}</span>
                </>
              )}
              <span className={cn('text-xs px-2 py-0.5 rounded-full', config.accentColor)}>
                {config.label}
              </span>
            </div>

            {/* Action Button with accent styling */}
            {ActionIcon && (
              <button
                onClick={handleAction}
                className={cn('p-1.5 rounded-md transition-all duration-200 hover:scale-110', config.accentColor)}
                title={actionLabel}
              >
                <ActionIcon className={cn('w-4 h-4', config.iconColor)} />
              </button>
            )}
          </div>

          {/* Score/Relevance Indicator */}
          {showScore && content.score !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className={cn('h-1.5 flex-1 rounded-full overflow-hidden max-w-[100px]', config.accentColor)}>
                <div 
                  className={cn('h-full rounded-full transition-all', config.iconColor)}
                  style={{ width: `${Math.min(100, Math.max(0, content.score * 100))}%` }}
                  aria-hidden="true"
                />
              </div>
              <span className={cn('text-xs font-medium', config.textColor, 'opacity-70')}>
                {Math.round(content.score * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Holographic effect on hover */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 via-transparent to-white/10" />
    </motion.div>
  )
}

