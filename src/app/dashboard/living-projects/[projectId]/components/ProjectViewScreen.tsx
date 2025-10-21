'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { useRouter } from 'next/navigation'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { api } from '@/convex/_generated/api'
import { useProjectFingerprint } from '@/app/dashboard/living-projects/hooks/useProjectFingerprint'
import { useAnalytics } from '@/hooks/useAnalytics'
import { T } from '@/components/translation'
import { 
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  RefreshCw,
  Trash2,
  LayoutGrid,
  List,
  FileText,
  Plus
} from 'lucide-react'
import { ConstellationTransition } from '@/app/dashboard/living-projects/components/widgets/ConstellationTransition'
import { DeleteProjectModal } from './DeleteProjectModal'
import { WidgetConfig } from '@/types/projectWidgets'
import { useWidgetGeneration } from './hooks/useWidgetGeneration'
import { useProjectActions } from './hooks/useProjectActions'
import { WidgetDetailsPanel } from './widgets/WidgetDetailsPanel'
import { ContentDetailsPanel } from './widgets/ContentDetailsPanel'
import { WidgetGenerationLoader } from './widgets/WidgetGenerationLoader'
import { ConstellationCanvas } from './widgets/ConstellationCanvas'
import { formatDistanceToNow } from './utils/dateFormatting'
import { useWidgetRunner } from '@/app/dashboard/living-projects/hooks/useWidgetRunner'
import { ContentAttachmentPanel } from '@/app/dashboard/living-projects/components/ContentAttachmentPanel'
import { ProjectContentSection } from './ProjectContentSection'
import { ProjectGridView } from './ProjectGridView'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProjectViewScreenProps {
  projectId: string
}

type ViewMode = "constellation" | "grid";

