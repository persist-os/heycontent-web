/**
 * Unified Content Card Component
 * 
 * Matches AssignmentArtifactCard styling for consistency across all content types.
 * Uses artifact-widget.svg icon and AssignmentArtifactCard layout.
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BaseCard } from '@/components/ui/base-card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { formatDistanceToNow } from '@/app/dashboard/living-projects/[projectId]/components/utils/dateFormatting'

export interface ContentCardData {
  id: string
  type: 'note' | 'artifact' | 'stardust' | 'shard' | 'widget'
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

  const handleClick = () => {
    if (onClick) {
      onClick(content)
    } else {
      // Default navigation
      switch (content.type) {
        case 'note':
          router.push(`/dashboard/thinking_lab?noteId=${content.id}`)
          break
        case 'artifact':
          // Navigate to gallery - projectId can be extracted from URL or passed separately
          router.push(`/dashboard/living-projects/gallery?id=${content.id}&type=artifact`)
          break
        case 'stardust':
          // Stardust navigation - could go to stardust detail page if exists
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

  // Format metadata string
  const getMetadataString = () => {
    const parts = []
    if (content.type) {
      parts.push(content.type.charAt(0).toUpperCase() + content.type.slice(1))
    }
    if (content.metadata?.updatedAt) {
      const relativeTime = formatDistanceToNow(new Date(content.metadata.updatedAt), { addSuffix: true, short: true })
      parts.push(relativeTime)
    }
    return parts.join(' • ')
  }

  const subtitle = content.content || content.description || content.preview || ''
  const metadata = getMetadataString()

  return (
    <BaseCard
      variant="content"
      onClick={handleClick}
      className={cn(
        'relative w-[348px] h-[129px] cursor-pointer border-2 overflow-hidden transition-all opacity-75',
        'bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-stroke-focus))]',
        className
      )}
    >
      {/* Widget Icon - Top Right */}
      <div className="absolute top-[9px] right-[9px] w-6 h-6 z-10">
        <Image
          src="/icons/artifact-widget.svg"
          alt="Widget icon"
          width={24}
          height={24}
          className="opacity-75"
        />
      </div>
      
      <div className="absolute left-[6px] top-[7px] right-[41px] px-[8px] py-0 h-[116px] flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[4px] min-w-0">
          <h3 className="text-[24px] font-semibold leading-[36px] tracking-[-0.72px] text-[hsl(var(--assignment-text-regular))] line-clamp-1 overflow-hidden">
            {content.title}
          </h3>
          {subtitle && (
            <p className="text-[16px] font-normal leading-[20px] text-[hsl(var(--assignment-text-subtle))] line-clamp-1 overflow-hidden">
              {subtitle}
            </p>
          )}
        </div>
        
        {metadata && (
          <div className="flex items-center justify-between gap-2 min-w-0">
            <span className="text-[16px] font-normal leading-[20px] text-[hsl(var(--assignment-text-regular))] truncate min-w-0">
              {metadata}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 p-[8px]"
              onClick={handleAction || handleClick}
            >
              <ArrowUpRight className="w-6 h-6 text-[hsl(var(--assignment-stroke-focus))]" />
            </Button>
          </div>
        )}
      </div>
    </BaseCard>
  )
}

