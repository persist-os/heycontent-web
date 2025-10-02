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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  ArrowLeft, 
  Play, 
  Loader2, 
  ExternalLink, 
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Calendar,
  Hash,
  FileText,
  Activity,
  Clock,
  Zap,
  Target,
  Layers,
  Palette
} from 'lucide-react'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import type { WidgetConfig } from '@/types/projectWidgets'

interface WidgetOutput {
  _id: string
  outputId: string
  widgetId: string
  projectId: string
  userId: string
  noteId: string
  prompts: Array<{
    text: string
    priority: number
  }>
  createdAt: number
}

export default function WidgetDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as Id<"projects">
  const widgetId = params.widgetId as string

  const [userId, setUserId] = useState<string | null>(null)
  const [widget, setWidget] = useState<any | null>(null) // Using any to support extended widget fields from schema
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

  // Fetch project widgets to get widget data
  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    userId && projectId ? { userId, projectId } : 'skip'
  )

  // Extract the specific widget
  useEffect(() => {
    if (projectWidgets?.widgets) {
      const foundWidget = projectWidgets.widgets.find(
        (w: WidgetConfig) => w.widget_id === widgetId
      )
      setWidget(foundWidget || null)
    }
  }, [projectWidgets, widgetId])

  // Fetch outputs for this widget
  const outputs = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    userId && widgetId ? {
      userId,
      filters: { widgetId },
      limit: outputLimit,
      orderBy: 'desc'
    } : 'skip'
  ) as WidgetOutput[] | undefined

  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      const result = await executeWidget({
        widgetId: widget.widget_id,
        projectId
      })
      
      if (result?.note_id) {
        // Optionally navigate to the thinking lab
        // router.push(`/dashboard/thinking_lab?noteId=${result.note_id}&widgetOutputId=${result.output_id}`)
      }
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
  }

  const handleLaunchThinkingLab = (output: WidgetOutput) => {
    router.push(`/dashboard/thinking_lab?noteId=${output.noteId}&widgetOutputId=${output.outputId}`)
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 dark:text-red-400'
    if (priority >= 6) return 'text-orange-600 dark:text-orange-400'
    if (priority >= 4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'Critical'
    if (priority >= 6) return 'High'
    if (priority >= 4) return 'Medium'
    return 'Low'
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
  const widgetData = widget as any // Extended widget data from schema
  const lastRun = widgetData.lastRunAt ? new Date(widgetData.lastRunAt).toLocaleString() : 'Never'
  const status = widgetData.lastRunStatus || 'idle'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                onClick={handleRunWidget}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Metadata & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status Card */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current State</span>
                    <Badge variant={status === 'success' ? 'default' : 'outline'}>
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Run</span>
                    <span className="text-sm text-foreground">{lastRun}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Outputs</span>
                    <span className="text-sm font-medium text-foreground">{totalOutputs}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Properties Card */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Properties</h3>
                
                <div className="space-y-3">
                  {/* Priority */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
                        {getPriorityLabel(widget.priority)} ({widget.priority}/10)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          widget.priority >= 8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                          widget.priority >= 6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                          widget.priority >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                          'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                        style={{ width: `${(widget.priority / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Badge variant="outline" className="text-xs">{widget.category}</Badge>
                  </div>

                  {/* Size */}
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Size:</span>
                    <span className="text-sm text-foreground capitalize">{widget.size}</span>
                  </div>

                  {/* Theme */}
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Theme:</span>
                    <span className="text-sm text-foreground capitalize">{widget.theme}</span>
                  </div>

                  {/* Update Frequency */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Updates:</span>
                    <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Widget ID */}
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Widget ID</h3>
                <div className="bg-muted/30 rounded p-3 break-all">
                  <code className="text-xs text-muted-foreground font-mono">
                    {widget.widget_id}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Outputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-light text-foreground">
                Widget Outputs
                <span className="text-muted-foreground ml-3 text-lg">
                  ({totalOutputs})
                </span>
              </h2>
            </div>

            {/* Outputs List */}
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
                  {outputs.map((output) => {
                    const isExpanded = expandedOutputs.has(output.outputId)
                    const createdDate = new Date(output.createdAt)
                    
                    return (
                      <Card key={output.outputId} className="border-border/50 overflow-hidden">
                        <CardContent className="p-0">
                          {/* Output Header */}
                          <div className="p-6 border-b border-border/30">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-foreground">
                                    {createdDate.toLocaleDateString()} at {createdDate.toLocaleTimeString()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4" />
                                    <span>{output.prompts?.length || 0} prompts</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4" />
                                    <code className="text-xs font-mono">{output.outputId.slice(0, 8)}</code>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleLaunchThinkingLab(output)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Launch Lab
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleOutput(output.outputId)}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Content */}
                          {isExpanded && (
                            <div className="p-6 space-y-4 bg-muted/20">
                              {/* Note ID */}
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Note ID</h4>
                                <div className="bg-muted/30 rounded p-3 break-all">
                                  <code className="text-xs text-foreground font-mono">
                                    {output.noteId}
                                  </code>
                                </div>
                              </div>

                              {/* Conversation Prompts */}
                              {output.prompts && output.prompts.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-medium text-muted-foreground mb-3">
                                    Conversation Starters
                                  </h4>
                                  <div className="space-y-2">
                                    {output.prompts.map((prompt, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-muted/30 rounded p-3 text-sm text-foreground/80"
                                      >
                                        <div className="flex items-start gap-3">
                                          <span className="text-xs text-muted-foreground font-medium mt-0.5">
                                            {idx + 1}.
                                          </span>
                                          <span className="flex-1">{prompt.text}</span>
                                          <Badge variant="outline" className="text-xs">
                                            P{prompt.priority}
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Output ID */}
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Output ID</h4>
                                <div className="bg-muted/30 rounded p-3 break-all">
                                  <code className="text-xs text-muted-foreground font-mono">
                                    {output.outputId}
                                  </code>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}

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
  )
}

