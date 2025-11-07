/**
 * Widget Panel Component
 * 
 * Displays project widget families in a scrollable panel.
 * Uses direct Convex query following convex-frontend-data-display.md pattern.
 * 
 * CRITICAL: Uses api.widgetsQueries.getProjectWidgets (correct query)
 * PATTERN: Copied from ArtifactPanel.tsx structure
 */

'use client'

import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface WidgetPanelProps {
  projectId?: string
  conversationId?: string
  userId: string
  className?: string
}

/**
 * Widget Panel - Clean separation from LabCompositions
 * 
 * Queries widgets table and renders with progressive disclosure.
 * Handles loading, empty, and error states.
 * 
 * CRITICAL: Every widget is tied to one conversation and one project.
 * If projectId is not provided, gets it from conversation.
 * userId is always required for security.
 */
export const WidgetPanel: React.FC<WidgetPanelProps> = ({ 
  projectId, 
  conversationId,
  userId,
  className = '' 
}) => {
  // Get conversation to extract projectId if not provided
  const conversation = useQuery(
    api.chatQueries.getConversation,
    (!projectId && conversationId) ? {
      userId,
      conversationId: conversationId as Id<"conversations">
    } : "skip"
  )
  
  // Determine the actual projectId to use (from prop or conversation)
  const effectiveProjectId = projectId || (conversation?.projectId as string | undefined)
  
  // Query widgets from widgets table
  // CRITICAL: userId is always required for security
  // CRITICAL: Query in component (NOT in store) - follows convex-frontend-data-display.md
  
    // Direct Convex query for widgets (families)
  const widgets = useQuery(api.widgetsQueries.getProjectWidgets, {
    projectId: effectiveProjectId as any,
    userId
  })
  
  // Navigation state for showing one widget at a time
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Collapsible state for progressive disclosure
  const [agentTeamOpen, setAgentTeamOpen] = useState(false)
  const [collaborationOpen, setCollaborationOpen] = useState(false)

  // Loading state - waiting for conversation or widgets
  const isLoadingConversation = !projectId && conversationId && conversation === undefined
  const isLoadingWidgets = effectiveProjectId && widgets === undefined

  if (isLoadingConversation || isLoadingWidgets) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm">Loading widgets...</p>
        </div>
      </div>
    )
  }

  // Empty state - no widgets yet
  if (!widgets || widgets.length === 0) {
    return (
      <div className={`h-full flex items-center justify-center p-6 ${className}`}>
        <div className="text-center text-muted-foreground">
          <p className="text-lg">No widgets yet</p>
          <p className="text-sm mt-2">Widgets will appear here as you work with your project</p>
          {effectiveProjectId && (
            <p className="text-xs mt-4 opacity-60">
              Project ID: {effectiveProjectId}
            </p>
          )}
        </div>
      </div>
    )
  }
  
  // Current widget being displayed
  const currentWidget = widgets[currentIndex]
  const hasNext = currentIndex < widgets.length - 1
  const hasPrev = currentIndex > 0
  
  // Navigation handlers
  const goNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1)
      // Reset collapsible state when navigating
      setAgentTeamOpen(false)
      setCollaborationOpen(false)
    }
  }
  
  const goPrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1)
      // Reset collapsible state when navigating
      setAgentTeamOpen(false)
      setCollaborationOpen(false)
    }
  }
  
  // Status badge helper
  const getStatusBadge = (widget: any) => {
    if (widget.lastRunStatus === 'running') {
      return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0">🔵 Active</Badge>
    }
    if (widget.lastRunStatus === 'completed') {
      return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-0">✅ Done</Badge>
    }
    if (widget.lastRunStatus === 'error') {
      return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-0">❌ Error</Badge>
    }
    return <Badge className="bg-muted/20 text-muted-foreground border-0">⚪ Resting</Badge>
  }

  // Display widgets with progressive disclosure
  return (
    <TooltipProvider>
      <div className={`h-full overflow-y-auto p-4 bg-background ${className}`}>
        <div className="space-y-4">
          {/* Header - Always visible */}
          <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <h2 className="text-2xl font-bold text-foreground">
                    {currentWidget.familyIdentity?.familyName || currentWidget.title}
                  </h2>
                </div>
                {getStatusBadge(currentWidget)}
              </div>
              
              <p className="text-muted-foreground text-lg mb-4">
                {currentWidget.familyIdentity?.mission || currentWidget.description || 'Helps you manage your project'}
              </p>
            </div>
          </Card>
          
          {/* Agent Team - Collapsible */}
          {currentWidget.agentRoster && currentWidget.agentRoster.length > 0 && (
            <Collapsible open={agentTeamOpen} onOpenChange={setAgentTeamOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  {agentTeamOpen ? "▲ Hide team" : `▼ Agent Team (${currentWidget.agentRoster.length} helpers)`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Agent Team
                      {' '}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-blue-500 cursor-help text-sm">ℹ️</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A helper is like a team member that handles one specific task.</p>
                          <p>They work together to get things done.</p>
                        </TooltipContent>
                      </Tooltip>
                    </h3>
                    
                    <div className="space-y-3">
                      {currentWidget.agentRoster.map((agent: any, idx: number) => (
                        <div key={idx} className="bg-purple-500/10 border-l-4 border-purple-500 p-4 rounded">
                          <p className="font-semibold text-foreground">
                            {idx + 1}. {agent.roleName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            → {agent.responsibilities?.[0] || agent.personality}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {agent.spawnCondition === 'Always active' 
                              ? 'Always working' 
                              : `Starts ${agent.spawnCondition?.toLowerCase() || 'when needed'}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Collaboration Style - Collapsible */}
          {currentWidget.familyIdentity?.collaborationStyle && (
            <Collapsible open={collaborationOpen} onOpenChange={setCollaborationOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  {collaborationOpen ? "▲ Hide details" : "▼ How They Work Together"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      How They Work Together
                    </h3>
                    
                    <div className="bg-muted/20 border border-border/30 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Collaboration Style:</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {currentWidget.familyIdentity.collaborationStyle}
                      </p>
                    </div>
                    
                    {currentWidget.familyIdentity.qualityStandard && (
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-foreground mb-2">Quality Standard:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {currentWidget.familyIdentity.qualityStandard}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border/20">
            <Button
              variant="ghost"
              onClick={goPrev}
              disabled={!hasPrev}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              ← Previous
            </Button>
            
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {widgets.length}
            </span>
            
            <Button
              variant="ghost"
              onClick={goNext}
              disabled={!hasNext}
              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              Next →
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

