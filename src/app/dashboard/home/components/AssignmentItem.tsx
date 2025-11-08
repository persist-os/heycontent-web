'use client'

import React, { useMemo, useState } from 'react'
import { Pencil, Plus, Trash, Pause, Image, Sparkles, MoreVertical, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AssignmentItemProps {
  project: any
  userId?: string | null
}

/**
 * AssignmentItem - Individual assignment card with progress tracking
 * 
 * Displays:
 * - Assignment title & timestamp
 * - Tags and metadata (artifacts/widgets counts)
 * - Progress bar
 * - Action buttons (Open Gallery, Open Conversation, etc.)
 */
export function AssignmentItem({ project, userId }: AssignmentItemProps) {
  const router = useRouter()
  const [isPausing, setIsPausing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Mutations
  const toggleArchive = useMutation(api.projectsMutations.toggleArchive)
  const deleteProject = useMutation(api.projectsMutations.deleteProject)
  const createConversation = useMutation(api.chatMutations.createConversation)
  
  // Get project artifacts and widgets for metadata display
  const artifacts = useQuery(
    api.artifactQueries.getProjectArtifacts,
    project?._id ? { projectId: project._id as any } : 'skip'
  )
  
  const widgets = useQuery(
    api.widgetsQueries.getProjectWidgets,
    userId && project?._id ? {
      projectId: project._id as any,
      userId,
      includeArchived: false
    } : 'skip'
  )
  
  // Get project conversation
  const projectConversation = useQuery(
    api.chatQueries.getProjectScopedConversation,
    project?._id && project?.userId ? { projectId: project._id, userId: project.userId } : 'skip'
  )

  // Calculate relative time
  const relativeTime = useMemo(() => {
    const now = Date.now()
    const diff = now - (project.updatedAt || project.createdAt)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours} hours ago`
    if (days < 7) return `${days} days ago`
    return new Date(project.updatedAt || project.createdAt).toLocaleDateString()
  }, [project])

  // Calculate progress (based on content count for now)
  const progress = useMemo(() => {
    const total = project.totalContent || 0
    if (total === 0) return 5
    // Simple heuristic: 10 items = 100% progress
    return Math.min(Math.floor((total / 10) * 100), 100)
  }, [project])

  // Handle pause/resume
  const handlePause = async () => {
    setIsPausing(true)
    try {
      await toggleArchive({
        projectId: project._id,
        userId: project.userId,
        archived: !project.archived
      })
    } catch (error) {
      console.error('Failed to pause/resume project:', error)
    } finally {
      setIsPausing(false)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteProject({ 
        projectId: project._id,
        userId: project.userId
      })
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get first item for gallery navigation
  const firstItemId = useMemo(() => {
    const firstArtifact = artifacts?.[0]
    const firstWidget = widgets?.[0]
    return firstArtifact?._id || firstWidget?._id || null
  }, [artifacts, widgets])

  return (
    <Card 
      className={cn(
        "group bg-card/50 backdrop-blur-sm border border-border/40 hover:border-border/60",
        "hover:bg-card/70 hover:shadow-lg transition-all duration-300 cursor-pointer",
        "min-h-[320px] flex flex-col overflow-hidden"
      )}
      onClick={() => router.push(`/dashboard/living-projects/${project._id}`)}
    >
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        
        {/* Header: Title + Timestamp */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {project.name || 'Untitled Assignment'}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
            {relativeTime}
          </span>
        </div>
        
        {/* Metadata Badges - Compact */}
        <div className="flex flex-wrap gap-1.5">
          {(project.noteCount > 0 || project.conversationCount > 0) && (
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-xs px-2 py-0.5">
              {project.noteCount || 0} notes • {project.conversationCount || 0} chats
            </Badge>
          )}
          {artifacts && artifacts.length > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs px-2 py-0.5 flex items-center gap-1">
              <Image className="w-3 h-3" aria-hidden="true" />
              {artifacts.length}
            </Badge>
          )}
          {widgets && widgets.length > 0 && (
            <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              {widgets.length}
            </Badge>
          )}
        </div>
        
        {/* Progress Section */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-foreground font-semibold">{progress}%</span>
          </div>
          
          {/* Progress Bar - More Subtle */}
          <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden relative">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/50 via-primary/60 to-primary-dark/60 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Action Buttons - Cleaner */}
        <div className="flex items-center gap-2 pt-4 mt-auto border-t border-border/30" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/dashboard/living-projects/${project._id}`)
            }}
            className="flex-1 h-8 text-xs font-medium"
          >
            Open
          </Button>
          
          {firstItemId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                router.push(`/dashboard/living-projects/${project._id}/gallery?id=${firstItemId}`)
              }}
              className="h-8 w-8 p-0"
              title="View Gallery"
            >
              <Image className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={async (e) => {
              e.stopPropagation()
              if (projectConversation?._id) {
                router.push(`/dashboard/thinking_lab?chatId=${projectConversation._id}`)
              } else {
                try {
                  const conversationId = await createConversation({
                    userId: project.userId,
                    title: `${project.name} - Conversation`,
                    projectId: project._id,
                    conversationType: "project_scoped"
                  })
                  
                  if (conversationId) {
                    router.push(`/dashboard/thinking_lab?chatId=${conversationId}`)
                  } else {
                    router.push(`/dashboard/thinking_lab?projectId=${project._id}`)
                  }
                } catch (error) {
                  console.error('Failed to create conversation:', error)
                  router.push(`/dashboard/thinking_lab?projectId=${project._id}`)
                }
              }
            }}
            className="h-8 w-8 p-0"
            disabled={!project._id}
            title="Open Chat"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
          </Button>
          
          {/* Secondary Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.status === "sleeping" ? (
                <DropdownMenuItem
                  onClick={async (e) => {
                    e.stopPropagation()
                    try {
                      setIsPausing(true)
                      const response = await fetch(`/api/projects/${project._id}/wake`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      })
                      if (!response.ok) {
                        throw new Error('Failed to wake project')
                      }
                    } catch (error) {
                      console.error('Failed to wake project:', error)
                    } finally {
                      setIsPausing(false)
                    }
                  }}
                  disabled={isPausing}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Wake Project
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePause()
                  }}
                  disabled={isPausing}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  {project.archived ? 'Resume' : 'Pause'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this project and all its content. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>
    </Card>
  )
}


