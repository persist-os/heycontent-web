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
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, FileText, Play } from 'lucide-react'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import type { WidgetConfig } from '@/types/projectWidgets'
import type { WidgetOutput, ConnectedNote } from './types'
import { WidgetHeader } from './components/WidgetHeader'
import { WidgetStatusCard } from './components/WidgetStatusCard'
import { WidgetPropertiesCard } from './components/WidgetPropertiesCard'
import { ConnectedNotesStats } from './components/ConnectedNotesStats'
import { ConnectedNoteCard } from './components/ConnectedNoteCard'
import { WidgetOutputCard } from './components/WidgetOutputCard'

export default function WidgetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as Id<"projects">
  const widgetId = params.widgetId as Id<"widgets">  // ✅ Convex ID type

  const [userId, setUserId] = useState<string | null>(null)
  const [outputLimit, setOutputLimit] = useState(10)
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set())

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

  // Get unique noteIds from outputs
  const noteIds = outputs 
    ? [...new Set(outputs.map(output => output.noteId).filter(Boolean))]
    : []

  // Fetch individual notes using useQuery for each noteId
  // This follows the Convex pattern of using hooks directly in components
  const note1 = useQuery(
    api.noteQueries.getNote,
    noteIds[0] && userId ? { noteId: noteIds[0], userId } : 'skip'
  )
  const note2 = useQuery(
    api.noteQueries.getNote,
    noteIds[1] && userId ? { noteId: noteIds[1], userId } : 'skip'
  )
  const note3 = useQuery(
    api.noteQueries.getNote,
    noteIds[2] && userId ? { noteId: noteIds[2], userId } : 'skip'
  )
  const note4 = useQuery(
    api.noteQueries.getNote,
    noteIds[3] && userId ? { noteId: noteIds[3], userId } : 'skip'
  )
  const note5 = useQuery(
    api.noteQueries.getNote,
    noteIds[4] && userId ? { noteId: noteIds[4], userId } : 'skip'
  )

  // Combine all fetched notes into a single array
  const connectedNotes = [note1, note2, note3, note4, note5]
    .filter(note => note !== null && note !== undefined) as ConnectedNote[]

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
    const { launchThinkingLabWithOutput } = require('@/app/dashboard/living-projects/utils/thinkingLabLauncher')
    launchThinkingLabWithOutput(router, output, projectId, widgetId)
  }

  const handleNoteClick = (noteId: string) => {
    router.push(`/dashboard/thinking_lab?noteId=${noteId}`)
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
  const totalNotes = connectedNotes?.length || 0
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Metadata & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <ConnectedNotesStats totalNotes={totalNotes} />
            <WidgetStatusCard 
              status={status}
              lastRun={lastRun}
              totalOutputs={totalOutputs}
            />
            <WidgetPropertiesCard widget={widget} />
          </div>

          {/* Right Column: Notes & Outputs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Connected Notes Section */}
            {totalNotes > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-light text-foreground">
                    Connected Notes
                    <span className="text-muted-foreground ml-3 text-lg">
                      ({totalNotes})
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {connectedNotes?.map((note) => (
                    <ConnectedNoteCard
                      key={note._id}
                      note={note}
                      onNoteClick={handleNoteClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Widget Outputs Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-light text-foreground">
                  Widget Outputs
                  <span className="text-muted-foreground ml-3 text-lg">
                    ({totalOutputs})
                  </span>
                </h2>
              </div>

              <div className="space-y-4">
                {!outputs || outputs.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No Outputs Yet
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Run this widget to generate your first output
                      </p>
                      <Button
                        onClick={handleRunWidget}
                        disabled={isRunning}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Run Widget Now
                      </Button>
                    </CardContent>
                  </Card>
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

                    {/* Load More Button */}
                    {outputs && outputs.length >= outputLimit && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setOutputLimit(prev => prev + 10)}
                        >
                          Load More Outputs
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
