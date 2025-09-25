'use client'

import React from 'react'
import { ProjectState, getProjectStateStyles } from '../hooks/useProjectStates'

interface ProjectSpaceBoundaryProps {
  x: number
  y: number
  width: number
  height: number
  scale: number
  isHighlighted: boolean
  isFocused: boolean
  viewMode: 'overview' | 'project-detail'
  projectName: string
  projectState: ProjectState
  projectId: string
  onClick: () => void
  onHover?: (isHovered: boolean) => void
  onRightClick?: (projectId: string, projectName: string, event: React.MouseEvent) => void
  onWheel?: (e: React.WheelEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  // Progressive disclosure thresholds
  ZOOM_THRESHOLD_PROJECT_DOTS: number
  ZOOM_THRESHOLD_PROJECT_CARDS: number
}

export function ProjectSpaceBoundary({
  x,
  y,
  width,
  height,
  scale,
  isHighlighted,
  isFocused,
  viewMode,
  projectName,
  projectState,
  projectId,
  onClick,
  onHover,
  onRightClick,
  onWheel,
  onMouseDown,
  ZOOM_THRESHOLD_PROJECT_DOTS,
  ZOOM_THRESHOLD_PROJECT_CARDS
}: ProjectSpaceBoundaryProps) {
  const halfWidth = width / 2
  const halfHeight = height / 2

  // Progressive disclosure: determine what to show based on zoom level
  const showAsDot = scale < ZOOM_THRESHOLD_PROJECT_DOTS
  const showAsCard = scale >= ZOOM_THRESHOLD_PROJECT_DOTS && scale < ZOOM_THRESHOLD_PROJECT_CARDS
  const showAsFull = scale >= ZOOM_THRESHOLD_PROJECT_CARDS
  
  // Show project space boundary at 30% zoom or higher, on hover, or always in project-detail
  const showBoundary = scale >= 0.3 || (isHighlighted || isFocused) || viewMode === 'project-detail'

  // Get project state styles
  const stateStyles = getProjectStateStyles(projectState)

  // Different boundary styles based on state and view mode
  const getBoundaryStyles = () => {
    if (viewMode === 'project-detail') {
      // In project-detail mode, show as visual reference only
      if (isFocused) {
        return {
          stroke: stateStyles.boundaryColor,
          strokeWidth: 2.5,
          strokeDasharray: 'none',
          fill: `${stateStyles.boundaryColor} / 0.08`,
          opacity: stateStyles.boundaryOpacity * 0.9
        }
      } else {
        return {
          stroke: stateStyles.boundaryColor,
          strokeWidth: 1,
          strokeDasharray: '4,4',
          fill: `${stateStyles.boundaryColor} / 0.02`,
          opacity: stateStyles.boundaryOpacity * 0.5
        }
      }
    }

    // Overview mode - interactive boundaries
    if (isHighlighted) {
      return {
        stroke: stateStyles.boundaryColor,
        strokeWidth: 2.5,
        strokeDasharray: '8,4',
        fill: `${stateStyles.boundaryColor} / 0.08`,
        opacity: stateStyles.boundaryOpacity
      }
    }

    if (isFocused) {
      return {
        stroke: stateStyles.boundaryColor,
        strokeWidth: 2,
        strokeDasharray: '6,6',
        fill: `${stateStyles.boundaryColor} / 0.05`,
        opacity: stateStyles.boundaryOpacity * 0.9
      }
    }

    return {
      stroke: stateStyles.boundaryColor,
      strokeWidth: 1.5,
      strokeDasharray: '6,6',
      fill: `${stateStyles.boundaryColor} / 0.03`,
      opacity: stateStyles.boundaryOpacity * 0.7
    }
  }

  const boundaryStyles = getBoundaryStyles()

  return (
    <>
      {/* HTML overlay for interactions - disabled in project-detail so widgets can be clicked */}
      {viewMode !== 'project-detail' && (
        <div
          className="absolute pointer-events-auto z-10"
          style={{
            left: x - halfWidth,
            top: y - halfHeight,
            width: width,
            height: height,
            borderRadius: '8px',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 10
          }}
          onWheel={onWheel}
          onWheelCapture={onWheel}
          onClick={onClick}
          onMouseDown={onMouseDown}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onRightClick?.(projectId, projectName, e)
          }}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        />
      )}

      <svg
        className="absolute pointer-events-none"
        style={{
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
      {/* Project title - responsive to mode and state */}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className={`font-medium pointer-events-none ${
          viewMode === 'project-detail' 
            ? isFocused 
              ? 'fill-primary' 
              : 'fill-muted-foreground/70'
            : isHighlighted 
              ? 'fill-primary' 
              : 'fill-foreground'
        }`}
        style={{
          fontSize: `${Math.max(12, Math.min(18, 16 / Math.sqrt(scale)))}px`,
          transformOrigin: `${x}px ${y + 4}px`,
          transform: `scale(${1 / scale})`,
          fontWeight: viewMode === 'project-detail' && isFocused ? '600' : '500'
        }}
      >
        {projectName}
      </text>

      {/* Show project space boundary only on hover; disable pointer events in project-detail */}
      {showBoundary && (
        <rect
          x={x - halfWidth}
          y={y - halfHeight}
          width={width}
          height={height}
          rx="8"
          ry="8"
          {...boundaryStyles}
          className={
            viewMode === 'project-detail'
              ? 'transition-all duration-300 ease-out pointer-events-none'
              : 'transition-all duration-300 ease-out cursor-pointer pointer-events-auto hover:opacity-100 hover:stroke-primary'
          }
          onClick={viewMode !== 'project-detail' ? onClick : undefined}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
          style={{
            transformOrigin: `${x}px ${y}px`,
            willChange: 'transform'
          }}
        />
      )}


      {/* Focus indicator for project-detail mode */}
      {viewMode === 'project-detail' && isFocused && (
        <>
          {/* Outer glow effect */}
          <rect
            x={x - halfWidth - 4}
            y={y - halfHeight - 4}
            width={width + 8}
            height={height + 8}
            rx="12"
            ry="12"
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            fill="transparent"
            opacity={0.2}
            className="animate-pulse"
          />
          
          {/* Animated pulse rectangle */}
          <rect
            x={x - halfWidth}
            y={y - halfHeight}
            width={width}
            height={height}
            rx="8"
            ry="8"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="transparent"
            opacity={0.4}
            className="animate-ping"
          />
          
          {/* Project space label with enhanced styling */}
          <text
            x={x}
            y={y + halfHeight + 24}
            textAnchor="middle"
            className="text-xs font-semibold fill-primary"
            style={{
              fontSize: `${Math.max(10, 12 / scale)}px`,
              transformOrigin: `${x}px ${y + halfHeight + 24}px`,
              transform: `scale(${1 / scale})`,
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
          >
            Active Project Space
          </text>
        </>
      )}

      {/* Subtle indicator for non-focused projects in project-detail mode */}
      {viewMode === 'project-detail' && !isFocused && showBoundary && (
        <text
          x={x}
          y={y + halfHeight + 16}
          textAnchor="middle"
          className="text-xs fill-muted-foreground/50"
          style={{
            fontSize: `${Math.max(8, 10 / scale)}px`,
            transformOrigin: `${x}px ${y + halfHeight + 16}px`,
            transform: `scale(${1 / scale})`
          }}
        >
          {projectName}
        </text>
      )}
      </svg>
    </>
  )
}
