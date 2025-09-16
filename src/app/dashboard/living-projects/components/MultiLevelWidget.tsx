'use client'

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

interface MultiLevelWidgetProps {
  widget: WidgetConfig
  x: number
  y: number
  scale: number
  viewMode: 'overview' | 'project-detail'
  zoomLevel: 'hidden' | 'dot' | 'summary' | 'full'
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
}

export function MultiLevelWidget({
  widget,
  x,
  y,
  scale,
  viewMode,
  zoomLevel,
  onClick,
  onHover
}: MultiLevelWidgetProps) {
  // Don't render if hidden
  if (zoomLevel === 'hidden') {
    return null
  }

  // Dot level - just a small circle
  if (zoomLevel === 'dot') {
    return (
      <circle
        cx={x}
        cy={y}
        r={4 / scale}
        fill="hsl(var(--primary))"
        opacity={0.7}
        className="transition-all duration-200 ease-out cursor-pointer hover:opacity-100"
        onClick={onClick}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
      />
    )
  }

  // Summary level - small card with title
  if (zoomLevel === 'summary') {
    const cardWidth = 120 / scale
    const cardHeight = 80 / scale

    return (
      <g>
        {/* Widget card background */}
        <rect
          x={x - cardWidth / 2}
          y={y - cardHeight / 2}
          width={cardWidth}
          height={cardHeight}
          rx={8 / scale}
          fill="hsl(var(--card))"
          stroke="hsl(var(--border))"
          strokeWidth={1 / scale}
          className="transition-all duration-200 ease-out cursor-pointer hover:shadow-lg"
          onClick={onClick}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        />

        {/* Widget title */}
        <text
          x={x}
          y={y - 5 / scale}
          textAnchor="middle"
          className="font-medium fill-foreground"
          style={{
            fontSize: `${10 / scale}px`,
            transformOrigin: `${x}px ${y - 5 / scale}px`,
            transform: `scale(${1 / scale})`
          }}
        >
          {widget.title}
        </text>

        {/* Widget type indicator */}
        <circle
          cx={x + cardWidth / 2 - 8 / scale}
          cy={y - cardHeight / 2 + 8 / scale}
          r={3 / scale}
          fill={`hsl(var(--${widget.theme}-500))`}
          opacity={0.8}
        />
      </g>
    )
  }

  // Full level - complete widget card
  if (zoomLevel === 'full') {
    const cardWidth = widget.size === 'large' ? 200 / scale : widget.size === 'medium' ? 160 / scale : 120 / scale
    const cardHeight = widget.size === 'large' ? 150 / scale : widget.size === 'medium' ? 120 / scale : 90 / scale

    return (
      <g>
        {/* Widget card background with theme */}
        <rect
          x={x - cardWidth / 2}
          y={y - cardHeight / 2}
          width={cardWidth}
          height={cardHeight}
          rx={12 / scale}
          fill={`hsl(var(--${widget.theme}-50))`}
          stroke={`hsl(var(--${widget.theme}-200))`}
          strokeWidth={2 / scale}
          className="transition-all duration-200 ease-out cursor-pointer hover:shadow-xl"
          onClick={onClick}
          onMouseEnter={() => onHover?.(true)}
          onMouseLeave={() => onHover?.(false)}
        />

        {/* Widget header */}
        <rect
          x={x - cardWidth / 2}
          y={y - cardHeight / 2}
          width={cardWidth}
          height={30 / scale}
          rx={12 / scale}
          fill={`hsl(var(--${widget.theme}-100))`}
        />

        {/* Widget title */}
        <text
          x={x}
          y={y - cardHeight / 2 + 18 / scale}
          textAnchor="middle"
          className="font-semibold fill-foreground"
          style={{
            fontSize: `${12 / scale}px`,
            transformOrigin: `${x}px ${y - cardHeight / 2 + 18 / scale}px`,
            transform: `scale(${1 / scale})`
          }}
        >
          {widget.title}
        </text>

        {/* Widget description */}
        <text
          x={x}
          y={y + 10 / scale}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{
            fontSize: `${9 / scale}px`,
            transformOrigin: `${x}px ${y + 10 / scale}px`,
            transform: `scale(${1 / scale})`
          }}
        >
          {widget.description}
        </text>

        {/* Priority indicator */}
        <circle
          cx={x + cardWidth / 2 - 8 / scale}
          cy={y - cardHeight / 2 + 8 / scale}
          r={4 / scale}
          fill={widget.priority > 7 ? 'hsl(var(--destructive))' : 'hsl(var(--muted-foreground))'}
          opacity={0.8}
        />

        {/* Size indicator */}
        <text
          x={x + cardWidth / 2 - 20 / scale}
          y={y + cardHeight / 2 - 8 / scale}
          textAnchor="end"
          className="fill-muted-foreground"
          style={{
            fontSize: `${8 / scale}px`,
            transformOrigin: `${x + cardWidth / 2 - 20 / scale}px ${y + cardHeight / 2 - 8 / scale}px`,
            transform: `scale(${1 / scale})`
          }}
        >
          {widget.size}
        </text>
      </g>
    )
  }

  return null
}
