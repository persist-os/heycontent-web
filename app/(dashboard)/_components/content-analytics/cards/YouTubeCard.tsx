import React from 'react';
import { Card } from '@/src/components/ui/card';
import { MessageSquare, TrendingUp, BarChart3, PlayCircle } from 'lucide-react';
import { ContentItem } from '../types';

interface YouTubeCardProps {
  item: ContentItem;
  onDiscussContent: (item: ContentItem) => void;
  onViewDetailedAnalytics: (item: ContentItem) => void;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics }) => {
  const { content, metrics, publishedAt, performance } = item;

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-red-500 dark:border-red-400 shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {content.thumbnail ? (
          <img
            src={content.thumbnail}
            alt={content.text || 'YouTube Video'}
            className="w-full h-full object-cover"
        
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <PlayCircle className="w-16 h-16" />
          </div>
        )}
      </div>
      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{content.text || 'Untitled Video'}</h3>
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span className="mr-2">Published:</span>
          <span>{new Date(publishedAt).toLocaleDateString()}</span>
        </div>
        {/* Metrics */}
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span>{metrics.views.toLocaleString()}</span>
            <span className="ml-1 text-xs">Views</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>{metrics.likes?.toLocaleString() ?? 0}</span>
            <span className="ml-1 text-xs">Likes</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-green-500" />
            <span>{metrics.comments?.toLocaleString() ?? 0}</span>
            <span className="ml-1 text-xs">Comments</span>
          </div>
        </div>
        {/* Performance */}
        <div className="flex items-center gap-2 text-xs">
          <span className={
            performance.trend === 'up' ? 'text-green-600' : performance.trend === 'down' ? 'text-red-600' : 'text-gray-500'
          }>
            {performance.trend === 'up' ? '▲' : performance.trend === 'down' ? '▼' : '■'}
            {performance.percentageChange}%
          </span>
          <span>Performance</span>
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
