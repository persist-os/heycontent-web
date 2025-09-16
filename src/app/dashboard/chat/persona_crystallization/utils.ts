/**
 * Utility functions for persona crystallization components
 */

/**
 * Formats timestamps consistently across the application
 */
export function formatTimestamp(timestamp: number | string | undefined | null, options?: {
  includeTime?: boolean;
  relative?: boolean;
}): string {
  if (!timestamp) return 'Unknown';
  
  const { includeTime = false, relative = false } = options || {};
  
  let date: Date;
  
  // Handle different timestamp formats
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    // Handle both milliseconds and seconds timestamps
    // Convex _creationTime is in milliseconds, but some other timestamps might be in seconds
    date = timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
  } else {
    return 'Invalid date';
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  if (relative) {
    return formatRelativeTime(date);
  }
  
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
    dateOptions.hour12 = false;
  }
  
  return date.toLocaleDateString('en-US', dateOptions);
}

/**
 * Formats relative time (e.g., "2 minutes ago", "1 hour ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatTimestamp(date.getTime(), { includeTime: false });
  }
}

/**
 * Formats time only (HH:mm)
 */
export function formatTimeOnly(timestamp: number | string | undefined | null): string {
  if (!timestamp) return 'Unknown';
  
  let date: Date;
  
  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'number') {
    date = timestamp > 1e12 ? new Date(timestamp) : new Date(timestamp * 1000);
  } else {
    return 'Invalid time';
  }
  
  if (isNaN(date.getTime())) {
    return 'Invalid time';
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}
