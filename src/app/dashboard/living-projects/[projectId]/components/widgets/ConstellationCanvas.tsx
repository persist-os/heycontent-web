/**
 * CONSTELLATION CANVAS COMPONENT
 *
 * Main constellation visualization component with all interaction logic
 * extracted from the main ProjectViewScreen for better separation of concerns.
 */

'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { WidgetConfig } from '@/types/projectWidgets'
import { usePanZoom } from '../../../hooks/usePanZoom'
import { ConnectionLines } from '../../../components/ConnectionLines'
import { ConstellationControls } from '../../../components/ConstellationControls'
import { ConstellationMinimap } from '../../../components/ConstellationMinimap'
import { useWidgetLayout } from '../hooks/useWidgetLayout'
import { FloatingWidgetCard } from './FloatingWidgetCard'
import { FloatingContentCard } from './FloatingContentCard'
import { ContentAttachmentPanel } from '@/app/dashboard/living-projects/components/ContentAttachmentPanel'
import { ProjectFingerprint } from './ProjectFingerprint'
import { useAnalytics } from '@/hooks/useAnalytics'
import { T } from '@/components/translation/T'

interface ConstellationCanvasProps {
  widgets: WidgetConfig[]
  userId: string | null
  projectId: string
  onWidgetClick: (widget: WidgetConfig) => void
  onWidgetHover: (widgetId: string | null) => void
  highlightedWidget: string | null
  onWidgetRun?: (widgetId: string) => void
  runningWidgetId?: string | null
  contentItems?: any[]
  storedLayout?: any
  onContentOpen?: (id: string, type: string) => void
  onLayoutReset?: () => void
}

export function ConstellationCanvas({
  widgets,
  userId,
  projectId,
  onWidgetClick,
  onWidgetHover,
  highlightedWidget,
  onWidgetRun,
  runningWidgetId,
  contentItems,
  storedLayout,
  onContentOpen,
  onLayoutReset
}: ConstellationCanvasProps) {
  const { trackWidgetOpen } = useAnalytics()
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  // Handle content card click - delegate to parent
  const handleContentOpen = useCallback((id: string, type: string) => {
    onContentOpen?.(id, type)
  }, [onContentOpen])
  
  // Generate constellation layout
  const layout = useWidgetLayout(widgets, contentItems, storedLayout)

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
    const buffer = 400
    const viewportLeft = -transform.x / transform.scale - buffer
    const viewportTop = -transform.y / transform.scale - buffer
    const viewportRight = viewportLeft + (viewportSize.width / transform.scale) + (buffer * 2)
    const viewportBottom = viewportTop + (viewportSize.height / transform.scale) + (buffer * 2)

    return layout.positions.filter(position =>
      position.x >= viewportLeft &&
      position.x <= viewportRight &&
      position.y >= viewportTop &&
      position.y <= viewportBottom
    )
  }, [layout.positions, transform, viewportSize])

  // Create widget lookup for performance using Convex IDs
  const widgetMap = useMemo(() => {
    const map = new Map<string, WidgetConfig>()
    widgets.forEach(widget => map.set(widget._id, widget))
    return map
  }, [widgets])

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
            highlightedProject={highlightedWidget}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
          />

          {/* Floating Widget Cards - Virtual Rendering */}
          {visibleWidgets.map(position => {
            const widget = widgetMap.get(position.id)
            if (!widget) return null

            return (
              <FloatingWidgetCard
                key={position.id}
                widget={widget}
                x={position.x}
                y={position.y}
                size={position.size}
                importance={position.importance}
                isHighlighted={highlightedWidget === position.id}
                scale={transform.scale}
                onClick={() => {
                  trackWidgetOpen(widget.widget_type)
                  onWidgetClick(widget)
                }}
                onHover={onWidgetHover}
                onRun={onWidgetRun}
                isRunning={runningWidgetId === position.id}
              />
            )
          })}

          {/* Floating Content Cards - Virtual Rendering */}
          {layout.positions
            .filter(position => position.type && position.type !== 'widget')
            .map(position => {
              const contentItem = contentItems?.find(item => 
                (item._contentId || item._id) === position.id
              )
              if (!contentItem) return null

              return (
                <FloatingContentCard
                  key={position.id}
                  item={contentItem}
                  itemType={position.type as 'note' | 'conversation' | 'crystal' | 'shard'}
                  x={position.x}
                  y={position.y}
                  size={position.size}
                  importance={position.importance}
                  isHighlighted={highlightedWidget === position.id}
                  scale={transform.scale}
                  onOpen={handleContentOpen}
                />
              )
            })}

          {/* Canvas bounds indicator with accent */}
          <div
            className="absolute inset-0 border border-primary/10 rounded-lg pointer-events-none"
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight
            }}
          />
        </div>
      </div>

      {/* Project Fingerprint - Top Left with enhanced glassmorphism */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto max-w-2xl">
        <div className="bg-gradient-to-br from-card/85 via-card/80 to-primary/10 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl shadow-primary/10 ring-1 ring-border/20">
          <ProjectFingerprint projectId={projectId} />
        </div>
      </div>

      {/* Stats Overlay - Top Right with color variety */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-gradient-to-br from-card/80 via-card/70 to-accent/10 backdrop-blur-lg border border-border/40 rounded-xl px-5 py-2.5 shadow-lg shadow-accent/10">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <T context="constellation.canvas.stats.active">Active</T>: <span className="text-foreground font-medium">{widgets.filter(w => w.priority > 7).length}</span>
            </span>
            <span className="text-border">•</span>
            <span className="text-foreground font-mono">{Math.round(transform.scale * 100)}% <T context="constellation.canvas.stats.zoom">zoom</T></span>
          </div>
        </div>
      </div>

      {/* Navigation Controls - Bottom Left */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="absolute bottom-4 left-4 z-10"
      />

      {/* Layout Reset Button with accent */}
      {onLayoutReset && (
        <div className="absolute bottom-4 left-64 z-10">
          <button
            onClick={onLayoutReset}
            className="px-4 py-2 text-xs bg-gradient-to-r from-secondary/80 to-secondary/60 backdrop-blur-lg border border-border/40 rounded-lg hover:from-secondary hover:to-secondary/80 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200"
            title="Reset layout"
          >
            <T context="constellation.canvas.button.reset_layout">Reset Layout</T>
          </button>
        </div>
      )}

      {/* Minimap - Top Right with responsive positioning to prevent cutoff */}
      <div className="absolute top-20 right-4 z-10 max-sm:top-16 max-sm:right-2">
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

      {/* Keyboard shortcuts hint - Center Bottom, Above Controls with accent */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-20 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
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
