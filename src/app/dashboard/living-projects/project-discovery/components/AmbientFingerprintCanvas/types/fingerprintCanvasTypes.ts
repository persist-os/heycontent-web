/**
 * Fingerprint Canvas Types
 * 
 * Type definitions for the ambient fingerprint canvas components.
 */

import { Id } from '@/convex/_generated/dataModel'

export interface FloatingInsight {
  id: string
  fieldName: string
  displayName: string
  x: number
  y: number
  timestamp: number
}

export interface AmbientFingerprintCanvasProps {
  projectId?: Id<"projects">
  messageCount: number
  isActive: boolean
  onAllStarsDiscovered?: () => void
}

export interface FingerprintStar {
  fieldName: string
  displayName: string
  category: string
  x: number
  y: number
  size: number
  importance: number
  discoveryPhase: number
}

export interface FingerprintConnection {
  from: string
  to: string
}

export interface DiscoveryPhase {
  phase: number
  message: string
}

export interface ConstellationSVGProps {
  discoveredFields: Set<string>
  hoveredField: string | null
  setHoveredField: (field: string | null) => void
  isCompleting: boolean
  isExpanded: boolean
}

export interface FingerprintTooltipProps {
  hoveredField: string | null
  isExpanded: boolean
}

export interface FloatingInsightsProps {
  insights: FloatingInsight[]
  isExpanded: boolean
}
