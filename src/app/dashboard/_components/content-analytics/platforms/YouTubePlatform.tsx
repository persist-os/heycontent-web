'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { YouTubeCard } from '../cards/YouTubeCard';
import { YoutubeModal } from '../modals/YoutubeModal';
import { LoadingState } from '../loading/LoadingState';
import { useYouTubeAnalytics } from '../hooks/useYouTubeAnalytics';
import { YouTubeContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';

interface YouTubePlatformProps {
  userId: string;
  selectedPlatform: 'youtube' | 'all';
}

export function YouTubePlatform({ userId, selectedPlatform }: YouTubePlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<YouTubeContentItem | null>(null);
  
  const { items, loading, error, isConnected } = useYouTubeAnalytics(userId);

  // Sort items by date
  const displayItems = sortContent(items, 'date');

  const discussContent = async (item: AnyContentItem) => {
    try {
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: (item as YouTubeContentItem).content.title,
        thumbnailUrl: (item as YouTubeContentItem).content?.thumbnailUrl || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        publishedAt: item.publishedAt,
        metrics: item.metrics,
        content: item.content
      };
      
      const encodedContext = encodeURIComponent(JSON.stringify(context));
      const baseUrl = `/dashboard/chat?contentContext=`;
      const fullUrl = baseUrl + encodedContext;
      
      if (fullUrl.length > 1900) {
        const minimalContext = {
          platform: item.platform,
          contentId: item.id,
          title: (item as YouTubeContentItem).content.title,
          publishedAt: item.publishedAt,
        };
        const minimalEncoded = encodeURIComponent(JSON.stringify(minimalContext));
        router.push(`/dashboard/chat?contentContext=${minimalEncoded}`);
      } else {
        router.push(fullUrl);
      }
    } catch (error) {
      console.error('Error creating discussion context:', error);
      router.push('/dashboard/chat');
    }
  };

  // Show loading state if data is still loading
  if (loading) {
    return <LoadingState type="content" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {displayItems.length > 0 ? (
          displayItems.map((item, index) => {
            const uniqueKey = `${item.platform}-${item.id}-${index}`;
            return (
              <YouTubeCard
                key={uniqueKey}
                item={item as YouTubeContentItem}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item as YouTubeContentItem)}
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
            <div className="space-y-2">
              <p className="text-lg font-medium">No YouTube content found</p>
              <p className="text-sm">
                Connect your YouTube account to see analytics and insights.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedContent && (
        <YoutubeModal
          selectedContent={selectedContent}
          onClose={() => setSelectedContent(null)}
          onDiscussContent={() => discussContent(selectedContent)}
        />
      )}
    </>
  );
} 