export function ProjectViewScreen({ projectId }: ProjectViewScreenProps) {
  const { trackProjectOpen } = useAnalytics()
  const [userId, setUserId] = useState<string | null>(null)
  const [showTransition, setShowTransition] = useState(false)
  const [highlightedWidget, setHighlightedWidget] = useState<string | null>(null)
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null)
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showProjectContentPanel, setShowProjectContentPanel] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("constellation")
  const [widgetPanelWidth, setWidgetPanelWidth] = useState(384) // Default 24rem
  const [selectedContent, setSelectedContent] = useState<{ item: any; type: 'note' | 'conversation' | 'crystal' | 'shard' } | null>(null)
  const [contentPanelWidth, setContentPanelWidth] = useState(448) // Default 28rem
  const menuRef = useRef<HTMLDivElement>(null)

  // Track project open
  useEffect(() => {
    if (projectId) trackProjectOpen(projectId)
  }, [projectId, trackProjectOpen])

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

  // Data fetching
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? { 
      projectId: projectId as any,
      userId: userId,
      includeContent: true // Include content items for constellation view
    } : 'skip'
  )

  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  const { fingerprint: currentFingerprint } = useProjectFingerprint(projectId as any)
  
  // Business logic hooks
  const { isGenerating, regenerateWidgets } = useWidgetGeneration({
    projectId,
    currentFingerprint,
    hasWidgets: !!projectWidgets?.widgets?.length
  })

  const { editFingerprint, goBack, deleteProjectAction } = useProjectActions(projectId)

  // Handle content opening with mutual exclusion (closes widget panel)
  const handleContentOpen = (id: string, type: string) => {
    const contentItem = (project as any)?.contentItems?.find((item: any) => 
      (item._contentId || item._id) === id
    )
    if (contentItem) {
      setSelectedContent({ item: contentItem, type: type as 'note' | 'conversation' | 'crystal' | 'shard' })
      // Close widget panel if open (mutual exclusion)
      if (showWidgetPanel) {
        setShowWidgetPanel(false)
        setSelectedWidget(null)
      }
    }
  };

  // Handle layout reset
  const handleLayoutReset = async () => {
    if (!userId) return;
    
    try {
      // Clear the stored layout
      await fetch('/api/convex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'runMutation',
          name: 'projectsMutations:clearConstellationLayout',
          args: { projectId, userId }
        })
      });
      
      console.log('Layout reset successfully');
    } catch (error) {
      console.error('Failed to reset layout:', error);
    }
  };

  // Widget runner hook
  const router = useRouter()
  const { executeWidget, isRunning: isWidgetRunning, lastResult } = useWidgetRunner()
  const [runningWidgetId, setRunningWidgetId] = useState<string | null>(null)

  // Event handlers - with mutual exclusion (closes content panel)
  const handleWidgetClick = (widget: WidgetConfig) => {
    setSelectedWidget(widget)
    setShowWidgetPanel(true)
    // Close content panel if open (mutual exclusion)
    if (selectedContent) {
      setSelectedContent(null)
    }
  }

  const handleWidgetHover = (widgetId: string | null) => {
    setHighlightedWidget(widgetId)
  }

  const handleWidgetRun = async (widgetId: string) => {
    try {
      setRunningWidgetId(widgetId)
      
      // Find widget by Convex ID
      const widget = projectWidgets?.widgets.find(
        (w: any) => w._id === widgetId  // ✅ Use Convex ID (_id)
      ) as WidgetConfig | undefined
      
      if (!widget) {
        console.error('Widget not found:', widgetId)
        return
      }

      const result = await executeWidget({
        widgetId,  // ✅ Already Convex ID from FloatingWidgetCard
        projectId
      })

      if (result) {
        // Success! Open the details panel to show the output
        console.log('Widget executed successfully:', result)
        
        // Set selected widget and open panel
        setSelectedWidget(widget)
        setShowWidgetPanel(true)
      }
    } catch (error) {
      console.error('Failed to run widget:', error)
    } finally {
      setRunningWidgetId(null)
    }
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

  // Handle view mode toggle
  const handleViewModeToggle = (mode: ViewMode) => {
    setViewMode(mode)
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

  const lastEvolution = currentFingerprint?.last_evolution 
    ? formatDistanceToNow(new Date(currentFingerprint.last_evolution), { addSuffix: true })
    : 'Never'

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

                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted/20 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeToggle("constellation")}
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm",
                      viewMode === "constellation"
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <T context="view.constellation">Constellation</T>
                  </button>
                  <button
                    onClick={() => handleViewModeToggle("grid")}
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm",
                      viewMode === "grid"
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <List className="w-4 h-4" />
                    <T context="view.grid">Grid View</T>
                    {project && (
                      <span className="ml-1 text-xs bg-muted/50 px-2 py-0.5 rounded-full">
                        {(projectWidgets?.widgets?.length || 0) + ((project as any)?.contentItems?.length || 0)}
                      </span>
                    )}
                  </button>
                </div>

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

          {viewMode === "constellation" && (
            <>
              {isGenerating ? (
                <WidgetGenerationLoader />
              ) : currentFingerprint ? (
                <ConstellationCanvas
                  widgets={(projectWidgets?.widgets || []) as WidgetConfig[]}
                  userId={userId}
                  projectId={projectId}
                  onWidgetClick={handleWidgetClick}
                  onWidgetHover={handleWidgetHover}
                  highlightedWidget={highlightedWidget}
                  showWidgetPanel={showWidgetPanel}
                  onWidgetRun={handleWidgetRun}
                  runningWidgetId={runningWidgetId}
                  selectedWidget={selectedWidget}
                  contentItems={(project as any)?.contentItems || []}
                  storedLayout={(project as any)?.constellationLayout}
                  onContentOpen={handleContentOpen}
                  onLayoutReset={handleLayoutReset}
                  widgetPanelWidth={widgetPanelWidth}
                  selectedContent={selectedContent}
                  contentPanelWidth={contentPanelWidth}
                />
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-muted-foreground mb-2">
                      <T context="error.no_fingerprint">No fingerprint available</T>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <T context="error.complete_discovery">Please complete the project discovery process</T>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {viewMode === "grid" && (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-br from-background to-muted/10 rounded-lg border border-border">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">
                          <T context="grid.title">Project Items</T>
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          <T context="grid.description">All your widgets, notes, conversations, crystals, and shards in a structured view</T>
                        </p>
                      </div>
                      <button
                        onClick={() => handleViewModeToggle("constellation")}
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <T context="button.back_to_constellation">Back to Constellation</T>
                      </button>
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
                        onWidgetRun={handleWidgetRun}
                        runningWidgetId={runningWidgetId}
                        onContentOpen={handleContentOpen}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Transition overlay */}
          <ConstellationTransition
            isActive={showTransition}
            onComplete={() => setShowTransition(false)}
            duration={3000}
          />
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

      <WidgetDetailsPanel
        widget={selectedWidget}
        isOpen={showWidgetPanel}
        onClose={() => {
          setShowWidgetPanel(false)
          setSelectedWidget(null)
        }}
        projectId={projectId}
        width={widgetPanelWidth}
        onWidthChange={setWidgetPanelWidth}
      />

      <ContentDetailsPanel
        item={selectedContent?.item || null}
        itemType={selectedContent?.type || null}
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
        projectId={projectId}
        width={contentPanelWidth}
        onWidthChange={setContentPanelWidth}
      />

      {/* Project Content Management Panel */}
      {userId && project && (
        <ContentAttachmentPanel
          projectId={projectId as any}
          userId={userId}
          isOpen={showProjectContentPanel}
          onClose={() => setShowProjectContentPanel(false)}
          attachedNoteIds={project.noteIds || []}
          attachedConversationIds={project.conversationIds || []}
          attachedCrystalIds={project.crystalIds || []}
          attachedShardIds={project.shardIds || []}
        />
      )}
    </>
  )
}