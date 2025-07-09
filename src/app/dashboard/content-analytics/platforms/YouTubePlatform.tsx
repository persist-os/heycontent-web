'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, RefreshCw } from 'lucide-react';
import { YouTubeCard } from '../cards/YouTubeCard';
import { YoutubeModal } from '../modals/YoutubeModal';
import { PlatformEmbeddingStatus } from '../components/PlatformEmbeddingStatus';
import { useYouTubeAnalytics } from '../hooks/useYouTubeAnalytics';
import { YouTubeContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';
import { YouTubeBrandIcon } from '../../../../lib/YoutubeBrandIcon';
import { Skeleton } from '@/components/ui/skeleton';
import { PlatformConnectionPrompt } from '../../_components/content-hub/PlatformConnectionPrompt';
import { useYouTubeRefresh } from '@/app/hooks/useYouTubeRefresh';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface YouTubePlatformProps {
  userId: string;
  isConnected: boolean;
  error: string | null;
}

export function YouTubePlatform({
  userId,
  isConnected,
  error,
}: YouTubePlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<YouTubeContentItem | null>(null);
  
  // Use the same refresh hook as other platforms
  const { 
    loading: refreshing, 
    error: refreshError, 
    success: refreshSuccess, 
    refreshAll 
  } = useYouTubeRefresh();

  // Fetch video data directly from Convex
  const videoData = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    userId ? { userId } : 'skip'
  );

  // Log the query result and userId for debugging in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.log('[YouTubePlatform] userId:', userId, 'videoData:', videoData);
  }

  // Sort items by date
  const displayItems = videoData ? sortContent(videoData, 'date') : [];

  const handleRefreshAll = async () => {
    await refreshAll(userId);
  };

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

  // Show YouTube connect card if no YouTube account found
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="YouTube"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center">
            <YouTubeBrandIcon href="https://youtube.com/" className="w-full h-full" />
          </div>
        }
        description="Connect your YouTube account to view detailed analytics, track video performance, and get insights on your content strategy."
        buttonColor="bg-red-600"
        buttonHoverColor="hover:bg-red-700"
      />
    );
  }

  if (videoData === undefined) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 flex flex-col space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <div className="flex justify-between items-center pt-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 mb-8">
        <p>Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">Try Again</Button>
      </div>
    );
  }

  if (displayItems.length === 0) {
    return (
      <>
        {/* Refresh Button (top right, consistent with other platforms) */}
        <div className="flex justify-end mb-4">
          <Button 
            size="sm" 
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh YouTube'}
          </Button>
        </div>
        {refreshError && !refreshSuccess && (
          <div className="text-red-500 text-sm mb-2 text-center">{refreshError}</div>
        )}
        {refreshSuccess && (
          <div className="text-green-500 text-sm mb-2 text-center">YouTube videos refreshed!</div>
        )}
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <YouTubeBrandIcon href="https://youtube.com/" className="w-16 h-16" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
              No Videos Found
            </h3>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
              We couldn't find any videos in your connected YouTube channel.
              Upload new content to see your analytics here.
            </p>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Refresh Button (top right, consistent with other platforms) */}
      <div className="flex justify-end mb-4">
        <Button 
          size="sm" 
          onClick={handleRefreshAll}
          disabled={refreshing}
          className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh YouTube'}
        </Button>
      </div>
      {refreshError && !refreshSuccess && (
        <div className="text-red-500 text-sm mb-2 text-center">{refreshError}</div>
      )}
      {refreshSuccess && (
        <div className="text-green-500 text-sm mb-2 text-center">YouTube videos refreshed!</div>
      )}
      {/* Platform Embedding Status (smart context memory box) */}
      <div className="w-full mb-4">
        <PlatformEmbeddingStatus 
          platform="youtube" 
          contentCount={displayItems.length} 
          userId={userId} 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {displayItems.map((item, index) => {
          const uniqueKey = `${item.platform}-${item.id}-${index}`;
          return (
            <YouTubeCard
              key={uniqueKey}
              item={item as YouTubeContentItem}
              onDiscussContent={() => discussContent(item)}
              onViewDetailedAnalytics={() => setSelectedContent(item as YouTubeContentItem)}
            />
          );
        })}
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