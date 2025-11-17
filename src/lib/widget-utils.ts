/**
 * WIDGET UTILITIES
 * 
 * Shared utility functions for widget-related UI components.
 * Centralizes time formatting, status normalization, and icon mapping logic.
 * 
 * LAW VI: Centralized abstraction for widget-specific helpers.
 * Eliminates duplicated logic across WidgetPanel and UnifiedGalleryView.
 */

/**
 * Widget job status type
 */
export type WidgetJobStatusType = 'idle' | 'active' | 'completed' | 'error'

/**
 * Widget job status result
 */
export interface WidgetJobStatus {
  status: WidgetJobStatusType
  label: string
}

/**
 * Format timestamp as human-readable "X seconds/minutes/hours/days ago"
 * 
 * Handles edge cases:
 * - Negative timestamps (future dates) → "0 seconds"
 * - Zero timestamps → "0 seconds"
 * - Singular/plural forms ("1 second" vs "2 seconds")
 * 
 * @param timestamp Unix timestamp in milliseconds
 * @returns Human-readable time string (e.g., "5 minutes", "2 hours")
 */
export function formatTimeAgo(timestamp: number): string {
  if (!timestamp || timestamp <= 0) {
    return '0 seconds'
  }
  
  const now = Date.now()
  const diff = now - timestamp
  
  // Handle future timestamps
  if (diff < 0) {
    return '0 seconds'
  }
  
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }
  
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }
  
  const days = Math.floor(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''}`
}

/**
 * Get normalized widget job status from job object
 * 
 * Normalizes various job status values to standard status types:
 * - 'running' → 'active'
 * - 'completed' → 'completed'
 * - 'error' or 'failed' → 'error'
 * - null/undefined/other → 'idle'
 * 
 * @param job Job object with optional status field
 * @returns Normalized status object with type and label
 */
export function getWidgetJobStatus(job: any): WidgetJobStatus {
  if (!job) {
    return { status: 'idle', label: 'Resting' }
  }
  
  const status = job.status?.toLowerCase()
  
  if (status === 'running' || status === 'active') {
    return { status: 'active', label: 'Active' }
  }
  
  if (status === 'completed' || status === 'success') {
    return { status: 'completed', label: 'Done' }
  }
  
  if (status === 'error' || status === 'failed') {
    return { status: 'error', label: 'Error' }
  }
  
  return { status: 'idle', label: 'Resting' }
}

/**
 * Get lucide icon name for A2A activity status
 * 
 * TEMPORARY: Returns icon name string until A2A components are refactored
 * to use icon components directly.
 * 
 * Maps status values to lucide icon names:
 * - 'completed' → 'CheckCircle2'
 * - 'planning' → 'FileText'
 * - 'working' → 'Circle'
 * - default → 'Circle'
 * 
 * @param status A2A activity status string
 * @returns Lucide icon name (for use with dynamic imports or switch statements)
 */
export function getA2AActivityIcon(status: string): string {
  if (!status) {
    return 'Circle'
  }
  
  const normalizedStatus = status.toLowerCase()
  
  if (normalizedStatus === 'completed') {
    return 'CheckCircle2'
  }
  
  if (normalizedStatus === 'planning') {
    return 'FileText'
  }
  
  if (normalizedStatus === 'working') {
    return 'Circle'
  }
  
  return 'Circle'
}









