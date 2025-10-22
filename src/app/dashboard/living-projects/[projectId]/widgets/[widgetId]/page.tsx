/**
 * WIDGET DASHBOARD PAGE
 * 
 * Full-page view for comprehensive widget information, outputs, and management.
 * Designed to display all widget data with expandable sections to avoid visual overload.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { T, TButton, THeading } from '@/components/translation'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import type { WidgetConfig } from '@/types/projectWidgets'
import type { WidgetOutput } from './types'
import { WidgetHeader } from './components/WidgetHeader'
import { WidgetOutputCard } from './components/WidgetOutputCard'
import { ContentAttachmentPanel } from './components/ContentAttachmentPanel'
import { ConnectedContentSection } from './components/ConnectedContentSection'
import { launchThinkingLabWithOutput } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'

export default function WidgetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as Id<"projects">
  const widgetId = params.widgetId as Id<"widgets">  // ✅ Convex ID type

  const [userId, setUserId] = useState<string | null>(null)
  const [outputLimit, setOutputLimit] = useState(10)
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set())
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false)

  const { executeWidget, isRunning } = useWidgetRunner()

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    getUserId()
  }, [])

  // ✅ OPTIMIZED: Direct widget query using Convex ID (no table scan)
  const widget = useQuery(
    api.widgetsQueries.getWidget,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as WidgetConfig | null | undefined

  // ✅ OPTIMIZED: Direct outputs query with Convex ID filter
  const outputs = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    userId && widgetId ? {
      userId,
      filters: { widgetId },
      limit: outputLimit,
      orderBy: 'desc'
    } : 'skip'
  ) as WidgetOutput[] | undefined

  // Query for connected content
  const connectedNotes = useQuery(
    api.noteQueries.getNotesByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined

  const connectedConversations = useQuery(
    api.chatQueries.getConversationsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined

  const connectedCrystals = useQuery(
    api.crystalQueries.getCrystalsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined

  const connectedShards = useQuery(
    api.crystalQueries.getShardsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  ) as any[] | undefined


  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      await executeWidget({
        widgetId,  // ✅ Use Convex ID directly from URL params
        projectId
      })
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
  }

  const handleOpenInLab = () => {
    router.push(`/dashboard/thinking_lab?widgetId=${widgetId}&projectId=${projectId}`)
  }

  const handleLaunchThinkingLab = (output: WidgetOutput) => {
    // Use the unified launcher utility with full context
    launchThinkingLabWithOutput(router, output, projectId, widgetId)
  }

  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/thinking_lab?noteId=${noteId}&projectId=${projectId}&widgetId=${widgetId}`)
  }

  const handleConversationClick = (conversationId: string) => {
    router.push(`/dashboard/thinking_lab?conversationId=${conversationId}&projectId=${projectId}&widgetId=${widgetId}`)
  }

  const toggleOutput = (outputId: string) => {
    const newExpanded = new Set(expandedOutputs)
    if (newExpanded.has(outputId)) {
      newExpanded.delete(outputId)
    } else {
      newExpanded.add(outputId)
    }
    setExpandedOutputs(newExpanded)
  }

  if (!userId || !widget) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">
            <T context="loading.widget">Loading widget...</T>
          </span>
        </div>
      </div>
    )
  }

  const totalOutputs = outputs?.length || 0
  const widgetData = widget as any
  const lastRun = widgetData.lastRunAt ? new Date(widgetData.lastRunAt).toLocaleString() : 'Never'
  const status = widgetData.lastRunStatus || 'idle'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <WidgetHeader 
        widget={widget}
        projectId={projectId}
        isRunning={isRunning}
        onRunWidget={handleRunWidget}
        onOpenInLab={handleOpenInLab}
      />

      {/* Main Content - New Layout */}
      <div className="max-w-[1600px] mx-auto px-8 py-12 ml-[120px]">
        {/* Widget Metadata Bar */}
        <div className="
          flex items-start gap-12 pb-12 mb-12
          border-b border-border/30
        ">
          <div className="flex-1 grid grid-cols-3 gap-8">
            <div className="
              bg-card/50 backdrop-blur-sm
              border border-border/40
              rounded-2xl p-6
              hover:bg-card/80 hover:border-border/60
              transition-all duration-300
            ">
              <span className="text-sm text-muted-foreground">
                <T context="widget.status">Status</T>
              </span>
              <p className="text-lg font-light text-foreground mt-1 capitalize">{status}</p>
            </div>
            <div className="
              bg-card/50 backdrop-blur-sm
              border border-border/40
              rounded-2xl p-6
              hover:bg-card/80 hover:border-border/60
              transition-all duration-300
            ">
              <span className="text-sm text-muted-foreground">
                <T context="widget.last_run">Last Run</T>
              </span>
              <p className="text-lg font-light text-foreground mt-1">{lastRun}</p>
            </div>
            <div className="
              bg-primary/10 backdrop-blur-sm
              border border-primary/20
              rounded-2xl p-6
              hover:bg-primary/15 hover:border-primary/30
              transition-all duration-300
            ">
              <span className="text-sm text-muted-foreground">
                <T context="widget.total_outputs">Total Outputs</T>
              </span>
              <p className="text-lg font-light text-foreground mt-1">{totalOutputs}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-16">
          {/* Left Column - Outputs (Wider) */}
          <div className="xl:col-span-3 space-y-8">
            <div className="flex items-baseline gap-6">
              <THeading level={2} className="text-3xl font-light tracking-tight text-foreground">
                <T context="widget.outputs">Outputs</T>
              </THeading>
              <span className="text-sm text-muted-foreground">
                <T context="widget.total_count">{totalOutputs} total</T>
              </span>
            </div>

            <div className="space-y-4">
              {!outputs || outputs.length === 0 ? (
                <div className="
                  bg-primary/5 backdrop-blur-sm
                  border border-dashed border-primary/30
                  rounded-2xl p-16 text-center
                  hover:bg-primary/10 hover:border-primary/40
                  transition-all duration-300
                ">
                  <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                    <T context="widget.empty_state">Run this widget to generate your first output</T>
                  </p>
                  <Button
                    onClick={handleRunWidget}
                    disabled={isRunning}
                    variant="outline"
                    className="
                      bg-primary text-primary-foreground
                      hover:bg-primary/90
                      transition-all duration-300
                    "
                  >
                    <T context="button.run_widget_now">Run Widget Now</T>
                  </Button>
                </div>
              ) : (
                <>
                  {outputs.map((output) => (
                    <WidgetOutputCard
                      key={output.outputId}
                      output={output}
                      isExpanded={expandedOutputs.has(output.outputId)}
                      onToggle={() => toggleOutput(output.outputId)}
                      onLaunchLab={() => handleLaunchThinkingLab(output)}
                    />
                  ))}

                  {outputs && outputs.length >= outputLimit && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => setOutputLimit(prev => prev + 10)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <T context="button.load_more">Load More</T>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Connected Content */}
          <div className="xl:col-span-2">
            <ConnectedContentSection
              widgetId={widgetId}
              userId={userId}
              onNoteClick={handleNoteClick}
              onConversationClick={handleConversationClick}
              onAddContent={() => setShowAttachmentPanel(true)}
            />
          </div>
        </div>
      </div>

      {/* Attachment Panel */}
      {showAttachmentPanel && (
        <ContentAttachmentPanel
          widgetId={widgetId}
          userId={userId}
          isOpen={showAttachmentPanel}
          onClose={() => setShowAttachmentPanel(false)}
          attachedNoteIds={connectedNotes?.map(n => n._id) || []}
          attachedConversationIds={connectedConversations?.map(c => c._id) || []}
          attachedCrystalIds={connectedCrystals?.map(c => c._id) || []}
          attachedShardIds={connectedShards?.map(s => s._id) || []}
        />
      )}
    </div>
  )
}
