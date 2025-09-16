'use client'

import React from 'react'
import { ProjectState, getProjectStateStyles } from '../hooks/useProjectStates'

interface ProjectSpaceBoundaryProps {
  x: number
  y: number
  radius: number
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
  // Progressive disclosure thresholds
  ZOOM_THRESHOLD_PROJECT_DOTS: number
  ZOOM_THRESHOLD_PROJECT_CARDS: number
}

export function ProjectSpaceBoundary({
  x,
  y,
  radius,
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
  ZOOM_THRESHOLD_PROJECT_DOTS,
  ZOOM_THRESHOLD_PROJECT_CARDS
}: ProjectSpaceBoundaryProps) {
  const diameter = radius * 2

  // Progressive disclosure: determine what to show based on zoom level
  const showAsDot = scale < ZOOM_THRESHOLD_PROJECT_DOTS
  const showAsCard = scale >= ZOOM_THRESHOLD_PROJECT_DOTS && scale < ZOOM_THRESHOLD_PROJECT_CARDS
  const showAsFull = scale >= ZOOM_THRESHOLD_PROJECT_CARDS
  
  // Show project space boundary on hover in overview, always in project-detail
  const showBoundary = (isHighlighted || isFocused) || viewMode === 'project-detail'

  // Get project state styles
  const stateStyles = getProjectStateStyles(projectState)

  // Different boundary styles based on state and view mode
  const getBoundaryStyles = () => {
    if (viewMode === 'project-detail' && isFocused) {
      return {
        stroke: stateStyles.boundaryColor,
        strokeWidth: 3,
        strokeDasharray: 'none',
        fill: `${stateStyles.boundaryColor} / 0.1`,
        opacity: stateStyles.boundaryOpacity
      }
    }

    if (isHighlighted) {
      return {
        stroke: stateStyles.boundaryColor,
        strokeWidth: 2,
        strokeDasharray: '8,4',
        fill: `${stateStyles.boundaryColor} / 0.05`,
        opacity: stateStyles.boundaryOpacity
      }
    }

    return {
      stroke: stateStyles.boundaryColor,
      strokeWidth: 1.5,
      strokeDasharray: '6,6',
      fill: `${stateStyles.boundaryColor} / 0.03`,
      opacity: stateStyles.boundaryOpacity * 0.8
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
            left: x - radius,
            top: y - radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: '50%',
            background: 'transparent',
            cursor: 'pointer',
            zIndex: 10
          }}
          onWheel={onWheel}
          onWheelCapture={onWheel}
          onClick={onClick}
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
      {/* Always show project title */}
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="font-medium fill-foreground pointer-events-none"
        style={{
          fontSize: `${Math.max(12, Math.min(18, 16 / Math.sqrt(scale)))}px`,
          transformOrigin: `${x}px ${y + 4}px`,
          transform: `scale(${1 / scale})`
        }}
      >
        {projectName}
      </text>

      {/* Show project space boundary only on hover; disable pointer events in project-detail */}
      {showBoundary && (
        <circle
          cx={x}
          cy={y}
          r={radius}
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
          {/* Animated pulse ring */}
          <circle
            cx={x}
            cy={y}
            r={radius}
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            fill="transparent"
            opacity={0.3}
            className="animate-ping"
          />
          
          {/* Project space label */}
          <text
            x={x}
            y={y + radius + 20}
            textAnchor="middle"
            className="text-xs font-medium fill-muted-foreground"
            style={{
              fontSize: `${12 / scale}px`,
              transformOrigin: `${x}px ${y + radius + 20}px`,
              transform: `scale(${1 / scale})`
            }}
          >
            Project Space
          </text>
        </>
      )}
      </svg>
    </>
  )
}
