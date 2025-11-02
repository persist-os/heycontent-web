/**
 * WIDGET HEADER COMPONENT
 * 
 * Displays widget title, description, and primary actions
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Id } from '@/convex/_generated/dataModel'
import type { WidgetConfig } from '@/types/projectWidgets'
import { T, TButton } from '@/components/translation'

interface WidgetHeaderProps {
  widget: WidgetConfig
  projectId: Id<"projects">
  isRunning: boolean
  onRunWidget: () => void
  onOpenInLab: () => void
}

export function WidgetHeader({ 
  widget, 
  projectId, 
  isRunning, 
  onRunWidget,
  onOpenInLab
}: WidgetHeaderProps) {
  const router = useRouter()

  return (
    <div className="
      bg-card/80 backdrop-blur-lg
      border-b border-border/30
      shadow-sm shadow-primary/5
    ">
      <div className="max-w-[1600px] mx-auto px-8 py-12">
        <div className="flex items-start justify-between gap-8">
          {/* Left: Title & Metadata */}
          <div className="flex-1 space-y-6">
            <div>
              <button
                onClick={() => router.push(`/dashboard/living-projects/${projectId}`)}
                className="
                  text-sm text-muted-foreground 
                  hover:text-foreground hover:bg-primary/5
                  transition-all duration-300
                  px-3 py-1.5 rounded-lg
                  mb-6 block
                "
              >
                <T context="navigation.back">← Back to Project</T>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline gap-6">
                <h1 className="text-5xl font-light tracking-tight text-foreground">
                  <T context="widget.title">{widget.title}</T>
                </h1>
                <span className="
                  text-sm text-muted-foreground
                  bg-primary/10 px-3 py-1 rounded-full
                  border border-primary/20
                ">
                  {widget.widget_type}
                </span>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed max-w-3xl">
                <T context="widget.description">{widget.description}</T>
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 pt-8">
            <Button
              onClick={onOpenInLab}
              variant="ghost"
              className="
                text-muted-foreground 
                hover:text-foreground hover:bg-primary/5
                transition-all duration-300
              "
            >
              <T context="button.open_lab">Open in Lab</T>
            </Button>
            <Button
              onClick={onRunWidget}
              disabled={isRunning}
              variant="outline"
              className="
                hover:bg-primary/5 hover:border-primary/30
                transition-all duration-300
              "
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <T context="button.running">Running</T>
                </>
              ) : (
                <T context="button.run_widget">Run Widget</T>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

