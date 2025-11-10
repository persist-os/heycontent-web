'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { getCurrentUserId } from '@/app/lib/api-helpers'
import { Button } from '@/components/ui/button'
import { ProjectStar } from './ProjectStar'
import { ConnectionLines } from './ConnectionLines'
import { ConstellationControls } from './ConstellationControls'
import { ConstellationMinimap } from './ConstellationMinimap'
import { LoadingState } from './LoadingState'
import { useConstellationLayout } from '../hooks/useConstellationLayout'
import { usePanZoom } from '../hooks/usePanZoom'
import { T } from '@/components/translation/T'
import { useIsMobile } from '@/app/dashboard/thinking_lab/layouts/ResponsiveLayout'
import { Plus } from 'lucide-react'

interface Project {
  _id: string
  name: string
  description?: string
  status?: string
  fingerprintId?: string
  createdAt: number
  updatedAt: number
}

export function ConstellationView() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
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
  
  // Mobile detection
  const isMobile = useIsMobile()
  
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
    const buffer = isMobile ? 200 : 400 // Smaller buffer on mobile
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
    
    return filtered
  }, [layout.positions, transform, viewportSize, isMobile])


  // Handle clicking on a project - Navigate to project page
  const handleProjectClick = useCallback((project: Project) => {
    router.push(`/dashboard/living-projects/${project._id}`)
  }, [router])

  // Handle double-click on a project - Navigate to project page
  const handleProjectDoubleClick = useCallback((project: Project) => {
    router.push(`/dashboard/living-projects/${project._id}`)
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
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4 md:px-6">
        <div className="space-y-5 bg-gradient-to-br from-card/80 via-card/70 to-primary/10 backdrop-blur-xl border border-border/60 rounded-2xl p-6 md:p-8 shadow-2xl shadow-primary/10">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border border-primary/30">
            <div className="w-10 h-10 md:w-12 md:h-12 text-primary/60 animate-pulse">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-light text-foreground">
            <T context="constellation.empty.heading">Your constellation awaits</T>
          </h2>
            <p className="text-muted-foreground leading-relaxed">
              <T context="constellation.empty.description">
                Start your first project to begin building your personal universe of ideas and work.
              </T>
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/thinking_lab')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 ring-1 ring-primary/30"
            size="lg"
          >
            <T context="constellation.button.create_first">Create your first star</T>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5 overflow-hidden">
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
            className="absolute inset-0 border border-primary/10 rounded-lg pointer-events-none"
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight
            }}
          />
        </div>
      </div>

      {/* Header - Centered with glassmorphism */}
      <div className="absolute top-4 md:top-6 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-gradient-to-br from-card/90 via-card/85 to-primary/10 backdrop-blur-xl border border-border/60 rounded-xl px-4 py-3 md:px-8 md:py-5 shadow-2xl shadow-primary/10 ring-1 ring-border/20">
          <div className="flex items-baseline gap-2 md:gap-4 justify-center">
            <h1 className="text-xl md:text-2xl font-light text-foreground">
              <T context="constellation.header.title">Constellation</T>
            </h1>
            <div className="text-xs md:text-sm text-muted-foreground font-mono bg-primary/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-primary/20">
              {projects.length} <T context="constellation.header.project">{projects.length !== 1 ? 'projects' : 'project'}</T>
            </div>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1 text-center hidden md:block">
            <T context="constellation.header.subtitle">Your universe of projects, connected and evolving</T>
          </p>
        </div>
      </div>

      {/* New Assignment Button - Mobile: bottom-right FAB, Desktop: top-right */}
      <div className="fixed bottom-20 right-4 md:absolute md:top-6 md:right-6 md:bottom-auto z-20">
        <Button
          onClick={() => router.push('/dashboard/thinking_lab')}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20 ring-1 ring-primary/30"
          size={isMobile ? "icon" : "default"}
          aria-label={isMobile ? "New Assignment" : undefined}
        >
          {isMobile ? (
            <Plus className="h-5 w-5" />
          ) : (
            <T context="constellation.button.new_project">New Assignment</T>
          )}
        </Button>
      </div>

      {/* Bottom Right - Minimap */}
      <div className="fixed bottom-4 right-4 md:absolute md:bottom-6 md:right-6 z-10">
        <div className="w-24 h-24 md:w-auto md:h-auto bg-background/80 backdrop-blur-sm border border-border/40 rounded-lg shadow-xl overflow-hidden">
          <ConstellationMinimap
            positions={layout.positions}
            canvasWidth={layout.canvasWidth}
            canvasHeight={layout.canvasHeight}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            currentTransform={transform}
            onViewportClick={handleMinimapClick}
          />
        </div>
      </div>

      {/* Bottom Left - Navigation Controls */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="fixed bottom-4 left-4 md:absolute md:bottom-6 md:left-6 z-10"
      />


      {/* Stats Overlay - Bottom Center with color variety */}
      <div className="absolute bottom-16 md:bottom-12 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <div className="bg-gradient-to-r from-card/80 via-card/70 to-card/80 backdrop-blur-lg border border-border/40 rounded-xl px-3 py-1.5 md:px-5 md:py-2.5 shadow-lg shadow-primary/5">
          <div className="flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <T context="constellation.stats.active">Active</T>: <span className="text-foreground font-medium">{projects.filter(p => p.fingerprintId && Date.now() - p.updatedAt < 7 * 24 * 60 * 60 * 1000).length}</span>
            </span>
            <span className="text-border">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              <T context="constellation.stats.discovering">Discovering</T>: <span className="text-foreground font-medium">{projects.filter(p => !p.fingerprintId).length}</span>
            </span>
            <span className="text-border">•</span>
            <span className="text-foreground font-mono">
              {Math.round(transform.scale * 100)}% <T context="constellation.stats.zoom">zoom</T>
            </span>
          </div>
        </div>
      </div>


      {/* Keyboard shortcuts hint with accent - Hidden on mobile */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-32 left-1/2 z-10 pointer-events-none hidden md:block" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 backdrop-blur-md border border-accent/30 rounded-xl px-5 py-3 shadow-xl shadow-accent/10">
            <div className="text-xs text-foreground text-center font-medium">
              <T context="constellation.hint.controls">Drag to explore • Scroll to zoom • Click to open project</T>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}