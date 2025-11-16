/**
 * NOTIFICATION ROUTING HOOK
 * 
 * Routing and formatting logic for A2A notification notes.
 * Handles route generation, text formatting, icon selection, and time formatting.
 * 
 * PATTERN COMPLIANCE:
 * - Pure logic, no UI
 * - React hooks best practices
 * - Centralized routing logic for reusability
 */

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  FileText,
  MessageSquare,
  Sparkles,
  LucideIcon,
} from 'lucide-react'

interface A2ANote {
  _id: string
  report?: {
    announcement?: string
    summary?: string
    artifact_id?: string
    widget_id?: string
    artifacts_created?: Array<{
      type?: string
      id?: string
    }>
    metadata?: {
      artifact_id?: string
      artifactId?: string
      widget_id?: string
      widgetId?: string
    }
  }
  agentId?: string
  conversationId?: string
  projectId?: string
  createdAt: number
}

export function useNotificationRouting() {
  const router = useRouter()

  /**
   * Get notification route from A2A note
   * Priority: artifacts_created[0].id > artifact_id (metadata/report) > widget_id > conversationId > projectId
   */
  const getNotificationRoute = useCallback((note: A2ANote): string | null => {
    const report = note.report || {}
    const metadata = report.metadata || {}
    
    // Artifact completed → gallery
    // Priority 1: Check artifacts_created array (new format from widget_executor.py)
    const artifactsCreated = report.artifacts_created
    const artifactIdFromArray = artifactsCreated && Array.isArray(artifactsCreated) && artifactsCreated.length > 0
      ? artifactsCreated[0]?.id
      : null
    
    // Priority 2: Check multiple locations for artifact ID (camelCase, snake_case, report level) - backward compatibility
    const artifactId = 
      artifactIdFromArray ||
      metadata.artifact_id || 
      metadata.artifactId || 
      report.artifact_id
    
    if (artifactId && note.projectId) {
      return `/dashboard/living-projects/${note.projectId}/gallery?id=${artifactId}`
    }
    
    // Widget completed → gallery
    // Check multiple locations for widget ID (camelCase, snake_case, report level)
    const widgetId = 
      metadata.widget_id || 
      metadata.widgetId || 
      report.widget_id
    
    if (widgetId && note.projectId) {
      return `/dashboard/living-projects/${note.projectId}/gallery?id=${widgetId}`
    }
    
    // Conversation update → thinking lab
    if (note.conversationId) {
      return `/dashboard/thinking_lab?chatId=${note.conversationId}`
    }
    
    // Default: project view
    if (note.projectId) {
      return `/dashboard/living-projects/${note.projectId}`
    }
    
    return null
  }, [])

  /**
   * Format notification text from A2A note
   */
  const formatNotificationText = useCallback((note: A2ANote): string => {
    const report = note.report || {}
    const agentId = note.agentId || "orchestrator"
    const announcement = report.announcement || report.summary
    
    // Try to extract meaningful text
    if (announcement) {
      return announcement
    }
    
    // Check for artifact/widget completion
    // Priority: artifacts_created array > metadata fields > report fields
    const artifactsCreated = report.artifacts_created
    const hasArtifactsCreated = artifactsCreated && Array.isArray(artifactsCreated) && artifactsCreated.length > 0
    
    const metadata = report.metadata || {}
    if (hasArtifactsCreated || metadata.artifact_id || metadata.artifactId || report.artifact_id) {
      return "Artifact completed"
    }
    if (metadata.widget_id || metadata.widgetId || report.widget_id) {
      return "Widget completed"
    }
    
    // Default based on agent
    if (agentId === "orchestrator") {
      return "Orchestration update"
    }
    
    return "New update"
  }, [])

  /**
   * Get notification icon based on note type
   */
  const getNotificationIcon = useCallback((note: A2ANote): LucideIcon => {
    const report = note.report || {}
    const metadata = report.metadata || {}
    
    // Check artifacts_created array first (new format)
    const artifactsCreated = report.artifacts_created
    const hasArtifactsCreated = artifactsCreated && Array.isArray(artifactsCreated) && artifactsCreated.length > 0
    
    if (hasArtifactsCreated || metadata.artifact_id || metadata.artifactId || report.artifact_id) {
      return FileText
    }
    if (metadata.widget_id || metadata.widgetId || report.widget_id) {
      return Sparkles
    }
    if (note.conversationId) {
      return MessageSquare
    }
    return CheckCircle
  }, [])

  /**
   * Format relative time
   */
  const formatRelativeTime = useCallback((timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }, [])

  /**
   * Handle notification click - navigate to route
   */
  const handleNotificationClick = useCallback((note: A2ANote, onClose?: () => void) => {
    const route = getNotificationRoute(note)
    if (route) {
      router.push(route)
      onClose?.()
    }
  }, [router, getNotificationRoute])

  return {
    getNotificationRoute,
    formatNotificationText,
    getNotificationIcon,
    formatRelativeTime,
    handleNotificationClick,
  }
}

