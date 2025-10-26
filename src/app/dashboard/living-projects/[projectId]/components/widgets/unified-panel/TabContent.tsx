/**
 * TAB CONTENT COMPONENTS
 * Content for each tab in the expanded panel view
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Layers,
  Clock,
  Calendar,
  Brain,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Heart,
  AlertCircle,
  Tag,
  Star,
  Play,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  Maximize2,
  Gem
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TabContentProps, MetadataField } from '@/app/dashboard/living-projects/types/unifiedDetailsPanel'
import { getItemPreview } from './panelConfig'
import { useUnifiedActions } from './useUnifiedActions'
import { launchThinkingLabWithOutput } from '@/app/dashboard/living-projects/utils/thinkingLabLauncher'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { T } from '@/components/translation/T'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'

/**
 * Overview Tab - Content preview and primary information
 */
export const OverviewTab = ({ item, itemType, config }: TabContentProps) => {
  const preview = getItemPreview(item, itemType)
  const [userId, setUserId] = React.useState<string | null>(null)

  // Fetch latest widget output for widgets
  const latestOutput = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    itemType === 'widget' && userId ? {
      userId,
      filters: { widgetId: item._id },
      limit: 1,
      orderBy: 'desc'
    } : 'skip'
  )

  React.useEffect(() => {
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

  const output = latestOutput && typeof latestOutput === 'object' && '_id' in latestOutput
    ? latestOutput
    : null

  return (
    <div className="space-y-6">
      {/* Content Preview */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          <T context="panel.overview.content">Content</T>
        </h3>
        <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {preview}
          </p>
        </div>
      </div>

      {/* Widget-specific: Latest Output */}
      {itemType === 'widget' && output && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <T context="panel.overview.latest_output">Latest Output</T>
          </h3>
          
          {output.prompts && output.prompts.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                <T context="panel.overview.prompts">Conversation Starters</T> ({output.prompts.length})
              </h4>
              {output.prompts.slice(0, 3).map((prompt: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-muted/30 rounded-md p-2 text-xs text-foreground/80 hover:bg-muted/50 transition-colors"
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
          ) : (
            <div className="text-xs text-muted-foreground/60">
              <T context="panel.overview.no_prompts">No conversation prompts generated</T>
            </div>
          )}
        </div>
      )}

      {/* Crystal-specific: Supporting Evidence */}
      {itemType === 'crystal' && item.supporting_quotes && item.supporting_quotes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <T context="panel.overview.evidence">Supporting Evidence</T>
          </h3>
          <div className="space-y-2">
            {item.supporting_quotes.slice(0, 3).map((quote: string, idx: number) => (
              <div key={idx} className="bg-violet-500/5 rounded-lg p-3 border border-violet-500/10">
                <p className="text-xs text-foreground/80 italic">"{quote}"</p>
              </div>
            ))}
            {item.supporting_quotes.length > 3 && (
              <div className="text-xs text-muted-foreground/60 text-center">
                +{item.supporting_quotes.length - 3} more quotes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shard-specific: Quantum Analysis */}
      {itemType === 'shard' && (item.what_it_reveals || item.why_significant) && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <T context="panel.overview.quantum_analysis">Quantum Analysis</T>
          </h3>
          <div className="space-y-3">
            {item.what_it_reveals && (
              <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  <T context="panel.overview.reveals">What it Reveals</T>
                </div>
                <p className="text-xs text-foreground/80">{item.what_it_reveals}</p>
              </div>
            )}
            {item.why_significant && (
              <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  <T context="panel.overview.significant">Why Significant</T>
                </div>
                <p className="text-xs text-foreground/80">{item.why_significant}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Note-specific: Analysis */}
      {itemType === 'note' && item.analysis && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <T context="panel.overview.analysis">Analysis</T>
          </h3>
          <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
            <p className="text-xs text-foreground/80">{item.analysis}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Metadata Tab - Stats and properties grid
 */
export const MetadataTab = ({ item, itemType }: TabContentProps) => {
  const getMetadataFields = (): MetadataField[] => {
    switch (itemType) {
      case 'widget':
        return [
          { label: 'Type', value: item.widget_type || 'N/A', icon: Layers },
          { label: 'Category', value: item.category || 'N/A', icon: Tag },
          { label: 'Priority', value: `${item.priority}/10`, icon: TrendingUp },
          { label: 'Size', value: item.size || 'medium', icon: Layers },
          { label: 'Theme', value: item.theme || 'clean', icon: Sparkles },
          { label: 'Update Frequency', value: item.update_frequency || 'daily', icon: Clock }
        ]
      case 'note':
        return [
          { label: 'Type', value: item.type || 'note', icon: FileText },
          { label: 'Tags', value: item.tags?.join(', ') || 'None', icon: Tag },
          { label: 'Important', value: item.important ? 'Yes' : 'No', icon: Star },
          { label: 'References', value: item.references?.length || 0, icon: Layers },
          { label: 'Platform', value: item.platform || 'N/A', icon: FileText }
        ]
      case 'conversation':
        return [
          { label: 'Type', value: item.conversationType || 'general', icon: FileText },
          { label: 'Messages', value: item.messageCount || 0, icon: FileText },
          { label: 'Starred', value: item.starred ? 'Yes' : 'No', icon: Star }
        ]
      case 'crystal':
        return [
          { label: 'Type', value: item.crystal_type || 'pattern', icon: Gem },
          { label: 'Dimension', value: item.dimension || 'N/A', icon: Layers },
          { label: 'Confidence', value: item.confidence_score || item.evidence_strength || 'N/A', icon: TrendingUp },
          { label: 'Observations', value: item.observation_count || item.usage_count || 0, icon: Brain },
          { label: 'Stability', value: item.stability_trend || 'N/A', icon: TrendingUp },
          { label: 'Consistency', value: item.consistency_rating || 'N/A', icon: AlertCircle }
        ]
      case 'shard':
        return [
          { label: 'Source Type', value: item.source_type || 'N/A', icon: FileText },
          { label: 'Confidence', value: item.confidence_level || 'N/A', icon: TrendingUp },
          { label: 'Intensity', value: item.linguistic_intensity || 'N/A', icon: TrendingUp },
          { label: 'Emotion', value: item.emotional_weight || 'N/A', icon: Heart },
          { label: 'Specificity', value: item.specificity || 'N/A', icon: AlertCircle },
          { label: 'Referenced', value: item.reference_count || 0, icon: Layers }
        ]
      default:
        return []
    }
  }

  const fields = getMetadataFields()

  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <Layers className="w-4 h-4" />
        <T context="panel.metadata.title">Metadata</T>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((field, idx) => {
          const FieldIcon = field.icon
          return (
            <div key={idx} className="bg-muted/20 rounded-lg p-3 border border-border/20">
              <div className="flex items-center gap-2 mb-1">
                <FieldIcon className="w-3 h-3 text-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">{field.label}</span>
              </div>
              <div className="text-sm font-medium text-foreground capitalize">
                {field.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Actions Tab - Available actions for the item
 */
export const ActionsTab = ({ item, itemType, projectId, onClose }: TabContentProps) => {
  const router = useRouter()
  const actions = useUnifiedActions(projectId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)

  // Fetch latest widget output for widgets (same as OverviewTab)
  const latestOutput = useQuery(
    api.widgetOutputsQueries.getWidgetOutputData,
    itemType === 'widget' && userId ? {
      userId,
      filters: { widgetId: item._id },
      limit: 1,
      orderBy: 'desc'
    } : 'skip'
  )

  React.useEffect(() => {
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

  // Parse the latest output
  const output = latestOutput && typeof latestOutput === 'object' && '_id' in latestOutput
    ? latestOutput
    : null

  const hasRunAction = itemType === 'widget'
  const hasEditAction = ['widget', 'note', 'conversation'].includes(itemType)
  const hasDeleteAction = ['widget', 'note', 'conversation'].includes(itemType)
  
  // Check if we have a widget output available (from just-run result OR existing output)
  const hasWidgetOutput = itemType === 'widget' && (
    (actions.lastResult?.note_id) || 
    (output?.noteId)
  )

  return (
    <div className="space-y-3">
      {hasRunAction && (
        <Button
          onClick={() => actions.handleRun(item, itemType)}
          disabled={actions.isRunning}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {actions.isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <T context="panel.actions.running">Running...</T>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              <T context="panel.actions.run">Run Widget</T>
            </>
          )}
        </Button>
      )}

      {hasWidgetOutput && (
        <Button
          onClick={() => {
            // Priority: 1) fresh result, 2) queried output, 3) fallback
            if (actions.lastResult?.note_id) {
              launchThinkingLabWithOutput(
                router,
                {
                  noteId: actions.lastResult.note_id,
                  outputId: actions.lastResult.output_id
                },
                projectId,
                item._id
              )
            } else if (output?.noteId) {
              launchThinkingLabWithOutput(
                router,
                {
                  noteId: output.noteId,
                  outputId: output.outputId
                },
                projectId,
                item._id
              )
            } else {
              actions.handleLaunchLab(item, itemType)
            }
            onClose()
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          <T context="panel.actions.go_to_lab">Go to Thinking Lab</T>
        </Button>
      )}

      <Button
        onClick={() => actions.handleOpenFull(item, itemType)}
        variant="outline"
        className="w-full"
      >
        <Maximize2 className="w-4 h-4 mr-2" />
        <T context="panel.actions.open_full">Open Full View</T>
      </Button>

      {hasEditAction && (
        <Button
          variant="outline"
          className="w-full"
          disabled={actions.isUpdating}
        >
          <Edit className="w-4 h-4 mr-2" />
          <T context="panel.actions.edit">Edit</T>
        </Button>
      )}

      {hasDeleteAction && (
        <>
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            disabled={actions.isDeleting}
          >
            {actions.isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                <T context="panel.actions.deleting">Deleting...</T>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                <T context="panel.actions.delete">Delete</T>
              </>
            )}
          </Button>

          <ConfirmationModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={() => {
              actions.handleDelete(item, itemType).then(() => {
                setShowDeleteConfirm(false)
                onClose()
              })
            }}
            title="Delete Item"
            titleContext="panel.delete_confirm.title"
            description="Are you sure you want to delete this item? This action cannot be undone."
            descriptionContext="panel.delete_confirm.description"
            confirmText="Delete"
            confirmContext="button.delete"
            cancelText="Cancel"
            cancelContext="button.cancel"
            variant="destructive"
            isLoading={actions.isDeleting}
          />
        </>
      )}
    </div>
  )
}

/**
 * Activity Tab - Timeline and history
 */
export const ActivityTab = ({ item, itemType }: TabContentProps) => {
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <T context="panel.activity.timeline">Timeline</T>
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <T context="panel.activity.created">Created</T>
            </span>
            <span className="text-foreground font-medium">{formatTimestamp(item.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              <T context="panel.activity.updated">Updated</T>
            </span>
            <span className="text-foreground font-medium">{formatTimestamp(item.updatedAt)}</span>
          </div>
          {itemType === 'crystal' && item.last_evolution && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <T context="panel.activity.last_evolution">Last Evolution</T>
              </span>
              <span className="text-foreground font-medium">{formatTimestamp(item.last_evolution)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ID Information */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          <T context="panel.activity.identifier">Identifier</T>
        </h3>
        <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
          <code className="text-xs text-muted-foreground font-mono break-all">
            {itemType === 'crystal' ? item.crystal_id : item._id}
          </code>
        </div>
      </div>
    </div>
  )
}

