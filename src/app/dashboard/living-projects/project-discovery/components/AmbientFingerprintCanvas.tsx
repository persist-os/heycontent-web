'use client'

/**
 * AmbientFingerprintCanvas - Resizable Panel Version
 *
 * Lives in the right panel of the split-pane layout during project discovery.
 * Shows the constellation of discovered fingerprint fields in real-time.
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Id } from '@/convex/_generated/dataModel'
import { useFingerprintDiscovery } from './AmbientFingerprintCanvas/hooks/useFingerprintDiscovery'

interface AmbientFingerprintCanvasProps {
  projectId?: Id<"projects">
  messageCount: number
  isActive: boolean
  onAllStarsDiscovered?: () => void
}

const AmbientFingerprintCanvas: React.FC<AmbientFingerprintCanvasProps> = ({
  projectId,
  messageCount,
  isActive,
  onAllStarsDiscovered
}) => {
  const discovery = useFingerprintDiscovery(projectId, onAllStarsDiscovered)
  const router = useRouter()
  const [hoveredField, setHoveredField] = useState<string | null>(null)

  if (!isActive) return null

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-baseline justify-between p-6 pb-4 border-b border-border/20">
        <div className="flex items-baseline gap-3">
          <h3 className="text-xl font-light tracking-tight text-foreground">
            Project
          </h3>
          <span className="text-sm text-muted-foreground font-light">constellation</span>
        </div>
      </div>

      {/* Constellation Canvas - fills available space */}
      <div className="relative flex-1 p-6">
        <svg 
          className="w-full h-full"
          viewBox="0 0 800 800"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Enhanced Gradient definitions */}
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="1" />
              <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="connectionLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.2" />
              <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Auto-generated connections between related fields */}
          {discovery.connections.map((connection, index) => {
            const fromPoint = discovery.getPointByField?.(connection.from)
            const toPoint = discovery.getPointByField?.(connection.to)
            
            if (!fromPoint || !toPoint) return null

            return (
              <line
                key={`${connection.from}-${connection.to}`}
                x1={fromPoint.x}
                y1={fromPoint.y}
                x2={toPoint.x}
                y2={toPoint.y}
                stroke="url(#connectionLine)"
                strokeWidth={connection.strength * 2.5}
                className="opacity-40 dark:opacity-50"
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.2;0.6;0.2"
                  dur="6s"
                  repeatCount="indefinite"
                  begin={`${index * 0.8}s`}
                />
              </line>
            )
          })}

          {/* Auto-discovered constellation points - More visible */}
          {discovery.constellationPoints.map(point => {
            const isHovered = hoveredField === point.field

            return (
              <g
                key={point.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredField(point.field)}
                onMouseLeave={() => setHoveredField(null)}
              >
                {/* Outer glow - more prominent */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 4.5 : 4)}
                  fill="url(#starGlow)"
                  className={`transition-all duration-300 ease-out ${
                    isHovered
                      ? 'opacity-80'
                      : 'opacity-50'
                  } ${discovery.isCompleting ? 'animate-pulse' : ''}`}
                >
                  {point.isRecent && (
                    <animate
                      attributeName="r"
                      values={`${point.size * 3};${point.size * 6};${point.size * 3}`}
                      dur="3s"
                      repeatCount="1"
                    />
                  )}
                </circle>

                {/* Main star - larger and more visible */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 2 : 1.5)}
                  fill={`rgba(59, 130, 246, ${Math.max(point.intensity, 0.9)})`}
                  stroke="rgba(255, 255, 255, 0.95)"
                  strokeWidth={point.isRecent ? 3 : 2}
                  className={`transition-all duration-300 ease-out ${
                    discovery.completion.phase === 'completing' ? 'animate-ping' : ''
                  } drop-shadow-[0_0_8px_rgba(59,130,246,1)]`}
                />

                {/* Field label - always visible for recent discoveries */}
                {point.isRecent && (
                  <text
                    x={point.x}
                    y={point.y - point.size * 2 - 12}
                    fill="hsl(var(--foreground))"
                    fontSize="14"
                    fontWeight="500"
                    textAnchor="middle"
                    className="animate-fade-in drop-shadow-sm"
                  >
                    {point.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </text>
                )}

                {/* Hover area - larger */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * 5}
                  fill="transparent"
                  className="cursor-pointer"
                />
              </g>
            )
          })}

          {/* Completion animation */}
          {discovery.completion.isComplete && (
            <circle
              cx="400"
              cy="400"
              r="0"
              fill="none"
              stroke="rgba(34, 197, 94, 0.8)"
              strokeWidth="4"
              className="animate-ping"
            >
              <animate
                attributeName="r"
                values="0;200;400"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>

        {/* Tooltip for hovered field - More prominent */}
        {hoveredField && (
          <div className="absolute top-6 left-6 pointer-events-none z-30 animate-in fade-in duration-200">
            <div className="bg-card border-2 border-blue-500/50 rounded-lg px-4 py-3 shadow-xl max-w-sm">
              <div className="text-sm font-semibold text-foreground mb-1.5">
                {hoveredField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {(() => {
                  const value = discovery.getFieldValue(hoveredField)?.toString()
                  if (!value) return 'Discovering...'
                  return value.length > 120 ? `${value.slice(0, 120)}...` : value
                })()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Progress & Actions */}
      <div className="border-t border-border/20 p-6">
        {discovery.discoveredFields.size > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <p className="text-sm text-muted-foreground font-light">
                  {discovery.completion.message}
                </p>
              </div>
              
              <div className="text-sm text-muted-foreground font-medium">
                {discovery.completion.completedFields}
                <span className="text-muted-foreground/60">/{discovery.completion.totalFields}</span>
                <span className="ml-2 text-xs text-muted-foreground/50">
                  ({discovery.completion.percentage}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              disabled={!projectId}
              onClick={() => {
                if (!projectId) return
                router.push(`/dashboard/living-projects/${projectId}/edit-fingerprint`)
              }}
              className="w-full text-xs px-3 py-2 border border-border/40 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Skip to manual fingerprint editor
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground/70 font-light leading-relaxed">
              Begin chatting to discover<br />your project constellation
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AmbientFingerprintCanvas
