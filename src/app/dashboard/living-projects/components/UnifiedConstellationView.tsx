'use client'

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from './CreateProjectModal'
import { CreateWidgetModal } from './CreateWidgetModal'
import { ProjectSpaceBoundary } from './ProjectSpaceBoundary'
import { ProjectOptionsModal } from './ProjectOptionsModal'
import { MultiLevelWidget } from './MultiLevelWidget'
import { WidgetCard } from './WidgetCard'
import { WidgetDetailsPanel } from './WidgetDetailsPanel'
import { ConnectionLines } from './ConnectionLines'
import { ConstellationControls } from './ConstellationControls'
import { ConstellationMinimap } from './ConstellationMinimap'
import { LoadingState } from './LoadingState'
import { useStaticConstellationLayout } from '../hooks/useStaticConstellationLayout'
import { useMultiLevelPanZoom, ViewMode } from '../hooks/useMultiLevelPanZoom'
import { useWidgetOrbitalLayout } from '../hooks/useWidgetOrbitalLayout'
import { useProjectStates } from '../hooks/useProjectStates'
import { WidgetConfig } from '@/types/projectWidgets'
import { getApiKey } from '@/app/lib/api-helpers'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
  // Static positioning fields
  position_x: number
  position_y: number
  space_radius: number
}

interface UnifiedConstellationViewProps {
  initialProjectId?: string
}

