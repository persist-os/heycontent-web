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
// import { WidgetScheduleControls } from '@/app/dashboard/living-projects/[projectId]/components/widgets/WidgetScheduleControls'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'
import { formatTimeAgo, getWidgetJobStatus, getA2AActivityIcon } from '@/lib/widget-utils'
import { BarChart3, Info, CheckCircle2, FileText, Circle, Lock } from 'lucide-react'
import { T } from '@/components/translation/T'

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
          <p className="font-semibold text-foreground">
            <T context="gallery.widget.status.working">Working right now</T>
          </p>
          <p className="text-sm text-muted-foreground">
            → {latestA2A?.report?.announcement || <T context="gallery.widget.status.processing">Processing...</T>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <T context="gallery.widget.status.started">Started</T> {formatTimeAgo(widgetJob.startedAt)} <T context="gallery.widget.status.ago">ago</T>
          </p>
        </div>
      )
    }
    
    return (
      <div className="bg-muted/20 border-l-4 border-border p-4 rounded">
        <p className="font-semibold text-foreground">
          <T context="gallery.widget.status.resting">Resting</T>
        </p>
        <p className="text-sm text-muted-foreground">
          → <T context="gallery.widget.status.waiting">Waiting for new work</T>
        </p>
        {widgetJob?.completedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            <T context="gallery.widget.status.last.active">Last active</T> {formatTimeAgo(widgetJob.completedAt)} <T context="gallery.widget.status.ago">ago</T>
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
              {currentItem.description || <T context="gallery.widget.description.default">Helps you manage your project</T>}
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
            {/* {widgetId && projectId && (
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
            )} */}
            
            {/* Current Activity */}
            {getCurrentActivity()}
          </div>
        </Card>
        
        {/* WHAT'S HAPPENING - Collapsible */}
        <Collapsible open={activityOpen} onOpenChange={setActivityOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              {activityOpen ? (
                <T context="button.gallery.hide.details">Hide details</T>
              ) : (
                <T context="button.gallery.see.whats.happening">See what's happening</T>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  <T context="gallery.widget.section.whats.happening">What's Happening</T>
                </h3>
                
                {widgetJob?.status === 'running' ? (
                  <>
                    <div className="bg-blue-500/10 border-l-4 border-blue-500 p-4 rounded mb-4">
                      <p className="font-semibold text-foreground">
                        <T context="gallery.widget.status.right.now">Right Now:</T>
                      </p>
                      <p className="text-sm text-foreground">
                        {a2aMessages[0]?.report?.announcement || <T context="gallery.widget.status.working.short">Working...</T>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <T context="gallery.widget.status.started">Started</T> {formatTimeAgo(widgetJob.startedAt)} <T context="gallery.widget.status.ago">ago</T>
                      </p>
                    </div>
                    
                    {a2aMessages.length > 1 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          <T context="gallery.widget.activity.recent">Recent Activity:</T>
                        </p>
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
                      <T context="gallery.widget.resting.message">This widget is resting right now.</T>
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <T context="gallery.widget.resting.will.start">It will automatically start working when:</T>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <T context="gallery.widget.resting.trigger.new.content">You add new content to your project</T>
                        </li>
                        <li>
                          <T context="gallery.widget.resting.trigger.patterns">It detects patterns that need analysis</T>
                        </li>
                        <li>
                          <T context="gallery.widget.resting.trigger.question">You ask it a question</T>
                        </li>
                      </ul>
                      <p className="mt-3">
                        <T context="gallery.widget.resting.no.action">You don't need to do anything - it knows when to help.</T>
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
              {helpersOpen ? (
                <T context="button.gallery.hide.details">Hide details</T>
              ) : (
                <T context="button.gallery.how.it.works">How it works</T>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  <T context="gallery.widget.section.how.it.works">How It Works</T>
                </h3>
                
                {currentItem.agentRoster && currentItem.agentRoster.length > 0 ? (
                  <>
                    <p className="text-foreground mb-4">
                      <T context="gallery.widget.helpers.count">This widget has</T> {currentItem.agentRoster.length} {currentItem.agentRoster.length !== 1 ? (
                        <T context="gallery.widget.helpers.plural">helpers</T>
                      ) : (
                        <T context="gallery.widget.helpers.singular">helper</T>
                      )}{' '}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-blue-500 inline cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            <T context="gallery.widget.helper.tooltip.1">A helper is like a team member that handles one specific task.</T>
                          </p>
                          <p>
                            <T context="gallery.widget.helper.tooltip.2">They work together to get things done.</T>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      {' '}
                      <T context="gallery.widget.helpers.working.together">working together:</T>
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
                            {agent.spawnCondition === 'Always active' ? (
                              <T context="gallery.widget.helper.always.working">Always working</T>
                            ) : (
                              <T context="gallery.widget.helper.starts">
                                Starts {agent.spawnCondition?.toLowerCase() || <T context="gallery.widget.helper.when.needed">when needed</T>}
                              </T>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      <T context="gallery.widget.setup.in.progress">This widget is still being set up.</T>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <T context="gallery.widget.setup.message">Once it's ready, you'll see the different helpers that work together.</T>
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
              {thinkingOpen ? (
                <T context="button.gallery.hide.details">Hide details</T>
              ) : (
                <T context="button.gallery.what.its.thinking">What it's thinking</T>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    <T context="gallery.widget.section.what.its.thinking">What It's Thinking</T>
                  </h3>
                  <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    <T context="gallery.widget.badge.auto.generated">Auto-Generated</T>
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  <T context="gallery.widget.thinking.description">These are the instructions guiding this widget. They were automatically created based on your project.</T>
                </p>
                
                {currentItem.familyIdentity?.mission ? (
                  <>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground mb-2">
                        <T context="gallery.widget.thinking.identity">Identity:</T>
                      </p>
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                        <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
                          {currentItem.familyIdentity.mission}
                        </p>
                      </div>
                    </div>
                    
                    {currentItem.familyIdentity?.collaborationStyle && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          <T context="gallery.widget.thinking.guidelines">Guidelines:</T>
                        </p>
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                          <p className="text-sm text-foreground font-mono whitespace-pre-wrap">
                            {currentItem.familyIdentity.collaborationStyle}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-4">
                      <T context="gallery.widget.thinking.last.updated">Last updated:</T> {formatTimeAgo(currentItem.updatedAt || currentItem._creationTime)} <T context="gallery.widget.status.ago">ago</T>
                    </p>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      <T context="gallery.widget.thinking.no.instructions">This widget doesn't have its instructions yet.</T>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <T context="gallery.widget.thinking.no.instructions.description">The system will automatically generate them the first time it runs. You'll be able to see what guides its decisions here.</T>
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
                {promptsOpen ? (
                  <T context="button.gallery.hide.prompts">Hide prompts</T>
                ) : (
                  <>
                    <T context="button.gallery.execution.prompts">Execution Prompts</T> ({widgetPrompts.length})
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    <T context="gallery.widget.section.execution.prompts">Execution Prompts</T>
                    {' '}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-blue-500 inline cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          <T context="gallery.widget.prompts.tooltip.1">Custom prompts generated for this widget's agents.</T>
                        </p>
                        <p>
                          <T context="gallery.widget.prompts.tooltip.2">These prompts are used when the widget runs operations.</T>
                        </p>
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
                                    {(prompt.effectiveness * 100).toFixed(0)}% <T context="gallery.widget.prompt.effective">effective</T>
                                  </Badge>
                                )}
                                {prompt.usageCount !== undefined && prompt.usageCount > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    <T context="gallery.widget.prompt.used">Used</T> {prompt.usageCount}x
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
                              <T context="gallery.widget.prompt.version">Version</T> {prompt.version}
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
              {outputsOpen ? (
                <T context="button.gallery.hide.outputs">Hide outputs</T>
              ) : (
                <>
                  <T context="button.gallery.what.its.made">What it's made</T> ({outputs?.length || 0})
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card className="bg-card/50 backdrop-blur-sm border border-border/40 mt-2">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  <T context="gallery.widget.section.what.its.made">What It's Made</T>
                </h3>
                
                {outputs && outputs.length > 0 ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      <T context="gallery.widget.outputs.description">These are the things this widget has created for you.</T>
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
                              <T context="gallery.widget.output.created">Created</T> {formatTimeAgo(artifact.createdAt || artifact._creationTime)} <T context="gallery.widget.status.ago">ago</T>
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
                          <T context="button.gallery.show.more">Show</T> {outputs.length - 5} <T context="button.gallery.show.more.suffix">more...</T>
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-lg text-foreground mb-3">
                      <T context="gallery.widget.outputs.empty">This widget hasn't created anything yet.</T>
                    </p>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <T context="gallery.widget.outputs.empty.will.see">Once it finishes its work, you'll see:</T>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <T context="gallery.widget.outputs.type.reports">Reports and summaries</T>
                        </li>
                        <li>
                          <T context="gallery.widget.outputs.type.analysis">Analysis and insights</T>
                        </li>
                        <li>
                          <T context="gallery.widget.outputs.type.content">Generated content</T>
                        </li>
                      </ul>
                      <p className="mt-3">
                        <T context="gallery.widget.outputs.empty.automatic">Everything it makes will appear here automatically.</T>
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


