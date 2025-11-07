/**
 * WIDGET DETAIL VIEW - Comprehensive Widget Information
 * 
 * Shows:
 * - Widget metadata and configuration
 * - Recent outputs/artifacts created by this widget
 * - Editable prompt blocks for execution review
 * - Agent roster and capabilities
 */

'use client'

import { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { cn } from '@/lib/utils'
import { Play, Edit2, Check, X, FileText, Zap } from 'lucide-react'

interface WidgetDetailViewProps {
  widget: any
  userId: string
  projectId: string
}

export function WidgetDetailView({ widget, userId, projectId }: WidgetDetailViewProps) {
  const [editingPrompts, setEditingPrompts] = useState(false)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [instructionsPrompt, setInstructionsPrompt] = useState('')
  
  // Fetch widget artifacts (artifacts created by this widget)
  // ✅ Using NEW artifacts table queries
  const widgetArtifacts = useQuery(
    api.artifactQueries.getWidgetArtifacts,
    widget?._id ? { widgetId: widget._id } : 'skip'
  )
  
  // Fetch all project artifacts
  // ✅ Using NEW artifacts table queries
  const projectArtifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    projectId ? { projectId: projectId as any } : 'skip'
  )
  
  const widgetType = widget.widget_type || widget.widgetType || 'unknown'
  const hasAgentRoster = widget.agentRoster && Array.isArray(widget.agentRoster)
  
  // Widget artifacts are the outputs from this specific widget
  const outputs = Array.isArray(widgetArtifacts) ? widgetArtifacts : []
  
  // Other artifacts from the project (for context/reference)
  const otherProjectArtifacts = projectArtifacts?.filter((artifact: any) => 
    artifact.widgetId !== widget._id
  ) || []
  
  const handleExecuteWidget = () => {
    // TODO: Implement widget execution with custom prompts
    console.log('[WidgetDetail] Execute widget with prompts:', {
      widgetId: widget._id,
      systemPrompt,
      instructionsPrompt
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Widget Header with Gradient */}
      <div className={cn(
        "rounded-xl p-6 border backdrop-blur-lg",
        "bg-gradient-to-br from-purple-500/5 via-indigo-500/5 to-purple-500/3",
        "border-purple-500/20"
      )}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {widget.title}
            </h2>
            <p className="text-muted-foreground text-lg">
              {widget.description}
            </p>
          </div>
          <Badge 
            variant="outline" 
            className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border-0"
          >
            {widgetType}
          </Badge>
        </div>
        
        {/* Widget Metadata Grid */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className={cn(
            "p-4 rounded-lg backdrop-blur-sm",
            "bg-gradient-to-br from-indigo-500/10 to-purple-500/5",
            "border border-indigo-500/20"
          )}>
            <span className="text-sm text-muted-foreground block mb-1">Category</span>
            <p className="text-foreground font-medium">
              {widget.category || 'Uncategorized'}
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg backdrop-blur-sm",
            "bg-gradient-to-br from-purple-500/10 to-indigo-500/5",
            "border border-purple-500/20"
          )}>
            <span className="text-sm text-muted-foreground block mb-1">Priority</span>
            <p className="text-foreground font-medium">
              {widget.priority || 5}/10
            </p>
          </div>
          <div className={cn(
            "p-4 rounded-lg backdrop-blur-sm",
            "bg-gradient-to-br from-indigo-500/10 to-purple-500/5",
            "border border-indigo-500/20"
          )}>
            <span className="text-sm text-muted-foreground block mb-1">Status</span>
            <p className="text-foreground font-medium capitalize">
              {widget.status || 'active'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Agent Roster Section */}
      {hasAgentRoster && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-500" />
            Agent Roster
          </h3>
          <div className="space-y-4">
            {widget.agentRoster.map((agent: any, idx: number) => (
              <div 
                key={idx}
                className="p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-indigo-500/5 border border-purple-500/10"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{agent.roleName}</h4>
                    <p className="text-sm text-purple-600 dark:text-purple-400">{agent.agentId}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.spawnCondition || 'Always active'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{agent.personality}</p>
                {agent.responsibilities && agent.responsibilities.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Responsibilities:</span>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {agent.responsibilities.map((resp: string, ridx: number) => (
                        <li key={ridx} className="flex items-start gap-2">
                          <span className="text-purple-500 mt-1">•</span>
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Family Identity */}
      {widget.familyIdentity && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Family Identity</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Mission</span>
              <p className="text-foreground mt-1">{widget.familyIdentity.mission}</p>
            </div>
            {widget.familyIdentity.collaborationStyle && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Collaboration Style</span>
                <p className="text-foreground mt-1">{widget.familyIdentity.collaborationStyle}</p>
              </div>
            )}
            {widget.familyIdentity.qualityStandard && (
              <div>
                <span className="text-sm font-medium text-muted-foreground">Quality Standard</span>
                <p className="text-foreground mt-1">{widget.familyIdentity.qualityStandard}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Prompt Blocks - Editable Before Execution */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Execution Prompts
          </h3>
          <div className="flex items-center gap-2">
            {!editingPrompts ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditingPrompts(true)
                  // Initialize with current prompts (would come from backend)
                  setSystemPrompt(`You are a ${widgetType} widget with the following mission:\n\n${widget.familyIdentity?.mission || 'Assist the user with their goals.'}`)
                  setInstructionsPrompt(`Follow these guidelines:\n\n1. ${widget.description}\n2. Maintain high quality standards\n3. Collaborate with other agents in the family`)
                }}
                className="text-indigo-600 dark:text-indigo-400"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Prompts
              </Button>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingPrompts(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setEditingPrompts(false)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
        
        {editingPrompts ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                System Prompt
              </label>
              <Textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
                placeholder="System prompt defines the agent's identity and role..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instructions
              </label>
              <Textarea
                value={instructionsPrompt}
                onChange={(e) => setInstructionsPrompt(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
                placeholder="Instructions guide the agent's behavior and output..."
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-sm font-medium text-muted-foreground mb-2">System Prompt</p>
              <p className="text-sm text-foreground/70 font-mono whitespace-pre-wrap">
                {systemPrompt || 'Click "Edit Prompts" to customize execution parameters'}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-border/40">
              <p className="text-sm font-medium text-muted-foreground mb-2">Instructions</p>
              <p className="text-sm text-foreground/70 font-mono whitespace-pre-wrap">
                {instructionsPrompt || 'Click "Edit Prompts" to customize execution parameters'}
              </p>
            </div>
          </div>
        )}
        
        <Button 
          className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          onClick={handleExecuteWidget}
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Widget with Custom Prompts
        </Button>
      </div>
      
      {/* Recent Outputs Section */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">
          Recent Outputs ({outputs.length})
        </h3>
        {outputs.length > 0 ? (
          <div className="space-y-4">
            {outputs.map((artifact: any) => (
              <div 
                key={artifact._id}
                className="p-4 rounded-lg bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      {artifact.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(artifact.createdAt || artifact._creationTime).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    v{artifact.metadata?.version || '1.0'}
                  </Badge>
                </div>
                {artifact.data && (
                  <div className="mt-3">
                    <ArtifactRenderer 
                      artifact={artifact} 
                      editable={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No outputs yet</p>
            <p className="text-sm mt-1">Execute the widget to generate artifacts</p>
          </div>
        )}
      </div>
      
      {/* Other Project Artifacts Section */}
      {otherProjectArtifacts.length > 0 && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">
            Other Project Artifacts ({otherProjectArtifacts.length})
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {otherProjectArtifacts.map((artifact: any) => (
              <div 
                key={artifact._id}
                className="p-3 rounded-lg bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/10"
              >
                <p className="font-medium text-sm text-foreground">{artifact.type}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {new Date(artifact.updatedAt || artifact.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

