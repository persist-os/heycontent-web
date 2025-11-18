'use client'

import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BaseCard } from '@/components/ui/base-card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ArtifactCardProps {
  artifact: any
}

/**
 * ArtifactCard - Individual artifact card with elegant styling
 * 
 * Displays artifacts from new artifacts table:
 * - Artifact title (with fallback to type)
 * - Tags or version badge
 * - Type/date metadata
 * - Click to navigate to artifact gallery
 */
export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to unified gallery view with artifact selected
    if (artifact.projectId) {
      router.push(`/dashboard/living-projects/${artifact.projectId}/gallery?id=${artifact._id}`)
    }
  }

  // Extract title with fallback chain
  let artifactTitle = artifact.title;
  if (!artifactTitle && artifact.data?.title) {
    artifactTitle = artifact.data.title;
  }
  if (!artifactTitle && artifact.type === 'report' && artifact.data?.markdown) {
    const match = artifact.data.markdown.match(/^#\s+(.+)$/m);
    if (match) {
      artifactTitle = match[1].trim();
    }
  }
  if (!artifactTitle) {
    artifactTitle = artifact.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact'
  }

  const createdDate = new Date(artifact.createdAt || artifact._creationTime || Date.now())
  const relativeTime = (() => {
    const now = Date.now()
    const diff = now - createdDate.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return createdDate.toLocaleDateString()
  })()

  return (
    <BaseCard
      variant="artifact"
      onClick={handleClick}
      className={cn(
        "group relative flex-shrink-0",
        "w-full max-w-[calc(100vw-2rem)]", // Mobile: full width with padding
        "md:w-72", // Desktop: preserve 288px
        "h-40",
        "bg-gradient-to-br from-blue-500/10 via-cyan-500/8 to-blue-500/5",
        "border border-blue-500/20",
        "cursor-pointer transition-all duration-300",
        "hover:bg-blue-500/15 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10",
        "backdrop-blur-sm overflow-hidden"
      )}
    >
      <div className="p-5 h-full flex flex-col justify-between relative">
      
        {/* Arrow icon (top-right) */}
        <div className="absolute top-4 right-4 z-10">
          <ArrowUpRight className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
        </div>
        
        {/* Top: Artifact name */}
        <div className="pr-8">
          <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">
            {artifactTitle}
          </h3>
        </div>
        
        {/* Bottom: Tags and metadata */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {artifact.tags && artifact.tags.length > 0 ? (
              <Badge
                variant="outline"
                className="bg-blue-500/20 border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 truncate max-w-[140px] md:max-w-full"
              >
                {artifact.tags[0]}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-muted/40 border-border/40 text-muted-foreground text-xs px-2 py-0.5 truncate max-w-[120px] md:max-w-full"
              >
                v{artifact.metadata?.version || 1}
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground md:whitespace-nowrap">
            {relativeTime}
          </span>
        </div>
        
      </div>
    </BaseCard>
  )
}