export function UnifiedConstellationView({ initialProjectId }: UnifiedConstellationViewProps = {}) {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCreateWidgetModal, setShowCreateWidgetModal] = useState(false)
  const [highlightedProject, setHighlightedProject] = useState<string | null>(null)
  const [highlightedWidget, setHighlightedWidget] = useState<string | null>(null)
  const [showProjectOptions, setShowProjectOptions] = useState(false)
  const [selectedProject, setSelectedProject] = useState<{ id: string; name: string } | null>(null)
  const [isGeneratingWidgets, setIsGeneratingWidgets] = useState(false)
  const [widgetGenerationError, setWidgetGenerationError] = useState<string | null>(null)
  const hasAttemptedGenerationRef = useRef<Set<string>>(new Set()) // Track attempted generations per project
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  // Fetch user's projects
  const projects = useQuery(
    api.projectsQueries.getProjectsForUser,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  ) as Project[] | undefined

  // Generate constellation layout using static positions
  const layout = useStaticConstellationLayout(projects || [])
  
  // Get project states for visual styling
  const projectStates = useProjectStates(projects || [])
  
  // Multi-level pan/zoom with view mode switching
  const {
    containerRef,
    transform,
    viewMode,
    focusedProjectId,
    shouldShowProjectDetail,
    ZOOM_THRESHOLD_PROJECT_DOTS,
    ZOOM_THRESHOLD_PROJECT_CARDS,
    ZOOM_THRESHOLD_WIDGET_VISIBILITY,
    ZOOM_THRESHOLD_WIDGET_DETAIL,
    ZOOM_THRESHOLD_PROJECT_FOCUS,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint,
    focusOnProject,
    isProjectInFocus
  } = useMultiLevelPanZoom({
    canvasWidth: layout.canvasWidth,
    canvasHeight: layout.canvasHeight,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
    onProjectFocus: (projectId) => {
      setHighlightedProject(projectId)
    },
    onReset: () => {
      // Navigate back to main constellation view
      router.push('/dashboard/living-projects')
    }
  })

  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get real widget data for the focused project or initial project
  const currentProjectId = focusedProjectId || initialProjectId
  const rawWidgets = useQuery(
    api.projectWidgetsQueries.getWidgetsByProject,
    currentProjectId && firebaseUser?.uid 
      ? { projectId: currentProjectId as any, userId: firebaseUser.uid }
      : 'skip'
  )

  // Convert Convex widget data to WidgetConfig format
  const widgets: WidgetConfig[] = useMemo(() => {
    if (!rawWidgets) return []
    
    return rawWidgets.map(widget => ({
      // Core Identification
      widget_id: widget.widget_id,
      project_id: widget.project_id,
      user_id: widget.user_id,
      fingerprint_id: widget.fingerprint_id,
      
      // Widget Configuration
      widget_type: widget.widget_type,
      title: widget.title,
      description: widget.description,
      category: widget.category,
      
      // Layout & Positioning
      priority: widget.priority,
      size: widget.size as 'small' | 'medium' | 'large' | 'xlarge',
      theme: widget.theme as 'warm' | 'clean' | 'professional' | 'creative',
      position: widget.position,
      layout_type: widget.layout_type,
      
      // Widget-Specific Configuration
      config: widget.config,
      data_sources: widget.data_sources,
      update_frequency: widget.update_frequency as 'realtime' | 'hourly' | 'daily' | 'weekly',
      
      // Interaction Settings
      interactive: widget.interactive,
      editable: widget.editable,
      shareable: widget.shareable,
      
      // Orbital Positioning
      orbital_angle: widget.orbital_angle,
      orbital_distance: widget.orbital_distance,
      
      // Metadata
      created_at: widget.created_at,
      updated_at: widget.updated_at,
      generated_at: widget.generated_at,
      version: widget.version,
      confidence: widget.confidence,
      status: widget.status as 'active' | 'archived' | 'generating',
    }))
  }, [rawWidgets])

  // Get widget layout for focused project or initial project
  const currentProject = projects?.find(p => p._id === currentProjectId)
  const widgetLayout = useWidgetOrbitalLayout(
    currentProject?.position_x || 0,
    currentProject?.position_y || 0,
    widgets || []
  )

  // Determine widget zoom level based on scale
  const getWidgetZoomLevel = useCallback((scale: number): 'hidden' | 'dot' | 'summary' | 'full' => {
    if (scale < ZOOM_THRESHOLD_WIDGET_VISIBILITY) return 'hidden'
    if (scale < 0.6) return 'dot'
    if (scale < ZOOM_THRESHOLD_WIDGET_DETAIL) return 'summary'
    return 'full'
  }, [ZOOM_THRESHOLD_WIDGET_VISIBILITY, ZOOM_THRESHOLD_WIDGET_DETAIL])

  // Handle creating a new project
  const handleCreateProject = useCallback((name: string, description?: string) => {
    const params = new URLSearchParams({
      mode: 'create',
      name,
      ...(description && { description })
    })
    router.push(`/dashboard/project-discovery?${params}`)
  }, [router])

  // Handle clicking on project space boundary
  const handleProjectSpaceClick = useCallback((project: Project) => {
    if (shouldShowProjectDetail) {
      // In project detail mode, clicking focuses on the project
      focusOnProject(project._id, project.position_x, project.position_y, project.space_radius)
    } else {
      // In overview mode, clicking navigates to project
      if (project.fingerprintId) {
        router.push(`/dashboard/living-projects/${project._id}`)
      } else {
        router.push(`/dashboard/project-discovery?projectId=${project._id}`)
      }
    }
  }, [shouldShowProjectDetail, focusOnProject, router])

  // Handle right-click on project
  const handleProjectRightClick = useCallback((projectId: string, projectName: string, event: React.MouseEvent) => {
    console.log('Right-click detected on project:', projectId, projectName)
    event.preventDefault()
    event.stopPropagation()
    setSelectedProject({ id: projectId, name: projectName })
    setShowProjectOptions(true)
  }, [])

  // Get mutations
  const deleteProjectMutation = useMutation(api.projectsMutations.deleteProject)
  const createWidgetMutation = useMutation(api.projectWidgetsMutations.createWidget)

  // Handle project deletion
  const handleDeleteProject = useCallback(async () => {
    if (!selectedProject || !firebaseUser) return
    
    try {
      await deleteProjectMutation({
        projectId: selectedProject.id as any, // Type assertion for Convex ID
        userId: firebaseUser.uid
      })
      // The query will automatically update due to Convex reactivity
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }, [selectedProject, firebaseUser, deleteProjectMutation])

  // Handle widget creation
  const handleCreateWidget = useCallback(async (widgetData: {
    widgetType: string
    title: string
    description: string
    priority: number
    size: string
    theme: string
    config?: any
  }) => {
    if (!currentProjectId || !firebaseUser) return
    
    try {
      await createWidgetMutation({
        projectId: currentProjectId as any,
        userId: firebaseUser.uid,
        fingerprintId: currentProject?._id as any, // Use project ID as fingerprint ID for manual widgets
        widgetType: widgetData.widgetType,
        title: widgetData.title,
        description: widgetData.description,
        category: 'General', // Default category for manual widgets
        priority: widgetData.priority,
        size: widgetData.size,
        theme: widgetData.theme,
        position: 1, // Default position
        layoutType: 'grid', // Default layout
        config: widgetData.config,
        dataSources: [],
        updateFrequency: 'daily',
        interactive: true,
        editable: true,
        shareable: false,
      })
      // The query will automatically update due to Convex reactivity
    } catch (error) {
      console.error('Failed to create widget:', error)
      throw error // Re-throw so the modal can handle it
    }
  }, [currentProjectId, firebaseUser, createWidgetMutation, currentProject])

  // Handle minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  // Handle project hover for connection highlighting
  const handleProjectHover = useCallback((projectId: string | null) => {
    setHighlightedProject(projectId)
  }, [])

  // Handle widget hover
  const handleWidgetHover = useCallback((widgetId: string | null) => {
    setHighlightedWidget(widgetId)
  }, [])

  // Create project lookup for performance
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    if (projects) {
      projects.forEach(project => map.set(project._id, project))
    }
    return map
  }, [projects])

  // Auto-focus on initial project if provided
  useEffect(() => {
    if (initialProjectId && projects && !focusedProjectId) {
      const project = projectMap.get(initialProjectId)
      if (project) {
        // Small delay to ensure the view is ready
        setTimeout(() => {
          focusOnProject(project._id, project.position_x, project.position_y, project.space_radius)
        }, 100)
      }
    }
  }, [initialProjectId, projects, projectMap, focusedProjectId, focusOnProject])

  // Check for widget generation needs when project is focused
  useEffect(() => {
    const checkWidgetGeneration = async () => {
      if (!currentProjectId || !firebaseUser?.uid || isGeneratingWidgets) return
      
      const currentProject = projects?.find(p => p._id === currentProjectId)
      if (!currentProject?.fingerprintId) return
      
      // Check if project has fingerprint but no widgets
      if (rawWidgets && rawWidgets.length === 0) {
        // Prevent multiple attempts for the same project
        if (hasAttemptedGenerationRef.current.has(currentProjectId)) {
          console.log('[LIVING_PROJECTS][widgets:already_attempted]', { projectId: currentProjectId })
          return
        }
        
        console.log('[LIVING_PROJECTS][widgets:check:needs_generation]', { projectId: currentProjectId })
        hasAttemptedGenerationRef.current.add(currentProjectId)
        setIsGeneratingWidgets(true)
        setWidgetGenerationError(null)
        
        try {
          const apiKey = await getApiKey()
          if (!apiKey) {
            throw new Error('Authentication required')
          }
          
          const response = await fetch(`/api/projects/${currentProjectId}/generate-widgets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              user_preferences: {}
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              console.log('[LIVING_PROJECTS][widgets:generation:success]')
              // Widgets will appear automatically via Convex reactivity
            } else {
              throw new Error(result.error || 'Widget generation failed')
            }
          } else {
            throw new Error('Failed to generate widgets')
          }
        } catch (error) {
          console.error('[LIVING_PROJECTS][widgets:generation:error]', error)
          setWidgetGenerationError('We had trouble creating your project widgets. No worries—this happens sometimes. You can always create widgets manually when you\'re ready.')
        } finally {
          setIsGeneratingWidgets(false)
        }
      }
    }
    
    checkWidgetGeneration()
  }, [currentProjectId, firebaseUser?.uid, rawWidgets, projects]) // Removed isGeneratingWidgets from dependencies

  if (!firebaseUser) {
    return <LoadingState />
  }

  const isLoading = projects === undefined

  if (isLoading) {
    return <LoadingState />
  }

  // Empty state - show this when we have no projects
  if (!projects || projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-light text-foreground">Your constellation awaits</h2>
            <p className="text-muted-foreground/80 leading-relaxed">
              Start your first project to begin building your personal universe of ideas and work.
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-foreground text-background hover:bg-foreground/90"
            size="lg"
          >
            Create your first star
          </Button>
        </div>
        
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateProject={handleCreateProject}
        />
      </div>
    )
  }

  const widgetZoomLevel = getWidgetZoomLevel(transform.scale)

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Constellation Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => {
          // Only prevent default if clicking on the background, not on project areas
          if (e.target === e.currentTarget) {
            e.preventDefault()
          }
        }}
        style={{
          willChange: 'transform'
        }}
      >
        {/* Canvas Container */}
        <div
          className="relative transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: layout.canvasWidth,
            height: layout.canvasHeight,
            willChange: 'transform'
          }}
        >
          {/* Connection Lines */}
          <ConnectionLines
            connections={layout.connections}
            positions={layout.positions}
            canvasWidth={layout.canvasWidth}
            canvasHeight={layout.canvasHeight}
            scale={transform.scale}
            translateX={transform.x}
            translateY={transform.y}
            highlightedProject={highlightedProject}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
          />

          {/* Project Space Boundaries */}
          {layout.positions.map(position => {
            const project = projectMap.get(position.id)
            if (!project) return null

            const isFocused = focusedProjectId === position.id
            const isInFocus = isProjectInFocus(project.position_x, project.position_y, project.space_radius)

            const projectState = projectStates.get(position.id)
            if (!projectState) return null

            return (
              <ProjectSpaceBoundary
                key={`boundary-${position.id}`}
                x={project.position_x}
                y={project.position_y}
                radius={project.space_radius}
                scale={transform.scale}
                isHighlighted={highlightedProject === position.id}
                isFocused={isFocused && isInFocus}
                viewMode={viewMode}
                projectName={project.name}
                projectState={projectState}
                projectId={project._id}
                onClick={() => handleProjectSpaceClick(project)}
                onWheel={handleWheel}
                onHover={(isHovered) => handleProjectHover(isHovered ? position.id : null)}
                onRightClick={handleProjectRightClick}
                ZOOM_THRESHOLD_PROJECT_DOTS={ZOOM_THRESHOLD_PROJECT_DOTS}
                ZOOM_THRESHOLD_PROJECT_CARDS={ZOOM_THRESHOLD_PROJECT_CARDS}
              />
            )
          })}

          {/* Widgets (only for focused project) */}
          {currentProjectId && currentProject && widgetZoomLevel !== 'hidden' && (
            <>
              {/* Widget Generation Loading State */}
              {isGeneratingWidgets && (
                <g>
                  <rect
                    x={currentProject.position_x - 150}
                    y={currentProject.position_y - 80}
                    width={300}
                    height={160}
                    fill="hsl(var(--background))"
                    fillOpacity={0.9}
                    stroke="hsl(var(--border))"
                    strokeWidth={2}
                    rx={12}
                    filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                  />
                  <text
                    x={currentProject.position_x}
                    y={currentProject.position_y - 40}
                    textAnchor="middle"
                    className="fill-foreground text-sm font-medium"
                  >
                    Creating your project widgets
                  </text>
                  <text
                    x={currentProject.position_x}
                    y={currentProject.position_y - 20}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    Thanks for your patience while we personalize your workspace
                  </text>
                  <circle
                    cx={currentProject.position_x - 40}
                    cy={currentProject.position_y + 20}
                    r={8}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="32"
                    strokeDashoffset="24"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      values="0;360"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <text
                    x={currentProject.position_x - 20}
                    y={currentProject.position_y + 25}
                    className="fill-muted-foreground text-xs"
                  >
                    Generating...
                  </text>
                </g>
              )}

              {/* Widget Generation Error State */}
              {widgetGenerationError && (
                <g>
                  <rect
                    x={currentProject.position_x - 180}
                    y={currentProject.position_y - 60}
                    width={360}
                    height={120}
                    fill="hsl(var(--background))"
                    fillOpacity={0.9}
                    stroke="hsl(var(--orange-200))"
                    strokeWidth={2}
                    rx={12}
                    filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                  />
                  <text
                    x={currentProject.position_x}
                    y={currentProject.position_y - 25}
                    textAnchor="middle"
                    className="fill-foreground text-sm font-medium"
                  >
                    Widgets are taking their time
                  </text>
                  <text
                    x={currentProject.position_x}
                    y={currentProject.position_y - 5}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                    style={{ fontSize: '10px' }}
                  >
                    {widgetGenerationError}
                  </text>
                  <rect
                    x={currentProject.position_x - 40}
                    y={currentProject.position_y + 15}
                    width={80}
                    height={24}
                    fill="hsl(var(--primary))"
                    rx={12}
                    className="cursor-pointer"
                    onClick={() => setWidgetGenerationError(null)}
                  />
                  <text
                    x={currentProject.position_x}
                    y={currentProject.position_y + 30}
                    textAnchor="middle"
                    className="fill-primary-foreground text-xs font-medium"
                  >
                    Got it, thanks
                  </text>
                </g>
              )}

              {/* Actual Widgets */}
              {!isGeneratingWidgets && !widgetGenerationError && (
                <>
                  {widgetLayout.positions.map(widgetPosition => {
                    const widget = widgets?.find(w => w.widget_id === widgetPosition.id)
                    if (!widget) return null

                    return (
                      <WidgetCard
                        key={widgetPosition.id}
                        widget={widget}
                        x={widgetPosition.x}
                        y={widgetPosition.y}
                        scale={transform.scale}
                        onClick={() => {
                          setSelectedWidget(widget)
                          setIsDetailsOpen(true)
                        }}
                        onHover={(isHovered) => handleWidgetHover(isHovered ? widgetPosition.id : null)}
                      />
                    )
                  })}

                  {/* Project-to-Widget Connections */}
                  {currentProject && (
                    <g>
                      {widgetLayout.positions.map(widgetPosition => (
                        <line
                          key={`connection-${widgetPosition.id}`}
                          x1={currentProject.position_x}
                          y1={currentProject.position_y}
                          x2={widgetPosition.x}
                          y2={widgetPosition.y}
                          stroke="hsl(var(--border))"
                          strokeWidth={1 / transform.scale}
                          strokeDasharray="4,4"
                          opacity={0.4}
                        />
                      ))}
                    </g>
                  )}
                </>
              )}
            </>
          )}


          {/* Canvas bounds indicator (subtle) */}
          <div 
            className="absolute inset-0 border border-border/10 rounded-lg pointer-events-none"
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight
            }}
          />
        </div>
      </div>

      {/* Header - Centered */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-6 py-4 shadow-lg">
          <div className="flex items-baseline gap-4 justify-center">
            <h1 className="text-2xl font-light text-foreground">
              {viewMode === 'project-detail' ? 'Project Space' : 'Constellation'}
            </h1>
            <div className="text-sm text-muted-foreground/70 font-mono">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
          <p className="text-sm text-muted-foreground/60 mt-1 text-center">
            {viewMode === 'project-detail' 
              ? 'Explore widgets and details within this project space'
              : 'Your universe of projects, connected and evolving'
            }
          </p>
        </div>
      </div>


      {/* Action Buttons - Top Right */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        {viewMode === 'project-detail' && currentProject && (
          <Button
            onClick={() => setShowCreateWidgetModal(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
          >
            + New Widget
          </Button>
        )}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-foreground text-background hover:bg-foreground/90 shadow-lg"
        >
          + New Project
        </Button>
      </div>

      {/* Navigation Controls */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="absolute bottom-6 left-20 z-10"
      />

      {/* Minimap */}
      <ConstellationMinimap
        positions={layout.positions}
        canvasWidth={layout.canvasWidth}
        canvasHeight={layout.canvasHeight}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        currentTransform={transform}
        onViewportClick={handleMinimapClick}
        className="absolute bottom-6 right-6 z-10"
      />

      {/* Stats Overlay - Bottom Center */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm">
            <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
              <span>
                Active: {Array.from(projectStates.values()).filter(s => s.isActive).length}
              </span>
              <span>•</span>
              <span>
                New: {Array.from(projectStates.values()).filter(s => s.isNew).length}
              </span>
              <span>•</span>
              <span>
                Complete: {Array.from(projectStates.values()).filter(s => s.isComplete).length}
              </span>
              <span>•</span>
              <span>
                {Math.round(transform.scale * 100)}% zoom
              </span>
                        {viewMode === 'project-detail' && (
                          <>
                            <span>•</span>
                            <span>
                              {widgets?.length || 0} widgets
                            </span>
                          </>
                        )}
            </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Create Widget Modal */}
      {currentProject && (
        <CreateWidgetModal
          isOpen={showCreateWidgetModal}
          onClose={() => setShowCreateWidgetModal(false)}
          projectId={currentProject._id}
          projectName={currentProject.name}
          onCreateWidget={handleCreateWidget}
        />
      )}

      {/* Project Options Modal */}
      <ProjectOptionsModal
        isOpen={showProjectOptions}
        onClose={() => setShowProjectOptions(false)}
        projectName={selectedProject?.name || ''}
        onDelete={handleDeleteProject}
        onViewDetails={() => {
          if (selectedProject) {
            router.push(`/dashboard/living-projects/${selectedProject.id}`)
          }
        }}
      />


      {/* Widget details panel */}
      <WidgetDetailsPanel
        widget={selectedWidget}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />


      {/* Keyboard shortcuts hint */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-32 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground/70 text-center">
              Drag to explore • Scroll to zoom • Click project spaces to focus
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
