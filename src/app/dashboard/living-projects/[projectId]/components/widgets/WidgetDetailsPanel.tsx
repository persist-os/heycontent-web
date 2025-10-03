/**
 * WIDGET DETAILS PANEL COMPONENT
 * 
 * Side panel for displaying detailed widget information with
 * actions and metadata.
 */

'use client'

import React, { useEffect, useState } from 'react'
import { X, Layers, Palette, Clock, Activity, Target, Calendar, Lightbulb, FileText, ExternalLink, Maximize2, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WidgetConfig } from '@/types/projectWidgets'
import { getWidgetThemeClasses } from '../utils/widgetStyling'
import { useRouter } from 'next/navigation'
import { api } from '@/convex/_generated/api'
import { useQuery } from 'convex/react'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import { launchThinkingLabWithOutput } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'

interface WidgetDetailsPanelProps {
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
  projectId: string
}

/**
 * Widget details panel component for displaying comprehensive widget information
 */
export function WidgetDetailsPanel({ 
  widget, 
  isOpen, 
  onClose,
  projectId
}: WidgetDetailsPanelProps) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const { executeWidget, isRunning } = useWidgetRunner()

  // Get user ID on mount
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
  
  // Fetch latest widget output
  const latestOutput = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    widget && userId ? {
      userId,
      filters: { widgetId: widget.widget_id },
      limit: 1,
      orderBy: 'desc'
    } : 'skip'
  )

  if (!isOpen || !widget) return null

  // When limit: 1, the query returns a single object, not an array
  const output = latestOutput && typeof latestOutput === 'object' && '_id' in latestOutput
    ? latestOutput 
    : null

  // Debug logging
  console.log('[WidgetDetailsPanel] Widget:', widget.widget_id, widget.title)
  console.log('[WidgetDetailsPanel] Latest output raw:', latestOutput)
  console.log('[WidgetDetailsPanel] Parsed output:', output)
  console.log('[WidgetDetailsPanel] Has noteId:', output?.noteId)
  console.log('[WidgetDetailsPanel] Has prompts:', output?.prompts?.length || 0)

  const handleLaunchThinkingLab = () => {
    if (output?.noteId) {
      launchThinkingLabWithOutput(router, output)
    }
  }

  const handleOpenFullDashboard = () => {
    router.push(`/dashboard/living-projects/${projectId}/widgets/${widget.widget_id}`)
  }

  const handleRunWidget = async () => {
    if (!widget) return
    
    try {
      await executeWidget({
        widgetId: widget.widget_id,
        projectId
      })
      // Output will appear automatically via the query
    } catch (error) {
      console.error('Failed to run widget:', error)
    }
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

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl z-30 transform transition-transform duration-300 ease-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getWidgetThemeClasses(widget.theme).includes('orange') ? 'bg-orange-400' : getWidgetThemeClasses(widget.theme).includes('blue') ? 'bg-blue-400' : getWidgetThemeClasses(widget.theme).includes('purple') ? 'bg-purple-400' : 'bg-slate-400'}`} />
            <h2 className="text-lg font-semibold text-foreground">{widget.title}</h2>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed">{widget.description}</p>
          </div>

          {/* Widget Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
              <Badge variant="outline" className="text-xs">
                {widget.widget_type}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <Badge variant="outline" className="text-xs">
                {widget.category}
              </Badge>
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
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
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
                  {getPriorityLabel(widget.priority)}
                </span>
                <span className="text-xs text-muted-foreground">({widget.priority}/10)</span>
              </div>
            </div>
          </div>

          {/* Size & Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Size</h3>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.size}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Theme</h3>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.theme}</span>
              </div>
            </div>
          </div>

          {/* Update Frequency */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Frequency</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
            </div>
          </div>

          {/* Widget ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Widget ID</h3>
            <div className="bg-muted/30 rounded-md p-3">
              <code className="text-xs text-muted-foreground font-mono break-all">
                {widget.widget_id}
              </code>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-border/30 space-y-2">
            <Button 
              onClick={handleRunWidget}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
            
            <Button 
              onClick={handleOpenFullDashboard}
              variant="outline"
              className="w-full"
            >
              <Maximize2 className="w-4 h-4 mr-2" />
              Open Full Dashboard
            </Button>
          </div>

          {/* Latest Output - Always visible */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Latest Output
            </h3>
            
            {output ? (
              <>
                {/* Launch Thinking Lab Button */}
                {output.noteId && (
                  <Button 
                    onClick={handleLaunchThinkingLab}
                    className="w-full mb-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Launch Thinking Lab
                  </Button>
                )}

                {/* Output Details */}
                <div className="space-y-3 mb-4">
                  <div className="bg-muted/30 rounded-md p-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">Output ID</div>
                    <code className="text-xs text-foreground font-mono break-all">
                      {output.outputId || output._id}
                    </code>
                  </div>
                  
                  {output.noteId && (
                    <div className="bg-muted/30 rounded-md p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Note ID</div>
                      <code className="text-xs text-foreground font-mono break-all">
                        {output.noteId}
                      </code>
                    </div>
                  )}
                </div>

                {/* Conversation Prompts */}
                {output.prompts && output.prompts.length > 0 ? (
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" />
                      Conversation Starters ({output.prompts.length})
                    </h4>
                    <div className="space-y-2">
                      {output.prompts.slice(0, 3).map((prompt: any, idx: number) => (
                        <div 
                          key={idx}
                          className="bg-muted/30 rounded-md p-2 text-xs text-foreground/80 hover:bg-muted/50 transition-colors cursor-default"
                        >
                          {prompt.text}
                        </div>
                      ))}
                      {output.prompts.length > 3 && (
                        <div className="text-xs text-muted-foreground/60 text-center">
                          +{output.prompts.length - 3} more prompts
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 text-xs text-muted-foreground/60">
                    No conversation prompts generated
                  </div>
                )}

                {/* Output Timestamp */}
                <div className="text-xs text-muted-foreground/60">
                  Generated {new Date(output.createdAt).toLocaleDateString()} at {new Date(output.createdAt).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground/60">
                  {latestOutput === undefined ? 'Loading output data...' : 'No output generated yet. Run this widget to create output.'}
                </div>
                {latestOutput === undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-muted-foreground/50">Fetching latest results...</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                View Activity
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/30">
          <div className="text-xs text-muted-foreground/60 text-center">
            Widget created by AI • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}
