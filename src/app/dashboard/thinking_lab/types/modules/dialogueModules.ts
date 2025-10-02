/**
 * Dialogue Module Types
 * 
 * Types specific to dialogue functionality and components.
 */

export interface InteractiveOption {
  id: string
  text: string
  action?: string
}

export interface SuggestedAction {
  id: string
  description: string
  action?: string
}

export interface ThinkingStep {
  id: string
  stage: 'analyzing' | 'searching' | 'grading' | 'generating' | 'completed'
  message: string
  submessage?: string
  timestamp: Date
  isCompleted: boolean
  isActive: boolean
  details?: {
    itemsProcessed?: number
    itemsKept?: number
    itemsFiltered?: number
    itemDecisions?: Array<{
      title: string
      reason: string
      isKept: boolean
      timestamp: Date
    }>
  }
}

export interface ContentItem {
  id: string
  title: string
  contentType: string
  score: number
}

export interface VectorSearchMetadata {
  foundRelevantContent?: boolean
  relevantContent?: ContentItem[]
  [key: string]: any
}
