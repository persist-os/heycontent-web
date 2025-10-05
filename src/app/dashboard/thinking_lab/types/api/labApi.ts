/**
 * API Types
 *
 * Interfaces specific to API communication and data transfer.
 * These define the contracts between services and external systems.
 */

import { WorkspaceContext, NotepadContext } from '../core/labCore'
import { FileUploadResponse } from '@/lib/file-upload'

export interface MessageTransmissionRequest {
  content: string
  isFirstMessage: boolean
  sessionIdentifier: string | null
  workspaceContext?: WorkspaceContext | null
  notepadContext?: NotepadContext | null
  additionalData?: Record<string, any>
  fileAttachments?: FileUploadResponse[]
  onStatusUpdate?: (status: string) => void
  // Project/widget context for conversation linkage
  projectId?: string
  widgetId?: string
  widgetOutputId?: string
  conversationType?: string
}

export interface ProjectTransmissionRequest {
  content: string
  isFirstMessage: boolean
  sessionIdentifier: string | null
  workspaceContext?: WorkspaceContext | null
  notepadContext?: NotepadContext | null
  projectName?: string
}

export interface VectorSearchResult {
  contentType: string
  title: string
  content: string
  score?: number
  _id: string
}

export interface VectorSearchResponse {
  success: boolean
  context: string
  relevantContent: Array<{
    title: string
    contentType: string
    score: number
    summary?: string
  }>
  prompt: string
  error?: string
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
