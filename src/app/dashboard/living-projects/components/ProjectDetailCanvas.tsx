'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { WidgetCard } from './WidgetCard'
import { WidgetStar } from './WidgetStar'
import { useWidgetGridLayout } from '../hooks/useWidgetGridLayout'
import { WidgetConfig } from '@/types/projectWidgets'

interface ProjectDetailCanvasProps {
  projectId: string
  projectX: number
  projectY: number
  projectWidth: number
  projectHeight: number
  widgets: WidgetConfig[]
  transform: { x: number; y: number; scale: number }
  viewportWidth: number
  viewportHeight: number
  onWidgetClick?: (widget: WidgetConfig) => void
  onWidgetHover?: (widgetId: string | null) => void
  onWidgetMove?: (widgetId: string, offsetX: number, offsetY: number) => void
  onWidgetSwap?: (widgetIdA: string, widgetIdB: string) => void
  interactionTool?: 'select' | 'move'
  className?: string
}

/**
 * A self-contained canvas component for project-detail mode that renders widgets
 * within project boundaries and handles enhanced widget dragging with visual effects.
 */
export function ProjectDetailCanvas({
  projectId,
  projectX,
  projectY,
  projectWidth,
  projectHeight,
  widgets,
  transform,
  viewportWidth,
  viewportHeight,
  onWidgetClick,
  onWidgetHover,
  onWidgetMove,
  onWidgetSwap,
  interactionTool = 'select',
  className = ''
}: ProjectDetailCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [placingWidget, setPlacingWidget] = useState<{widgetId: string, widget: WidgetConfig} | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{x: number, y: number} | null>(null)
  const [hoveredWidgetId, setHoveredWidgetId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, transform: { x: 0, y: 0, scale: 1 } })

  // Get widget layout for the project
  const widgetLayout = useWidgetGridLayout(
    projectX,
    projectY,
    widgets,
    projectWidth,
    projectHeight,
    'constellation'
  )

  // Calculate project boundaries in canvas coordinates
  const projectBounds = {
    left: projectX - projectWidth / 2,
    right: projectX + projectWidth / 2,
    top: projectY - projectHeight / 2,
    bottom: projectY + projectHeight / 2
  }

  // Constrain transform to project boundaries
  const constrainedTransform = useCallback(() => {
    const minX = viewportWidth - projectBounds.right * transform.scale
    const maxX = viewportWidth - projectBounds.left * transform.scale
    const minY = viewportHeight - projectBounds.bottom * transform.scale
    const maxY = viewportHeight - projectBounds.top * transform.scale

    return {
      x: Math.max(minX, Math.min(maxX, transform.x)),
      y: Math.max(minY, Math.min(maxY, transform.y)),
      scale: transform.scale
    }
  }, [transform, projectBounds, viewportWidth, viewportHeight])

  // Handle canvas panning with boundary constraints
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || placingWidget) return
    
    setIsDragging(true)
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      transform: { ...transform }
    })
  }, [transform, placingWidget])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || placingWidget) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const newTransform = {
      x: dragStart.transform.x + deltaX,
      y: dragStart.transform.y + deltaY,
      scale: dragStart.transform.scale
    }

    // Apply boundary constraints
    const constrained = {
      x: Math.max(
        viewportWidth - projectBounds.right * newTransform.scale,
        Math.min(viewportWidth - projectBounds.left * newTransform.scale, newTransform.x)
      ),
      y: Math.max(
        viewportHeight - projectBounds.bottom * newTransform.scale,
        Math.min(viewportHeight - projectBounds.top * newTransform.scale, newTransform.y)
      ),
      scale: newTransform.scale
    }

    // Update transform through parent component
    // This would need to be passed as a callback from parent
  }, [isDragging, dragStart, placingWidget, projectBounds, viewportWidth, viewportHeight])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Set up mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    } else {
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Handle widget click for move mode
  const handleWidgetClick = useCallback((widget: WidgetConfig) => {
    if (interactionTool === 'move') {
      setPlacingWidget({ widgetId: widget.widget_id, widget })
    } else {
      onWidgetClick?.(widget)
    }
  }, [interactionTool, onWidgetClick])

  // Handle click-to-move overlay
  const handleCanvasClick = useCallback(async (e: React.MouseEvent) => {
    if (!placingWidget) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const canvasX = (mouseX - transform.x) / transform.scale
    const canvasY = (mouseY - transform.y) / transform.scale
    
    // Check if hovering over another widget
    const hoveredWidget = widgetLayout.positions.find(pos => {
      if (pos.id === placingWidget.widgetId) return false
      const dx = pos.x - canvasX
      const dy = pos.y - canvasY
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < 70 / transform.scale // Widget radius
    })
    
    if (hoveredWidget) {
      // Swap with hovered widget
      onWidgetSwap?.(placingWidget.widgetId, hoveredWidget.id)
    } else if (hoverPosition) {
      // Move to empty space
      const minX = projectBounds.left + 40
      const maxX = projectBounds.right - 40
      const minY = projectBounds.top + 40
      const maxY = projectBounds.bottom - 40
      const relX = (hoverPosition.x - minX) / (maxX - minX)
      const relY = (hoverPosition.y - minY) / (maxY - minY)
      onWidgetMove?.(placingWidget.widgetId, relX, relY)
    }
    
    // Clear placing state
    setPlacingWidget(null)
    setHoverPosition(null)
    setHoveredWidgetId(null)
  }, [placingWidget, transform, widgetLayout.positions, hoverPosition, projectBounds, onWidgetSwap, onWidgetMove])

  // Handle mouse move for placing widget
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!placingWidget) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const canvasX = (mouseX - transform.x) / transform.scale
    const canvasY = (mouseY - transform.y) / transform.scale
    
    // Check if hovering over another widget
    const hoveredWidget = widgetLayout.positions.find(pos => {
      if (pos.id === placingWidget.widgetId) return false
      const dx = pos.x - canvasX
      const dy = pos.y - canvasY
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance < 70 / transform.scale // Widget radius
    })
    
    if (hoveredWidget) {
      setHoveredWidgetId(hoveredWidget.id)
      setHoverPosition(null)
    } else {
      setHoveredWidgetId(null)
      // Snap to grid within project bounds
      const minX = projectBounds.left + 40
      const maxX = projectBounds.right - 40
      const minY = projectBounds.top + 40
      const maxY = projectBounds.bottom - 40
      const snap = 24
      const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
      const sx = clamp(Math.round((canvasX - minX) / snap) * snap + minX, minX, maxX)
      const sy = clamp(Math.round((canvasY - minY) / snap) * snap + minY, minY, maxY)
      setHoverPosition({ x: sx, y: sy })
    }
  }, [placingWidget, transform, widgetLayout.positions, projectBounds])

  // Determine widget zoom level based on scale
  const getWidgetZoomLevel = useCallback((scale: number): 'hidden' | 'dot' | 'summary' | 'full' => {
    if (scale < 0.3) return 'hidden'
    if (scale < 0.8) return 'dot'
    return 'full'
  }, [])

  const widgetZoomLevel = getWidgetZoomLevel(transform.scale)

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 cursor-grab active:cursor-grabbing select-none ${className}`}
      onMouseDown={handleMouseDown}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      style={{
        willChange: 'transform'
      }}
    >
      {/* Project Boundary Visual Reference */}
      <div
        className="absolute border-2 border-dashed border-border/30 rounded-lg pointer-events-none"
        style={{
          left: projectBounds.left,
          top: projectBounds.top,
          width: projectWidth,
          height: projectHeight,
          opacity: 0.6
        }}
      />

      {/* Widgets */}
      {widgetZoomLevel !== 'hidden' && (
        <>
          {widgetLayout.positions.map(widgetPosition => {
            const widget = widgets.find(w => w.widget_id === widgetPosition.id)
            if (!widget) return null

            // Use WidgetStar for dot level, WidgetCard for full level
            const WidgetComponent = widgetZoomLevel === 'full' ? WidgetCard : WidgetStar

            return (
              <WidgetComponent
                key={widgetPosition.id}
                widget={widget}
                x={widgetPosition.x}
                y={widgetPosition.y}
                scale={transform.scale}
                onClick={() => handleWidgetClick(widget)}
                onHover={(isHovered) => onWidgetHover?.(isHovered ? widgetPosition.id : null)}
              />
            )
          })}

          {/* Project-to-Widget Connections */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={projectWidth + 200}
            height={projectHeight + 200}
            style={{ 
              overflow: 'visible',
              left: projectBounds.left - 100,
              top: projectBounds.top - 100
            }}
          >
            <g>
              {widgetLayout.positions.map(widgetPosition => (
                <line
                  key={`connection-${widgetPosition.id}`}
                  x1={projectX - projectBounds.left + 100}
                  y1={projectY - projectBounds.top + 100}
                  x2={widgetPosition.x - projectBounds.left + 100}
                  y2={widgetPosition.y - projectBounds.top + 100}
                  stroke="hsl(var(--border))"
                  strokeWidth={1 / transform.scale}
                  strokeDasharray="4,4"
                  opacity={0.4}
                />
              ))}
            </g>
          </svg>

          {/* Widget-to-Widget Connections (curved) at full zoom */}
          {widgetZoomLevel === 'full' && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={projectWidth + 200}
              height={projectHeight + 200}
              style={{ 
                overflow: 'visible',
                left: projectBounds.left - 100,
                top: projectBounds.top - 100
              }}
            >
              <g>
                {(() => {
                  const posById = new Map(widgetLayout.positions.map(p => [p.id, p]))
                  const paths: JSX.Element[] = []
                  for (const edge of widgetLayout.edges || []) {
                    const a = posById.get(edge.fromId)
                    const b = posById.get(edge.toId)
                    if (!a || !b) continue
                    const dx = b.x - a.x
                    const dy = b.y - a.y
                    const mx = (a.x + b.x) / 2
                    const my = (a.y + b.y) / 2
                    const len = Math.hypot(dx, dy) || 1
                    // Perpendicular unit
                    const nx = -dy / len
                    const ny = dx / len
                    const curvature = edge.curvature ?? 0.12
                    const cx = mx + nx * len * curvature
                    const cy = my + ny * len * curvature
                    const d = `M ${a.x - projectBounds.left + 100} ${a.y - projectBounds.top + 100} Q ${cx - projectBounds.left + 100} ${cy - projectBounds.top + 100} ${b.x - projectBounds.left + 100} ${b.y - projectBounds.top + 100}`
                    paths.push(
                      <path
                        key={`edge-${edge.fromId}-${edge.toId}`}
                        d={d}
                        stroke="hsl(var(--border))"
                        strokeWidth={Math.max(0.5, 1 / transform.scale)}
                        fill="none"
                        opacity={0.35}
                      />
                    )
                  }
                  return paths
                })()}
              </g>
            </svg>
          )}

          {/* Visual feedback for placing mode */}
          {placingWidget && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={projectWidth + 200}
              height={projectHeight + 200}
              style={{ 
                overflow: 'visible',
                left: projectBounds.left - 100,
                top: projectBounds.top - 100
              }}
            >
              <>
                {/* Snap indicator dot */}
                {hoverPosition && (
                  <circle
                    cx={hoverPosition.x - projectBounds.left + 100}
                    cy={hoverPosition.y - projectBounds.top + 100}
                    r={4 / transform.scale}
                    fill="hsl(var(--primary))"
                    opacity={0.8}
                  />
                )}
                
                {/* Highlighted widget being placed */}
                {(() => {
                  const placingPos = widgetLayout.positions.find(p => p.id === placingWidget.widgetId)
                  if (!placingPos) return null
                  return (
                    <rect
                      x={placingPos.x - 70 / transform.scale - projectBounds.left + 100}
                      y={placingPos.y - 35 / transform.scale - projectBounds.top + 100}
                      width={140 / transform.scale}
                      height={70 / transform.scale}
                      rx={8 / transform.scale}
                      ry={8 / transform.scale}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2 / transform.scale}
                      fill="hsl(var(--primary) / 0.1)"
                      opacity={0.6}
                    />
                  )
                })()}
                
                {/* Swap preview for hovered widget */}
                {hoveredWidgetId && (() => {
                  const hoveredPos = widgetLayout.positions.find(p => p.id === hoveredWidgetId)
                  if (!hoveredPos) return null
                  return (
                    <rect
                      x={hoveredPos.x - 70 / transform.scale - projectBounds.left + 100}
                      y={hoveredPos.y - 35 / transform.scale - projectBounds.top + 100}
                      width={140 / transform.scale}
                      height={70 / transform.scale}
                      rx={8 / transform.scale}
                      ry={8 / transform.scale}
                      stroke="hsl(var(--primary))"
                      strokeWidth={1 / transform.scale}
                      strokeDasharray="4,4"
                      fill="hsl(var(--primary) / 0.05)"
                      opacity={0.4}
                    />
                  )
                })()}
              </>
            </svg>
          )}
        </>
      )}
    </div>
  )
}
