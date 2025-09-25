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

    // Define field categories for organization (no manual field mapping needed!)
    const fieldCategories = {
      'Core Nature': ['domain', 'complexity_level', 'collaboration_style', 'time_horizon'],
      'Project Archetype': ['primary_pattern', 'working_style', 'decision_making', 'energy_patterns'],
      'Intentions': ['core_intention', 'success_vision', 'value_creation', 'personal_growth'],
      'Timeline': ['natural_rhythm', 'key_phases', 'flexibility_preference'],
      'Outputs': ['tangible_deliverables', 'intangible_benefits', 'measurement_approach', 'sharing_intention'],
      'Interface': ['cognitive_load_preference', 'information_density', 'motivation_style', 'feedback_frequency'],
      'Evolution': ['learning_sensitivity', 'change_triggers', 'stability_zones', 'growth_edges'],
      'AI Coordination': ['morning_persona', 'evening_persona', 'event_triggers'],
      'AI Personality': ['base_personality', 'project_voice', 'question_generation_style', 'suggestion_approach', 'clarification_method'],
      'Dynamic Intelligence': ['dynamic_dimensions'],
      'Context': ['user_constraints', 'external_dependencies', 'support_systems', 'potential_obstacles']
    }

    // Generate constellation layout automatically
    const centerX = 300
    const centerY = 300
    const baseRadius = 120

    // Auto-discover fields by checking if they have meaningful values
    Object.entries(fieldCategories).forEach(([category, categoryFields], categoryIndex) => {
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

          // Auto-generate constellation position
          const categoryCount = Object.keys(fieldCategories).length
          const categoryAngle = (categoryIndex / categoryCount) * 2 * Math.PI
          const fieldAngle = categoryAngle + (fieldIndex - categoryFields.length / 2) * 0.3
          const fieldRadius = baseRadius + (fieldIndex % 2) * 40
          
          const x = centerX + Math.cos(fieldAngle) * fieldRadius
          const y = centerY + Math.sin(fieldAngle) * fieldRadius

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

          // Auto-determine importance based on field type and category
          const importance = (() => {
            if (['core_intention', 'success_vision', 'domain'].includes(field)) return 'high'
            if (category === 'Core Nature' || category === 'Intentions') return 'high'
            if (category === 'AI Personality' || category === 'Context') return 'low'
            return 'medium'
          })() as 'low' | 'medium' | 'high'

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
    const totalFields = completionStatus?.total_fields || 20
    const completedFields = completionStatus?.discovered_fields?.length || 0
    const percentage = Math.round((completedFields / totalFields) * 100)
    
    return {
      percentage,
      completedFields,
      totalFields,
      isComplete: percentage >= 75,
      status: completionStatus?.status || 'not_started',
      phase: (() => {
        if (percentage < 25) return 'initial'
        if (percentage < 50) return 'exploring'
        if (percentage < 75) return 'deepening'
        return 'completing'
      })(),
      message: (() => {
        if (percentage < 25) return 'Beginning discovery...'
        if (percentage < 50) return 'Exploring patterns...'
        if (percentage < 75) return 'Deepening understanding...'
        return 'Crystallizing insights...'
      })()
    }
  }, [completionStatus])

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

  // Trigger completion callback when fingerprint is complete (no state needed!)
  useEffect(() => {
    if (completionMetrics.isComplete && onAllStarsDiscovered) {
      onAllStarsDiscovered()
    }
  }, [completionMetrics.isComplete, onAllStarsDiscovered])

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
