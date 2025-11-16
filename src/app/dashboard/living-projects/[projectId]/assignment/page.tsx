'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MessageSquare, 
  ExternalLink,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Plus
} from 'lucide-react'
import { T } from '@/components/translation/T'
import type { Id } from '@/convex/_generated/dataModel'
import { useGalleryItems } from '@/hooks/useGalleryItems'
import Link from 'next/link'
import { formatDistanceToNow } from '../components/utils/dateFormatting'
import { CheckCircle2 } from 'lucide-react'
import { ContentAttachmentPanel } from '@/app/dashboard/living-projects/components/ContentAttachmentPanel'

function AssignmentPageContent() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [userId, setUserId] = useState<string | null>(null)
  const [showProjectContentPanel, setShowProjectContentPanel] = useState(false)

  // Get user ID
  useEffect(() => {
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

  // Fetch project data
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? {
      projectId: projectId as Id<'projects'>,
      userId: userId,
    } : 'skip'
  )

  // Fetch assignment status
  const assignmentStatus = useQuery(
    api.backgroundJobs.getAssignmentStatus,
    projectId && userId ? {
      projectId: projectId as Id<'projects'>,
      userId: userId,
    } : 'skip'
  )

  // Fetch artifacts and widgets
  const { items: galleryItems, isLoading: isLoadingItems } = useGalleryItems({
    projectId: projectId,
    userId: userId || undefined
  })

  // Separate artifacts and widgets
  const artifacts = useMemo(() => 
    galleryItems.filter(item => item.itemType === 'artifact'),
    [galleryItems]
  )
  const widgets = useMemo(() => 
    galleryItems.filter(item => item.itemType === 'widget'),
    [galleryItems]
  )

  // Fetch A2A notes for status updates (no limit - show all)
  const a2aNotes = useQuery(
    api.a2aQueries.getLatestA2ANotesPublic,
    projectId ? {
      projectId: projectId as string,
      limit: 1000  // Show all notes - high limit to get everything
    } : 'skip'
  )

  // Calculate progress (based on widget completion)
  const progress = useMemo(() => {
    if (!assignmentStatus?.widgets || assignmentStatus.widgets.length === 0) return 0
    const completed = assignmentStatus.widgets.filter((w: any) => w.status === 'completed').length
    return Math.round((completed / assignmentStatus.widgets.length) * 100)
  }, [assignmentStatus])

  // Get project conversation for "Discuss In Chat"
  const projectConversation = useQuery(
    api.chatQueries.getProjectScopedConversation,
    project?._id && project?.userId ? {
      projectId: project._id,
      userId: project.userId
    } : 'skip'
  )

  // Handle open gallery for artifact/widget
  const handleOpenGallery = (itemId: string, itemType: 'artifact' | 'widget') => {
    router.push(`/dashboard/living-projects/${projectId}/gallery?id=${itemId}&type=${itemType}`)
  }

  // Handle discuss in chat
  const handleDiscussInChat = () => {
    if (projectConversation?._id) {
      router.push(`/dashboard/thinking_lab?conversationId=${projectConversation._id}`)
    } else if (projectId) {
      router.push(`/dashboard/thinking_lab?projectId=${projectId}`)
    }
  }

  // Map widgets to tasks, sorted by status priority
  const taskWidgets = useMemo(() => {
    if (!assignmentStatus?.widgets || assignmentStatus.widgets.length === 0) {
      return []
    }
    // Sort: in_progress first, then pending, then completed
    return [...assignmentStatus.widgets].sort((a: any, b: any) => {
      const statusOrder: Record<string, number> = {
        'in_progress': 0,
        'pending': 1,
        'completed': 2,
        'failed': 3
      }
      return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
    }).slice(0, 5) // Limit to 5 most relevant
  }, [assignmentStatus])

  if (!project || !userId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">
          <T context="assignment.loading">Loading assignment...</T>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-[60px] max-w-[1128px]">
        {/* Breadcrumb and Header */}
        <div className="flex flex-col gap-5 mb-10">
          <div className="flex items-center justify-between py-3">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-[32px] font-extralight leading-[60px] tracking-[-0.96px] text-foreground">
              <Link href="/dashboard" className="hover:underline cursor-pointer">
                <T context="assignment.breadcrumb.files">Files</T>
              </Link>
              <span>/</span>
              <Link href="/dashboard/home" className="hover:underline cursor-pointer">
                <T context="assignment.breadcrumb.assignments">Assignments</T>
              </Link>
              <span>/</span>
              <span className="text-foreground">{project.name || <T context="assignment.breadcrumb.untitled">Untitled Assignment</T>}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Add Content Button */}
              <Button
                onClick={() => setShowProjectContentPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <Plus className="w-4 h-4" />
                <T context="button.add_content">Add Content</T>
              </Button>
              
              {/* Discuss In Chat Button */}
              <Button
                onClick={handleDiscussInChat}
                className="bg-[hsl(var(--assignment-primary-blue))] text-[hsl(var(--assignment-primary-blue-text))] hover:bg-[hsl(var(--assignment-primary-blue))]/90 px-4 py-2 h-auto rounded-lg"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="text-sm">
                  <T context="assignment.header.discuss_chat">Discuss In Chat</T>
                </span>
              </Button>
            </div>
          </div>

          {/* Synopsis */}
          {project.description && (
            <p className="text-[18px] leading-normal text-foreground font-normal">
              {project.description}
            </p>
          )}
        </div>

        {/* Activity Section */}
        <div className="flex flex-col gap-5 mb-10">
          <h2 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground">
            <T context="assignment.activity.title">Activity</T>
          </h2>
          
          <Card className="bg-[hsl(var(--assignment-surface-container))] border-none rounded-xl p-5">
            <div className="flex flex-col gap-[10px]">

              {/* Task List */}
              <Card className="bg-[hsl(var(--assignment-bg))] border-none rounded-xl p-4 mt-2">
                <div className="flex items-end">
                  {/* Task List */}
                  <div className="flex flex-col gap-[5px] flex-1">
                    {taskWidgets.length === 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full border-2 border-[hsl(var(--assignment-outline-variant))] flex-shrink-0" />
                        <span className="text-base text-[hsl(var(--assignment-text-subtle))]">
                          <T context="assignment.activity.no_tasks">No tasks yet</T>
                        </span>
                      </div>
                    ) : (
                      taskWidgets.map((widget: any, index: number) => {
                        const isActive = widget.status === 'in_progress'
                        const isCompleted = widget.status === 'completed'
                        const isFailed = widget.status === 'failed'

                        return (
                          <React.Fragment key={widget.widget_id || index}>
                            {index > 0 && (
                              <div className="w-[2px] h-[22px] bg-[hsl(var(--assignment-outline-variant))] ml-[5px]" />
                            )}
                            <div className="flex items-center gap-3 mb-[5px] last:mb-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                              ) : isFailed ? (
                                <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                              ) : isActive ? (
                                <div className="w-3 h-3 rounded-full bg-[hsl(var(--assignment-brand-orange))] flex-shrink-0" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border-2 border-[hsl(var(--assignment-outline-variant))] flex-shrink-0" />
                              )}
                              <span className={`text-base ${
                                isActive 
                                  ? 'text-[hsl(var(--assignment-text-subtle))]' 
                                  : isCompleted || isFailed
                                  ? 'text-foreground'
                                  : 'text-[hsl(var(--assignment-text-subtle))]'
                              }`}>
                                {widget.title || <T context="assignment.activity.unnamed_widget">Unnamed Widget</T>}
                              </span>
                            </div>
                          </React.Fragment>
                        )
                      })
                    )}
                  </div>
                </div>
              </Card>

              {/* A2A Notes Status Updates - Display ALL notes */}
              {a2aNotes && a2aNotes.length > 0 && (
                <Card className="bg-[hsl(var(--assignment-bg))] border-none rounded-xl p-4 mt-2">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-semibold text-foreground mb-2">
                      <T context="assignment.activity.status_updates">Status Updates</T>
                    </h3>
                    <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
                      {a2aNotes.map((note: any) => {
                        const report = note.report || {}
                        const announcement = report.announcement || report.summary
                        
                        return (
                          <div
                            key={note._id}
                            className="flex items-start gap-3 p-2 rounded-lg bg-[hsl(var(--assignment-surface-container))] border border-[hsl(var(--assignment-outline-variant))]"
                          >
                            <div className="mt-0.5 flex-shrink-0">
                              <Sparkles className="w-3 h-3 text-[hsl(var(--assignment-brand-orange))]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground line-clamp-2">
                                {announcement || <T context="assignment.activity.status_update_fallback">Status update</T>}
                              </p>
                              <p className="text-[10px] text-[hsl(var(--assignment-text-subtle))] mt-1">
                                {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true, short: true })}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </Card>
        </div>

        {/* Artifacts Section */}
        <div className="flex flex-col gap-5 mb-10">
          <h2 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground">
            <T context="assignment.artifacts.title">Artifacts</T>
          </h2>
          
          <div className="flex items-center justify-between gap-6">
            {artifacts.slice(0, 3).map((artifact, index) => (
              <Card
                key={artifact._id}
                onClick={() => handleOpenGallery(artifact._id, 'artifact')}
                className={`relative w-[348px] h-[129px] cursor-pointer border-2 rounded-xl overflow-hidden transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-transparent to-[hsl(var(--assignment-brand-orange))]/75 border-[hsl(var(--assignment-brand-orange))] opacity-75'
                    : 'bg-[hsl(var(--assignment-bg))] border-[hsl(var(--assignment-outline))] opacity-75'
                }`}
              >
                {/* Widget Icon - Top Right */}
                <div className="absolute top-[9px] right-[9px] w-6 h-6">
                  <Sparkles className="w-6 h-6 text-foreground" />
                </div>
                
                <CardContent className="p-2 h-full flex flex-col justify-between">
                  <div className="flex flex-col gap-1 pr-8">
                    <h3 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground line-clamp-1">
                      {artifact.title || <T context="assignment.artifacts.artifact_name_fallback">artifact name</T>}
                    </h3>
                    <p className={`text-base leading-5 ${
                      index === 0 ? 'text-foreground' : 'text-[hsl(var(--assignment-text-subtle))]'
                    }`}>
                      {widgets.find(w => w._id === artifact.widgetId)?.title || <T context="assignment.artifacts.widget_name_fallback">project/widget name as a tag</T>}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-base text-foreground">
                      {(() => {
                        const artifactType = artifact.type || 'artifact'
                        const formattedType = artifactType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
                        const updatedAt = artifact.updatedAt || artifact._creationTime || Date.now()
                        const relativeTime = formatDistanceToNow(new Date(updatedAt), { addSuffix: true, short: true })
                        return `${formattedType} • ${relativeTime}`
                      })()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenGallery(artifact._id, 'artifact')
                      }}
                    >
                      <ArrowUpRight className={`w-6 h-6 ${
                        index === 0 
                          ? 'text-[hsl(var(--assignment-accent-orange-text))]' 
                          : 'text-[hsl(var(--assignment-outline))]'
                      }`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Fill empty slots if less than 3 artifacts */}
            {artifacts.length < 3 && Array.from({ length: 3 - artifacts.length }).map((_, i) => (
              <Card
                key={`empty-${i}`}
                className="w-[348px] h-[129px] bg-[hsl(var(--assignment-bg))] border-2 border-[hsl(var(--assignment-outline))] opacity-75 rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* Files Section */}
        <div className="flex flex-col gap-5">
          <h2 className="text-2xl font-semibold leading-9 tracking-[-0.72px] text-foreground">
            <T context="assignment.files.title">Files</T>
          </h2>
          
          <div className="flex flex-col">
            {/* Table Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--assignment-outline-variant))]">
              <div className="flex items-center gap-3 w-[400px]">
                <Checkbox />
                <span className="text-sm font-semibold text-[hsl(var(--assignment-on-surface-variant))]">
                  <T context="assignment.files.table.name">Name</T>
                </span>
                <ChevronUp className="w-6 h-6 text-[hsl(var(--assignment-on-surface-variant))]" />
              </div>
              <div className="flex items-center gap-3 w-[120px]">
                <span className="text-sm font-semibold text-[hsl(var(--assignment-on-surface-variant))]">
                  <T context="assignment.files.table.type">Type</T>
                </span>
                <ChevronUp className="w-6 h-6 text-[hsl(var(--assignment-on-surface-variant))]" />
              </div>
              <div className="flex items-center gap-3 w-[300px]">
                <span className="text-base text-foreground">
                  <T context="assignment.files.table.last_opened">Last opened</T>
                </span>
                <ChevronUp className="w-6 h-6 text-[hsl(var(--assignment-on-surface-variant))]" />
              </div>
            </div>

            {/* Table Rows */}
            {galleryItems.slice(0, 3).map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between px-4 py-2 bg-[hsl(var(--assignment-surface-container))] border-b border-[hsl(var(--assignment-outline-variant))] last:border-b-0"
              >
                <div className="flex items-center gap-3 w-[400px]">
                  <Checkbox />
                  <span className="text-sm font-semibold text-[hsl(var(--assignment-on-surface-variant))]">
                    {item.title || <T context="assignment.files.untitled">Untitled</T>}
                  </span>
                </div>
                <div className="w-[120px]">
                  <span className="text-sm font-semibold text-[hsl(var(--assignment-on-surface-variant))]">
                    {item.itemType === 'artifact' ? (
                      <T context="assignment.files.type.artifact">Artifact</T>
                    ) : item.itemType === 'widget' ? (
                      <T context="assignment.files.type.widget">Widget</T>
                    ) : (
                      <T context="assignment.files.type.chat">Chat</T>
                    )}
                  </span>
                </div>
                <div className="w-[300px]">
                  <span className="text-base text-foreground">
                    {new Date(item.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Project Content Management Panel */}
      {userId && project && (
        <ContentAttachmentPanel
          projectId={projectId as Id<'projects'>}
          userId={userId}
          isOpen={showProjectContentPanel}
          onClose={() => setShowProjectContentPanel(false)}
          attachedNoteIds={project.noteIds || []}
          attachedArtifactIds={project.artifactIds || []}
          attachedStardustIds={project.stardustIds || []}
          attachedShardIds={project.shardIds || []}
        />
      )}
    </div>
  )
}

export default function AssignmentPage() {
  return <AssignmentPageContent />
}

