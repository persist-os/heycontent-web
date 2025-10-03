/**
 * WIDGET SUMMARY HEADER
 * 
 * Clean, minimal header with essential info and actions
 */

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import type { WidgetConfig } from '@/types/projectWidgets'

interface WidgetSummaryHeaderProps {
  widget: WidgetConfig
  projectId: Id<"projects">
  isRunning: boolean
  onRunWidget: () => void
  stats: {
    outputs: number
    crystals: number
    shards: number
    conversations: number
    notes: number
  }
}

export function WidgetSummaryHeader({
  widget,
  projectId,
  isRunning,
  onRunWidget,
  stats
}: WidgetSummaryHeaderProps) {
  const router = useRouter()

  const totalInsights = stats.crystals + stats.shards + stats.conversations

  return (
    <div className="border-b border-border/30 bg-background">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Title and breadcrumb */}
          <div className="flex-1 space-y-4">
            <button
              onClick={() => router.push(`/dashboard/living-projects/${projectId}`)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to project</span>
            </button>

            <div className="space-y-2">
              <h1 className="text-3xl font-light tracking-tight text-foreground">
                {widget.name}
              </h1>
              
              {widget.description && (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">
                  {widget.description}
                </p>
              )}
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Outputs</span>
                <span className="font-medium text-foreground">{stats.outputs}</span>
              </div>
              
              <div className="h-4 w-px bg-border/50" />
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Insights</span>
                <span className="font-medium text-foreground">{totalInsights}</span>
              </div>
              
              <div className="h-4 w-px bg-border/50" />
              
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Notes</span>
                <span className="font-medium text-foreground">{stats.notes}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={onRunWidget}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Widget
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

