"use client"

import React from 'react';
import { Card } from '@/src/components/ui/card';
import { MessageSquare, ThumbsUp, PlayCircle, Eye, Clock, BarChart3 } from 'lucide-react';
import { YouTubeContentItem } from '../types';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface YouTubeCardProps {
  item: YouTubeContentItem;
  onDiscussContent: (item: YouTubeContentItem) => void;
  onViewDetailedAnalytics: (item: YouTubeContentItem) => void;
  userId: string;
}

export const YouTubeCard: React.FC<YouTubeCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics, userId }) => {
  const { content, metrics, publishedAt } = item;

  const videos = useQuery(api.youtubeQueries.listUserYouTubeVideos, {
    userId: userId
  });

  console.log(videos);

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-red-500 dark:border-red-400 shadow-lg">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        {content.thumbnailUrl ? (
          <img
            src={content.thumbnailUrl}
            alt={content.title || 'YouTube Video'}
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
