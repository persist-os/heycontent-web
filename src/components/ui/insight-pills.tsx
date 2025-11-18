'use client'

import React from 'react'
import { Badge } from './badge'
import { cn } from '@/lib/utils'

// Type matching AmbientInsights format
export interface InsightWithOptionalIcon {
  type: string
  title: string
  description: string
  action: string
  recommendation?: string
  icon?: React.ReactNode
  id: string
}

interface InsightPillsProps {
  insights: InsightWithOptionalIcon[]
  onInsightClick: (insight: InsightWithOptionalIcon) => void
  isLoading?: boolean
  className?: string
}

/**
 * InsightPills - Horizontal scrolling pill/bubble display for AmbientInsights
 * 
 * Features:
 * - Horizontal scrollable layout (no wrapping)
 * - Traditional chat bubble aesthetic
 * - Mobile responsive (44px touch targets, horizontal scroll)
 * - Semantic colors only (no grays, no white)
 * - Reuses Badge component
 */
export function InsightPills({
  insights,
  onInsightClick,
  isLoading = false,
  className
}: InsightPillsProps) {
  // Loading state: skeleton pills
  if (isLoading) {
    return (
      <div className={cn("flex gap-3 md:gap-2 px-4 md:px-6 overflow-x-auto scrollbar-hide", className)}>
        <div className="flex gap-3 md:gap-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-11 md:h-8 w-24 flex-shrink-0 rounded-full bg-muted/20 border border-border/20 animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  // Empty state: return null
  if (insights.length === 0) {
    return null
  }

  return (
    <div className={cn("flex gap-3 md:gap-2 px-4 md:px-6 overflow-x-auto scrollbar-hide", className)}>
      <div className="flex gap-3 md:gap-2">
        {insights.map((insight) => (
          <Badge
            key={insight.id}
            className={cn(
              "rounded-full px-4 py-2 md:px-3 md:py-1.5",
              "text-sm md:text-xs font-medium",
              "min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
              "bg-primary/10 border border-primary/20 text-foreground",
              "hover:bg-primary/20 hover:border-primary/30",
              "cursor-pointer transition-all duration-200",
              "hover:shadow-sm",
              "flex items-center justify-center",
              "flex-shrink-0 whitespace-nowrap"
            )}
            onClick={() => onInsightClick(insight)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onInsightClick(insight)
              }
            }}
            aria-label={insight.title}
          >
            {insight.title}
          </Badge>
        ))}
      </div>
    </div>
  )
}

