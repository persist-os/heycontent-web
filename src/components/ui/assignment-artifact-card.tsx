'use client'

import React from 'react'
import { BaseCard } from '@/components/ui/base-card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import { T } from '@/components/translation/T'
import { formatDistanceToNow } from '@/app/dashboard/living-projects/[projectId]/components/utils/dateFormatting'
import { cn } from '@/lib/utils'

export interface AssignmentArtifactCardProps {
  artifact: {
    _id: string
    title?: string
    widgetId?: string
    type?: string
    updatedAt?: number
    _creationTime?: number
  }
  widgetTitle?: string
  isHighlighted?: boolean
  onClick?: () => void
  className?: string
}

export function AssignmentArtifactCard({
  artifact,
  widgetTitle,
  isHighlighted = false,
  onClick,
  className
}: AssignmentArtifactCardProps) {
  const artifactType = artifact.type || 'artifact'
  const formattedType = artifactType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  const updatedAt = artifact.updatedAt || artifact._creationTime || Date.now()
  const relativeTime = formatDistanceToNow(new Date(updatedAt), { addSuffix: true, short: true })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.()
    }
  }

  return (
    <BaseCard
      variant="artifact"
      onClick={onClick}
      className={cn(
        'relative w-full md:w-[348px] min-h-[129px] md:h-[129px] cursor-pointer overflow-hidden transition-all opacity-75 [&>div]:p-0',
        isHighlighted
          ? 'bg-gradient-to-r from-transparent to-[hsl(var(--assignment-brand-orange))]/75 border-[hsl(var(--assignment-brand-orange))]'
          : 'bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-stroke-focus))]',
        className
      )}
    >
      {/* Widget Icon - Top Right - Mobile: Responsive positioning */}
      <div className="absolute top-2 right-2 md:top-[9px] md:right-[9px] w-5 h-5 md:w-6 md:h-6 z-10">
        <Image
          src="/icons/artifact-widget.svg"
          alt="Widget icon"
          width={24}
          height={24}
          className={cn('w-full h-full', {
            'opacity-100': isHighlighted,
            'opacity-75': !isHighlighted
          })}
        />
      </div>
      
      {/* Mobile: Responsive padding | Desktop: Original layout - EXACT original */}
      <div className="absolute left-2 top-2 md:left-[6px] md:top-[7px] right-12 md:right-[41px] px-2 md:px-[8px] py-2 md:py-0 min-h-[auto] md:h-[116px] flex flex-col gap-3 md:gap-[16px]">
        <div className="flex flex-col gap-1 md:gap-[4px] min-w-0">
          <h3 className="text-lg md:text-[24px] font-semibold leading-[1.4] md:leading-[36px] tracking-[-0.36px] md:tracking-[-0.72px] text-[hsl(var(--assignment-text-regular))] line-clamp-2 md:line-clamp-1 overflow-hidden break-words">
            {artifact.title || <T context="assignment.artifacts.artifact_name_fallback">artifact name</T>}
          </h3>
          <p className={cn('text-sm md:text-[16px] font-normal leading-[1.4] md:leading-[20px] line-clamp-2 md:line-clamp-1 overflow-hidden break-words', {
            'text-[hsl(var(--assignment-text-regular))]': isHighlighted,
            'text-[hsl(var(--assignment-text-subtle))]': !isHighlighted
          })}>
            {widgetTitle || <T context="assignment.artifacts.widget_name_fallback">project/widget name as a tag</T>}
          </p>
        </div>
        
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="text-sm md:text-[16px] font-normal leading-[1.4] md:leading-[20px] text-[hsl(var(--assignment-text-regular))] truncate min-w-0 flex-1">
            {`${formattedType} • ${relativeTime}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 md:w-10 md:h-10 p-2 md:p-[8px] min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
            aria-label="Open artifact"
          >
            <ArrowUpRight className={cn('w-5 h-5 md:w-6 md:h-6', {
              'text-[hsl(var(--assignment-accent-orange-text))]': isHighlighted,
              'text-[hsl(var(--assignment-stroke-focus))]': !isHighlighted
            })} />
          </Button>
        </div>
      </div>
    </BaseCard>
  )
}

