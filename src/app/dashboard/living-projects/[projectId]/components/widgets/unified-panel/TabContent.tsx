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
// import { WidgetScheduleControls } from '../WidgetScheduleControls'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'

/**
 * Overview Tab - Content preview and primary information
 * 
 * NEW ASYNC-FIRST ARCHITECTURE:
 * - Widgets show family info and current status
 * - Artifacts show rendered content
 * - All other types show standard preview
 */
export const OverviewTab = ({ item, itemType, config, projectId }: TabContentProps) => {
  const preview = getItemPreview(item, itemType)
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")

  React.useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.error('Failed to get user ID:', error)
      }
    }
    fetchUserId()
  }, [])

  // Special rendering for artifacts
  if (itemType === 'artifact') {
    return (
      <div className="space-y-4">
        {/* Artifact Renderer - now handles database format internally */}
        {userId ? (
          <EditableArtifactRenderer
            artifact={item as any}
            userId={userId}
          />
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Loading...
          </div>
        )}
        
        {/* View Full Artifact Button */}
        <Button
          onClick={() => router.push(`/dashboard/living-projects/${projectId}/gallery?id=${item._id}`)}
          className="w-full"
          variant="outline"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          <T context="panel.overview.view_full_artifact">View in Gallery</T>
        </Button>
      </div>
    )
  }

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

      {/* Widget-specific: Family Status */}
      {itemType === 'widget' && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <T context="panel.overview.family_info">Family Information</T>
          </h3>
          <div className="space-y-3">
            {/* Current Status */}
            <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                <T context="panel.overview.current_status">Current Status</T>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-foreground capitalize">
                  {item.lastRunStatus || 'idle'}
                </div>
              </div>
            </div>

            {/* Family Identity */}
            {item.familyIdentity && (
              <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  <T context="panel.overview.mission">Mission</T>
                </div>
                <p className="text-xs text-foreground/80">{item.familyIdentity.mission}</p>
              </div>
            )}

            {/* Info Message */}
            <div className="text-xs text-muted-foreground/60 italic">
              <T context="panel.overview.widget_execution_info">
                This family executes automatically when you start the project. Check the project view for real-time updates.
              </T>
            </div>
          </div>
        </div>
      )}

      {/* Widget-specific: Schedule Info */}
      {/* {itemType === 'widget' && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <T context="panel.overview.schedule">Schedule</T>
          </h3>
          <div className="space-y-3">
            {item.scheduleEnabled ? (
              <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-green-600 dark:text-green-400">
                      Scheduled {item.scheduleFrequency || 'daily'}
                    </div>
                    {item.nextScheduledRun && (
                      <div className="text-xs text-muted-foreground">
                        Next run: {new Date(item.nextScheduledRun * 1000).toLocaleString()}
                      </div>
                    )}
                    {item.lastScheduledRun && (
                      <div className="text-xs text-muted-foreground">
                        Last run: {new Date(item.lastScheduledRun * 1000).toLocaleString()}
                      </div>
                    )}
                    {item.scheduledRunCount !== undefined && (
                      <div className="text-xs text-muted-foreground">
                        Total runs: {item.scheduledRunCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-muted/20 rounded-lg p-3 border border-border/20">
                <div className="text-xs text-muted-foreground">
                  Not scheduled. Use the schedule controls to enable automatic execution.
                </div>
              </div>
            )}
            {projectId && (
              <WidgetScheduleControls
                widgetId={item._id}
                projectId={projectId}
                isScheduled={item.scheduleEnabled}
                nextScheduledRun={item.nextScheduledRun}
                frequency={item.scheduleFrequency}
                suggestedFrequency={item.execution_profile?.frequency_suggestion || null}
              />
            )}
          </div>
        </div>
      )} */}

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
 * 
 * NEW ASYNC-FIRST ARCHITECTURE:
 * - Widgets: View-only (execution is project-level via "Start Project")
 * - Artifacts: Edit, feedback, view in gallery
 * - Notes/Conversations: Edit, delete, open full
 */
export const ActionsTab = ({ item, itemType, projectId, onClose }: TabContentProps) => {
  const router = useRouter()
  const actions = useUnifiedActions(projectId)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Widgets (Families): View-only actions
  if (itemType === 'widget') {
    return (
      <div className="space-y-3">
        {/* View in Gallery */}
        <Button
          onClick={() => {
            router.push(`/dashboard/living-projects/${projectId}/gallery?id=${item._id}&type=widget`)
            onClose()
          }}
          className="w-full"
          variant="outline"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          <T context="panel.actions.view_in_gallery">View in Gallery</T>
        </Button>

        {/* Info Message */}
        <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
          <p className="text-xs text-muted-foreground">
            <T context="panel.actions.widget_info">
              Families execute automatically when you start the project. Check the project view for real-time status.
            </T>
          </p>
        </div>
      </div>
    )
  }

  // Artifacts: Edit, feedback, view actions
  if (itemType === 'artifact') {
    return (
      <div className="space-y-3">
        <Button
          onClick={() => {
            router.push(`/dashboard/living-projects/${projectId}/gallery?id=${item._id}&type=artifact`)
            onClose()
          }}
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          <T context="panel.actions.view_full_artifact">View in Gallery</T>
        </Button>

        <Button
          variant="outline"
          className="w-full"
        >
          <Edit className="w-4 h-4 mr-2" />
          <T context="panel.actions.edit_artifact">Edit Artifact</T>
        </Button>
      </div>
    )
  }

  // Notes, Conversations, Crystals, Shards: Standard actions
  const hasEditAction = ['note', 'conversation'].includes(itemType)
  const hasDeleteAction = ['note', 'conversation'].includes(itemType)

  return (
    <div className="space-y-3">
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

