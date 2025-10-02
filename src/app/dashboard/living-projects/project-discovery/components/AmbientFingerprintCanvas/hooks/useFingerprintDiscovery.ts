/**
 * Revolutionary Zero-State Reactive Fingerprint Discovery Hook
 * 
 * ZERO frontend state management - everything flows reactively from Convex.
 * Automatically discovers and tracks ALL fingerprint fields without manual mapping.
 */

import { useMemo, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

// SINGLE SOURCE OF TRUTH for core fingerprint fields
// Only essential fields that matter for project understanding
const FINGERPRINT_FIELD_CATEGORIES = {
  'Core Nature': ['domain', 'complexity_level', 'collaboration_style', 'time_horizon'],
  'Intentions': ['core_intention', 'success_vision', 'value_creation'],
  'Timeline': ['natural_rhythm', 'flexibility_preference'],
  'Outputs': ['tangible_deliverables', 'intangible_benefits'],
  'Interface': ['cognitive_load_preference', 'information_density'],
  'Evolution': ['learning_sensitivity', 'change_triggers', 'growth_edges'],
  'Context': ['user_constraints', 'potential_obstacles']
}

// Extended fields for discovery display (not counted in completion)
const EXTENDED_FIELD_CATEGORIES = {
  ...FINGERPRINT_FIELD_CATEGORIES,
  'Project Archetype': ['primary_pattern', 'working_style', 'decision_making', 'energy_patterns'],
  'Timeline Extended': ['key_phases'],
  'Outputs Extended': ['measurement_approach', 'sharing_intention'],
  'Interface Extended': ['motivation_style', 'feedback_frequency'],
  'Evolution Extended': ['stability_zones'],
  'Context Extended': ['external_dependencies', 'support_systems']
}

export const useFingerprintDiscovery = (
  projectId?: Id<"projects">,
  onAllStarsDiscovered?: () => void
) => {
  // SINGLE SOURCE OF TRUTH - Complete fingerprint data from Convex
  const fingerprint = useQuery(
    api.projectFingerprintQueries.getByProject,
    projectId ? { projectId } : "skip"
  )

  // Completion status for UI indicators
  const completionStatus = useQuery(
    api.projectFingerprintQueries.getCompletionStatus,
    projectId ? { projectId } : "skip"
  )

  // REVOLUTIONARY AUTO-DISCOVERY: Extract all non-empty fields dynamically
  const discoveredFieldsData = useMemo(() => {
    if (!fingerprint) return { 
      fields: new Set<string>(), 
      categories: new Map<string, string[]>(),
      insights: [],
      constellationPoints: []
    }

    const fields = new Set<string>()
    const categories = new Map<string, string[]>()
    const insights: Array<{
      id: string
      category: string
      field: string
      value: any
      displayValue: string
      importance: 'low' | 'medium' | 'high'
      timestamp: number
      x: number
      y: number
    }> = []

    // Generate collision-free constellation layout
    const centerX = 400  // Centered in 800x800 viewBox
    const centerY = 400
    const minRadius = 100
    const maxRadius = 320
    const minDistance = 60  // Minimum distance between points to prevent overlap
    
    const placedPoints: Array<{x: number, y: number, size: number}> = []
    
    // Helper function to check if a point is too close to existing points
    const isTooClose = (x: number, y: number, size: number): boolean => {
      return placedPoints.some(point => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
        const requiredDistance = minDistance + (size + point.size) * 2
        return distance < requiredDistance
      })
    }
    
    // Helper function to find a valid position with collision detection
    const findValidPosition = (preferredAngle: number, preferredRadius: number, size: number, maxAttempts = 50): {x: number, y: number} => {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Add randomness that increases with each attempt
        const angleVariation = (Math.random() - 0.5) * (attempt * 0.2)
        const radiusVariation = (Math.random() - 0.5) * (attempt * 20)
        
        const angle = preferredAngle + angleVariation
        const radius = Math.max(minRadius, Math.min(maxRadius, preferredRadius + radiusVariation))
        
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        // Check bounds
        if (x < 50 || x > 750 || y < 50 || y > 750) continue
        
        if (!isTooClose(x, y, size)) {
          return { x, y }
        }
      }
      
      // Fallback: place in a spiral pattern
      const spiralAngle = placedPoints.length * 0.618 * 2 * Math.PI  // Golden angle
      const spiralRadius = minRadius + (placedPoints.length * 12)
      return {
        x: centerX + Math.cos(spiralAngle) * spiralRadius,
        y: centerY + Math.sin(spiralAngle) * spiralRadius
      }
    }

    // Auto-discover fields by checking if they have meaningful values (use extended list for discovery)
    Object.entries(EXTENDED_FIELD_CATEGORIES).forEach(([category, categoryFields], categoryIndex) => {
      const discoveredInCategory: string[] = []
      
      categoryFields.forEach((field, fieldIndex) => {
        const value = fingerprint[field as keyof typeof fingerprint]
        
        // Smart value detection - handles strings, arrays, objects, numbers
        const hasValue = (() => {
          if (value === null || value === undefined) return false
          if (typeof value === 'string') return value.trim() !== ''
          if (typeof value === 'number') return value !== 0
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object') {
            // For objects like morning_persona, check if any property has a value
            return Object.values(value).some(v => 
              v !== null && v !== undefined && v !== '' && 
              (Array.isArray(v) ? v.length > 0 : true)
            )
          }
          return true
        })()

        if (hasValue) {
          fields.add(field)
          discoveredInCategory.push(field)

          // Determine size based on importance
          const importance = (() => {
            if (['core_intention', 'success_vision', 'domain', 'name'].includes(field)) return 'high'
            if (category === 'Core Nature' || category === 'Intentions') return 'high'
            if (category === 'AI Personality' || category === 'Context') return 'low'
            return 'medium'
          })() as 'low' | 'medium' | 'high'
          
          const size = importance === 'high' ? 8 : importance === 'medium' ? 6 : 4

          // Calculate preferred position (spread categories evenly)
          const categoryCount = Object.keys(EXTENDED_FIELD_CATEGORIES).length
          const categoryAngle = (categoryIndex / categoryCount) * 2 * Math.PI
          const fieldOffset = (fieldIndex - categoryFields.length / 2) * 0.4
          const preferredAngle = categoryAngle + fieldOffset
          const preferredRadius = minRadius + ((maxRadius - minRadius) * (fieldIndex / Math.max(categoryFields.length - 1, 1)))
          
          // Find collision-free position
          const { x, y } = findValidPosition(preferredAngle, preferredRadius, size)
          
          // Record this point
          placedPoints.push({ x, y, size })

          // Smart display value generation
          const displayValue = (() => {
            if (typeof value === 'string') return value
            if (typeof value === 'number') return value.toString()
            if (Array.isArray(value)) return value.join(', ')
            if (typeof value === 'object') {
              // For complex objects, create a meaningful summary
              if (field.includes('persona')) {
                return Object.entries(value)
                  .filter(([, v]) => v && v !== '')
                  .map(([k, v]) => `${k}: ${v}`)
                  .join('; ')
              }
              return JSON.stringify(value, null, 2)
            }
            return String(value)
          })()

          insights.push({
            id: field,
            category,
            field,
            value,
            displayValue,
            importance,
            timestamp: fingerprint.last_evolution || fingerprint.created_at,
            x,
            y
          })
        }
      })

      if (discoveredInCategory.length > 0) {
        categories.set(category, discoveredInCategory)
      }
    })

    // Generate constellation points for visualization
    const constellationPoints = insights.map(insight => ({
      id: insight.field,
      field: insight.field,
      category: insight.category,
      x: insight.x,
      y: insight.y,
      size: insight.importance === 'high' ? 8 : insight.importance === 'medium' ? 6 : 4,
      intensity: (() => {
        if (typeof insight.value === 'string') return Math.min(insight.value.length / 50, 1)
        if (Array.isArray(insight.value)) return Math.min(insight.value.length / 5, 1)
        if (typeof insight.value === 'object') return Object.keys(insight.value).length / 10
        return 0.8
      })(),
      isRecent: (Date.now() - insight.timestamp) < (30 * 1000) // Last 30 seconds
    }))

    return { fields, categories, insights, constellationPoints }
  }, [fingerprint])

  // Reactive completion tracking
  const completionMetrics = useMemo(() => {
    // Only count CORE fields towards completion (not all the detailed subfields)
    const coreFields = new Set(Object.values(FINGERPRINT_FIELD_CATEGORIES).flat())
    const completedFields = Array.from(discoveredFieldsData.fields)
      .filter(field => coreFields.has(field))
      .length
    
    // Count only core fields for total
    const totalFields = Object.values(FINGERPRINT_FIELD_CATEGORIES).flat().length
    
    const percentage = Math.round((completedFields / totalFields) * 100)
    
    return {
      percentage,
      completedFields,
      totalFields,
      isComplete: percentage >= 80, // Less strict - ready at 80% of core fields
      status: completionStatus?.status || 'not_started',
      phase: (() => {
        if (percentage < 30) return 'initial'
        if (percentage < 50) return 'exploring'
        if (percentage < 60) return 'deepening'
        return 'completing'
      })(),
      message: (() => {
        if (percentage < 30) return 'Beginning discovery...'
        if (percentage < 50) return 'Exploring patterns...'
        if (percentage < 60) return 'Deepening understanding...'
        return 'Crystallizing insights...'
      })()
    }
  }, [discoveredFieldsData.fields, completionStatus])

  // Generate connections between related fields automatically
  const connections = useMemo(() => {
    const connections: Array<{ from: string; to: string; strength: number }> = []

    // Define semantic relationships between field types
    const relationships = [
      { from: 'core_intention', to: 'success_vision', strength: 0.9 },
      { from: 'domain', to: 'primary_pattern', strength: 0.8 },
      { from: 'collaboration_style', to: 'working_style', strength: 0.7 },
      { from: 'time_horizon', to: 'natural_rhythm', strength: 0.8 },
      { from: 'energy_patterns', to: 'morning_persona', strength: 0.6 },
      { from: 'energy_patterns', to: 'evening_persona', strength: 0.6 },
      { from: 'learning_sensitivity', to: 'change_triggers', strength: 0.7 },
      { from: 'cognitive_load_preference', to: 'information_density', strength: 0.8 }
    ]

    relationships.forEach(({ from, to, strength }) => {
      if (discoveredFieldsData.fields.has(from) && discoveredFieldsData.fields.has(to)) {
        connections.push({ from, to, strength })
      }
    })

    return connections
  }, [discoveredFieldsData.fields])

  // NOTE: Automatic transition removed - UI now shows a button when ready
  // Users manually trigger progression to widget generation
  // This prevents premature transitions and gives users control

  return {
    // Raw data (directly from Convex - ZERO state management!)
    fingerprint,
    completionStatus,
    
    // Auto-discovered structure
    discoveredFields: discoveredFieldsData.fields,
    fieldCategories: discoveredFieldsData.categories,
    insights: discoveredFieldsData.insights,
    constellationPoints: discoveredFieldsData.constellationPoints,
    connections,
    
    // Reactive completion tracking
    completion: completionMetrics,
    
    // Computed state (derived, not stored!)
    isLoading: fingerprint === undefined,
    exists: !!fingerprint,
    isEmpty: !discoveredFieldsData.fields.size,
    
    // Legacy compatibility for existing components
    currentPhase: completionMetrics.phase === 'initial' ? 1 : 
                  completionMetrics.phase === 'exploring' ? 2 : 
                  completionMetrics.phase === 'deepening' ? 3 : 4,
    currentPhaseData: { phase: 1, message: completionMetrics.message },
    isCompleting: completionMetrics.isComplete,
    fieldsToDiscover: discoveredFieldsData.constellationPoints.map(p => ({
      fieldName: p.field,
      displayName: p.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: p.category,
      x: p.x,
      y: p.y,
      size: p.size,
      importance: 1,
      discoveryPhase: 1
    })),
    floatingInsights: discoveredFieldsData.constellationPoints
      .filter(p => p.isRecent)
      .map(p => ({
        id: p.field,
        fieldName: p.field,
        displayName: p.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        x: p.x,
        y: p.y,
        timestamp: Date.now()
      })),
    
    // Helper functions
    hasField: (fieldName: string) => discoveredFieldsData.fields.has(fieldName),
    getFieldValue: (fieldName: string) => fingerprint?.[fieldName as keyof typeof fingerprint],
    getCategoryFields: (category: string) => discoveredFieldsData.categories.get(category) || [],
    getPointByField: (field: string) => discoveredFieldsData.constellationPoints.find(p => p.field === field),
    
    // Reactive status checks
    isDiscovering: completionStatus?.status === 'discovering',
    isActive: completionStatus?.status === 'active'
  }
}
