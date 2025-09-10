'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { ALL_FINGERPRINT_FIELDS } from '@/types/fingerprint-schema'
import { ChevronUp, ChevronDown, Map } from 'lucide-react'

// Map fingerprint schema fields to constellation stars
const FINGERPRINT_STARS = [
  // Core Identity Constellation (center-top)
  { fieldName: 'name', displayName: 'Project Identity', category: 'core', x: 50, y: 15, size: 8, importance: 10, discoveryPhase: 1 },
  { fieldName: 'description', displayName: 'Purpose Definition', category: 'core', x: 45, y: 22, size: 6, importance: 8, discoveryPhase: 2 },
  
  // AI Nature Constellation (top-left quadrant)
  { fieldName: 'domain', displayName: 'Project Domain', category: 'nature', x: 20, y: 25, size: 7, importance: 9, discoveryPhase: 2 },
  { fieldName: 'complexity_level', displayName: 'Complexity Level', category: 'nature', x: 15, y: 35, size: 5, importance: 7, discoveryPhase: 3 },
  { fieldName: 'collaboration_style', displayName: 'Collaboration Style', category: 'nature', x: 30, y: 30, size: 6, importance: 8, discoveryPhase: 3 },
  { fieldName: 'time_horizon', displayName: 'Time Horizon', category: 'nature', x: 25, y: 40, size: 5, importance: 7, discoveryPhase: 4 },
  { fieldName: 'primary_pattern', displayName: 'Working Pattern', category: 'nature', x: 35, y: 20, size: 7, importance: 9, discoveryPhase: 4 },
  
  // Archetype Constellation (top-right quadrant)
  { fieldName: 'decision_making', displayName: 'Decision Making', category: 'archetype', x: 75, y: 25, size: 6, importance: 8, discoveryPhase: 5 },
  { fieldName: 'energy_patterns', displayName: 'Energy Patterns', category: 'archetype', x: 80, y: 35, size: 5, importance: 7, discoveryPhase: 5 },
  
  // Intentions Constellation (center-right)
  { fieldName: 'core_intention', displayName: 'Core Intention', category: 'intentions', x: 70, y: 45, size: 8, importance: 10, discoveryPhase: 6 },
  { fieldName: 'success_vision', displayName: 'Success Vision', category: 'intentions', x: 85, y: 50, size: 7, importance: 9, discoveryPhase: 6 },
  { fieldName: 'value_creation', displayName: 'Value Creation', category: 'intentions', x: 75, y: 55, size: 6, importance: 8, discoveryPhase: 7 },
  
  // Timeline Constellation (center-left)
  { fieldName: 'natural_rhythm', displayName: 'Natural Rhythm', category: 'timeline', x: 25, y: 50, size: 6, importance: 8, discoveryPhase: 7 },
  { fieldName: 'flexibility_preference', displayName: 'Flexibility Style', category: 'timeline', x: 15, y: 60, size: 5, importance: 7, discoveryPhase: 8 },
  
  // Outputs Constellation (bottom-right quadrant)
  { fieldName: 'tangible_deliverables', displayName: 'Deliverables', category: 'outputs', x: 70, y: 70, size: 6, importance: 8, discoveryPhase: 8 },
  { fieldName: 'intangible_benefits', displayName: 'Intangible Benefits', category: 'outputs', x: 80, y: 75, size: 5, importance: 7, discoveryPhase: 9 },
  { fieldName: 'measurement_approach', displayName: 'Measurement', category: 'outputs', x: 75, y: 80, size: 4, importance: 6, discoveryPhase: 9 },
  { fieldName: 'sharing_intention', displayName: 'Sharing Intent', category: 'outputs', x: 65, y: 85, size: 5, importance: 7, discoveryPhase: 10 },
  
  // Interface Constellation (bottom-left quadrant)
  { fieldName: 'cognitive_load_preference', displayName: 'Cognitive Load', category: 'interface', x: 25, y: 70, size: 5, importance: 7, discoveryPhase: 10 },
  { fieldName: 'information_density', displayName: 'Info Density', category: 'interface', x: 15, y: 80, size: 4, importance: 6, discoveryPhase: 11 },
  { fieldName: 'feedback_frequency', displayName: 'Feedback Rhythm', category: 'interface', x: 30, y: 85, size: 5, importance: 7, discoveryPhase: 11 },
  
  // Evolution Intelligence (bottom-center)
  { fieldName: 'learning_sensitivity', displayName: 'Learning Rate', category: 'evolution', x: 45, y: 75, size: 6, importance: 8, discoveryPhase: 12 },
  
  // Context Awareness (scattered for natural feel)
  { fieldName: 'user_constraints', displayName: 'Constraints', category: 'context', x: 40, y: 35, size: 4, importance: 6, discoveryPhase: 13 },
  { fieldName: 'support_systems', displayName: 'Support Systems', category: 'context', x: 60, y: 30, size: 5, importance: 7, discoveryPhase: 13 },
  { fieldName: 'external_dependencies', displayName: 'Dependencies', category: 'context', x: 55, y: 65, size: 4, importance: 6, discoveryPhase: 14 },
  
  // Agent Coordination (center constellation)
  { fieldName: 'morning_persona', displayName: 'Morning AI', category: 'agent', x: 45, y: 45, size: 5, importance: 7, discoveryPhase: 14 },
  { fieldName: 'evening_persona', displayName: 'Evening AI', category: 'agent', x: 55, y: 50, size: 5, importance: 7, discoveryPhase: 15 },
  
  // Prompt Generation (upper center)
  { fieldName: 'base_personality', displayName: 'AI Personality', category: 'prompt', x: 50, y: 35, size: 7, importance: 9, discoveryPhase: 15 },
  { fieldName: 'project_voice', displayName: 'Project Voice', category: 'prompt', x: 60, y: 40, size: 6, importance: 8, discoveryPhase: 16 }
]

