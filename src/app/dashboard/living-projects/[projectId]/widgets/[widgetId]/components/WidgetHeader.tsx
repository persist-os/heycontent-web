/**
 * WIDGET HEADER COMPONENT
 * 
 * Displays widget title, description, and primary actions
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Loader2 } from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'
import type { WidgetConfig } from '@/types/projectWidgets'

interface WidgetHeaderProps {
  widget: WidgetConfig
  projectId: Id<"projects">
  isRunning: boolean
  onRunWidget: () => void
}

export function WidgetHeader({ 
  widget, 
  projectId, 
  isRunning, 
  onRunWidget 
}: WidgetHeaderProps) {
  const router = useRouter()

  return (
    <div className="border-b border-border/30">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Title & Metadata */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/dashboard/living-projects/${projectId}`)}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </Button>
            </div>

            <div className="flex items-baseline gap-4">
              <h1 className="text-4xl font-light tracking-tight text-foreground">
                {widget.title}
              </h1>
              <Badge variant="outline" className="text-sm">
                {widget.widget_type}
              </Badge>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              {widget.description}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-3">
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

