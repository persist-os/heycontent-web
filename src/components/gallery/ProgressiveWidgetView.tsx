/**
 * PROGRESSIVE WIDGET VIEW
 * 
 * Extracted component for displaying widget details with progressive disclosure.
 * Implements clean, professional UI without emojis, using semantic colors and lucide icons.
 * 
 * LAW VI: Extracted from UnifiedGalleryView for single responsibility and testability.
 */

'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { StatusBadge } from '@/components/ui/status-badge'
import { StarRating } from '@/components/ui/star-rating'
import { WidgetScheduleControls } from '@/app/dashboard/living-projects/[projectId]/components/widgets/WidgetScheduleControls'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'
import { formatTimeAgo, getWidgetJobStatus, getA2AActivityIcon } from '@/lib/widget-utils'
import { BarChart3, Info, CheckCircle2, FileText, Circle, Lock } from 'lucide-react'

interface ProgressiveWidgetViewProps {
  currentItem: any // Widget item from gallery
  widgetId: string | null
  userId: string
  projectId: string
  widgetJob: any // Background job for widget execution
  a2aMessages: any[]
  widgetPrompts: any[]
  outputs: any[]
  currentRating?: number
  onFeedbackSubmit: (rating: number, feedbackText?: string) => Promise<void>
  isSubmittingFeedback: boolean
}

/**
 * ProgressiveWidgetView - Widget details with progressive disclosure
 * 
 * Displays widget information in collapsible sections to prevent cognitive overload.
 * All sections collapsed by default - user expands only what they need.
 */
