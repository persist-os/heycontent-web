'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { api } from '@/convex/_generated/api'
import { useAnalytics } from '@/hooks/useAnalytics'
import { T } from '@/components/translation'
import { 
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  RefreshCw,
  Trash2,
  FileText,
  Plus
} from 'lucide-react'
import { DeleteProjectModal } from './DeleteProjectModal'
import { WidgetConfig } from '@/types/projectWidgets'
import { useWidgetGeneration } from './hooks/useWidgetGeneration'
import { useProjectActions } from './hooks/useProjectActions'
import { UnifiedDetailsPanel, usePanelInstances } from './widgets/unified-panel/UnifiedDetailsPanel'
import { ContentAttachmentPanel } from '@/app/dashboard/living-projects/components/ContentAttachmentPanel'
import { ProjectGridView } from './ProjectGridView'
import { motion } from 'framer-motion'

interface ProjectViewScreenProps {
  projectId: string
}

export function ProjectViewScreen({ projectId }: ProjectViewScreenProps) {
  const { trackProjectOpen } = useAnalytics()
  const [userId, setUserId] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showProjectContentPanel, setShowProjectContentPanel] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Validate projectId - must be a valid Convex ID (not "project-discovery" or other invalid values)
  const isValidProjectId = projectId && projectId !== 'project-discovery' && projectId.length > 0
  
  // Unified panel management (replaces separate widget/content panel state)
  const {
    instances: panelInstances,
    openPanel,
    updateInstance,
    closeInstance
  } = usePanelInstances()

  // Track project open
  useEffect(() => {
    if (isValidProjectId) trackProjectOpen(projectId)
  }, [projectId, isValidProjectId, trackProjectOpen])

  // Get user ID on component mount
  useEffect(() => {
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

  // Data fetching - skip if projectId is invalid
  const project = useQuery(
    api.projectsQueries.getById,
    isValidProjectId && userId ? { 
      projectId: projectId as any,
      userId: userId,
      includeContent: true // Include content items for grid view
    } : 'skip'
  )

  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    isValidProjectId ? { projectId: projectId as any } : 'skip'
  )

  // Fetch assignment fingerprint
  const assignmentFingerprint = useQuery(
    api.assignmentFingerprintQueries.getByProject,
    isValidProjectId && userId ? { 
      projectId: projectId as any,
      userId: userId
    } : 'skip'
  )

  // Business logic hooks
  const { isGenerating, regenerateWidgets } = useWidgetGeneration({
    projectId,
    assignmentFingerprint,
    hasWidgets: !!projectWidgets?.widgets?.length
  })

  const { editFingerprint, goBack, deleteProjectAction } = useProjectActions(projectId)

  // Handle content opening with mutual exclusion (closes widget panel)
  const handleContentOpen = (id: string, type: string) => {
    const contentItem = (project as any)?.contentItems?.find((item: any) => 
      (item._contentId || item._id) === id
    )
    if (contentItem) {
      // Open unified panel at content position (center of viewport)
      const position = {
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 150
      }
      openPanel(contentItem, type as 'note' | 'artifact' | 'stardust' | 'shard', position)
    }
  };

  // Event handlers - unified panel opens at widget/content position
  const handleWidgetClick = (widget: WidgetConfig) => {
    // Open panel at widget position (center of viewport as fallback)
    const position = {
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 150
    }
    openPanel(widget, 'widget', position)
  }

  const handleDeleteProject = async () => {
    try {
      setIsDeleting(true)
      await deleteProjectAction()
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }


  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <button 
            onClick={goBack}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-6"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
            <T context="button.back">Back</T>
          </button>
          
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse mx-auto" />
              <h2 className="text-xl font-light text-foreground">
                <T context="loading.project">Loading project</T>
              </h2>
              <p className="text-muted-foreground/60 text-sm">
                <T context="loading.description">Preparing your project intelligence...</T>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Main container */}
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Back button */}
              <button 
                onClick={goBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                title="Back to projects"
              >
                <ArrowLeft className="w-4 h-4" />
                <T context="button.back_to_projects">Back to projects</T>
              </button>

              {/* Project info */}
              <div className="flex-1 text-center px-8">
                <h1 className="text-2xl font-medium text-foreground mb-1">
                  {project?.name || <T context="project.default_title">Project Dashboard</T>}
                </h1>
                <p className="text-sm text-muted-foreground/70">
                  {project?.description || <T context="project.default_description">AI-powered project management and insights</T>}
                </p>
                <div className="text-xs text-muted-foreground/60 mt-2">
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <T context="status.generating">Generating widgets...</T>
                    </span>
                  ) : (
                    <>
                      <T context="status.active">Active</T>: {projectWidgets?.widgets?.length || 0} <T context="label.widgets">widgets</T> • {projectWidgets?.categories?.length || 0} <T context="label.categories">categories</T>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Add Content Button - Prominent */}
                <button
                  onClick={() => setShowProjectContentPanel(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                  title="Add content to project"
                >
                  <Plus className="w-4 h-4" />
                  <T context="button.add_content">Add Content</T>
                </button>

                {/* Menu */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 hover:bg-muted/50 rounded-md transition-colors"
                    title="More options"
                  >
                    <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                  </button>
                  
                  {showMenu && (
                    <div className="absolute right-0 top-12 bg-background border border-border rounded-md shadow-lg z-30 min-w-[200px]">
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowProjectContentPanel(true)
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <T context="menu.manage_content">Manage content</T>
                      </button>
                      <div className="border-t border-border/20 my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          editFingerprint()
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        <T context="menu.resume_discovery">Resume Discovery</T>
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          regenerateWidgets()
                        }}
                        disabled={isGenerating}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="w-4 h-4" />
                        {isGenerating ? <T context="menu.generating">Generating...</T> : <T context="menu.regenerate_widgets">Regenerate widgets</T>}
                      </button>
                      <div className="border-t border-border/20 my-1" />
                      <button
                        onClick={() => {
                          setShowMenu(false)
                          setShowDeleteModal(true)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <T context="menu.delete_project">Delete project</T>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="bg-gradient-to-br from-background to-muted/10 rounded-lg border border-border">
                <div className="p-6 border-b border-border">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      <T context="grid.title">Project Items</T>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      <T context="grid.description">All your widgets, notes, conversations, crystals, and shards in a structured view</T>
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  {userId && (
                    <ProjectGridView
                      projectId={projectId}
                      userId={userId}
                      widgets={(projectWidgets?.widgets || []) as WidgetConfig[]}
                      contentItems={(project as any)?.contentItems || []}
                      onWidgetClick={handleWidgetClick}
                      onContentOpen={handleContentOpen}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        projectName={project?.name || 'Project'}
        isDeleting={isDeleting}
      />

      {/* Unified Details Panel - handles widgets, notes, conversations, crystals, shards */}
      <UnifiedDetailsPanel
        instances={panelInstances}
        onInstanceUpdate={updateInstance}
        onInstanceClose={closeInstance}
        projectId={projectId}
      />

      {/* Project Content Management Panel */}
      {userId && project && (
        <ContentAttachmentPanel
          projectId={projectId as any}
          userId={userId}
          isOpen={showProjectContentPanel}
          onClose={() => setShowProjectContentPanel(false)}
          attachedNoteIds={project.noteIds || []}
          attachedArtifactIds={project.artifactIds || []}
          attachedStardustIds={project.stardustIds || []}
          attachedShardIds={project.shardIds || []}
        />
      )}
    </>
  )
}