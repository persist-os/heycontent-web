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
            
            <radialGradient id="completionGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.08" />
              <stop offset="50%" stopColor="rgb(139 92 246)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="connectionLine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.3" />
            </linearGradient>
            
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Completion glow effect - static, elegant glow when ready */}
          {discovery.completion.isComplete && (
            <circle
              cx="400"
              cy="400"
              r="380"
              fill="url(#completionGlow)"
              className="opacity-90"
              filter="url(#softGlow)"
            />
          )}

          {/* Auto-generated connections between related fields */}
          {discovery.connections.map((connection) => {
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
                strokeWidth={connection.strength * 2}
                className={discovery.completion.isComplete ? "opacity-60 dark:opacity-70" : "opacity-40 dark:opacity-50"}
                style={{ transition: 'all 0.5s ease-out' }}
              />
            )
          })}

          {/* Auto-discovered constellation points - Clean and readable */}
          {discovery.constellationPoints.map(point => {
            const isHovered = hoveredField === point.field
            const showLabel = discovery.completion.isComplete || point.isRecent

            return (
              <g
                key={point.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredField(point.field)}
                onMouseLeave={() => setHoveredField(null)}
              >
                {/* Outer glow - elegant and static when complete */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 5 : 4.5)}
                  fill="url(#starGlow)"
                  filter="url(#softGlow)"
                  className={`transition-all duration-500 ease-out ${
                    isHovered ? 'opacity-90' : discovery.completion.isComplete ? 'opacity-70' : 'opacity-50'
                  }`}
                >
                  {point.isRecent && !discovery.completion.isComplete && (
                    <animate
                      attributeName="r"
                      values={`${point.size * 3};${point.size * 5};${point.size * 4.5}`}
                      dur="2s"
                      repeatCount="1"
                    />
                  )}
                </circle>

                {/* Main star - crisp and visible */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 2.2 : 1.8)}
                  fill={`rgba(59, 130, 246, ${discovery.completion.isComplete ? 1 : Math.max(point.intensity, 0.9)})`}
                  stroke="rgba(255, 255, 255, 1)"
                  strokeWidth={discovery.completion.isComplete ? 2.5 : isHovered ? 2.5 : 2}
                  className="transition-all duration-500 ease-out drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                  filter="url(#softGlow)"
                />

                {/* Field label - visible when complete or recent */}
                {showLabel && (
                  <text
                    x={point.x}
                    y={point.y - point.size * 2 - 14}
                    fill="hsl(var(--foreground))"
                    fontSize={discovery.completion.isComplete ? "13" : "14"}
                    fontWeight={discovery.completion.isComplete ? "400" : "500"}
                    textAnchor="middle"
                    className={`transition-all duration-500 ${discovery.completion.isComplete ? 'opacity-80' : 'opacity-90'}`}
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                  >
                    {point.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </text>
                )}

                {/* Hover area - larger */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * 6}
                  fill="transparent"
                  className="cursor-pointer"
                />
              </g>
            )
          })}

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
                <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  discovery.completion.isComplete 
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' 
                    : 'bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                }`} />
                <p className="text-sm text-muted-foreground font-light">
                  {discovery.completion.isComplete 
                    ? 'Fingerprint ready!' 
                    : discovery.completion.message}
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

            {/* Show prominent button when ready, subtle skip otherwise */}
            {discovery.completion.isComplete ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={!projectId}
                  onClick={() => {
                    if (!projectId) return
                    router.push(`/dashboard/living-projects/${projectId}`)
                  }}
                  className="w-full px-4 py-3 bg-gradient-to-b from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg text-foreground font-medium hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Continue to generation
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-400/0 via-blue-400/10 to-blue-400/0 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000" />
                </button>
                <p className="text-xs text-center text-muted-foreground/60">
                  Or continue the conversation to refine further
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={!projectId}
                onClick={() => {
                  if (!projectId) return
                  router.push(`/dashboard/living-projects/${projectId}`)
                }}
                className="w-full text-xs px-3 py-2 border border-border/40 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Skip to generation
              </button>
            )}
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
