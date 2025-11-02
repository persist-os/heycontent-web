/**
 * UNIFIED WIDGET PAGE
 * 
 * Combines artifact display + metadata + connected content into one optimal page.
 * Design: Artifacts-first with contextual depth.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft,
  Settings,
  Play,
  Loader2,
  FileStack,
  Activity,
  Clock,
  AlertCircle,
  FileText,
  List,
  Lightbulb,
  BarChart3,
  Activity as ActivityIcon,
  Clock as ClockIcon,
  MessageSquare,
  Sparkles,
  Layers,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { MetadataCard } from '@/components/widgets/MetadataCard'
import { ArtifactDisplayCard } from '@/components/widgets/ArtifactDisplayCard'
import { WidgetSettingsDialog } from './components/WidgetSettingsDialog'
import { ContentAttachmentPanel } from './components/ContentAttachmentPanel'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import { Artifact } from '@/types/artifacts'
import { formatDistanceToNow } from 'date-fns'

// Artifact type visuals
const ARTIFACT_VISUALS = {
  structured_list: { icon: List, color: 'text-blue-500', label: 'List' },
  report: { icon: FileText, color: 'text-purple-500', label: 'Report' },
  analysis: { icon: Lightbulb, color: 'text-amber-500', label: 'Analysis' },
  summary: { icon: BarChart3, color: 'text-green-500', label: 'Summary' },
  tracker: { icon: ActivityIcon, color: 'text-orange-500', label: 'Tracker' },
  timeline: { icon: ClockIcon, color: 'text-indigo-500', label: 'Timeline' }
}

function getArtifactVisuals(type: string) {
  return ARTIFACT_VISUALS[type as keyof typeof ARTIFACT_VISUALS] || {
    icon: FileText,
    color: 'text-muted-foreground',
    label: type
  }
}

export default function UnifiedWidgetPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as Id<"projects">
  const widgetId = params.widgetId as Id<"widgets">

  const [userId, setUserId] = useState<string | null>(null)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
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

  // Query widget configuration
  const widget = useQuery(
    api.widgetsQueries.getWidget,
    userId && widgetId ? { widgetId, userId } : 'skip'
  )

  // Query widget outputs (which contain artifacts)
  const outputs = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    userId && widgetId ? {
      userId,
      filters: { widgetId },
      limit: 10,
      orderBy: 'desc'
    } : 'skip'
  ) as any[] | undefined

  // Query connected content
  const connectedNotes = useQuery(
    api.noteQueries.getNotesByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  )

  const connectedConversations = useQuery(
    api.chatQueries.getConversationsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  )

  const connectedCrystals = useQuery(
    api.crystalQueries.getCrystalsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  )

  const connectedShards = useQuery(
    api.shardQueries.getShardsByWidgetId,
    userId && widgetId ? { widgetId, userId } : 'skip'
  )

  // Handle widget execution
  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      await executeWidget({
        widgetId,
        projectId
      })
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
  }

  // Handle settings dialog
  const handleOpenSettings = () => {
    setShowSettingsDialog(true)
  }

  // Handle attach content
  const handleAttachContent = () => {
    setShowAttachmentPanel(true)
  }

  // Extract artifacts from latest output
  const latestOutput = outputs?.[0]
  const artifacts: Artifact[] = []

  if (latestOutput?.artifactData) {
    if (Array.isArray(latestOutput.artifactData)) {
      artifacts.push(...latestOutput.artifactData)
    } else {
      artifacts.push({
        type: latestOutput.artifactType || 'unknown',
        schema: latestOutput.artifactSchema || {},
        data: latestOutput.artifactData || {},
        metadata: {
          version: 1,
          lastUpdatedBy: 'system',
          lastUpdatedAt: (latestOutput as any).createdAt || Date.now()
        }
      })
    }
  }

  // Calculate metadata
  const widgetData = widget as any
  const status = widgetData?.lastRunStatus || 'idle'
  const lastRun = widgetData?.lastRunAt 
    ? formatDistanceToNow(new Date(widgetData.lastRunAt), { addSuffix: true })
    : 'Never'
  const artifactCount = artifacts.length

  // Extract attached content IDs
  const attachedNoteIds = connectedNotes?.map((n: any) => n._id) || []
  const attachedConversationIds = connectedConversations?.map((c: any) => c._id) || []
  const attachedCrystalIds = connectedCrystals?.map((cr: any) => cr.crystal_id || cr._id) || []
  const attachedShardIds = connectedShards?.map((s: any) => s._id) || []

  // Loading state
  if (!userId || widget === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-8 space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border/30 shadow-sm">
        <div className="max-w-7xl mx-auto p-8">
          <div className="flex items-start justify-between gap-8">
            {/* Left: Title & Description */}
            <div className="flex-1 space-y-4">
              <Link href={`/dashboard/living-projects/${projectId}`}>
                <Button variant="ghost" size="sm" className="gap-2 -ml-2 mb-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Project
                </Button>
              </Link>
              
              <div>
                <h1 className="text-4xl font-light tracking-tight text-foreground">
                  {widget.title}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-3xl">
                  {widget.description}
                </p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 pt-8">
              <Button
                onClick={handleRunWidget}
                disabled={isRunning}
                className="gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Widget
                  </>
                )}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={handleOpenSettings}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* METADATA BAR */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetadataCard
            label="Status"
            value={status}
            icon={Activity}
          />
          <MetadataCard
            label="Last Run"
            value={lastRun}
            icon={Clock}
          />
          <MetadataCard
            label="Artifacts"
            value={artifactCount}
            icon={FileStack}
            variant="accent"
          />
        </div>
      </div>

      {/* MAIN CONTENT: 70/30 SPLIT */}
      <div className="max-w-7xl mx-auto px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">
          {/* LEFT: ARTIFACTS (Primary - 70%) */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <FileStack className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-2xl font-semibold text-foreground">
                Widget Artifacts
              </h2>
            </div>

            {artifacts.length === 0 ? (
              /* Empty State */
              <Card className="bg-card/30 border-dashed border-border/40">
                <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <AlertCircle className="h-16 w-16 text-muted-foreground/50 mb-6" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No Artifacts Yet
                  </h3>
                  <p className="text-muted-foreground max-w-sm mb-6">
                    Execute this widget to generate artifacts. Artifacts are structured outputs that can be displayed, edited, and shared.
                  </p>
                  <Button onClick={handleRunWidget} disabled={isRunning}>
                    {isRunning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Execute Widget
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : artifacts.length === 1 ? (
              /* Single Artifact */
              <ArtifactDisplayCard
                artifact={artifacts[0]}
                editable={true}
                widgetTitle={widget.title}
              />
            ) : (
              /* Multiple Artifacts - Tabs */
              <Tabs defaultValue={`${artifacts[0].type}-0`} className="w-full">
                <TabsList className="bg-muted/30 p-1 rounded-lg grid gap-1 w-full" style={{ gridTemplateColumns: `repeat(${artifacts.length}, 1fr)` }}>
                  {artifacts.map((artifact, index) => {
                    const visuals = getArtifactVisuals(artifact.type)
                    const Icon = visuals.icon
                    const tabValue = `${artifact.type}-${index}`

                    return (
                      <TabsTrigger
                        key={tabValue}
                        value={tabValue}
                        className="gap-2 transition-all duration-200"
                      >
                        <Icon className={`h-4 w-4 ${visuals.color}`} />
                        {visuals.label}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>

                {artifacts.map((artifact, index) => {
                  const tabValue = `${artifact.type}-${index}`
                  return (
                    <TabsContent 
                      key={tabValue} 
                      value={tabValue}
                      className="animate-in fade-in-50 slide-in-from-bottom-2 duration-200 mt-6"
                    >
                      <ArtifactDisplayCard
                        artifact={artifact}
                        editable={true}
                        widgetTitle={widget.title}
                      />
                    </TabsContent>
                  )
                })}
              </Tabs>
            )}
          </div>

          {/* RIGHT: SIDEBAR (Secondary - 30%) */}
          <div className="space-y-6">
            {/* Connected Content */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/40 hover:bg-card/80 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Connected Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notes */}
                {connectedNotes && connectedNotes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Notes</span>
                      <span className="text-xs text-muted-foreground">{connectedNotes.length}</span>
                    </div>
                    <div className="space-y-1">
                      {connectedNotes.slice(0, 3).map((note: any) => (
                        <button
                          key={note._id}
                          onClick={() => router.push(`/dashboard/thinking_lab?noteId=${note._id}`)}
                          className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded px-2 py-1 truncate"
                        >
                          <FileText className="h-3 w-3 inline mr-2" />
                          {note.title || 'Untitled Note'}
                        </button>
                      ))}
                      {connectedNotes.length > 3 && (
                        <button className="text-xs text-primary hover:text-primary/80 w-full text-left px-2 py-1">
                          + View all ({connectedNotes.length - 3} more)
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversations */}
                {connectedConversations && connectedConversations.length > 0 && (
                  <>
                    <div className="border-t border-border/30 my-4" />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Conversations</span>
                        <span className="text-xs text-muted-foreground">{connectedConversations.length}</span>
                      </div>
                      <div className="space-y-1">
                        {connectedConversations.slice(0, 3).map((conv: any) => (
                          <button
                            key={conv._id}
                            onClick={() => router.push(`/dashboard/thinking_lab?conversationId=${conv._id}`)}
                            className="w-full text-left text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors rounded px-2 py-1 truncate"
                          >
                            <MessageSquare className="h-3 w-3 inline mr-2" />
                            {conv.title || 'Untitled Conversation'}
                          </button>
                        ))}
                        {connectedConversations.length > 3 && (
                          <button className="text-xs text-primary hover:text-primary/80 w-full text-left px-2 py-1">
                            + View all ({connectedConversations.length - 3} more)
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Crystals & Shards */}
                {((connectedCrystals && connectedCrystals.length > 0) || 
                  (connectedShards && connectedShards.length > 0)) && (
                  <>
                    <div className="border-t border-border/30 my-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {connectedCrystals && connectedCrystals.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Crystals</span>
                          <p className="text-lg font-light text-foreground">{connectedCrystals.length}</p>
                        </div>
                      )}
                      {connectedShards && connectedShards.length > 0 && (
                        <div>
                          <span className="text-xs text-muted-foreground">Shards</span>
                          <p className="text-lg font-light text-foreground">{connectedShards.length}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Empty State */}
                {(!connectedNotes || connectedNotes.length === 0) &&
                 (!connectedConversations || connectedConversations.length === 0) &&
                 (!connectedCrystals || connectedCrystals.length === 0) &&
                 (!connectedShards || connectedShards.length === 0) && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      No connected content yet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 justify-start"
                  onClick={() => router.push(`/dashboard/thinking_lab?widgetId=${widgetId}&projectId=${projectId}`)}
                >
                  <Sparkles className="h-4 w-4" />
                  Open in Thinking Lab
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 justify-start"
                  onClick={handleAttachContent}
                >
                  <Plus className="h-4 w-4" />
                  Attach Content
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      {widget && userId && (
        <WidgetSettingsDialog
          widget={widget}
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          projectId={projectId}
          userId={userId}
        />
      )}

      {/* Attachment Panel */}
      {userId && (
        <ContentAttachmentPanel
          widgetId={widgetId}
          projectId={projectId}
          userId={userId}
          isOpen={showAttachmentPanel}
          onClose={() => setShowAttachmentPanel(false)}
          attachedNoteIds={attachedNoteIds}
          attachedConversationIds={attachedConversationIds}
          attachedCrystalIds={attachedCrystalIds}
          attachedShardIds={attachedShardIds}
        />
      )}
    </div>
  )
}
