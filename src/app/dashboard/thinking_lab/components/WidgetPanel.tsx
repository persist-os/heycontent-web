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
import { useQuery, useMutation, useAction } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'

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
  // CRITICAL: Skip query if projectId is not available yet
  
    // Direct Convex query for widgets (families)
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    effectiveProjectId ? {
      projectId: effectiveProjectId as any,
      userId
    } : "skip"
  )
  
  // Query assignment fingerprint for the project
  const fingerprint = useQuery(
    api.assignmentFingerprintQueries.getByProject,
    effectiveProjectId ? {
      projectId: effectiveProjectId as any,
      userId
    } : "skip"
  )
  
  // Query cognitive field for the project
  const cognitiveField = useQuery(
    api.cognitiveQueries.queryCognitiveField,
    effectiveProjectId ? {
      userId,
      useIndex: "by_project",
      indexFields: { projectId: effectiveProjectId },
      limit: 1,
      orderBy: "desc"
    } : "skip"
  )
  
  // Navigation state for showing one widget at a time
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Collapsible state for progressive disclosure
  const [agentTeamOpen, setAgentTeamOpen] = useState(false)
  const [collaborationOpen, setCollaborationOpen] = useState(false)
  const [fingerprintOpen, setFingerprintOpen] = useState(false)
  const [cognitiveFieldOpen, setCognitiveFieldOpen] = useState(false)
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  
  // Convex mutations and actions for widget execution
  const createJob = useMutation(api.backgroundJobs.create)
  const enqueueToRedis = useAction(api.backgroundJobs.enqueueToRedis)

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
  
  // Handle widget execution
  const handleRunWidget = async () => {
    if (!currentWidget || !effectiveProjectId) {
      toast.error('Cannot execute widget - missing project context')
      return
    }
    
    setIsExecuting(true)
    try {
      const widgetId = currentWidget._id || currentWidget.widget_id
      
      if (!widgetId) {
        toast.error('Cannot execute widget - missing widget ID')
        return
      }
      
      // Step 1: Create Convex job record
      const jobResult = await createJob({
        userId,
        type: "widget_execution",
        payload: {
          widget_id: widgetId,
          project_id: effectiveProjectId,
          user_id: userId,
          scheduled: false,
          execution_prompt: "Manual trigger from WidgetPanel",
          metadata: { trigger_source: "widget_panel_ui" }
        },
        priority: "normal"
      })
      
      if (!jobResult || !jobResult.jobId) {
        toast.error('Failed to create job record')
        return
      }
      
      // Step 2: Enqueue to Redis via Convex action
      const enqueueResult = await enqueueToRedis({
        jobId: jobResult.jobId,
        jobType: "widget_execution",
        userId,
        payload: {
          widget_id: widgetId,
          project_id: effectiveProjectId,
          user_id: userId,
          scheduled: false,
          execution_prompt: "Manual trigger from WidgetPanel",
          metadata: { trigger_source: "widget_panel_ui" }
        },
        priority: "normal"
      })
      
      if (enqueueResult.success) {
        toast.success('Widget execution started! 🚀')
      } else {
        toast.warning('Job created but Redis enqueue failed - will retry automatically')
      }
      
    } catch (error) {
      console.error('Failed to execute widget:', error)
      toast.error(`Failed to execute widget: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsExecuting(false)
    }
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
                <div className="flex items-center gap-2">
                  {getStatusBadge(currentWidget)}
                  <Button
                    onClick={handleRunWidget}
                    disabled={isExecuting || !effectiveProjectId}
                    variant="default"
                    size="sm"
                    className="ml-2"
                  >
                    {isExecuting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Running...
                      </>
                    ) : (
                      '▶️ Run Widget'
                    )}
                  </Button>
                </div>
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
          
          {/* Assignment Fingerprint - Collapsible */}
          {fingerprint && (
            <Collapsible open={fingerprintOpen} onOpenChange={setFingerprintOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                  {fingerprintOpen ? "▲ Hide fingerprint" : `▼ Assignment Fingerprint ${fingerprint._id ? `(${fingerprint._id.slice(0, 8)}...)` : ''}`}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Assignment Fingerprint
                    </h3>
                    
                    {fingerprint.currentGoals && fingerprint.currentGoals.length > 0 && (
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Current Goals:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {fingerprint.currentGoals.map((goal: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground">{goal}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {fingerprint.currentConstraints && fingerprint.currentConstraints.length > 0 && (
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-foreground mb-2">Current Constraints:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {fingerprint.currentConstraints.map((constraint: string, idx: number) => (
                            <li key={idx} className="text-sm text-foreground">{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {fingerprint.totalInsights !== undefined && (
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                        <p className="text-sm font-medium text-foreground mb-2">Intelligence:</p>
                        <p className="text-sm text-foreground">
                          {fingerprint.totalInsights} total insights
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
          
          {/* Cognitive Field - Collapsible */}
          {cognitiveField && Array.isArray(cognitiveField) && cognitiveField.length > 0 && (() => {
            const field = cognitiveField[0];
            const transparency = field.transparencyLayer;
            const semantic = field.semanticMetadata;
            const crossDomain = field.crossDomainLayer;
            const coreField = field.coreField;
            
            // Helper to format timestamp
            const formatTimestamp = (ts?: number) => {
              if (!ts) return 'Never';
              return new Date(ts).toLocaleString();
            };
            
            // Helper to get status badge
            const getStatusBadge = (status?: string) => {
              if (!status) return null;
              const statusColors: Record<string, string> = {
                active: 'bg-green-500/20 text-green-600 dark:text-green-400',
                evolving: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
                stable: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
                archived: 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
              };
              return (
                <Badge className={`${statusColors[status] || 'bg-muted/20 text-muted-foreground'} border-0`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              );
            };
            
            return (
              <Collapsible open={cognitiveFieldOpen} onOpenChange={setCognitiveFieldOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    {cognitiveFieldOpen ? "▲ Hide cognitive field" : `▼ Cognitive Field ${field?.fieldId ? `(${field.fieldId.slice(0, 8)}...)` : ''}`}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                    <div className="p-6 space-y-4">
                      {/* Header with Status */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Cognitive Field
                        </h3>
                        {getStatusBadge(field.status)}
                      </div>
                      
                      {/* Human-Readable Summary (Transparency Layer) */}
                      {transparency?.interpretiveSummary && (
                        <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">💡 Understanding</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {transparency.interpretiveSummary}
                          </p>
                        </div>
                      )}
                      
                      {/* Human Label */}
                      {transparency?.humanLabel && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-1">Label:</p>
                          <p className="text-sm text-foreground">{transparency.humanLabel}</p>
                        </div>
                      )}
                      
                      {/* Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {field.usageCount !== undefined && (
                          <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Usage Count</p>
                            <p className="text-lg font-semibold text-foreground">{field.usageCount}</p>
                          </div>
                        )}
                        {field.lastUsed && (
                          <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Last Used</p>
                            <p className="text-sm font-semibold text-foreground">{formatTimestamp(field.lastUsed)}</p>
                          </div>
                        )}
                        {transparency?.stabilityScore !== undefined && (
                          <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Stability</p>
                            <p className="text-lg font-semibold text-foreground">
                              {(transparency.stabilityScore * 100).toFixed(0)}%
                            </p>
                          </div>
                        )}
                        {field.createdAt && (
                          <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground mb-1">Created</p>
                            <p className="text-sm font-semibold text-foreground">{formatTimestamp(field.createdAt)}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Abstract Dimensions (Semantic Layer) */}
                      {semantic?.abstractDimensions && semantic.abstractDimensions.length > 0 && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-3">📊 Abstract Dimensions</p>
                          <div className="space-y-2">
                            {semantic.abstractDimensions.map((dim: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-foreground">{dim.dimensionName || `Dimension ${idx + 1}`}</span>
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary rounded-full transition-all"
                                      style={{ width: `${Math.min(100, Math.max(0, (dim.value || 0) * 100))}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-12 text-right">
                                    {(dim.value || 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Meta Inference Summary */}
                      {semantic?.metaInferenceSummary && (
                        <div className="bg-purple-500/10 border-l-4 border-purple-500 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">🧠 Meta Inference</p>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {semantic.metaInferenceSummary}
                          </p>
                        </div>
                      )}
                      
                      {/* Cross-Domain Patterns */}
                      {crossDomain?.crossDomainPatterns && crossDomain.crossDomainPatterns.length > 0 && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-3">🌐 Cross-Domain Patterns</p>
                          <div className="space-y-3">
                            {crossDomain.crossDomainPatterns.map((pattern: any, idx: number) => (
                              <div key={idx} className="bg-background/50 rounded p-3">
                                <p className="text-sm font-semibold text-foreground mb-1">
                                  {pattern.name || `Pattern ${idx + 1}`}
                                </p>
                                {pattern.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{pattern.description}</p>
                                )}
                                {pattern.domains && pattern.domains.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {pattern.domains.map((domain: string, dIdx: number) => (
                                      <Badge key={dIdx} variant="outline" className="text-xs">
                                        {domain}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {pattern.noveltyScore !== undefined && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Novelty: {(pattern.noveltyScore * 100).toFixed(0)}%
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Emergent Themes */}
                      {crossDomain?.emergentThemes && crossDomain.emergentThemes.length > 0 && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-3">✨ Emergent Themes</p>
                          <div className="flex flex-wrap gap-2">
                            {crossDomain.emergentThemes.map((theme: string, idx: number) => (
                              <Badge key={idx} className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-0">
                                {theme}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Temporal Drift */}
                      {crossDomain?.temporalDrift && (
                        <div className="bg-orange-500/10 border-l-4 border-orange-500 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">⏰ Temporal Drift</p>
                          {crossDomain.temporalDrift.direction && (
                            <p className="text-sm text-foreground mb-2">
                              <span className="font-semibold">Direction:</span> {crossDomain.temporalDrift.direction}
                            </p>
                          )}
                          {crossDomain.temporalDrift.description && (
                            <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                              {crossDomain.temporalDrift.description}
                            </p>
                          )}
                          {crossDomain.temporalDrift.keyChanges && crossDomain.temporalDrift.keyChanges.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-foreground mb-1">Key Changes:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {crossDomain.temporalDrift.keyChanges.map((change: string, idx: number) => (
                                  <li key={idx} className="text-xs text-foreground">{change}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Source Tracking */}
                      {((field.sourceShardIds && field.sourceShardIds.length > 0) || 
                       (field.sourceStardustIds && field.sourceStardustIds.length > 0)) && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">🔗 Sources</p>
                          {field.sourceShardIds && field.sourceShardIds.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs text-muted-foreground mb-1">Shards ({field.sourceShardIds.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {field.sourceShardIds.slice(0, 3).map((id: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs font-mono">
                                    {id.slice(0, 8)}...
                                  </Badge>
                                ))}
                                {field.sourceShardIds.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{field.sourceShardIds.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {field.sourceStardustIds && field.sourceStardustIds.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Stardust ({field.sourceStardustIds.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {field.sourceStardustIds.slice(0, 3).map((id: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs font-mono">
                                    {id.slice(0, 8)}...
                                  </Badge>
                                ))}
                                {field.sourceStardustIds.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{field.sourceStardustIds.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Field ID (Technical) */}
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">Field ID:</p>
                        <p className="text-xs text-foreground font-mono break-all">
                          {field.fieldId || 'N/A'}
                        </p>
                      </div>
                      
                      {/* Core Field Stats (if available) */}
                      {coreField && (
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm font-medium text-foreground mb-2">⚙️ Core Field Stats</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {coreField.fieldNodes && (
                              <div>
                                <span className="text-muted-foreground">Nodes: </span>
                                <span className="text-foreground font-semibold">{coreField.fieldNodes.length}</span>
                              </div>
                            )}
                            {coreField.crosslinks && (
                              <div>
                                <span className="text-muted-foreground">Crosslinks: </span>
                                <span className="text-foreground font-semibold">{coreField.crosslinks.length}</span>
                              </div>
                            )}
                            {coreField.lastProcessed && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Last Processed: </span>
                                <span className="text-foreground">{formatTimestamp(coreField.lastProcessed)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            );
          })()}
          
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

