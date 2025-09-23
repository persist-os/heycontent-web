/**
 * Lab Interface Definitions
 * 
 * All TypeScript interfaces for the thinking lab system.
 * Complete rebuild with no legacy dependencies.
 */

export interface LabResponseData {
  response_content: string
  session_identifier: string
  user_input: string
  suggestions?: string[]
  metadata?: Record<string, any>
}

export interface WorkspaceContext {
  platform: string
  resourceId: string
  title: string
  analysis?: string
  thumbnailUrl?: string
  publishedAt?: string
  metrics?: Record<string, any>
  content?: Record<string, any>
  convexData?: Record<string, any>
  deepInsight?: CompleteInsight
  actionStep?: string
  originalPlatform?: string
  additionalContext?: string
}

export interface CompleteInsight {
  title: string
  impact: string
  whyNow: string[]
  actionSteps: string[]
  expectedOutcome: string
  sourceDetails: ResourceDetail[]
  relatedItems: ConnectedItem[]
}

export interface ResourceDetail {
  platform: string
  title: string
  url?: string
}

export interface ConnectedItem {
  id: string
  title: string
  type: string
}

export interface ContentSearchResult {
  contentType: string
  title: string
  content: string
  score?: number
  _id: string
}

export interface ContentDiscoveryResponse {
  success: boolean
  contextString: string
  discoveredContent: Array<{
    title: string
    contentType: string
    score: number
    summary?: string
  }>
  prompt: string
  error?: string
}

export interface RelevanceAnalysisResponse {
  relevant_content: Array<{
    title: string
    contentType: string
    score: number
    summary?: string
    relevance_score: number
    relevance_reason: string
  }>
  analysis_summary: {
    total_items: number
    relevant_items: number
    confidence_score: number
  }
  metadata: {
    request_id: string
    processing_time_ms: number
  }
}

export interface QueryIntentResponse {
  needs_context: boolean
  confidence_score: number
  reasoning: string
  metadata: {
    request_id: string
    processing_time_ms: number
  }
}

export interface SearchMetadata {
  foundRelevantContent: boolean
  relevantItemsCount: number
  searchQuery?: string
  contextString?: string
  analyzed?: boolean
  analysis_summary?: {
    total_items: number
    relevant_items: number
    confidence_score: number
  }
  query_intent?: QueryIntentResponse
  skip_reason?: string
  search_performed?: boolean
  no_results_reason?: string
  discoveredContent?: Array<{
    title: string
    contentType: string
    score: number
  }>
}

export interface MessageTransmissionParams {
  content: string
  isInitialMessage: boolean
  sessionIdentifier: string | null
  workspaceContext?: WorkspaceContext | null
  hasContextualData?: boolean
  onProgressUpdate?: (status: string) => void
  useContentDiscovery?: boolean
  notepadContext?: { content: string; title?: string } | null
}

export interface ProjectExplorationParams {
  content: string
  isInitialMessage: boolean
  sessionIdentifier: string | null
  workspaceContext?: WorkspaceContext | null
  projectName?: string
}

export interface EmbeddingProcessingResult {
  conversations: { processed: number; succeeded: number; failed: number; skipped: number }
  notes: { processed: number; succeeded: number; failed: number; skipped: number }
  errors: string[]
  totalEmbeddings?: number
  itemsProcessed?: number
  itemsSucceeded?: number
  itemsFailed?: number
  summary?: string
}

export interface EmbeddingStatusCheck {
  hasEmbeddings: boolean
  count: number
}

export type ProgressUpdateCallback = (status: string) => void
export type ContentPlatform = 'conversations' | 'notes'