'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from './CreateProjectModal'
import { ProjectStar } from './ProjectStar'
import { ConnectionLines } from './ConnectionLines'
import { ConstellationControls } from './ConstellationControls'
import { ConstellationMinimap } from './ConstellationMinimap'
import { LoadingState } from './LoadingState'
import { useConstellationLayout } from '../hooks/useConstellationLayout'
import { usePanZoom } from '../hooks/usePanZoom'

interface Project {
  _id: string
  name: string
  description?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
}

export function ConstellationView() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [highlightedProject, setHighlightedProject] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })

  // Get current user ID
  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getCurrentUserId()
      setUserId(id)
    }
    if (firebaseUser) {
      fetchUserId()
    }
  }, [firebaseUser])

  // Fetch user's projects
  const projects = useQuery(
    api.projectsQueries.getByUser,
    userId ? { userId } : 'skip'
  ) as Project[] | undefined

  // Generate constellation layout
  const layout = useConstellationLayout(projects || [])
  
  // Debug logging
  console.log('ConstellationView Debug:', {
    firebaseUser: !!firebaseUser,
    projects: projects,
    projectsLength: projects?.length,
    layout: layout,
    layoutPositionsLength: layout.positions.length
  })
  
  // Pan and zoom functionality
  const {
    transform,
    containerRef,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint
  } = usePanZoom(layout.canvasWidth, layout.canvasHeight, viewportSize.width, viewportSize.height)

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

  // Virtual rendering - only render projects visible in viewport + buffer
  const visibleProjects = useMemo(() => {
    // Temporarily disable virtual rendering to debug
    // TODO: Re-enable virtual rendering once issue is resolved
    return layout.positions
    
    /* Original virtual rendering logic:
    const buffer = 400 // Buffer zone around viewport
    const viewportLeft = -transform.x / transform.scale - buffer
    const viewportTop = -transform.y / transform.scale - buffer
    const viewportRight = viewportLeft + (viewportSize.width / transform.scale) + (buffer * 2)
    const viewportBottom = viewportTop + (viewportSize.height / transform.scale) + (buffer * 2)

    const filtered = layout.positions.filter(position => 
      position.x >= viewportLeft && 
      position.x <= viewportRight &&
      position.y >= viewportTop && 
      position.y <= viewportBottom
    )
    
    console.log('Virtual rendering debug:', {
      totalPositions: layout.positions.length,
      visiblePositions: filtered.length,
      viewport: { viewportLeft, viewportTop, viewportRight, viewportBottom },
      transform,
      viewportSize
    })
    
    return filtered
    */
  }, [layout.positions, transform, viewportSize])

  // Handle creating a new project
  const handleCreateProject = useCallback(async (
    name: string, 
    description?: string,
    noteIds?: string[],
    conversationIds?: string[],
    crystalIds?: string[],
    shardIds?: string[]
  ): Promise<string> => {
    const params = new URLSearchParams({
      mode: 'create',
      name,
      ...(description && { description }),
      ...(noteIds && noteIds.length > 0 && { noteIds: noteIds.join(',') }),
      ...(conversationIds && conversationIds.length > 0 && { conversationIds: conversationIds.join(',') }),
      ...(crystalIds && crystalIds.length > 0 && { crystalIds: crystalIds.join(',') }),
      ...(shardIds && shardIds.length > 0 && { shardIds: shardIds.join(',') })
    })
    router.push(`/dashboard/living-projects/project-discovery?${params}`)
    return 'temp-id' // Return temp ID since we're navigating away
  }, [router])

  // Handle clicking on a project
  const handleProjectClick = useCallback((project: Project) => {
    if (project.fingerprintId) {
      router.push(`/dashboard/living-projects/${project._id}`)
    } else {
      router.push(`/dashboard/living-projects/project-discovery?projectId=${project._id}`)
    }
  }, [router])

  // Handle minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  // Handle project hover for connection highlighting
  const handleProjectHover = useCallback((projectId: string | null) => {
    setHighlightedProject(projectId)
  }, [])

  // Create project lookup for performance
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    if (projects) {
      projects.forEach(project => map.set(project._id, project))
    }
    return map
  }, [projects])

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
          userId={userId || ''}
        />
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Constellation Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
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

          {/* Project Stars - Virtual Rendering */}
          {visibleProjects.map(position => {
            const project = projectMap.get(position.id)
            if (!project) return null

            return (
              <ProjectStar
                key={position.id}
                project={project}
                x={position.x}
                y={position.y}
                size={position.size}
                importance={position.importance}
                isHighlighted={highlightedProject === position.id}
                scale={transform.scale}
                onClick={() => handleProjectClick(project)}
                onHover={handleProjectHover}
                onDelete={() => {
                  // Refresh the projects list after deletion
                  // The query will automatically update due to Convex reactivity
                }}
              />
            )
          })}

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
            <h1 className="text-2xl font-light text-foreground">Constellation</h1>
            <div className="text-sm text-muted-foreground/70 font-mono">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </div>
          </div>
          <p className="text-sm text-muted-foreground/60 mt-1 text-center">
            Your universe of projects, connected and evolving
          </p>
        </div>
      </div>

      {/* New Project Button - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-foreground text-background hover:bg-foreground/90 shadow-lg"
        >
          New Project
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
              Active: {projects.filter(p => p.fingerprintId && Date.now() - p.updatedAt < 7 * 24 * 60 * 60 * 1000).length}
            </span>
            <span>•</span>
            <span>
              Discovering: {projects.filter(p => !p.fingerprintId).length}
            </span>
            <span>•</span>
            <span>
              {Math.round(transform.scale * 100)}% zoom
            </span>
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateProject={handleCreateProject}
        userId={userId || ''}
      />

      {/* Keyboard shortcuts hint */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-32 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground/70 text-center">
              Drag to explore • Scroll to zoom • Click projects to open
            </div>
          </div>
        </div>
      )}
    </div>
  )
}