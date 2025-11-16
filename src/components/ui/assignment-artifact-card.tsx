'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, ArrowUpRight } from 'lucide-react'
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
        'relative w-[348px] h-[129px] cursor-pointer border-2 rounded-xl overflow-hidden transition-all opacity-75',
        isHighlighted
          ? 'bg-gradient-to-r from-transparent to-[hsl(var(--assignment-brand-orange))]/75 border-[hsl(var(--assignment-brand-orange))]'
          : 'bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-outline))]',
        className
      )}
    >
      {/* Widget Icon - Top Right */}
      <div className="absolute top-[9px] right-[9px] w-6 h-6">
        <Sparkles className="w-6 h-6 text-foreground" />
      </div>
      
      <CardContent className="p-2 h-full flex flex-col justify-between">
        <div className="flex flex-col gap-1 pr-8">
          <h3 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground line-clamp-1">
            {artifact.title || <T context="assignment.artifacts.artifact_name_fallback">artifact name</T>}
          </h3>
          <p className={cn('text-base leading-5', {
            'text-foreground': isHighlighted,
            'text-[hsl(var(--assignment-text-subtle))]': !isHighlighted
          })}>
            {widgetTitle || <T context="assignment.artifacts.widget_name_fallback">project/widget name as a tag</T>}
          </p>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-base text-foreground">
            {`${formattedType} • ${relativeTime}`}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="w-10 h-10"
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            <ArrowUpRight className={cn('w-6 h-6', {
              'text-[hsl(var(--assignment-accent-orange-text))]': isHighlighted,
              'text-[hsl(var(--assignment-outline))]': !isHighlighted
            })} />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

