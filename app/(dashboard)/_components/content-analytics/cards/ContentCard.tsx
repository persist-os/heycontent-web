import React from 'react';
import { Card } from '@/src/components/ui/card';
import { MessageSquare, TrendingUp, BarChart3 } from 'lucide-react';
import { ContentItem } from '../types';
import { getPlatformIcon, getMetricsDisplay } from '../utils';

interface ContentCardProps {
  item: ContentItem;
  onDiscussContent: (item: ContentItem) => void;
  onViewDetailedAnalytics: (item: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({ 
  item, 
  onDiscussContent, 
  onViewDetailedAnalytics 
}) => {
  return (
    <Card key={item.id} className="overflow-hidden">
      {/* Content Preview */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {item.platform === 'gmail' ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <div className="w-full">
              <h3 className="font-medium text-lg mb-2 line-clamp-2">{item.content.subject}</h3>
              {item.content.emailType === 'partnership' && (
                <p className="text-sm text-heycontent-purple mb-1">
                  Partner: {item.content.partnerName}
                </p>
              )}
              {item.content.recipients ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Recipients: {item.content.recipients?.toLocaleString()}
                </p>
              ) : item.content.thread && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Thread: {item.content.thread.messageCount} messages
                </p>
              )}
            </div>
          </div>
        // Use thumbnail for YouTube, mediaUrl for others
        ) : (item.content.thumbnail || item.content.mediaUrl) && (
          <img 
            src={item.content.thumbnail || item.content.mediaUrl}
            alt="Content thumbnail"
            className="w-full h-full object-cover"
          />
        )}
        {/* Platform Icon */} 
        <div className="absolute top-2 left-2 p-1 bg-black/30 rounded-full text-white">
          {getPlatformIcon(item.platform)}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-medium dark:text-white line-clamp-2">
              {/* Display subject for email, text for others */}
              {item.platform === 'gmail' ? item.content.subject : item.content.text}
            </p>
            <p className="text-sm text-text-gray dark:text-gray-400">
              {/* Format date nicely */}
              {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : 'Date unknown'}
            </p>
          </div>
          {/* Performance Trend */} 
          <div className={`flex items-center gap-1 text-sm ${
            item.performance.trend === 'up' 
              ? 'text-green-500' 
              : item.performance.trend === 'down'
              ? 'text-red-500'
              : 'text-gray-500'
          }`}>
            {item.performance.trend !== 'stable' && (
              <TrendingUp className={`w-4 h-4 ${item.performance.trend === 'down' ? 'transform rotate-180' : ''}`} />
            )}
            {item.performance.percentageChange !== 0 ? `${item.performance.percentageChange}%` : '-'}
          </div>
        </div>

        {/* Metrics */} 
        <div className="grid grid-cols-3 gap-4 mb-4">
          {getMetricsDisplay(item)}
        </div>

        {/* Action Buttons */} 
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDiscussContent(item)}
            className="flex items-center gap-2 text-sm text-heycontent-purple dark:text-heycontent-purple hover:underline"
          >
            <MessageSquare className="w-4 h-4" />
            Discuss with Content
          </button>
          <button 
            onClick={() => onViewDetailedAnalytics(item)}
            className="flex items-center gap-2 text-sm text-text-gray dark:text-gray-400 hover:underline ml-auto"
          >
            <BarChart3 className="w-4 h-4" />
            Detailed Analytics
          </button>
        </div>
      </div>
    </Card>
  );
};
