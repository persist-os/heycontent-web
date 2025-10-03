/**
 * WIDGET DASHBOARD PAGE
 * 
 * A magical space where widget insights come to life.
 * Displays crystals, shards, conversations, notes, and outputs in a delightful, non-overwhelming way.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Id } from '@/convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import { useWidgetData } from './hooks/useWidgetData'
import { WidgetSummaryHeader } from './components/WidgetSummaryHeader'
import { CrystalShowcase } from './components/CrystalShowcase'
import { ShardCollection } from './components/ShardCollection'
import { ConversationThreads } from './components/ConversationThreads'
import { OutputsGallery } from './components/OutputsGallery'
import { NotesCollection } from './components/NotesCollection'
import { launchThinkingLabWithOutput, launchThinkingLabWithNote } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'
import type { WidgetOutput } from './types'

export default function WidgetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as Id<"projects">
  const widgetId = params.widgetId as string

  const [userId, setUserId] = useState<string | null>(null)
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

  // Fetch all widget data
  const {
    widget,
    outputs,
    crystals,
    shards,
    conversations,
    notes,
    isLoading
  } = useWidgetData({ userId, projectId, widgetId })

  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      await executeWidget({
        widgetId: widget.widget_id,
        projectId
      })
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
  }

  const handleLaunchThinkingLab = (output: WidgetOutput) => {
    launchThinkingLabWithOutput(router, output)
  }

  const handleNoteClick = (noteId: string) => {
    launchThinkingLabWithNote(router, noteId)
  }

  if (isLoading || !widget) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading widget...</span>
        </div>
      </div>
    )
  }

  const stats = {
    outputs: outputs.length,
    crystals: crystals.length,
    shards: shards.length,
    conversations: conversations.length,
    notes: notes.length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Clean header with essential info */}
      <WidgetSummaryHeader
        widget={widget}
        projectId={projectId}
        isRunning={isRunning}
        onRunWidget={handleRunWidget}
        stats={stats}
      />

      {/* Main content - Two column layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Insights (Crystals, Shards, Conversations) */}
          <div className="space-y-8">
            <CrystalShowcase crystals={crystals} />
            <ShardCollection shards={shards} />
            <ConversationThreads conversations={conversations} />
          </div>

          {/* Right Column: Outputs and Notes */}
          <div className="space-y-8">
            <OutputsGallery
              outputs={outputs}
              onLaunchLab={handleLaunchThinkingLab}
            />
            <NotesCollection
              notes={notes}
              onNoteClick={handleNoteClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
