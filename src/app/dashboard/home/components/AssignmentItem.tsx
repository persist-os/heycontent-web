'use client'

import React, { useMemo, useState } from 'react'
import { Pencil, Plus, Trash, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMutation } from 'convex/react'
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

interface AssignmentItemProps {
  project: any
}

/**
 * AssignmentItem - Individual assignment card with progress tracking
 * 
 * Displays:
 * - Assignment title & timestamp
 * - Tags
 * - Progress bar (simulated for now)
 * - Action buttons
 */
export function AssignmentItem({ project }: AssignmentItemProps) {
  const router = useRouter()
  const [isPausing, setIsPausing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Mutations
  const toggleArchive = useMutation(api.projectsMutations.toggleArchive)
  const deleteProject = useMutation(api.projectsMutations.deleteProject)

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

  return (
    <div className="w-full rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-4">
      
      {/* Header: Title + Timestamp */}
      <div className="flex items-start justify-between">
        <h3 
          className="text-xl font-semibold text-foreground cursor-pointer hover:text-foreground/80 transition-colors"
          onClick={() => router.push(`/dashboard/living-projects/${project._id}`)}
        >
          {project.name || 'Untitled Assignment'}
        </h3>
        <span className="text-sm text-muted-foreground">
          {relativeTime}
        </span>
      </div>
      
      {/* Tags */}
      <div className="flex flex-wrap gap-2">
        {project.description && (
          <span className="px-3 py-1 rounded-full bg-muted/40 text-sm text-muted-foreground">
            {project.description.length > 30 ? project.description.slice(0, 30) + '...' : project.description}
          </span>
        )}
        <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-sm text-primary-darker font-medium">
          {project.noteCount || 0} notes • {project.conversationCount || 0} chats
        </span>
      </div>
      
      {/* Progress Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Project Progress</span>
          <span className="text-foreground">{progress}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden relative">
          <div 
            className={cn(
              "absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/dashboard/living-projects/${project._id}`)}
          className="gap-2"
        >
          <Pencil className="w-4 h-4" />
          Edit Assignment
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={() => router.push(`/dashboard/living-projects/${project._id}`)}
          className="gap-2 bg-primary/20 text-primary-darker border border-primary/30 hover:bg-primary/30"
        >
          <Plus className="w-4 h-4" />
          New Widget
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePause}
          disabled={isPausing}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Pause className="w-4 h-4" />
          {project.archived ? 'Resume' : 'Pause'}
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="gap-2 ml-auto"
            >
              <Trash className="w-4 h-4" />
              Delete
            </Button>
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
      </div>
      
    </div>
  )
}


