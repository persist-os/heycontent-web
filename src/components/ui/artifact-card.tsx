'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export interface ArtifactCardProps {
  title: string
  timestamp: string
  summary: string
  tag?: string
  onClick?: () => void
  artifactId?: string
  projectId?: string
  className?: string
}

/**
 * ArtifactCard - Matches Figma design exactly
 * 
 * Figma specs (node-id: 1580:2654):
 * - Width: 556px (half of 1124px in 2-column grid)
 * - Height: 168px
 * - Border: 2px solid #ffa312 (brand orange) with gradient background
 * - Border radius: 12px
 * - Padding: 36px horizontal, 8px vertical
 * - Title: H2 (24px, SemiBold, line-height 36px, tracking -0.72px)
 * - Timestamp: H3 (16px, SemiBold, line-height 24px, tracking -0.48px), right-aligned
 * - Summary: Body/L (16px, Regular, line-height 20px), subtle color
 * - Tag badge: dark orange background (#663e00), white text
 * - Arrow icon: 24px, right-aligned, 40px x 40px button
 */
export function ArtifactCard({
  title,
  timestamp,
  summary,
  tag,
  onClick,
  artifactId,
  projectId,
  className
}: ArtifactCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (projectId && artifactId) {
      router.push(`/dashboard/living-projects/${projectId}/gallery?id=${artifactId}`)
    }
  }

  return (
    <a
      onClick={handleClick}
      className={cn(
        'relative rounded-[12px] shrink-0 w-full h-[168px] cursor-pointer',
        'bg-gradient-to-l border-2 border-[#ffa312] border-solid from-[rgba(243,156,18,0)] to-[rgba(255,163,18,0.3)]',
        className
      )}
    >
      <div className="box-border content-stretch flex flex-col gap-[8px] items-end overflow-hidden px-[36px] py-[8px] relative rounded-[inherit] w-full">
        {/* Title and Timestamp */}
        <div className="content-stretch flex font-['DM_Sans'] font-semibold gap-[10px] h-[36px] items-center justify-between leading-[0] relative shrink-0 w-full min-w-0">
          <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-0 relative shrink-0 text-[24px] tracking-[-0.72px] text-[hsl(var(--assignment-text-regular))] overflow-hidden [font-variation-settings:'opsz'_14]">
            <p className="leading-[36px] whitespace-nowrap overflow-hidden text-ellipsis">{title}</p>
          </div>
          <div className="flex flex-col justify-center relative shrink-0 text-[16px] tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
            <p className="leading-[24px] text-[hsl(var(--assignment-text-subtle))]">{timestamp}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col font-['DM_Sans'] font-normal justify-center leading-[0] min-w-0 relative shrink-0 text-[hsl(var(--assignment-text-subtle))] text-[16px] w-full overflow-hidden [font-variation-settings:'opsz'_14]">
          <p className="leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">{summary}</p>
        </div>

        {/* Tag */}
        <div className="content-stretch flex h-[32px] items-center relative shrink-0 w-full min-w-0">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0 min-w-0">
            {tag && (
              <div className="bg-[hsl(var(--assignment-accent-orange))] box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-[hsl(var(--assignment-accent-orange-text))] text-[16px] tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
                  <p className="leading-[24px]">{tag}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arrow Icon Button */}
        <div className="box-border content-stretch flex gap-[10px] items-end justify-end p-[8px] relative rounded-[8px] shrink-0 w-[40px]">
          <div className="overflow-clip relative shrink-0 size-[24px]">
            <div className="absolute inset-[20.83%_16.67%]">
              <ArrowRight className="w-6 h-6 text-[hsl(var(--assignment-text-regular))]" />
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

