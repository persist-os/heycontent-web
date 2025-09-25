'use client'

import React from 'react'

interface WidgetPosition {
  id: string
  x: number
  y: number
}

interface WidgetConnectionsProps {
  positions: WidgetPosition[]
  scale: number
  translateX: number
  translateY: number
}

export function WidgetConnections({ positions, scale, translateX, translateY }: WidgetConnectionsProps) {
  if (positions.length < 2) return null

  // Create connections between all widgets (fully connected graph)
  const connections: Array<{ from: WidgetPosition; to: WidgetPosition }> = []
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      connections.push({
        from: positions[i],
        to: positions[j]
      })
    }
  }

  return (
    <g>
      {connections.map((connection, index) => {
        const { from, to } = connection
        
        // Calculate control points for curved line
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2
        
        // Create a gentle curve by offsetting the control point
        const offset = Math.min(50, Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)) * 0.3)
        const controlX = midX + (Math.random() - 0.5) * offset
        const controlY = midY + (Math.random() - 0.5) * offset
        
        return (
          <path
            key={`widget-connection-${index}`}
            d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`}
            stroke="hsl(var(--border))"
            strokeWidth={1 / scale}
            fill="none"
            opacity={0.3}
            strokeDasharray="2,4"
          />
        )
      })}
    </g>
  )
}
