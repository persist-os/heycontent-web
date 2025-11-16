'use client'

import React from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ArtifactQuickEntryCardProps {
  artifact: any
  className?: string
}

/**
 * ArtifactQuickEntryCard - Compact artifact card for homepage
 * 
 * Matches Figma design exactly:
 * - 348px x 129px
 * - Gradient border (from transparent to #ffa312/75%)
 * - Widget icon top-right
 * - Title (H2), tag (Body/L), metadata (Body/L)
 * - Arrow icon button bottom-right
 */
export function ArtifactQuickEntryCard({ artifact, className }: ArtifactQuickEntryCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (artifact.projectId) {
      router.push(`/dashboard/living-projects/${artifact.projectId}/gallery?id=${artifact._id}`)
    }
  }

  // Extract title with fallback chain
  let artifactTitle = artifact.title
  if (!artifactTitle && artifact.data?.title) {
    artifactTitle = artifact.data.title
  }
  if (!artifactTitle && artifact.type === 'report' && artifact.data?.markdown) {
    const match = artifact.data.markdown.match(/^#\s+(.+)$/m)
    if (match) {
      artifactTitle = match[1].trim()
    }
  }
  if (!artifactTitle) {
    artifactTitle = artifact.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'artifact name'
  }

  // Extract widget/project name for tag
  const widgetName = artifact.widgetTitle || artifact.projectName || 'project/widget name as a tag'

  // Extract metadata
  const metadata = artifact.metadata || {}
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
  const metadataText = `type of output/${relativeTime}`

  return (
    <div
      onClick={handleClick}
      className={cn(
        "col-[auto] h-[129px] relative row-[auto] shrink-0 w-[348px] cursor-pointer transition-all",
        "bg-gradient-to-r from-[rgba(255,163,18,0)] to-[rgba(255,163,18,0.75)]",
        "border-2 border-[#ffa312] opacity-75",
        "rounded-[12px] overflow-hidden",
        className
      )}
    >
      {/* Widget Icon - Exact from Figma: left-[307px] top-[9px] width="24" height="24" */}
      <div className="absolute left-[307px] overflow-clip size-[24px] top-[9px]">
        <Sparkles className="w-6 h-6 text-foreground" />
      </div>

      {/* Content - Exact from Figma: Frame 179 x="6" y="7" width="335" height="116" */}
      <div className="absolute box-border content-stretch flex flex-col gap-[16px] items-start left-[6px] px-[8px] py-0 top-[7px] w-[335px]">
        {/* Title and Tag - Exact from Figma: Frame 177 x="8" y="0" width="319" height="60" */}
        <div className="content-stretch flex flex-col gap-[4px] items-start leading-[0] relative shrink-0 text-[color:var(--assignment-text-regular,#eef1fe)] w-full">
          <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center relative shrink-0 text-[24px] tracking-[-0.72px] w-full" style={{ fontVariationSettings: "'opsz' 14, 'opsz' 14" }}>
            <p className="leading-[36px] whitespace-pre-wrap line-clamp-1">{artifactTitle}</p>
          </div>
          <div className="flex flex-col font-['DM_Sans'] font-normal justify-center relative shrink-0 text-[16px] w-full" style={{ fontVariationSettings: "'opsz' 14" }}>
            <p className="leading-[20px] whitespace-pre-wrap">{widgetName}</p>
          </div>
        </div>

        {/* Metadata and Arrow - Exact from Figma: Frame 178 x="8" y="76" width="319" height="40" */}
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          <div className="flex flex-col font-['DM_Sans'] font-normal justify-center leading-[0] relative shrink-0 text-[color:var(--assignment-text-regular,#eef1fe)] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14" }}>
            <p className="leading-[20px]">{metadataText}</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
            aria-label="Open artifact"
            className="box-border content-stretch cursor-pointer flex gap-[10px] items-center p-[8px] relative rounded-[8px] shrink-0 w-[40px] h-[40px] hover:bg-[hsl(var(--assignment-surface-container))]/50 transition-colors"
          >
            <ArrowUpRight className="overflow-clip relative shrink-0 size-[24px] text-[#663e00]" />
          </button>
        </div>
      </div>
    </div>
  )
}

