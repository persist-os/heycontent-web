'use client'

import React from 'react'
import { WidgetConfig } from '@/types/projectWidgets'

interface WidgetCardProps {
  widget: WidgetConfig
  x: number
  y: number
  scale: number
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
}

/**
 * A compact, square widget marker rendered on the canvas at an orbital position.
 * The card maintains a constant on-screen size regardless of zoom using inverse scaling.
 */
export function WidgetCard({ widget, x, y, scale, onClick, onHover }: WidgetCardProps) {
  const size = 24 / Math.max(scale, 0.001)
  const left = x - size / 2
  const top = y - size / 2

  const themeBg: Record<WidgetConfig['theme'], string> = {
    warm: 'bg-orange-500/20',
    clean: 'bg-blue-500/10',
    professional: 'bg-slate-500/10',
    creative: 'bg-violet-500/15',
  }

  return (
    <div
      className={[
        'absolute rounded-md border shadow-sm cursor-pointer z-20',
        'hover:shadow-md hover:border-primary transition-all duration-150',
        themeBg[widget.theme] || 'bg-card/40',
      ].join(' ')}
      style={{
        left,
        top,
        width: size,
        height: size,
        borderColor: 'hsl(var(--border))',
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      title={widget.title}
    >
      <div
        className="absolute inset-0 grid place-items-center text-[10px] select-none"
        style={{ transform: `scale(${1 / Math.max(scale, 0.001)})` }}
      >
        {/* Minimal dot indicator for priority */}
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: widget.priority > 7 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}
        />
      </div>
    </div>
  )
}


