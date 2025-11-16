'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
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

  return (
    <Card
      onClick={onClick}
      className={cn(
        'relative w-[348px] h-[129px] cursor-pointer border-2 rounded-[12px] overflow-hidden transition-all opacity-75',
        isHighlighted
          ? 'bg-gradient-to-r from-transparent to-[hsl(var(--assignment-brand-orange))]/75 border-[hsl(var(--assignment-brand-orange))]'
          : 'bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-stroke-focus))]',
        className
      )}
    >
      {/* Widget Icon - Top Right */}
      <div className="absolute top-[9px] left-[307px] w-6 h-6">
        <Image
          src="/icons/artifact-widget.svg"
          alt="Widget icon"
          width={24}
          height={24}
          className={cn({
            'opacity-100': isHighlighted,
            'opacity-75': !isHighlighted
          })}
        />
      </div>
      
      <div className="absolute left-[6px] top-[7px] px-[8px] py-0 w-[335px] h-[116px] flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[4px]">
          <h3 className="text-[24px] font-semibold leading-[36px] tracking-[-0.72px] text-[hsl(var(--assignment-text-regular))] line-clamp-1">
            {artifact.title || <T context="assignment.artifacts.artifact_name_fallback">artifact name</T>}
          </h3>
          <p className={cn('text-[16px] font-normal leading-[20px]', {
            'text-[hsl(var(--assignment-text-regular))]': isHighlighted,
            'text-[hsl(var(--assignment-text-subtle))]': !isHighlighted
          })}>
            {widgetTitle || <T context="assignment.artifacts.widget_name_fallback">project/widget name as a tag</T>}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-[16px] font-normal leading-[20px] text-[hsl(var(--assignment-text-regular))] whitespace-nowrap">
            {`${formattedType} • ${relativeTime}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10 p-[8px]"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <ArrowUpRight className={cn('w-6 h-6', {
              'text-[hsl(var(--assignment-accent-orange-text))]': isHighlighted,
              'text-[hsl(var(--assignment-stroke-focus))]': !isHighlighted
            })} />
          </Button>
        </div>
      </div>
    </Card>
  )
}

