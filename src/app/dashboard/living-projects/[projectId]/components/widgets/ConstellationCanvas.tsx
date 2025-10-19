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

interface ConstellationCanvasProps {
  widgets: WidgetConfig[]
  userId: string | null
  projectId: string
  onWidgetClick: (widget: WidgetConfig) => void
  onWidgetHover: (widgetId: string | null) => void
  highlightedWidget: string | null
  showWidgetPanel: boolean
  onWidgetRun?: (widgetId: string) => void
  runningWidgetId?: string | null
  selectedWidget?: WidgetConfig | null
  contentItems?: any[]
  storedLayout?: any
  onContentOpen?: (id: string, type: string) => void
  onLayoutReset?: () => void
  widgetPanelWidth?: number
  selectedContent?: { item: any; type: 'note' | 'conversation' | 'crystal' | 'shard' } | null
  contentPanelWidth?: number
}

export function ConstellationCanvas({
  widgets,
  userId,
  projectId,
  onWidgetClick,
  onWidgetHover,
  highlightedWidget,
  showWidgetPanel,
  onWidgetRun,
  runningWidgetId,
  selectedWidget,
  contentItems,
  storedLayout,
  onContentOpen,
  onLayoutReset,
  widgetPanelWidth = 384,
  selectedContent,
  contentPanelWidth = 448
}: ConstellationCanvasProps) {
  const { trackWidgetOpen } = useAnalytics()
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  const [showAttachmentPanel, setShowAttachmentPanel] = useState(false)
  
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

  // Calculate total panel width
  const totalPanelWidth = (showWidgetPanel ? widgetPanelWidth : 0) + (selectedContent ? contentPanelWidth : 0)
  
  return (
    <div 
      className="relative h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden transition-all duration-300"
      style={{ width: `calc(100vw - ${totalPanelWidth}px)` }}
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
                  isHighlighted={selectedContent?.item?._id === contentItem._id || highlightedWidget === position.id}
                  scale={transform.scale}
                  onOpen={handleContentOpen}
                />
              )
            })}

          {/* Canvas bounds indicator */}
          <div
            className="absolute inset-0 border border-border/10 rounded-lg pointer-events-none"
            style={{
              width: layout.canvasWidth,
              height: layout.canvasHeight
            }}
          />
        </div>
      </div>

      {/* Project Fingerprint - Top Left */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto max-w-2xl">
        <ProjectFingerprint projectId={projectId} />
      </div>

      {/* Stats Overlay - Top Right */}
      <div className="absolute top-4 right-4 z-10 pointer-events-none">
        <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm">
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
            <span>Active: {widgets.filter(w => w.priority > 7).length}</span>
            <span>•</span>
            <span>{Math.round(transform.scale * 100)}% zoom</span>
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

      {/* Layout Reset Button */}
      {onLayoutReset && (
        <div className="absolute bottom-4 left-64 z-10">
          <button
            onClick={onLayoutReset}
            className="px-3 py-2 text-xs bg-background/80 backdrop-blur-sm border border-border/30 rounded-lg hover:bg-background/90 transition-colors"
            title="Reset layout"
          >
            Reset Layout
          </button>
        </div>
      )}

      {/* Minimap - Bottom Right */}
      <ConstellationMinimap
        positions={layout.positions}
        canvasWidth={layout.canvasWidth}
        canvasHeight={layout.canvasHeight}
        viewportWidth={viewportSize.width}
        viewportHeight={viewportSize.height}
        currentTransform={transform}
        onViewportClick={handleMinimapClick}
        className="absolute bottom-4 right-4 z-10"
      />

      {/* Keyboard shortcuts hint - Center Bottom, Above Controls */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-20 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground/70 text-center">
              Drag to explore • Scroll to zoom • Click widgets to interact
            </div>
          </div>
        </div>
      )}

      {/* Content Attachment Panel for Selected Widget */}
      {selectedWidget && userId && showAttachmentPanel && (
        <ContentAttachmentPanel
          widgetId={selectedWidget._id}
          userId={userId}
          isOpen={showAttachmentPanel}
          onClose={() => setShowAttachmentPanel(false)}
          attachedNoteIds={(selectedWidget as any).noteIds || []}
          attachedConversationIds={(selectedWidget as any).conversationIds || []}
          attachedCrystalIds={(selectedWidget as any).crystalIds || []}
          attachedShardIds={(selectedWidget as any).shardIds || []}
        />
      )}
    </div>
  )
}
