'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useAuth } from '@/app/context/auth-context'
import { DeleteProjectModal } from '../[projectId]/components/DeleteProjectModal'
import { formatDistanceToNow } from '../[projectId]/components/utils/dateFormatting'
import { getProjectStatus, getCardDimensions } from '../[projectId]/components/utils/widgetStyling'
import { T } from '@/components/translation/T'
import { useTranslation } from '@/hooks/useTranslation'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  status?: string
  createdAt: number
  updatedAt: number
}

interface ProjectStarProps {
  project: Project
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (projectId: string | null) => void
  onDelete?: () => void
}

export function ProjectStar({
  project,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onClick,
  onHover,
  onDelete
}: ProjectStarProps) {
  const { firebaseUser } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteProject = useMutation(api.projectsMutations.deleteProject)
  const menuRef = useRef<HTMLDivElement>(null)
  
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000

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

  // Calculate card dimensions and status using shared utilities
  const { width, height } = getCardDimensions(size)
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

  // Show different levels of detail based on zoom
  const showDescription = scale > 0.8
  const showMetadata = scale > 1.0
  const showFullDetails = scale > 1.4

  // Calculate opacity based on importance and scale
  const baseOpacity = Math.max(0.7, importance)
  const scaleOpacity = Math.min(1, Math.max(0.6, scale))
  const finalOpacity = baseOpacity * scaleOpacity

  // Translated tooltips
  const { text: moreOptionsText } = useTranslation('More options', { targetLang: 'en', context: 'project.tooltip.more_options' })
  const { text: deleteText } = useTranslation('Delete', { targetLang: 'en', context: 'project.action.delete' })

  return (
    <div
      className="absolute cursor-pointer group transition-all duration-300 ease-out will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - height/2}px`,
        width: `${width}px`,
        height: `${height}px`,
        opacity: finalOpacity
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(project._id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Main Card */}
      <div className={`
        relative w-full h-full rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${status.borderColor} ${status.bgGradient}
        ${isHighlighted ? status.activeGlow : status.glowColor}
        ${isHighlighted ? 'ring-2 scale-[1.01]' : 'ring-1'}
      `}>
        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />

        {/* Content */}
        <div className="relative p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 mb-3">
            <div className="flex items-start justify-between mb-1">
              <h3 className={`
                font-medium text-foreground leading-tight transition-colors duration-300
                group-hover:text-blue-600 dark:group-hover:text-blue-400
                ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
              `}>
                {project.name}
              </h3>
              <div className="flex items-center gap-1">
                {/* 3-dots menu - only show at medium zoom and above */}
                {scale > 0.8 && (
                  <div className="relative" ref={menuRef}>
                    <button
                      title={moreOptionsText}
                      onClick={handleMenuClick}
                      className="p-1 hover:bg-muted/50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      disabled={isDeleting}
                    >
                      <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 top-6 bg-background border border-border rounded-md shadow-lg z-20 min-w-[100px]">
                        <button
                          onClick={handleDeleteClick}
                          disabled={isDeleting}
                          className="w-full px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                          <T context="project.action.delete">Delete</T>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
                {status.label}
              </span>
              {isRecent && hasFingerprint && (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Description - shown at medium zoom and above */}
          {showDescription && project.description && (
            <div className="flex-1 mb-3">
              <p className={`
                text-muted-foreground/80 leading-relaxed
                ${size === 'large' ? 'text-sm' : 'text-xs'}
                ${showFullDetails ? 'line-clamp-none' : 'line-clamp-2'}
              `}>
                {project.description}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer metadata - shown at high zoom */}
          {showMetadata && (
            <div className="flex-shrink-0 pt-2 border-t border-border/20">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    {hasFingerprint ? (
                      <T context="project.status.intelligence_active">Intelligence active</T>
                    ) : (
                      <T context="project.status.awaiting_discovery">Awaiting discovery</T>
                    )}
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(hasFingerprint ? project.updatedAt : project.createdAt), { short: true })}
                  </div>
                </div>
                {showFullDetails && (
                  <div className="text-right space-y-1">
                    <div className="text-muted-foreground/80">
                      {hasFingerprint ? (
                        <T context="project.action.explore">Explore</T>
                      ) : (
                        <T context="project.action.begin">Begin</T>
                      )}
                    </div>
                    <div className="text-muted-foreground/50 font-mono text-xs">
                      v{importance.toFixed(1)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Minimal footer for low zoom */}
          {!showMetadata && (
            <div className="flex-shrink-0 pt-2">
            <div className="text-xs text-muted-foreground/50 font-mono">
              {formatDistanceToNow(new Date(hasFingerprint ? project.updatedAt : project.createdAt), { short: true })}
            </div>
            </div>
          )}
        </div>

        {/* Project Status Indicators - Living Projects states */}
        {project.status === 'working' && (
          <div 
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/50"
            title="Working - AI actively executing"
          />
        )}
        {project.status === 'sleeping' && (
          <div 
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-500/50"
            title="Sleeping - Budget exceeded or paused"
          />
        )}
        {project.status === 'stable' && (
          <div 
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-lg shadow-emerald-500/50"
            title="Stable - All work complete, ready to resume"
          />
        )}
        
        {/* Importance indicator - subtle corner accent (only if no status indicator) */}
        {!project.status && (
          <div 
            className={`
              absolute top-0 right-0 w-3 h-3 rounded-bl-lg rounded-tr-lg
              transition-opacity duration-300
              ${importance > 0.7 ? 'bg-blue-400/30' : importance > 0.4 ? 'bg-blue-400/20' : 'bg-blue-400/10'}
              ${isHighlighted ? 'opacity-100' : 'opacity-60'}
            `}
          />
        )}
      </div>

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
