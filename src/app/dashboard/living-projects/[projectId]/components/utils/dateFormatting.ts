/**
 * DATE FORMATTING UTILITIES
 * 
 * Centralized date formatting functions for consistent time display
 * across living projects components.
 */

export interface FormatDistanceOptions {
  addSuffix?: boolean
  short?: boolean
}

/**
 * Formats a date as a human-readable distance from now
 * Used throughout living projects for displaying relative timestamps
 */
export function formatDistanceToNow(date: Date, options: FormatDistanceOptions = {}): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  const { addSuffix = false, short = false } = options
  
  if (diffMinutes < 1) {
    return addSuffix ? 'just now' : 'now'
  }
  
  if (diffMinutes < 60) {
    if (short) return `${diffMinutes}m${addSuffix ? ' ago' : ''}`
    return addSuffix ? `${diffMinutes} minutes ago` : `${diffMinutes}m`
  }
  
  if (diffHours < 24) {
    if (short) return `${diffHours}h${addSuffix ? ' ago' : ''}`
    return addSuffix ? `${diffHours} hours ago` : `${diffHours}h`
  }
  
  if (diffDays < 7) {
    if (short) return `${diffDays}d${addSuffix ? ' ago' : ''}`
    return addSuffix ? `${diffDays} days ago` : `${diffDays}d`
  }
  
  // For older dates, show formatted date
  if (short) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  return date.toLocaleDateString()
}

/**
 * Checks if a date is considered "recent" (within last 24 hours)
 */
export function isRecentDate(date: Date): boolean {
  return Date.now() - date.getTime() < 24 * 60 * 60 * 1000
}

/**
 * Checks if a date is within a specified number of days
 */
export function isWithinDays(date: Date, days: number): boolean {
  return Date.now() - date.getTime() < days * 24 * 60 * 60 * 1000
}
