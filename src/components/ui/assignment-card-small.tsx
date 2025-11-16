'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AssignmentCardSmallProps {
  assignment: any
  className?: string
}

/**
 * AssignmentCardSmall - Small assignment card
 * 
 * Matches Figma design exactly:
 * - 742px x 60px
 * - Border (1px solid, uses --assignment-outline-variant)
 * - Card background (uses --card CSS variable, adapts to light/dark mode)
 * - Title (H3) and timestamp (Body/L)
 */
export function AssignmentCardSmall({ assignment, className }: AssignmentCardSmallProps) {
  const router = useRouter()

  const handleClick = () => {
    if (assignment._id) {
      router.push(`/dashboard/living-projects/${assignment._id}/assignment`)
    }
  }

  // Format relative time
  const relativeTime = (() => {
    if (!assignment.updatedAt && !assignment._creationTime) return '1 day ago'
    const date = new Date(assignment.updatedAt || assignment._creationTime)
    const now = Date.now()
    const diff = now - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  })()

  return (
    <div
      onClick={handleClick}
      className={cn(
        "bg-[hsl(var(--card))] border border-[hsl(var(--assignment-outline-variant))] border-solid relative rounded-[8px] shrink-0 w-[742px] h-[60px] cursor-pointer",
        "transition-all hover:border-[hsl(var(--assignment-outline-variant))]/80",
        className
      )}
    >
      {/* Exact from Figma: x="20" y="18" width="638" height="24" for title, x="658" y="18" width="64" height="24" for timestamp */}
      <div className="box-border content-stretch flex font-['DM_Sans'] font-semibold items-center justify-between leading-[0] overflow-clip px-[20px] py-[18px] relative rounded-[inherit] text-[hsl(var(--assignment-text-subtle))] tracking-[-0.48px] w-full" style={{ fontVariationSettings: "'opsz' 14, 'opsz' 14" }}>
        <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative shrink-0 text-[16px]">
          <p className="leading-[24px] whitespace-pre-wrap line-clamp-1">
            {assignment.name || 'Assignment 2'}
          </p>
        </div>
        <div className="flex flex-col justify-center relative shrink-0 text-[0px] whitespace-nowrap" style={{ fontVariationSettings: "'opsz' 14, 'opsz' 14" }}>
          <p className="font-['DM_Sans'] font-semibold leading-[24px] text-[16px] tracking-[-0.48px]">
            {relativeTime}
          </p>
        </div>
      </div>
    </div>
  )
}

