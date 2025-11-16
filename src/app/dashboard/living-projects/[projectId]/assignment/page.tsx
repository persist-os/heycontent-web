'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, Sparkles } from 'lucide-react'
import { T } from '@/components/translation/T'
import type { Id } from '@/convex/_generated/dataModel'
import { useGalleryItems } from '@/hooks/useGalleryItems'
import { formatDistanceToNow } from '../components/utils/dateFormatting'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { SectionHeader } from '@/components/ui/section-header'
import { TaskList } from '@/components/ui/task-list'
import { AssignmentArtifactCard } from '@/components/ui/assignment-artifact-card'
import { FilesTable, type FileItem } from '@/components/ui/files-table'
import { ContentCard, type ContentCardData } from '@/components/command-palette/ContentCard'

function AssignmentPageContent() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const [userId, setUserId] = useState<string | null>(null)

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

  // Transform taskWidgets to TaskList format
  const tasks = useMemo(() => {
    return taskWidgets.map((widget: any) => ({
      id: widget.widget_id || String(widget._id || Math.random()),
      label: widget.title || '',
      status: widget.status === 'in_progress' ? 'active' as const : 
              widget.status === 'completed' ? 'completed' as const :
              widget.status === 'failed' ? 'failed' as const :
              'pending' as const
    }))
  }, [taskWidgets])

  // Transform galleryItems to FilesTable format
  const fileItems = useMemo(() => {
    return galleryItems.slice(0, 3).map((item) => ({
      id: item._id,
      name: item.title || '',
      type: item.itemType || 'artifact',
      lastOpened: item.updatedAt || item._creationTime || Date.now()
    }))
  }, [galleryItems])

  // Breadcrumb items
  const breadcrumbItems = useMemo(() => [
    { label: 'Files', href: '/dashboard' },
    { label: 'Assignments', href: '/dashboard/home' },
    { label: project?.name || 'Untitled Assignment' }
  ], [project])

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
            <Breadcrumb items={breadcrumbItems} />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
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
          <SectionHeader title="Activity" />
          
          <Card className="bg-[hsl(var(--assignment-surface-container))] border-none rounded-xl p-5">
            <div className="flex flex-col gap-[10px]">
              {/* Task List */}
              <Card className="bg-[hsl(var(--assignment-bg))] border-none rounded-xl p-4 mt-2">
                <TaskList tasks={tasks} />
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
          <SectionHeader title="Artifacts" />
          
          <div className="flex items-center justify-between gap-6">
            {artifacts.slice(0, 3).map((artifact, index) => (
              <AssignmentArtifactCard
                key={artifact._id}
                artifact={artifact}
                widgetTitle={widgets.find(w => w._id === artifact.widgetId)?.title}
                isHighlighted={index === 0}
                onClick={() => handleOpenGallery(artifact._id, 'artifact')}
              />
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

        {/* Widgets Section */}
        <div className="flex flex-col gap-5 mb-10">
          <SectionHeader title="Widgets" />
          
          {widgets.length === 0 ? (
            <Card className="bg-[hsl(var(--assignment-surface-container))] border-none rounded-xl p-5">
              <p className="text-muted-foreground text-sm">
                <T context="assignment.widgets.empty">No widgets yet</T>
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {widgets.map((widget) => {
                const widgetCardData: ContentCardData = {
                  id: widget._id,
                  type: 'widget',
                  title: widget.title || 'Untitled Widget',
                  description: widget.description || 'No description',
                  metadata: {
                    createdAt: widget._creationTime,
                    updatedAt: widget.updatedAt,
                    priority: (widget as any).priority,
                    size: (widget as any).size,
                    theme: (widget as any).theme
                  }
                }
                
                return (
                  <ContentCard
                    key={widget._id}
                    content={widgetCardData}
                    onClick={() => handleOpenGallery(widget._id, 'widget')}
                    showMetadata={true}
                    variant="default"
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Files Section */}
        <div className="flex flex-col gap-5">
          <SectionHeader title="Files" />
          
          <FilesTable
            items={fileItems}
            onItemClick={(item) => {
              const galleryItem = galleryItems.find(gi => gi._id === item.id)
              if (galleryItem) {
                handleOpenGallery(item.id, galleryItem.itemType as 'artifact' | 'widget')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function AssignmentPage() {
  return <AssignmentPageContent />
}

