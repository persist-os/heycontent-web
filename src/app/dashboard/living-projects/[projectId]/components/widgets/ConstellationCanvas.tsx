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

interface ConstellationCanvasProps {
  widgets: WidgetConfig[]
  onWidgetClick: (widget: WidgetConfig) => void
  onWidgetHover: (widgetId: string | null) => void
  highlightedWidget: string | null
  showWidgetPanel: boolean
}

export function ConstellationCanvas({
  widgets,
  onWidgetClick,
  onWidgetHover,
  highlightedWidget,
  showWidgetPanel
}: ConstellationCanvasProps) {
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  // Generate constellation layout
  const layout = useWidgetLayout(widgets)

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

  // Create widget lookup for performance
  const widgetMap = useMemo(() => {
    const map = new Map<string, WidgetConfig>()
    widgets.forEach(widget => map.set(widget.widget_id, widget))
    return map
  }, [widgets])

  // Handle minimap viewport click
  const handleMinimapClick = useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  return (
    <div className={`relative h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden transition-all duration-300 ${showWidgetPanel ? 'w-[calc(100vw-24rem)]' : 'w-screen'}`}>
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
                onClick={() => onWidgetClick(widget)}
                onHover={onWidgetHover}
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

      {/* Navigation Controls */}
      <ConstellationControls
        scale={transform.scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        className="absolute bottom-6 left-6 z-10"
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

      {/* Stats Overlay */}
      <div className="absolute top-6 right-6 left-1/2 z-10 pointer-events-none">
        <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm max-w-xs">
          <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
            <span>Active: {widgets.filter(w => w.priority > 7).length}</span>
            <span>•</span>
            <span>{Math.round(transform.scale * 100)}% zoom</span>
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      {transform.scale < 0.6 && (
        <div className="absolute bottom-6 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
          <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground/70 text-center">
              Drag to explore • Scroll to zoom • Click widgets to interact
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
