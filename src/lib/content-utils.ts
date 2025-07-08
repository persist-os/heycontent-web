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