// Logical connections between fingerprint fields
const FINGERPRINT_CONNECTIONS = [
  // Core to Nature
  { from: 'name', to: 'domain' },
  { from: 'description', to: 'core_intention' },
  
  // Nature internal connections
  { from: 'domain', to: 'complexity_level' },
  { from: 'collaboration_style', to: 'primary_pattern' },
  { from: 'time_horizon', to: 'natural_rhythm' },
  
  // Archetype to Intentions
  { from: 'decision_making', to: 'success_vision' },
  { from: 'energy_patterns', to: 'natural_rhythm' },
  
  // Intentions internal flow
  { from: 'core_intention', to: 'success_vision' },
  { from: 'success_vision', to: 'value_creation' },
  
  // Timeline to Outputs
  { from: 'natural_rhythm', to: 'feedback_frequency' },
  { from: 'flexibility_preference', to: 'measurement_approach' },
  
  // Outputs internal flow
  { from: 'tangible_deliverables', to: 'intangible_benefits' },
  { from: 'measurement_approach', to: 'sharing_intention' },
  
  // Interface preferences
  { from: 'cognitive_load_preference', to: 'information_density' },
  { from: 'information_density', to: 'feedback_frequency' },
  
  // Evolution connections
  { from: 'learning_sensitivity', to: 'flexibility_preference' },
  
  // Context awareness
  { from: 'user_constraints', to: 'support_systems' },
  { from: 'support_systems', to: 'external_dependencies' },
  
  // Agent coordination
  { from: 'energy_patterns', to: 'morning_persona' },
  { from: 'natural_rhythm', to: 'evening_persona' },
  
  // Prompt generation
  { from: 'primary_pattern', to: 'base_personality' },
  { from: 'base_personality', to: 'project_voice' },
  
  // Cross-category meaningful connections
  { from: 'core_intention', to: 'base_personality' },
  { from: 'collaboration_style', to: 'support_systems' },
  { from: 'complexity_level', to: 'cognitive_load_preference' },
  { from: 'success_vision', to: 'tangible_deliverables' }
]

// Discovery phases with natural progression messages
const DISCOVERY_PHASES = [
  { phase: 1, message: "Understanding your project's essence..." },
  { phase: 2, message: "Mapping your creative domain..." },
  { phase: 3, message: "Learning your working style..." },
  { phase: 4, message: "Discovering your patterns..." },
  { phase: 5, message: "Reading your decision rhythms..." },
  { phase: 6, message: "Seeing your deeper intentions..." },
  { phase: 7, message: "Understanding your timeline..." },
  { phase: 8, message: "Mapping your natural flow..." },
  { phase: 9, message: "Defining success together..." },
  { phase: 10, message: "Shaping how you'll share..." },
  { phase: 11, message: "Calibrating your interface..." },
  { phase: 12, message: "Setting evolution sensitivity..." },
  { phase: 13, message: "Mapping your context..." },
  { phase: 14, message: "Coordinating AI support..." },
  { phase: 15, message: "Creating your AI voice..." },
  { phase: 16, message: "Completing your constellation..." }
]

interface FloatingInsight {
  id: string
  fieldName: string
  displayName: string
  x: number
  y: number
  timestamp: number
}

interface AmbientFingerprintCanvasProps {
  messageCount: number
  isActive: boolean
}

