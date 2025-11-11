/**
 * CONSTELLATION CANVAS COMPONENT
 *
 * Main constellation visualization component with all interaction logic
 * extracted from the main ProjectViewScreen for better separation of concerns.
 */

'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { WidgetConfig } from '@/types/projectWidgets'
import { usePanZoom } from '../../../hooks/usePanZoom'
import { ConnectionLines } from '../../../components/ConnectionLines'
import { ConstellationControls } from '../../../components/ConstellationControls'
import { ConstellationMinimap } from '../../../components/ConstellationMinimap'
import { useWidgetLayout } from '../hooks/useWidgetLayout'
import { FloatingWidgetCard } from './FloatingWidgetCard'
import { ArtifactCard } from './ArtifactCard'
import { ProjectControlPanel } from '../ProjectControlPanel'
import { SpawnWidgetDialog } from './SpawnWidgetDialog'
import { useAnalytics } from '@/hooks/useAnalytics'
import { T } from '@/components/translation/T'
import { deriveFamilyStatus, type FamilyStatus } from '@/app/types/family-status'
import { Sparkles, MessageCircle, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/app/dashboard/thinking_lab/layouts/ResponsiveLayout'
import { ProjectCollaboratorsModal } from '@/components/projects/ProjectCollaboratorsModal'

interface ConstellationCanvasProps {
  widgets: WidgetConfig[]
  artifacts?: any[] // Widget output artifacts
  userId: string | null
  projectId: Id<"projects">
  onWidgetClick: (widget: WidgetConfig) => void
  onWidgetHover: (widgetId: string | null) => void
  highlightedWidget: string | null
  contentItems?: any[] // Deprecated - kept for backward compatibility
  storedLayout?: any
  onContentOpen?: (id: string, type: string) => void
  onArtifactClick?: (artifact: any) => void
  onLayoutReset?: () => void
}

export function ConstellationCanvas({
  widgets,
  artifacts = [],
  userId,
  projectId,
  onWidgetClick,
  onWidgetHover,
  highlightedWidget,
  contentItems,
  storedLayout,
  onContentOpen,
  onArtifactClick,
  onLayoutReset
}: ConstellationCanvasProps) {
  const { trackWidgetOpen } = useAnalytics()
  const router = useRouter()
  const isMobile = useIsMobile()
  
  // Explicitly type projectId to ensure correct type inference
  const typedProjectId: Id<"projects"> = projectId;
  
  // Query for project-scoped conversation
  const projectConversation = useQuery(
    api.chatQueries.getProjectScopedConversation,
    userId && projectId ? { 
      projectId: projectId, 
      userId 
    } : 'skip'
  )
  
  // Mutation for creating conversation
  const createConversation = useMutation(api.chatMutations.createConversation)
  
  // Direct Convex queries for family status (NO polling)
  // Query background jobs for execution status
  const backgroundJobs = useQuery(
    api.backgroundJobs.getUserJobs,
    userId ? { userId, jobType: 'widget_execution', limit: 100 } : 'skip'
  )
  
  // Derive family status for each widget
  const familyStatusMap = useMemo(() => {
    const statusMap = new Map<string, FamilyStatus>()
    
    widgets.forEach(widget => {
      // Find background job for this widget
      const widgetJob = backgroundJobs?.find(
        (job: any) => job.payload?.widget_id === widget._id || job.payload?.widgetId === widget._id
      )
      
      // Derive status from widget data, job status, and questions
      const status = deriveFamilyStatus(
        widget.lastRunStatus,
        widgetJob?.status,
      )
      
      statusMap.set(widget._id, status)
    })
    
    return statusMap
  }, [widgets, backgroundJobs])
  
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  // Spawn widget dialog state
  const [isSpawnDialogOpen, setIsSpawnDialogOpen] = useState(false)
  
  // ✅ Sharing modal state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  
  // Get project name for sharing modal
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && userId ? {
      projectId: projectId,
      userId: userId,
    } : 'skip'
  )
  
  // Get user permission for project
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    projectId && userId ? {
      userId,
      contentType: 'project',
      contentId: projectId,
    } : 'skip'
  ) as 'owner' | 'edit' | 'read' | null
  
  // Only show share button if user has permission (owner or editor)
  const canShare = userPermission === 'owner' || userPermission === 'edit'
  
  // Handle content card click - delegate to parent (deprecated)
  const handleContentOpen = useCallback((id: string, type: string) => {
    onContentOpen?.(id, type)
  }, [onContentOpen])
  
  // Handle artifact click
  const handleArtifactClick = useCallback((artifact: any) => {
    onArtifactClick?.(artifact)
  }, [onArtifactClick])
  
  // Handle conversation open
  const handleOpenConversation = useCallback(async () => {
    if (!userId || !projectId) return
    
    if (projectConversation?._id) {
      // Conversation exists, navigate to it
      router.push(`/dashboard/thinking_lab?chatId=${projectConversation._id}`)
    } else {
      // No conversation yet, create one
      try {
        const conversationId = await createConversation({
          userId,
          title: `Project Conversation`,
          projectId: projectId as any,
          conversationType: "project_scoped"
        })
        
        if (conversationId) {
          router.push(`/dashboard/thinking_lab?chatId=${conversationId}`)
        } else {
          // Fallback if creation failed
          router.push(`/dashboard/thinking_lab?projectId=${projectId}`)
        }
      } catch (error) {
        console.error('[ConstellationCanvas] Failed to create conversation:', error)
        // Fallback to project context mode
        router.push(`/dashboard/thinking_lab?projectId=${projectId}`)
      }
    }
  }, [userId, projectId, projectConversation, createConversation, router])
  
  // Natural scattered positioning for mixed widgets and artifacts
  // Creates organic constellation layout across entire canvas
  const allPositions = useMemo(() => {
    const CARD_WIDTH = 360
    const CARD_HEIGHT = 260
    const MIN_DISTANCE = 120
    const CANVAS_PADDING = 200
    const CANVAS_WIDTH = 2400
    const CANVAS_HEIGHT = 1600
    
    // Mix widgets and artifacts together
    const allItems = [
      ...widgets.map(w => ({ item: w, type: 'widget' as const })),
      ...artifacts.map(a => ({ item: a, type: 'artifact' as const }))
    ]
    
    const positions: Array<{ 
      item: any
      type: 'widget' | 'artifact'
      x: number
      y: number
      size: 'small' | 'medium' | 'large' 
    }> = []
    
    allItems.forEach(({ item, type }, index) => {
      const id = item._id || item.id || String(index)
      const seed = id.charCodeAt(0) + id.charCodeAt(1) + id.charCodeAt(Math.min(2, id.length - 1))
      
      // Natural scatter across entire canvas with more randomness
      let finalX = CANVAS_PADDING + ((seed * 1327) % (CANVAS_WIDTH - CANVAS_PADDING * 2 - CARD_WIDTH))
      let finalY = CANVAS_PADDING + ((seed * 977) % (CANVAS_HEIGHT - CANVAS_PADDING * 2 - CARD_HEIGHT))
      
      // Check for collisions and adjust
      let attempts = 0
      while (attempts < 100) {
        let hasCollision = false
        
        for (const pos of positions) {
          const dx = Math.abs(finalX - pos.x)
          const dy = Math.abs(finalY - pos.y)
          
          if (dx < (CARD_WIDTH + MIN_DISTANCE) && dy < (CARD_HEIGHT + MIN_DISTANCE)) {
            hasCollision = true
            break
          }
        }
        
        if (!hasCollision) break
        
        // Try new position with spiral outward pattern
        const angle = (attempts * 137.5) * (Math.PI / 180) // Golden angle for natural distribution
        const radius = 150 + (attempts * 50)
        finalX = Math.max(CANVAS_PADDING, Math.min(
          CANVAS_WIDTH - CANVAS_PADDING - CARD_WIDTH,
          finalX + Math.cos(angle) * radius
        ))
        finalY = Math.max(CANVAS_PADDING, Math.min(
          CANVAS_HEIGHT - CANVAS_PADDING - CARD_HEIGHT,
          finalY + Math.sin(angle) * radius
        ))
        attempts++
      }
      
      positions.push({
        item,
        type,
        x: finalX,
        y: finalY,
        size: 'medium' as const
      })
    })
    
    return positions
  }, [widgets.length, artifacts.length])
  
  // Separate for rendering
  const widgetPositions = useMemo(() => 
    allPositions.filter(p => p.type === 'widget'),
    [allPositions]
  )
  
  const artifactPositions = useMemo(() => 
    allPositions.filter(p => p.type === 'artifact'),
    [allPositions]
  )

  // Fixed canvas size for stable constellation
  const canvasWidth = 2400
  const canvasHeight = 1600

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
  } = usePanZoom(canvasWidth, canvasHeight, viewportSize.width, viewportSize.height)

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

  // Prevent body scroll when constellation is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Virtual rendering - only render widgets visible in viewport + buffer
  const visibleWidgets = useMemo(() => {
    const buffer = isMobile ? 200 : 400
    const viewportLeft = -transform.x / transform.scale - buffer
    const viewportTop = -transform.y / transform.scale - buffer
    const viewportRight = viewportLeft + (viewportSize.width / transform.scale) + (buffer * 2)
    const viewportBottom = viewportTop + (viewportSize.height / transform.scale) + (buffer * 2)

    return widgetPositions.filter(position =>
      position.x >= viewportLeft &&
      position.x <= viewportRight &&
      position.y >= viewportTop &&
      position.y <= viewportBottom
    )
  }, [widgetPositions, transform, viewportSize, isMobile])

  // Handle minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  return (
    <div 
      className="relative h-screen bg-gradient-to-br from-background via-primary/5 to-muted/30 overflow-hidden transition-all duration-300"
    >
      {/* Widget Constellation Canvas */}
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
            width: canvasWidth,
            height: canvasHeight,
            willChange: 'transform'
          }}
        >
          {/* Floating Widget Cards - Fixed Positions */}
          {visibleWidgets.map(({ item: widget, x, y, size }) => (
            <FloatingWidgetCard
              key={widget._id}
              widget={widget}
              x={x}
              y={y}
              size={size}
              importance={1}
              isHighlighted={highlightedWidget === widget._id}
              scale={transform.scale}
              onClick={() => {
                trackWidgetOpen(widget.widget_type)
                onWidgetClick(widget)
              }}
              onHover={onWidgetHover}
              status={familyStatusMap.get(widget._id) || 'idle'}
            />
          ))}

          {/* Artifact Cards - Fixed Positions */}
          {artifactPositions.map(({ item: artifact, x, y, size }) => (
            <ArtifactCard
              key={artifact._id}
              artifact={artifact}
              x={x}
              y={y}
              size={size}
              scale={transform.scale}
              isHighlighted={highlightedWidget === artifact._id}
              onClick={() => handleArtifactClick(artifact)}
            />
          ))}

          {/* Canvas bounds indicator with accent */}
          <div
            className="absolute inset-0 border border-primary/10 rounded-lg pointer-events-none"
            style={{
              width: canvasWidth,
              height: canvasHeight
            }}
          />
        </div>
      </div>


      {/* Project Control Panel and Spawn Widget Button - Top Right */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 z-10 flex flex-col md:flex-row items-end md:items-start gap-2 md:gap-3">
        {/* Spawn Widget Button */}
        <button
          onClick={() => setIsSpawnDialogOpen(true)}
          className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] md:min-h-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground backdrop-blur-lg border border-primary/20 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 touch-manipulation"
          title="Spawn Widget Family"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">
            <T context="constellation.button.spawn_widget">Spawn Widget</T>
          </span>
        </button>
        
        {/* Share Button - Show if user has permission */}
        {canShare && (
          <button
            onClick={() => setShowCollaboratorsModal(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] md:min-h-auto bg-gradient-to-r from-secondary/80 to-secondary/60 text-secondary-foreground backdrop-blur-lg border border-secondary/20 rounded-xl hover:shadow-lg hover:shadow-secondary/20 transition-all duration-200 touch-manipulation"
            title="Share project with collaborators"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">
              <T context="constellation.button.share">Share</T>
            </span>
          </button>
        )}
        
        {/* Open Conversation Button */}
        <button
          onClick={handleOpenConversation}
          className="flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] md:min-h-auto bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground backdrop-blur-lg border border-secondary/20 rounded-xl hover:shadow-lg hover:shadow-secondary/20 transition-all duration-200 touch-manipulation"
          title="Open Project Conversation"
          disabled={!userId || !projectId}
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:inline">
            <T context="constellation.button.open_conversation">Open Conversation</T>
          </span>
        </button>
        
        <ProjectControlPanel
          projectId={typedProjectId}
          userId={userId || ''}
        />
      </div>
      
      {/* Collaborators Modal */}
      {projectId && project && (
        <ProjectCollaboratorsModal
          projectId={projectId}
          projectName={project.name || 'Untitled Project'}
          isOpen={showCollaboratorsModal}
          onClose={() => setShowCollaboratorsModal(false)}
        />
      )}
      
      {/* Spawn Widget Dialog */}
      <SpawnWidgetDialog
        projectId={projectId}
        isOpen={isSpawnDialogOpen}
        onClose={() => setIsSpawnDialogOpen(false)}
        onSuccess={(widgetsId) => {
          console.log('[ConstellationCanvas] Widget generated:', widgetsId)
          // Widgets will auto-refresh via Convex reactivity
        }}
      />

      {/* Navigation Controls - Bottom Left */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        isMobile={isMobile}
        className="absolute bottom-16 md:bottom-4 left-2 md:left-4 z-10"
      />

      {/* Layout Reset Button with accent */}
      {onLayoutReset && (
        <div className="absolute bottom-4 left-64 z-10 hidden md:block">
          <button
            onClick={onLayoutReset}
            className="px-4 py-2 text-xs bg-gradient-to-r from-secondary/80 to-secondary/60 backdrop-blur-lg border border-border/40 rounded-lg hover:from-secondary hover:to-secondary/80 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
            title="Reset layout"
          >
            <T context="constellation.canvas.button.reset_layout">Reset Layout</T>
          </button>
        </div>
      )}

      {/* Minimap - Bottom Right (moved from top to avoid overlap with ProjectControlPanel) */}
      <div className="absolute bottom-2 md:bottom-8 right-2 md:right-4 z-10">
        <ConstellationMinimap
          positions={[
            ...widgetPositions.map(p => ({ id: p.item._id, x: p.x, y: p.y, size: p.size, importance: 1, type: 'widget' as const })),
            ...artifactPositions.map(p => ({ id: p.item._id, x: p.x, y: p.y, size: p.size, importance: 1, type: 'artifact' as const }))
          ]}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          viewportWidth={viewportSize.width}
          viewportHeight={viewportSize.height}
          currentTransform={transform}
          onViewportClick={handleMinimapClick}
          isMobile={isMobile}
        />
      </div>

      {/* Keyboard shortcuts hint - Center Bottom, Above Controls with accent */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-20 left-1/2 z-10 pointer-events-none hidden md:block" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 backdrop-blur-md border border-primary/30 rounded-xl px-5 py-3 shadow-xl shadow-primary/10">
            <div className="text-xs text-foreground text-center font-medium">
              <T context="constellation.canvas.hint.controls">Drag to explore • Scroll to zoom • Click widgets to interact</T>
            </div>
          </div>
        </div>
      )}

      {/* Content Attachment Panel is now handled in unified panel Actions tab */}
    </div>
  )
}
