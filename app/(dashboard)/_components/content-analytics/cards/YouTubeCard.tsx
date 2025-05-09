import React from 'react';
import { Card } from '@/src/components/ui/card';
import { MessageSquare, ThumbsUp, PlayCircle, Eye, Clock, BarChart3 } from 'lucide-react';

import { YouTubeContentItem } from '../types';

interface YouTubeCardProps {
  item: YouTubeContentItem;
  onDiscussContent: (item: YouTubeContentItem) => void;
  onViewDetailedAnalytics: (item: YouTubeContentItem) => void;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics }) => {
  // Extract data with null checks
  const content = item?.content || {};
  const metrics = item?.metrics || {};
  const publishedAt = item?.publishedAt || new Date().toISOString();
  
  // Debug the exact data received by this component
  console.log('YouTubeCard rendering with data:', JSON.stringify({
    id: item.id,
    content: content,
    metrics: metrics,
    publishedAt: publishedAt
  }, null, 2));

  // Create a direct thumbnail URL - using either our data or constructing from video ID
  let thumbnailUrl = '';
  
  // Debug what we're working with
  console.log('Thumbnail data:', {
    fromContent: content.thumbnailUrl,
    videoId: item.id
  });
  
  // First try using the standard YouTube thumbnail URL format 
  if (item.id) {
    // Construct a YouTube thumbnail URL directly from video ID - most reliable method
    thumbnailUrl = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
  } 
  // Fall back to content.thumbnailUrl if necessary
  else if (content.thumbnailUrl) {
    thumbnailUrl = content.thumbnailUrl;
  }
  
  console.log('Using thumbnail URL:', thumbnailUrl);
  
  // Format metrics for display with fallbacks
  const views = metrics?.views ? Number(metrics.views) : 0;
  const likes = metrics?.likes ? Number(metrics.likes) : 0;
  const comments = metrics?.comments ? Number(metrics.comments) : 0;

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-red-500 dark:border-red-400 shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 overflow-hidden">
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={content?.title || 'YouTube Video'}
              className="w-full h-full object-cover"
              loading="eager"
              onError={(e) => {
                console.error('Error loading YouTube thumbnail:', thumbnailUrl);
                e.currentTarget.onerror = null; // Prevent infinite loop
                e.currentTarget.style.display = 'none'; // Hide the broken image
                
                // Try fallback image with direct YouTube URL pattern if needed
                if (item.id && !thumbnailUrl.includes('i.ytimg.com')) {
                  const fallbackImg = document.createElement('img');
                  fallbackImg.src = `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;
                  fallbackImg.alt = content?.title || 'YouTube Video';
                  fallbackImg.className = 'w-full h-full object-cover';
                  e.currentTarget.parentElement?.appendChild(fallbackImg);
                } else {
                  // If still failing, show placeholder icon
                  const placeholder = document.createElement('div');
                  placeholder.className = 'flex items-center justify-center h-full w-full';
                  placeholder.innerHTML = '<div class="w-16 h-16 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg></div>';
                  e.currentTarget.parentElement?.appendChild(placeholder);
                }
              }}
            />
            {/* Overlay play button to make it look more like a video */}
            <div className="absolute inset-0 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
              <div className="bg-black bg-opacity-50 rounded-full p-2">
                <PlayCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <PlayCircle className="w-16 h-16" />
          </div>
        )}
      </div>
      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{content.title || 'Untitled Video'}</h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>{new Date(publishedAt).toLocaleDateString()}</span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Eye className="w-4 h-4" />
            <span>{(metrics?.views ?? 0).toLocaleString()} Views</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Clock className="w-4 h-4" />
            <span>{(metrics?.watchTimeMinutes ?? 0).toLocaleString()} min Watch Time</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <BarChart3 className="w-4 h-4" />
            <span>{metrics?.averageViewDurationSeconds ?? 0} sec Avg. Duration</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <ThumbsUp className="w-4 h-4" />
            <span>{(metrics?.likes ?? 0).toLocaleString()} Likes</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <MessageSquare className="w-4 h-4" />
            <span>{(metrics?.comments ?? 0).toLocaleString()} Comments</span>
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            className="px-3 py-1 rounded bg-heycontent-purple text-white hover:bg-purple-700 text-xs"
            onClick={() => onViewDetailedAnalytics(item)}
          >
            View Analytics
          </button>
          <button
            className="px-3 py-1 rounded border border-heycontent-purple text-heycontent-purple hover:bg-purple-50 text-xs"
            onClick={() => onDiscussContent(item)}
          >
            Discuss
          </button>
        </div>
      </div>
    </Card>
  );
};
