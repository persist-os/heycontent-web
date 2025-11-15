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
 * InsightPills - Staggered pill/bubble display for AmbientInsights
 * 
 * Features:
 * - Staggered layout (alternating left/right alignment)
 * - Traditional chat bubble aesthetic
 * - Mobile responsive (stacks vertically)
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
      <div className={cn("flex flex-wrap gap-2 px-6 justify-center", className)}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="h-8 w-24 rounded-full bg-muted/20 border border-border/20 animate-pulse"
          />
        ))}
      </div>
    )
  }

  // Empty state: return null
  if (insights.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-2 px-6 justify-center", className)}>
      {insights.map((insight) => (
        <Badge
          key={insight.id}
          className={cn(
            "rounded-full px-3 py-1.5",
            "text-xs font-medium",
            "bg-primary/10 border border-primary/20 text-foreground",
            "hover:bg-primary/20 hover:border-primary/30",
            "cursor-pointer transition-all duration-200",
            "hover:shadow-sm"
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
  )
}

