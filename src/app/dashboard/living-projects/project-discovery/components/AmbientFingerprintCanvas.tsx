'use client'

import React, { useState } from 'react'
import { Id } from '@/convex/_generated/dataModel'
import { useFingerprintDiscovery } from './AmbientFingerprintCanvas/hooks/useFingerprintDiscovery'
import { ChevronUp, ChevronDown } from 'lucide-react'

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
  // REVOLUTIONARY REACTIVE APPROACH - Zero state management!
  const discovery = useFingerprintDiscovery(projectId, onAllStarsDiscovered)
  
  // Only UI state we need
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredField, setHoveredField] = useState<string | null>(null)

  if (!isActive) return null

  return (
    <div className={`fixed transition-all duration-500 ease-out z-20 ${
      isExpanded 
        ? 'bottom-4 right-4 w-[32rem] h-[85vh] bg-background/95 backdrop-blur-lg border border-border/30 rounded-lg shadow-lg' 
        : 'bottom-4 right-4 w-80 h-64 bg-card/90 backdrop-blur-sm border border-border/20 rounded-lg shadow-sm hover:shadow-md'
    }`}>
    
      {/* Header */}
      <div className={`flex items-baseline justify-between ${isExpanded ? 'p-6 pb-4' : 'p-3 pb-2'}`}>
        <div className="flex items-baseline gap-3">
          <h3 className={`font-light tracking-tight text-foreground ${isExpanded ? 'text-2xl' : 'text-sm'}`}>
            {isExpanded ? 'Project' : 'Fingerprint'}
          </h3>
          {isExpanded && (
            <span className="text-base text-muted-foreground font-light">constellation</span>
          )}
          {!isExpanded && (
            <div className="text-xs text-muted-foreground font-medium">
              {discovery.discoveredFields.size > 0 ? 'Active' : 'Ready'}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronUp className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Revolutionary Reactive Constellation */}
      <div className={`relative ${isExpanded ? 'flex-1' : 'h-32'}`}>
        <svg 
          className="w-full h-full opacity-80 dark:opacity-90"
          viewBox="0 0 600 600"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Gradient definitions */}
          <defs>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="connectionLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.1" />
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
                strokeWidth={connection.strength * 2}
                className="opacity-20 dark:opacity-30"
              >
                <animate
                  attributeName="stroke-opacity"
                  values="0.1;0.4;0.1"
                  dur="6s"
                  repeatCount="indefinite"
                  begin={`${index * 0.8}s`}
                />
              </line>
            )
          })}

          {/* Auto-discovered constellation points */}
          {discovery.constellationPoints.map(point => {
            const isHovered = hoveredField === point.field

            return (
              <g
                key={point.id}
                className={isExpanded ? 'cursor-pointer' : ''}
                onMouseEnter={() => isExpanded && setHoveredField(point.field)}
                onMouseLeave={() => isExpanded && setHoveredField(null)}
              >
                {/* Outer glow */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 3 : 2.5)}
                  fill="url(#starGlow)"
                  className={`transition-all duration-300 ease-out ${
                    isHovered
                      ? 'opacity-60 dark:opacity-70'
                      : 'opacity-30 dark:opacity-40'
                  } ${discovery.isCompleting ? 'animate-pulse' : ''}`}
                >
                  {point.isRecent && (
                    <animate
                      attributeName="r"
                      values={`${point.size * 2};${point.size * 4};${point.size * 2}`}
                      dur="3s"
                      repeatCount="1"
                    />
                  )}
                </circle>

                {/* Main star */}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={point.size * (isHovered ? 1.2 : 1)}
                  fill={`rgba(59, 130, 246, ${point.intensity})`}
                  stroke="rgba(255, 255, 255, 0.8)"
                  strokeWidth={point.isRecent ? 2 : 1}
                  className={`transition-all duration-300 ease-out ${
                    discovery.completion.phase === 'completing' ? 'animate-ping' : ''
                  } ${discovery.completion.percentage > 50 ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]' : ''}`}
                />

                {/* New field label */}
                {point.isRecent && isExpanded && (
                  <text
                    x={point.x}
                    y={point.y - point.size - 8}
                    fill="white"
                    fontSize="12"
                    textAnchor="middle"
                    className="animate-fade-in font-medium"
                  >
                    {point.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </text>
                )}

                {/* Hover area */}
                {isExpanded && (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={point.size * 3}
                    fill="transparent"
                    className="cursor-pointer"
                  />
                )}
              </g>
            )
          })}

          {/* Completion animation */}
          {discovery.completion.isComplete && (
            <circle
              cx="300"
              cy="300"
              r="0"
              fill="none"
              stroke="rgba(34, 197, 94, 0.8)"
              strokeWidth="3"
              className="animate-ping"
            >
              <animate
                attributeName="r"
                values="0;150;300"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </svg>

        {/* Reactive floating insights */}
        {isExpanded && discovery.floatingInsights.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {discovery.floatingInsights.slice(0, 3).map((insight, index) => (
              <div
                key={insight.id}
                className="absolute transition-opacity duration-1000 opacity-90"
                style={{
                  left: `${(insight.x / 600) * 100}%`,
                  top: `${(insight.y / 600) * 100}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="bg-card/90 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 rounded-md px-2 py-1 shadow-md">
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                    {insight.displayName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tooltip for hovered field */}
        {isExpanded && hoveredField && (
          <div className="absolute top-4 left-4 pointer-events-none z-30">
            <div className="bg-background/90 backdrop-blur-sm border border-border/30 rounded px-3 py-2 shadow-sm w-56">
              <div className="text-xs font-medium text-foreground leading-tight">
                {hoveredField.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1 leading-relaxed font-light">
                {discovery.getFieldValue(hoveredField)?.toString().slice(0, 80) || 'Discovering...'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      
      <div className={`${isExpanded ? 'p-6 pt-4' : 'p-3 pt-2'}`}>
        {discovery.discoveredFields.size > 0 && (
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <div className="w-1 h-1 bg-blue-400/60 rounded-full mt-2 animate-pulse" />
              <p className={`text-muted-foreground font-light leading-relaxed ${isExpanded ? 'text-sm' : 'text-xs'}`}>
                {isExpanded ? discovery.completion.message : `Phase ${discovery.currentPhase}`}
              </p>
            </div>
            
            {isExpanded && (
              <div className="text-xs text-muted-foreground/70 font-light">
                {discovery.completion.completedFields}<span className="text-muted-foreground/50">/{discovery.completion.totalFields}</span>
                <span className="ml-2 text-muted-foreground/50">({discovery.completion.percentage}%)</span>
              </div>
            )}
          </div>
        )}
        
        {discovery.isEmpty && (
          <div className="text-center py-3">
            <p className="text-xs text-muted-foreground/70 font-light leading-relaxed">
              Begin chatting to discover<br />your project constellation
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AmbientFingerprintCanvas
