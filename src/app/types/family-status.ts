/**
 * Family Status Types
 * 
 * Maps Convex data (widget lastRunStatus, background job status, pending questions)
 * to user-facing family execution status badges.
 * 
 * Data Sources:
 * - widgets.lastRunStatus: "idle" | "running" | "success" | "failed"
 * - background_jobs.status: "queued" | "running" | "completed" | "failed"
 * - widget_questions (pending count indicates waiting_input)
 */

export type FamilyStatus =
  | 'idle'          // No execution yet (widget.lastRunStatus === "idle" or null)
  | 'queued'        // Waiting in queue (background job status === "queued")
  | 'running'       // Currently executing (background job status === "running" OR widget.lastRunStatus === "running")
  | 'waiting_input' // Has pending questions (widget_questions.status === "pending")
  | 'complete'      // Successfully completed (background job status === "completed" OR widget.lastRunStatus === "success")
  | 'paused'        // User paused (not yet implemented - reserved for future)
  | 'failed'        // Execution error (background job status === "failed" OR widget.lastRunStatus === "failed")

export interface FamilyStatusBadge {
  status: FamilyStatus
  icon: string         // Emoji icon
  label: string        // Human-readable label
  color: string        // Tailwind color classes
  animate: boolean     // Should pulse/animate
}

/**
 * Status badge configuration
 * Maps each status to visual presentation
 */
export const FAMILY_STATUS_CONFIG: Record<FamilyStatus, FamilyStatusBadge> = {
  idle: {
    status: 'idle',
    icon: '○',
    label: 'Not Started',
    color: 'text-muted-foreground border-muted/30 bg-muted/5',
    animate: false
  },
  queued: {
    status: 'queued',
    icon: '🔄',
    label: 'Waiting',
    color: 'text-accent border-accent/40 bg-accent/5',
    animate: false
  },
  running: {
    status: 'running',
    icon: '⚡',
    label: 'Working',
    color: 'text-blue-400 border-blue-500/50 bg-blue-500/10',
    animate: true
  },
  waiting_input: {
    status: 'waiting_input',
    icon: '⏱️',
    label: 'Question',
    color: 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10',
    animate: true
  },
  complete: {
    status: 'complete',
    icon: '✅',
    label: 'Complete',
    color: 'text-primary border-primary/50 bg-primary/10',
    animate: false
  },
  paused: {
    status: 'paused',
    icon: '⏸️',
    label: 'Paused',
    color: 'text-muted-foreground border-muted/30 bg-muted/5',
    animate: false
  },
  failed: {
    status: 'failed',
    icon: '❌',
    label: 'Failed',
    color: 'text-red-400 border-red-500/50 bg-red-500/10',
    animate: false
  }
}

/**
 * Status priority for determining overall project status
 * Higher number = higher priority
 */
export const STATUS_PRIORITY: Record<FamilyStatus, number> = {
  'failed': 6,        // Highest - user needs to know about failures
  'waiting_input': 5, // High - user action required
  'running': 4,       // Medium-high - active work
  'queued': 3,        // Medium - scheduled but not started
  'paused': 2,        // Low-medium - user initiated pause
  'idle': 1,          // Low - not started
  'complete': 0       // Lowest - all done
}

/**
 * Helper: Get status badge config
 */
export function getStatusBadge(status: FamilyStatus): FamilyStatusBadge {
  return FAMILY_STATUS_CONFIG[status]
}

/**
 * Helper: Determine family status from widget data
 * 
 * Priority:
 * 1. Pending questions → waiting_input
 * 2. Background job status (if exists)
 * 3. Widget lastRunStatus (fallback)
 */
export function deriveFamilyStatus(
  widgetRunStatus: string | null | undefined,
  backgroundJobStatus: string | null | undefined,
  hasPendingQuestions: boolean
): FamilyStatus {
  // Priority 1: Pending questions
  if (hasPendingQuestions) {
    return 'waiting_input'
  }

  // Priority 2: Background job status (most accurate for in-flight execution)
  if (backgroundJobStatus) {
    switch (backgroundJobStatus) {
      case 'queued':
        return 'queued'
      case 'running':
        return 'running'
      case 'completed':
        return 'complete'
      case 'failed':
        return 'failed'
      default:
        break
    }
  }

  // Priority 3: Widget lastRunStatus (fallback for completed/failed widgets)
  if (widgetRunStatus) {
    switch (widgetRunStatus) {
      case 'running':
        return 'running'
      case 'success':
        return 'complete'
      case 'failed':
        return 'failed'
      case 'idle':
      default:
        return 'idle'
    }
  }

  // Default: idle (no execution yet)
  return 'idle'
}

/**
 * Helper: Get highest priority status from multiple families
 * Used for overall project status
 */
export function getHighestPriorityStatus(statuses: FamilyStatus[]): FamilyStatus {
  if (statuses.length === 0) return 'idle'
  
  return statuses.reduce((highest, current) => {
    return STATUS_PRIORITY[current] > STATUS_PRIORITY[highest] ? current : highest
  })
}

