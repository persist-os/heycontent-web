'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare, Sparkles, Lock, ArrowLeft } from 'lucide-react'
import { T } from '@/components/translation/T'
import type { Id } from '@/convex/_generated/dataModel'
import type { GalleryItem } from '@/types/gallery'
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

  // ✅ CRITICAL: Check project access FIRST before calling any queries that might throw
  const projectAccess = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    projectId && userId && typeof userId === 'string' && userId.trim().length > 0 ? {
      userId: userId.trim(),
      contentType: 'project',
      contentId: projectId
    } : 'skip'
  )
  
  // Determine if user has access (only call other queries if access is granted)
  const hasAccess = useMemo(() => {
    if (!userId || !projectId) return false;
    if (projectAccess === undefined) return undefined; // Still checking
    if (projectAccess === null) return false; // Access denied
    return true; // Has access (owner, editor, or viewer)
  }, [userId, projectId, projectAccess])
  
  // Fetch project data (ONLY if access is granted)
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId && typeof userId === 'string' && userId.trim().length > 0 && hasAccess === true ? {
      projectId: projectId as Id<'projects'>,
      userId: userId.trim(),
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

  // ✅ PRIMARY PATTERN: Component calls useQuery directly (not through hook)
  // Fetch artifacts (ONLY if access is granted)
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    projectId && userId && typeof userId === 'string' && userId.trim().length > 0 && hasAccess === true ? { 
      projectId: projectId as Id<'projects'>,
      userId: userId.trim()
    } : 'skip'
  );
  
  // Fetch widgets (ONLY if access is granted)
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    projectId && userId && typeof userId === 'string' && userId.trim().length > 0 && hasAccess === true ? { 
      projectId: projectId as Id<'projects'>, 
      userId: userId.trim(),
      includeArchived: true
    } : 'skip'
  );
  
  // Merge and normalize into unified list
  const galleryItems = useMemo(() => {
    const artifactItems: GalleryItem[] = (artifacts || [])
      .filter((a: any) => a && a._id)
      .map((a: any) => {
        let title = a.title;
        if (!title && a.data?.title) {
          title = a.data.title;
        }
        if (!title && a.type === 'report' && a.data?.markdown) {
          const match = a.data.markdown.match(/^#\s+(.+)$/m);
          if (match) {
            title = match[1].trim();
          }
        }
        if (!title) {
          title = a.type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Artifact';
        }
        return {
          ...a,
          itemType: 'artifact' as const,
          title,
          description: a.tags?.join(' • ') || `v${a.metadata?.version || 1}`,
          updatedAt: a.updatedAt || a._creationTime
        };
      });
    
    const widgetItems: GalleryItem[] = (widgets || [])
      .filter((w: any) => w && w._id && w.status !== 'deleted')
      .map((w: any) => ({
        ...w,
        itemType: 'widget' as const,
        title: w.title || 'Untitled Widget',
        description: w.description || 'No description',
        updatedAt: w.updatedAt || w._creationTime
      }));
    
    return [...artifactItems, ...widgetItems].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [artifacts, widgets]);
  
  // Separate artifacts and widgets
  const artifactItems = useMemo(() => 
    galleryItems.filter(item => item.itemType === 'artifact'),
    [galleryItems]
  );
  const widgetItems = useMemo(() => 
    galleryItems.filter(item => item.itemType === 'widget'),
    [galleryItems]
  );
  
  const isLoadingItems = artifacts === undefined || widgets === undefined;

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
    { label: 'Files', href: '/dashboard/notes' },
    { label: 'Assignments', href: '/dashboard/assignments' },
    { label: project?.name || 'Untitled Assignment' }
  ], [project])

  // ✅ Error handling: Show access denied message with back button (check BEFORE queries run)
  const isLoadingAccess = hasAccess === undefined && userId && projectId;
  if (hasAccess === false && !isLoadingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="bg-card/50 backdrop-blur-sm border border-destructive/50">
            <CardContent className="py-12 text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <Lock className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Access Denied</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  You don't have permission to view this assignment. This project may be private or you may need to be added as a collaborator.
                </p>
              </div>
              <Button
                onClick={() => router.push('/dashboard/home')}
                variant="outline"
                className="mt-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back to Assignments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

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
            {artifactItems.slice(0, 3).map((artifact, index) => (
              <AssignmentArtifactCard
                key={artifact._id}
                artifact={artifact}
                widgetTitle={widgetItems.find(w => w._id === artifact.widgetId)?.title}
                isHighlighted={index === 0}
                onClick={() => handleOpenGallery(artifact._id, 'artifact')}
              />
            ))}
            
            {/* Fill empty slots if less than 3 artifacts */}
            {artifactItems.length < 3 && Array.from({ length: 3 - artifactItems.length }).map((_, i) => (
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
          
          {widgetItems.length === 0 ? (
            <Card className="bg-[hsl(var(--assignment-surface-container))] border-none rounded-xl p-5">
              <p className="text-muted-foreground text-sm">
                <T context="assignment.widgets.empty">No widgets yet</T>
              </p>
            </Card>
          ) : (
            <div className="flex items-center justify-between gap-6">
              {widgetItems.slice(0, 3).map((widget, index) => (
                <AssignmentArtifactCard
                  key={widget._id}
                  artifact={{
                    _id: widget._id,
                    title: widget.title || 'Untitled Widget',
                    widgetId: widget._id,
                    type: 'widget',
                    updatedAt: widget.updatedAt,
                    _creationTime: widget._creationTime
                  }}
                  widgetTitle={widget.description || 'Widget'}
                  isHighlighted={index === 0}
                  onClick={() => handleOpenGallery(widget._id, 'widget')}
                />
              ))}
              
              {/* Fill empty slots if less than 3 widgets */}
              {widgetItems.length < 3 && Array.from({ length: 3 - widgetItems.length }).map((_, i) => (
                <Card
                  key={`empty-${i}`}
                  className="w-[348px] h-[129px] bg-[hsl(var(--assignment-bg))] border-2 border-[hsl(var(--assignment-stroke-focus))] opacity-75 rounded-[12px]"
                />
              ))}
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

