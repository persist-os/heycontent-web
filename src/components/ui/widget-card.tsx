'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export interface WidgetCardProps {
  title: string
  timestamp: string
  summary: string
  path?: string
  tag?: string
  onClick?: () => void
  widgetId?: string
  projectId?: string
  className?: string
}

/**
 * WidgetCard - Matches Figma design exactly (same as chat cards)
 * 
 * Figma specs (node-id: 1238-2033):
 * - Width: 1124px, Height: auto (based on content)
 * - Border: 2px solid #65b5ff (brand rigel) with gradient background
 * - Border radius: 12px
 * - Padding: 36px horizontal, 8px vertical
 * - Title: H2 (24px, SemiBold, line-height 36px, tracking -0.72px)
 * - Timestamp: H3 (16px, SemiBold, line-height 24px, tracking -0.48px), right-aligned
 * - Summary: Body/L (16px, Regular, line-height 20px), subtle color
 * - Path text: H3 (16px, SemiBold), blue color (#9acbff)
 * - Tag badge: dark blue background (#003355), white text, 8px padding, 8px border radius
 * - Arrow icon: 24px, right-aligned, 40px x 40px button
 */
export function WidgetCard({
  title,
  timestamp,
  summary,
  path,
  tag,
  onClick,
  widgetId,
  projectId,
  className
}: WidgetCardProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (projectId && widgetId) {
      router.push(`/dashboard/living-projects/${projectId}/gallery?id=${widgetId}&type=widget`)
    } else if (projectId) {
      router.push(`/dashboard/living-projects/${projectId}/assignment`)
    }
  }

  return (
    <a
      onClick={handleClick}
      className={cn(
        'relative rounded-[12px] shrink-0 w-full cursor-pointer',
        'bg-gradient-to-l border-2 border-[#65b5ff] border-solid from-[rgba(101,181,255,0)] to-[rgba(101,181,255,0.3)]',
        className
      )}
    >
      <div className="box-border content-stretch flex flex-col gap-[8px] items-end overflow-clip px-[36px] py-[8px] relative rounded-[inherit] w-full">
        {/* Title and Timestamp */}
        <div className="content-stretch flex font-['DM_Sans'] font-semibold gap-[10px] h-[36px] items-center justify-center leading-[0] relative shrink-0 w-[1051px]">
          <div className="flex flex-[1_0_0] flex-col justify-center min-h-px min-w-px relative shrink-0 text-[24px] tracking-[-0.72px] text-[hsl(var(--assignment-text-subtle))] [font-variation-settings:'opsz'_14]">
            <p className="leading-[36px] whitespace-pre-wrap">{title}</p>
          </div>
          <div className="flex flex-col justify-center relative shrink-0 text-[16px] tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
            <p className="leading-[24px] text-[hsl(var(--assignment-text-subtle))]">{timestamp}</p>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col font-['DM_Sans'] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[hsl(var(--assignment-text-subtle))] text-[16px] w-[min-content] [font-variation-settings:'opsz'_14]">
          <p className="leading-[20px] whitespace-pre-wrap">{summary}</p>
        </div>

        {/* Path and Tag */}
        <div className="content-stretch flex h-[32px] items-center relative shrink-0 w-[1051px]">
          <div className="content-stretch flex gap-[20px] items-center relative shrink-0">
            {path && (
              <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-[0px] text-[#9acbff] tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
                <p className="font-['DM_Sans'] font-semibold leading-[24px] text-[16px]">{path}</p>
              </div>
            )}
            {tag && (
              <div className="bg-[#003355] box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[4px] relative rounded-[8px] shrink-0">
                <div className="flex flex-col font-['DM_Sans'] font-semibold justify-center leading-[0] relative shrink-0 text-[#eef1fe] text-[16px] tracking-[-0.48px] whitespace-nowrap [font-variation-settings:'opsz'_14]">
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
              <ArrowRight className="w-6 h-6 text-[#eef1fe]" />
            </div>
          </div>
        </div>
      </div>
    </a>
  )
}