const AmbientFingerprintCanvas: React.FC<AmbientFingerprintCanvasProps> = ({
  messageCount,
  isActive
}) => {
  const [discoveredFields, setDiscoveredFields] = useState<Set<string>>(new Set())
  const [floatingInsights, setFloatingInsights] = useState<FloatingInsight[]>([])
  const [currentPhase, setCurrentPhase] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hoveredField, setHoveredField] = useState<string | null>(null)

  // Calculate which fingerprint fields should be discovered based on message count
  const fieldsToDiscover = useMemo(() => {
    // More natural discovery rate - 1-2 fields per 2-3 messages
    const maxFields = Math.min(Math.floor(messageCount * 0.8) + 1, FINGERPRINT_STARS.length)
    return FINGERPRINT_STARS.slice(0, maxFields)
  }, [messageCount])

  // Update discovered fields and current phase
  useEffect(() => {
    const newDiscovered = new Set(discoveredFields)
    const newInsights: FloatingInsight[] = []
    let phaseChanged = false

    fieldsToDiscover.forEach(field => {
      if (!discoveredFields.has(field.fieldName)) {
        newDiscovered.add(field.fieldName)
        
        // Create floating insight for newly discovered field (subtle, not bouncing)
        newInsights.push({
          id: field.fieldName,
          fieldName: field.fieldName,
          displayName: field.displayName,
          x: field.x,
          y: field.y,
          timestamp: Date.now()
        })

        // Update phase if needed
        if (field.discoveryPhase > currentPhase) {
          setCurrentPhase(field.discoveryPhase)
          phaseChanged = true
        }
      }
    })

    if (newDiscovered.size > discoveredFields.size) {
      setDiscoveredFields(newDiscovered)
      setFloatingInsights(prev => [...prev, ...newInsights])
    }
  }, [fieldsToDiscover, discoveredFields, currentPhase])

  // Remove floating insights after 3 seconds (shorter for subtlety)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now()
      setFloatingInsights(prev => 
        prev.filter(insight => now - insight.timestamp < 3000)
      )
    }, 1000)

    return () => clearInterval(cleanup)
  }, [])

  // Get connections for discovered fields
  const activeConnections = useMemo(() => {
    return FINGERPRINT_CONNECTIONS.filter(connection => 
      discoveredFields.has(connection.from) && discoveredFields.has(connection.to)
    )
  }, [discoveredFields])

  // Get current phase message
  const currentPhaseData = DISCOVERY_PHASES.find(p => p.phase === currentPhase)

  if (!isActive) return null

  return (
    <div className={`fixed transition-all duration-500 ease-out z-20 ${
      isExpanded 
        ? 'bottom-4 right-4 w-[32rem] h-[85vh] bg-background/95 backdrop-blur-lg border border-border/30 rounded-lg shadow-lg' 
        : 'bottom-4 right-4 w-80 h-64 bg-card/90 backdrop-blur-sm border border-border/20 rounded-lg shadow-sm hover:shadow-md'
    }`}>
      
      {/* Header - Typography-focused, minimal */}
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
              {discoveredFields.size}<span className="text-muted-foreground/60">/{FINGERPRINT_STARS.length}</span>
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
      
      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

      {/* Constellation SVG */}
      <div className={`relative ${isExpanded ? 'flex-1' : 'h-32'}`}>
        <svg 
          className="w-full h-full opacity-80 dark:opacity-90"
          viewBox="0 0 100 100"
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

        {/* Connection Lines - Subtle flowing energy between discovered fields */}
        {activeConnections.map((connection, index) => {
          const fromField = FINGERPRINT_STARS.find(f => f.fieldName === connection.from)
          const toField = FINGERPRINT_STARS.find(f => f.fieldName === connection.to)
          
          if (!fromField || !toField) return null

          return (
            <line
              key={`${connection.from}-${connection.to}`}
              x1={fromField.x}
              y1={fromField.y}
              x2={toField.x}
              y2={toField.y}
              stroke="url(#connectionLine)"
              strokeWidth="0.08"
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

        {/* Fingerprint Field Stars - Constellation nodes */}
        {FINGERPRINT_STARS.map(field => {
          const isDiscovered = discoveredFields.has(field.fieldName)
          const isHovered = hoveredField === field.fieldName
          
          if (!isDiscovered) return null

          return (
            <g 
              key={field.fieldName}
              className={isExpanded ? 'cursor-pointer' : ''}
              onMouseEnter={() => isExpanded && setHoveredField(field.fieldName)}
              onMouseLeave={() => isExpanded && setHoveredField(null)}
            >
              {/* Outer glow - subtle aurora effect */}
              <circle
                cx={field.x}
                cy={field.y}
                r={field.size * (isHovered ? 0.7 : 0.6)}
                fill="url(#starGlow)"
                className={`transition-all duration-300 ease-out ${
                  isHovered 
                    ? 'opacity-60 dark:opacity-70' 
                    : 'opacity-30 dark:opacity-40'
                }`}
              >
                <animate
                  attributeName="r"
                  values={`${field.size * 0.5};${field.size * 0.7};${field.size * 0.5}`}
                  dur={`${4 + field.importance * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
              
              {/* Main star - steady presence */}
              <circle
                cx={field.x}
                cy={field.y}
                r={field.size * (isHovered ? 0.28 : 0.25)}
                fill="rgb(59 130 246)"
                className={`transition-all duration-300 ease-out ${
                  isHovered 
                    ? 'opacity-85 dark:opacity-75' 
                    : 'opacity-70 dark:opacity-60'
                }`}
              />
              
              {/* Inner core - bright center */}
              <circle
                cx={field.x}
                cy={field.y}
                r={field.size * (isHovered ? 0.14 : 0.12)}
                fill="rgb(147 197 253)"
                className={`transition-all duration-300 ease-out ${
                  isHovered 
                    ? 'opacity-95' 
                    : 'opacity-85 dark:opacity-75'
                }`}
              />
              
              {/* Invisible hover area for better UX */}
              {isExpanded && (
                <circle
                  cx={field.x}
                  cy={field.y}
                  r={field.size * 1.2}
                  fill="transparent"
                  className="cursor-pointer"
                />
              )}
            </g>
          )
        })}
        </svg>

        {/* Floating Insights - Only show when expanded */}
        {isExpanded && (
          <div className="absolute inset-0 pointer-events-none">
            {floatingInsights.map((insight, index) => {
              const positionClass = index % 8 === 0 ? 'top-1/4 left-1/4' :
                                   index % 8 === 1 ? 'top-1/3 left-1/3' :
                                   index % 8 === 2 ? 'top-1/2 left-1/2' :
                                   index % 8 === 3 ? 'top-2/3 left-2/3' :
                                   index % 8 === 4 ? 'bottom-1/4 right-1/4' :
                                   index % 8 === 5 ? 'bottom-1/3 right-1/3' :
                                   index % 8 === 6 ? 'bottom-1/2 right-1/2' :
                                   'bottom-2/3 right-2/3'
              
              return (
                <div
                  key={insight.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 opacity-90 ${positionClass}`}
                >
                  <div className="bg-card/90 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30 rounded-md px-2 py-1 shadow-md">
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium whitespace-nowrap">
                      {insight.displayName}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Minimal Tooltip - Directly above star */}
        {isExpanded && hoveredField && (
          <div className="absolute pointer-events-none z-30">
            {(() => {
              const field = FINGERPRINT_STARS.find(f => f.fieldName === hoveredField)
              const schemaField = ALL_FINGERPRINT_FIELDS.find(f => f.name === hoveredField)
              
              if (!field || !schemaField) return null

              // All tooltips in the same position at the top
              const getTooltipClasses = () => {
                return 'top-0 left-1/2 -translate-x-1/2'
              }

              return (
                <div className={`absolute transition-opacity duration-300 ${getTooltipClasses()}`}>
                  <div className="bg-background/90 backdrop-blur-sm border border-border/30 rounded px-3 py-2 shadow-sm w-56">
                    <div className="text-xs font-medium text-foreground leading-tight">
                      {field.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1 leading-relaxed font-light">
                      {schemaField.description.length > 80 
                        ? `${schemaField.description.slice(0, 80)}...`
                        : schemaField.description
                      }
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Footer - Clean typography, minimal */}
      <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
      
      <div className={`${isExpanded ? 'p-6 pt-4' : 'p-3 pt-2'}`}>
        {currentPhaseData && discoveredFields.size > 0 && (
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <div className="w-1 h-1 bg-blue-400/60 rounded-full mt-2 animate-pulse" />
              <p className={`text-muted-foreground font-light leading-relaxed ${isExpanded ? 'text-sm' : 'text-xs'}`}>
                {isExpanded ? currentPhaseData.message : `Phase ${currentPhase}`}
              </p>
            </div>
            
            {isExpanded && (
              <div className="text-xs text-muted-foreground/70 font-light">
                {discoveredFields.size}<span className="text-muted-foreground/50">/{FINGERPRINT_STARS.length}</span>
              </div>
            )}
          </div>
        )}
        
        {discoveredFields.size === 0 && (
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