export function ProgressiveWidgetView({
  currentItem,
  widgetId,
  userId,
  projectId,
  widgetJob,
  a2aMessages,
  widgetPrompts,
  outputs,
  currentRating,
  onFeedbackSubmit,
  isSubmittingFeedback
}: ProgressiveWidgetViewProps) {
  // Progressive disclosure state: All sections collapsed by default
  const [activityOpen, setActivityOpen] = useState(false)
  const [helpersOpen, setHelpersOpen] = useState(false)
  const [thinkingOpen, setThinkingOpen] = useState(false)
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [outputsOpen, setOutputsOpen] = useState(false)
  
  const jobStatus = getWidgetJobStatus(widgetJob)
  
  const getCurrentActivity = () => {
    if (widgetJob?.status === 'running') {
      const latestA2A = a2aMessages[0]
      return (
        <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
          <p className="font-semibold text-foreground">Working right now</p>
          <p className="text-sm text-muted-foreground">
            → {latestA2A?.report?.announcement || 'Processing...'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Started {formatTimeAgo(widgetJob.startedAt)} ago
          </p>
        </div>
      )
    }
    
    return (
      <div className="bg-muted/20 border-l-4 border-border p-4 rounded">
        <p className="font-semibold text-foreground">Resting</p>
        <p className="text-sm text-muted-foreground">
          → Waiting for new work
        </p>
        {widgetJob?.completedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Last active {formatTimeAgo(widgetJob.completedAt)} ago
          </p>
        )}
      </div>
    )
  }
  
  // Map A2A icon name to component
  const getA2AIconComponent = (status: string) => {
    const iconName = getA2AActivityIcon(status)
    switch (iconName) {
      case 'CheckCircle2':
        return <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
      case 'FileText':
        return <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'Circle':
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />
    }
  }
  
  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* HEADER - Always visible */}
        <Card className="bg-card/50 backdrop-blur-sm border border-border/40">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  {currentItem.title}
                </h2>
              </div>
              <StatusBadge status={jobStatus.status} showIcon={true} />
            </div>
            
            <p className="text-muted-foreground text-lg mb-4">
              {currentItem.description || 'Helps you manage your project'}
            </p>
            
            {/* Star Rating for Widget */}
            <div className="flex items-center justify-end mb-4">
              <StarRating
                size="sm"
                value={currentRating}
                onRate={onFeedbackSubmit}
                disabled={isSubmittingFeedback}
                allowFeedbackText={true}
              />
            </div>
            
            {/* Widget Schedule Controls */}
            {widgetId && projectId && (
              <div className="mb-4">
                <WidgetScheduleControls
                  widgetId={String(widgetId)}
                  projectId={projectId}
                  isScheduled={currentItem.scheduleEnabled || false}
                  nextScheduledRun={currentItem.nextScheduledRun || null}
                  frequency={currentItem.scheduleFrequency || 'daily'}
                  suggestedFrequency={currentItem.executionProfile?.frequencySuggestion || null}
                  onScheduleChange={() => {
                    // Trigger a refetch of widget data if needed
                    // The component will update via Convex reactivity
                  }}
                />
              </div>
            )}
            
            {/* Current Activity */}
            {getCurrentActivity()}
          </div>
        </Card>
        
        {/* WHAT'S HAPPENING - Collapsible */}
        <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {activityOpen ? "Hide details" : "See what's happening"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  What's Happening
                </h3>
                
                {widgetJob?.status === 'running' ? (
                  <>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded mb-4">
                      <p className="font-semibold text-foreground">Right Now:</p>
                      <p className="text-sm text-foreground">
                        {a2aMessages[0]?.report?.announcement || 'Working...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Started {formatTimeAgo(widgetJob.startedAt)} ago
                      </p>
                    </div>
                    
                    {a2aMessages.length > 1 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Recent Activity:</p>
                        {a2aMessages.slice(1, 4).map((msg: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 text-sm mb-2">
                            {getA2AIconComponent(msg.report?.status)}
                            <span className="text-foreground">{msg.report?.announcement}</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatTimeAgo(msg.createdAt)} ago
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      This widget is resting right now.
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>It will automatically start working when:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You add new content to your project</li>
                        <li>It detects patterns that need analysis</li>
                        <li>You ask it a question</li>
                      </ul>
                      <p className="mt-3">
                        You don't need to do anything - it knows when to help.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        {/* HOW IT WORKS - Collapsible */}
        <Collapsible open={helpersOpen} onOpenChange={setHelpersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {helpersOpen ? "Hide details" : "How it works"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  How It Works
                </h3>
                
                {currentItem.agentRoster && currentItem.agentRoster.length > 0 ? (
                  <>
                    <p className="text-foreground mb-4">
                      This widget has {currentItem.agentRoster.length} helper{currentItem.agentRoster.length !== 1 ? 's' : ''}{' '}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-blue-500 inline cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A helper is like a team member that handles one specific task.</p>
                          <p>They work together to get things done.</p>
                        </TooltipContent>
                      </Tooltip>
                      {' '}working together:
                    </p>
                    
                    <div className="space-y-3">
                      {currentItem.agentRoster.map((agent: any, idx: number) => (
                        <div key={idx} className="bg-blue-500/5 border-l-4 border-blue-500 p-4 rounded">
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
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      This widget is still being set up.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Once it's ready, you'll see the different helpers that work together.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        {/* WHAT IT'S THINKING - Collapsible */}
        <Collapsible open={thinkingOpen} onOpenChange={setThinkingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {thinkingOpen ? "Hide details" : "What it's thinking"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    What It's Thinking
                  </h3>
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Auto-Generated
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  These are the instructions guiding this widget. They were automatically created based on your project.
                </p>
                
                {currentItem.familyIdentity?.mission ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">Identity:</p>
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                        <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
                          {currentItem.familyIdentity.mission}
                        </p>
                      </div>
                    </div>
                    
                    {currentItem.familyIdentity?.collaborationStyle && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Guidelines:</p>
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
                            {currentItem.familyIdentity.collaborationStyle}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      Last updated: {formatTimeAgo(currentItem.updatedAt || currentItem._creationTime)} ago
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      This widget doesn't have its instructions yet.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      The system will automatically generate them the first time it runs. You'll be able to see what guides its decisions here.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
        
        {/* EXECUTION PROMPTS - Collapsible */}
        {widgetPrompts && Array.isArray(widgetPrompts) && widgetPrompts.length > 0 && (
          <Collapsible open={promptsOpen} onOpenChange={setPromptsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-start">
                {promptsOpen ? "Hide prompts" : `Execution Prompts (${widgetPrompts.length})`}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Execution Prompts
                    {' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-blue-500 inline cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Custom prompts generated for this widget's agents.</p>
                        <p>These prompts are used when the widget runs operations.</p>
                      </TooltipContent>
                    </Tooltip>
                  </h3>
                  
                  <div className="space-y-4">
                    {widgetPrompts.map((prompt: any, idx: number) => {
                      // Extract operation from tags (e.g., "information_check", "planning")
                      const operationTag = prompt.tags?.find((tag: string) => 
                        ['information_check', 'planning', 'generation', 'validation'].includes(tag)
                      ) || prompt.tags?.[0] || 'unknown';
                      
                      return (
                        <div key={prompt._id || idx} className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {operationTag}
                                </Badge>
                                {prompt.effectiveness !== undefined && (
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${
                                      prompt.effectiveness >= 0.8 
                                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                        : prompt.effectiveness >= 0.5
                                        ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                        : 'bg-muted/20'
                                    }`}
                                  >
                                    {(prompt.effectiveness * 100).toFixed(0)}% effective
                                  </Badge>
                                )}
                                {prompt.usageCount !== undefined && prompt.usageCount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    Used {prompt.usageCount}x
                                  </Badge>
                                )}
                              </div>
                              {prompt.description && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {prompt.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-background/50 rounded p-3 mt-2">
                            <p className="text-xs text-foreground whitespace-pre-wrap font-mono">
                              {prompt.content}
                            </p>
                          </div>
                          
                          {prompt.version && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Version {prompt.version}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* WHAT IT'S MADE - Collapsible */}
        <Collapsible open={outputsOpen} onOpenChange={setOutputsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {outputsOpen ? "Hide outputs" : `What it's made (${outputs?.length || 0})`}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  What It's Made
                </h3>
                
                {outputs && outputs.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      These are the things this widget has created for you.
                    </p>
                    
                    <div className="space-y-4">
                      {outputs.slice(0, 5).map((artifact: any) => {
                        // Extract title with fallback chain
                        let artifactTitle = artifact.title;
                        if (!artifactTitle && artifact.data?.title) {
                          artifactTitle = artifact.data.title;
                        }
                        if (!artifactTitle && artifact.type === 'report' && artifact.data?.markdown) {
                          const match = artifact.data.markdown.match(/^#\s+(.+)$/m);
                          if (match) {
                            artifactTitle = match[1].trim();
                          }
                        }
                        if (!artifactTitle) {
                          artifactTitle = artifact.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact';
                        }
                        
                        return (
                          <div key={artifact._id} className="bg-cyan-500/5 border-l-4 border-cyan-500 p-4 rounded">
                            <p className="font-semibold text-foreground">{artifactTitle}</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Created {formatTimeAgo(artifact.createdAt || artifact._creationTime)} ago
                            </p>
                            {artifact.data && (
                              <div className="mt-2">
                                <EditableArtifactRenderer artifact={artifact} userId={userId} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {outputs.length > 5 && (
                        <Button 
                          variant="ghost" 
                          className="w-full"
                          onClick={() => {/* Could implement pagination */}}
                        >
                          Show {outputs.length - 5} more...
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      This widget hasn't created anything yet.
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>Once it finishes its work, you'll see:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Reports and summaries</li>
                        <li>Analysis and insights</li>
                        <li>Generated content</li>
                      </ul>
                      <p className="mt-3">
                        Everything it makes will appear here automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </TooltipProvider>
  )
}

