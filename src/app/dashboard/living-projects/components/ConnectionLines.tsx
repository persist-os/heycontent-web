'use client'

import React, { useMemo } from 'react'

interface Connection {
  from: string
  to: string
  strength: number
}

interface ProjectPosition {
  id: string
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
}

interface ConnectionLinesProps {
  connections: Connection[]
  positions: ProjectPosition[]
  canvasWidth: number
  canvasHeight: number
  scale: number
  translateX: number
  translateY: number
  highlightedProject?: string | null
  viewportWidth: number
  viewportHeight: number
}

export function ConnectionLines({
  connections,
  positions,
  canvasWidth,
  canvasHeight,
  scale,
  translateX,
  translateY,
  highlightedProject,
  viewportWidth,
  viewportHeight
}: ConnectionLinesProps) {
  // Create position lookup for performance
  const positionMap = useMemo(() => {
    const map = new Map<string, ProjectPosition>()
    positions.forEach(pos => map.set(pos.id, pos))
    return map
  }, [positions])

  // Filter connections to only show those visible in viewport
  const visibleConnections = useMemo(() => {
    // Calculate viewport bounds in canvas coordinates
    const viewportLeft = -translateX / scale
    const viewportTop = -translateY / scale
    const viewportRight = viewportLeft + viewportWidth / scale
    const viewportBottom = viewportTop + viewportHeight / scale
    
    // Expand viewport bounds to include buffer zone
    const buffer = 200
    const expandedLeft = viewportLeft - buffer
    const expandedTop = viewportTop - buffer
    const expandedRight = viewportRight + buffer
    const expandedBottom = viewportBottom + buffer

    return connections.filter(connection => {
      const fromPos = positionMap.get(connection.from)
      const toPos = positionMap.get(connection.to)
      
      if (!fromPos || !toPos) return false

      // Check if either endpoint is in the expanded viewport
      const fromVisible = fromPos.x >= expandedLeft && fromPos.x <= expandedRight && 
                         fromPos.y >= expandedTop && fromPos.y <= expandedBottom
      const toVisible = toPos.x >= expandedLeft && toPos.x <= expandedRight && 
                       toPos.y >= expandedTop && toPos.y <= expandedBottom

      // Also check if line crosses through viewport
      const lineVisible = (fromPos.x <= expandedRight && toPos.x >= expandedLeft) &&
                         (fromPos.y <= expandedBottom && toPos.y >= expandedTop)

      return fromVisible || toVisible || lineVisible
    })
  }, [connections, positionMap, scale, translateX, translateY, viewportWidth, viewportHeight])

  // Calculate line opacity based on scale and highlight state
  const getLineOpacity = (connection: Connection, fromPos: ProjectPosition, toPos: ProjectPosition) => {
    let baseOpacity = connection.strength * 0.3 // Base opacity from connection strength
    
    // Scale-based opacity (more visible when zoomed in)
    const scaleMultiplier = Math.min(1.5, Math.max(0.5, scale))
    baseOpacity *= scaleMultiplier
    
    // Highlight effect
    if (highlightedProject) {
      if (connection.from === highlightedProject || connection.to === highlightedProject) {
        baseOpacity *= 2.5 // Brighten connected lines
      } else {
        baseOpacity *= 0.3 // Dim other lines
      }
    }
    
    // Distance-based opacity (closer lines are more visible)
    const distance = Math.sqrt(
      Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2)
    )
    const distanceMultiplier = Math.max(0.3, 1 - (distance / 600))
    baseOpacity *= distanceMultiplier
    
    return Math.min(0.6, Math.max(0.05, baseOpacity))
  }

  // Calculate stroke width based on connection strength and scale
  const getStrokeWidth = (connection: Connection) => {
    const baseWidth = 1 + connection.strength * 1.5
    const scaleMultiplier = Math.max(0.5, Math.min(2, scale))
    return baseWidth * scaleMultiplier
  }

  // Generate path with subtle curve for more organic feel
  const generatePath = (fromPos: ProjectPosition, toPos: ProjectPosition) => {
    const deltaX = toPos.x - fromPos.x
    const deltaY = toPos.y - fromPos.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Create a subtle curve based on distance and direction
    const curvature = Math.min(50, distance * 0.1)
    const midX = (fromPos.x + toPos.x) / 2
    const midY = (fromPos.y + toPos.y) / 2
    
    // Add perpendicular offset for curve
    const perpX = -deltaY / distance * curvature
    const perpY = deltaX / distance * curvature
    
    const controlX = midX + perpX
    const controlY = midY + perpY
    
    return `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`
  }

  if (visibleConnections.length === 0) {
    return null
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={canvasWidth}
      height={canvasHeight}
      style={{
        overflow: 'visible'
      }}
    >
      <defs>
        {/* Gradient definitions for different connection types */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
        </linearGradient>
        
        <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {visibleConnections.map((connection) => {
        const fromPos = positionMap.get(connection.from)
        const toPos = positionMap.get(connection.to)
        
        if (!fromPos || !toPos) return null

        const opacity = getLineOpacity(connection, fromPos, toPos)
        const strokeWidth = getStrokeWidth(connection)
        const isHighlighted = highlightedProject && 
          (connection.from === highlightedProject || connection.to === highlightedProject)
        
        // Use different colors based on connection strength and theme
        const strokeColor = isHighlighted 
          ? 'text-blue-400 dark:text-blue-300'
          : 'text-blue-400/60 dark:text-blue-300/40'

        return (
          <g key={`${connection.from}-${connection.to}`}>
            {/* Main connection line */}
            <path
              d={generatePath(fromPos, toPos)}
              fill="none"
              stroke="url(#connectionGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${2 + connection.strength * 4} ${4 + connection.strength * 2}`}
              opacity={opacity}
              className={`transition-all duration-300 ${strokeColor}`}
              style={{
                filter: isHighlighted ? 'drop-shadow(0 0 2px currentColor)' : undefined
              }}
            />
            
            {/* Subtle glow effect for highlighted connections */}
            {isHighlighted && (
              <path
                d={generatePath(fromPos, toPos)}
                fill="none"
                stroke="url(#highlightGradient)"
                strokeWidth={strokeWidth + 2}
                strokeDasharray={`${2 + connection.strength * 4} ${4 + connection.strength * 2}`}
                opacity={opacity * 0.5}
                className={`transition-all duration-300 ${strokeColor}`}
                style={{
                  filter: 'blur(2px)'
                }}
              />
            )}
          </g>
        )
      })}

      {/* Animated pulse effect for very strong connections */}
      {visibleConnections
        .filter(conn => conn.strength > 0.8)
        .map((connection) => {
          const fromPos = positionMap.get(connection.from)
          const toPos = positionMap.get(connection.to)
          
          if (!fromPos || !toPos) return null

          const isHighlighted = highlightedProject && 
            (connection.from === highlightedProject || connection.to === highlightedProject)

          if (!isHighlighted) return null

          return (
            <path
              key={`pulse-${connection.from}-${connection.to}`}
              d={generatePath(fromPos, toPos)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.4"
              className="text-blue-400 dark:text-blue-300"
              style={{
                animation: 'constellation-pulse 2s ease-in-out infinite'
              }}
            />
          )
        })}

      <style jsx>{`
        @keyframes constellation-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </svg>
  )
}
