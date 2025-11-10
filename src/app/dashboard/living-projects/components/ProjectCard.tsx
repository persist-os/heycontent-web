'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { DeleteProjectModal } from '../[projectId]/components/DeleteProjectModal'
import { formatDistanceToNow } from '../[projectId]/components/utils/dateFormatting'
import { getProjectStatus } from '../[projectId]/components/utils/widgetStyling'

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
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteProject = useMutation(api.projectsMutations.batchDeleteProjects)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000 // Less than 24 hours

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

  return (
    <div 
      className="group cursor-pointer transition-all duration-500 hover:scale-[1.02] relative"
      onClick={onClick}
    >
      {/* Main Card */}
      <div className="bg-card border border-border/50 hover:border-border transition-colors duration-300 relative overflow-hidden">
        {/* Status Indicator - Subtle line */}
        <div className={`h-px w-full ${
          status.stage === 'early' ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent' :
          status.stage === 'active' ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
        }`} />
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                  {project.name}
                </h3>
                <div className="mt-1 text-xs text-muted-foreground/70 font-mono tracking-wide">
                  {status.label.toLowerCase()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* 3-dots menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    title="More options"
                    onClick={handleMenuClick}
                    className="p-1 hover:bg-muted/50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-8 bg-background border border-border rounded-md shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={handleDeleteClick}
                        disabled={isDeleting}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {project.description && (
              <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 mt-3">
                {project.description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border/30">
            {hasFingerprint ? (
              /* Active Project */
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    Intelligence active
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                    Open
                  </div>
                  {isRecent && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full ml-auto animate-pulse" />
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
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                  Begin
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
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
