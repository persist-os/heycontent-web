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
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import type { WidgetConfig } from '@/types/projectWidgets'
import type { WidgetOutput } from './types'
import { WidgetHeader } from './components/WidgetHeader'
import { WidgetOutputCard } from './components/WidgetOutputCard'
import { WidgetAttachmentPanel } from './components/WidgetAttachmentPanel'
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
          <span className="text-muted-foreground">Loading widget...</span>
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
      <div className="max-w-[1600px] mx-auto px-8 py-12" style={{ marginLeft: '120px' }}>
        {/* Widget Metadata Bar */}
        <div className="flex items-start gap-12 pb-12 mb-12 border-b border-border/30">
          <div className="flex-1 grid grid-cols-3 gap-8">
            <div>
              <span className="text-sm text-muted-foreground">Status</span>
              <p className="text-lg font-light text-foreground mt-1 capitalize">{status}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Last Run</span>
              <p className="text-lg font-light text-foreground mt-1">{lastRun}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Outputs</span>
              <p className="text-lg font-light text-foreground mt-1">{totalOutputs}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-16">
          {/* Left Column - Outputs (Wider) */}
          <div className="xl:col-span-3 space-y-8">
            <div className="flex items-baseline gap-6">
              <h2 className="text-3xl font-light tracking-tight text-foreground">
                Outputs
              </h2>
              <span className="text-sm text-muted-foreground">
                {totalOutputs} total
              </span>
            </div>

            <div className="space-y-4">
              {!outputs || outputs.length === 0 ? (
                <div className="border border-dashed border-border/50 rounded p-16 text-center">
                  <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                    Run this widget to generate your first output
                  </p>
                  <Button
                    onClick={handleRunWidget}
                    disabled={isRunning}
                    variant="outline"
                    className="hover:bg-muted/50 transition-colors duration-300"
                  >
                    Run Widget Now
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
                        Load More
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
        <WidgetAttachmentPanel
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
