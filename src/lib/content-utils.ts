/**
 * Shared utility functions for content display across the application
 */

/**
 * Format numbers with K/M suffixes for display
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format date for display
 */
export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Convert YouTube duration format (PT4M13S) to readable format
 */
export const formatDuration = (duration: string): string => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * Get grid classes based on item count for dynamic layouts
 */
export const getGridClasses = (itemCount: number): string => {
  if (itemCount === 0) return "grid grid-cols-1 gap-4";
  if (itemCount === 1) return "grid grid-cols-1 gap-4";
  if (itemCount === 2) return "grid grid-cols-2 gap-4";
  if (itemCount === 3) return "grid grid-cols-2 gap-4";
  if (itemCount === 4) return "grid grid-cols-2 gap-4";
  if (itemCount === 5) return "grid grid-cols-2 gap-4";
  return "grid grid-cols-2 gap-4"; // Default for 6+ items
};

/**
 * Get item classes based on position and total count for dynamic layouts
 */
export const getItemClasses = (index: number, totalCount: number): string => {
  if (totalCount === 1) return "col-span-1";
  if (totalCount === 2) return "col-span-1";
  if (totalCount === 3 && index === 2) return "col-span-2"; // Last item spans full width
  if (totalCount === 4) return "col-span-1";
  if (totalCount === 5 && index === 4) return "col-span-2"; // Last item spans full width
  return "col-span-1"; // Default
};

/**
 * Build array of available stat items for YouTube videos
 */
export const buildYouTubeStatItems = (videoData: any) => {
  const statItems: Array<{
    icon: React.ReactNode;
    value: string;
    label: string;
  }> = [];
  
  if (videoData.statistics?.views !== undefined) {
    statItems.push({
      icon: '👁️', // Will be replaced with actual icon component
      value: formatNumber(videoData.statistics.views),
      label: "Views"
    });
  }
  
  if (videoData.statistics?.likes !== undefined) {
    statItems.push({
      icon: '❤️',
      value: formatNumber(videoData.statistics.likes),
      label: "Likes"
    });
  }
  
  if (videoData.statistics?.comments !== undefined) {
    statItems.push({
      icon: '💬',
      value: formatNumber(videoData.statistics.comments),
      label: "Comments"
    });
  }
  
  if (videoData.content_details?.duration) {
    statItems.push({
      icon: '⏱️',
      value: formatDuration(videoData.content_details.duration),
      label: "Duration"
    });
  }
  
  if (videoData.snippet?.published_at) {
    statItems.push({
      icon: '📅',
      value: formatDate(new Date(videoData.snippet.published_at).getTime()),
      label: "Published"
    });
  }
  
  return statItems;
}; 

/**
 * Normalizes prefixed IDs to the format expected by Convex
 * Handles legacy 4-part insight format: insight:platform:analysisId:index -> insight:analysisId:index
 */
export function normalizePrefixedId(prefixedId: string): string {
  if (!prefixedId || typeof prefixedId !== 'string') {
    return prefixedId;
  }

  const parts = prefixedId.split(':');
  
  // Handle insight IDs specifically
  if (parts[0] === 'insight') {
    if (parts.length === 4) {
      // Legacy format: insight:platform:analysisId:index
      // Normalize to: insight:analysisId:index
      const [, platform, analysisId, index] = parts;
      
      if (process.env.NODE_ENV === 'development') {
        console.warn('[normalizePrefixedId] Normalizing legacy 4-part insight ID:', {
          original: prefixedId,
          normalized: `insight:${analysisId}:${index}`,
          platform,
          analysisId,
          index
        });
      }
      
      return `insight:${analysisId}:${index}`;
    }
    // Already in correct 3-part format or invalid format - return as is
    return prefixedId;
  }
  
  // For non-insight types, return as is
  return prefixedId;
}

/**
 * Validates a prefixed ID format
 */
export function validatePrefixedId(prefixedId: string): { isValid: boolean; error?: string } {
  if (!prefixedId || typeof prefixedId !== 'string') {
    return { isValid: false, error: 'PrefixedId must be a non-empty string' };
  }

  const trimmedId = prefixedId.trim();
  if (trimmedId === '') {
    return { isValid: false, error: 'PrefixedId cannot be empty' };
  }

  const parts = prefixedId.split(':');
  if (parts.length < 2) {
    return { isValid: false, error: 'PrefixedId must contain at least one colon separator' };
  }

  const [contentType, ...contentIdParts] = parts;
  const contentId = contentIdParts.join(':');

  if (!contentType || !contentId || contentType.trim() === '' || contentId.trim() === '') {
    return { isValid: false, error: 'Both content type and content ID must be non-empty' };
  }

  // Validate known content types
  const validContentTypes = ['note', 'youtube', 'instagram', 'gmail', 'insight'];
  if (!validContentTypes.includes(contentType)) {
    return { isValid: false, error: `Unknown content type: ${contentType}` };
  }

  // Special validation for insights
  if (contentType === 'insight') {
    const insightParts = contentId.split(':');
    if (insightParts.length !== 2) {
      return { isValid: false, error: 'Insight ID must be in format insight:analysisId:index' };
    }
    
    const [analysisId, indexStr] = insightParts;
    if (!analysisId || !indexStr) {
      return { isValid: false, error: 'Insight analysisId and index must be non-empty' };
    }
    
    const index = parseInt(indexStr, 10);
    if (isNaN(index) || index < 0) {
      return { isValid: false, error: 'Insight index must be a non-negative integer' };
    }
  }

  // Validate minimum content ID length for other types
  if (contentType !== 'insight' && contentId.length < 3) {
    return { isValid: false, error: 'Content ID too short' };
  }

  return { isValid: true };
} 