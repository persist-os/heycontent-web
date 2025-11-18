'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BaseCard } from '@/components/ui/base-card'
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
    <div
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={cn(
        "group relative flex-shrink-0",
        "w-full max-w-[calc(100vw-2rem)]", // Mobile: full width with padding
        "md:w-72", // Desktop: preserve 288px
        "cursor-pointer transition-all duration-300",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      tabIndex={0}
      role="button"
      aria-label={`View artifact: ${artifactTitle}`}
    >
      <BaseCard
        variant="artifact"
        className={cn(
          "h-40",
          "bg-gradient-to-br from-blue-500/10 via-cyan-500/8 to-blue-500/5",
          "border border-blue-500/20",
          "transition-all duration-300",
          "group-hover:bg-blue-500/15 group-hover:border-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/10",
          "backdrop-blur-sm overflow-hidden"
        )}
      >
        <div className="p-5 h-full flex flex-col justify-between relative">
          
          {/* Top: Artifact name */}
          <div>
            <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-tight">
              {artifactTitle}
            </h3>
          </div>
          
          {/* Bottom: Time on left, arrow on right */}
          <div className="flex items-end justify-between w-full">
            <span className="text-xs text-muted-foreground">
              {relativeTime}
            </span>
            <ArrowRight className="w-5 h-5 text-foreground/60 group-hover:text-foreground transition-colors flex-shrink-0" />
          </div>
          
        </div>
      </BaseCard>
    </div>
  )
}
