'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Trash2, Lock } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { DeleteProjectModal } from '../[projectId]/components/DeleteProjectModal'
import { formatDistanceToNow } from '../[projectId]/components/utils/dateFormatting'
import { getProjectStatus } from '../[projectId]/components/utils/widgetStyling'
import { Badge } from '@/components/ui/badge'
import { BaseCard } from '@/components/ui/base-card'
import { cn } from '@/lib/utils'
import type { Id } from '@/convex/_generated/dataModel'

interface ProjectCardProps {
  project: {
    _id: string
    name: string
    description?: string
    fingerprintId?: string
    createdAt: number
    updatedAt: number
  }
  onClick: () => void
  onDelete?: () => void
}

export function ProjectCard({ project, onClick, onDelete }: ProjectCardProps) {
  const { firebaseUser } = useAuth()
  const userId = firebaseUser?.uid
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteProject = useMutation(api.projectsMutations.batchDeleteProjects)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // ✅ FIX BLOCKER 1: Get user permission for visual distinction
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    userId && project._id ? {
      userId,
      contentType: 'project',
      contentId: project._id,
    } : 'skip'
  ) as 'owner' | 'edit' | 'read' | null
  
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000 // Less than 24 hours
  
  // ✅ FIX BLOCKER 1: Determine visual styling based on permission
  const isOwner = userPermission === 'owner'
  const isEditor = userPermission === 'edit'
  const isViewer = userPermission === 'read'
  const canDelete = isOwner // Only owner can delete
  
  // Border styling: Owner (solid), Editor (dashed), Viewer (dotted)
  const borderStyle = isOwner ? 'border-solid' : isEditor ? 'border-dashed' : isViewer ? 'border-dotted' : 'border-solid'
  
  // Badge styling
  const getBadgeVariant = () => {
    if (isOwner) return 'default' // Primary color
    if (isEditor) return 'secondary' // Blue
    if (isViewer) return 'outline' // Gray
    return 'outline'
  }
  
  const getBadgeText = () => {
    if (isOwner) return 'Owner'
    if (isEditor) return 'Can Edit'
    if (isViewer) return 'Can View'
    return ''
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])
  
  const status = getProjectStatus(project)

  const handleDelete = async () => {
    if (!firebaseUser?.uid) return
    
    try {
      setIsDeleting(true)
      await deleteProject({ 
        projectId: project._id as any, 
        userId: firebaseUser.uid 
      })
      
      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete()
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setShowMenu(false)
    setShowDeleteModal(true)
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setShowMenu(!showMenu)
  }

  const status = getProjectStatus(project)
  const timestamp = hasFingerprint 
    ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
    : formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })

  return (
    <div className="group relative">
      <BaseCard
        variant="project"
        title={project.name}
        timestamp={timestamp}
        summary={project.description}
        tag={status.label.toLowerCase()}
        onClick={onClick}
        className={cn(
          "transition-all duration-500 hover:scale-[1.02]",
          borderStyle,
          isViewer && "opacity-90"
        )}
      >
        {/* Status Indicator - Subtle line */}
        <div className={`absolute top-0 left-0 right-0 h-px ${
          status.stage === 'early' ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent' :
          status.stage === 'active' ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
        }`} />
        
        {/* Permission badge and lock icon - positioned near title */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {userPermission && (
            <Badge variant={getBadgeVariant()} className="text-xs">
              {getBadgeText()}
            </Badge>
          )}
          {isViewer && (
            <Lock className="w-3 h-3 text-muted-foreground" />
          )}
        </div>
        
        {/* Custom Footer */}
        <div className="pt-3 border-t border-border/30 mt-4">
          {hasFingerprint ? (
            /* Active Project */
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground/60">
                  Intelligence active
                </div>
              </div>
              <div className="text-right space-y-1 flex items-center gap-2">
                <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                  Open
                </div>
                {isRecent && (
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          ) : (
            /* Discovery Phase */
            <div className="flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="text-muted-foreground/60">
                  Awaiting discovery
                </div>
              </div>
              <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                Begin
              </div>
            </div>
          )}
        </div>

        {/* 3-dots menu */}
        <div className="absolute top-4 right-4" ref={menuRef}>
          <button
            title="More options"
            onClick={handleMenuClick}
            className="p-1 hover:bg-muted/50 rounded-md transition-colors opacity-0 group-hover:opacity-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            disabled={isDeleting}
          >
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-12 bg-background border border-border rounded-md shadow-lg z-10 min-w-[120px]">
              {/* Disable delete for non-owners */}
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting || !canDelete}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors min-h-[44px]",
                  canDelete 
                    ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    : "text-muted-foreground cursor-not-allowed opacity-50"
                )}
                title={!canDelete ? "Only project owner can delete" : undefined}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </BaseCard>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[12px]" />
      
      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        projectName={project.name}
        isDeleting={isDeleting}
      />
    </div>
  )
}
