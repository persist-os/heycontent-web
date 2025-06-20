'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { YouTubeCard } from '../cards/YouTubeCard';
import { YoutubeModal } from '../modals/YoutubeModal';
import { PlatformEmbeddingStatus } from '../components/PlatformEmbeddingStatus';
import { useYouTubeAnalytics } from '../hooks/useYouTubeAnalytics';
import { YouTubeContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';
import { YouTubeBrandIcon } from '../../../../lib/YoutubeBrandIcon';
import { Skeleton } from '@/components/ui/skeleton';

interface YouTubePlatformProps {
  userId: string;
  items: YouTubeContentItem[];
  loading: boolean;
  isConnected: boolean;
  error: string | null;
}

export function YouTubePlatform({
  userId,
  items,
  loading,
  isConnected,
  error,
}: YouTubePlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<YouTubeContentItem | null>(null);

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

  // Show YouTube connect card if no YouTube account found
  if (loading) {
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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <YouTubeBrandIcon href="https://youtube.com/" className="w-16 h-16" />
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
            Connect Your YouTube Channel
          </h3>
          
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm leading-relaxed">
            Connect your YouTube channel to view detailed analytics, track video performance, 
            and get insights on your content strategy.
          </p>
          
          <Button 
            onClick={() => router.push('/settings?tab=integrations')}
            className="w-full py-3 px-4 sm:px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Settings className="w-4 h-4" />
            Go to Integrations
          </Button>
          
          <div className="mt-3 sm:mt-4 text-xs text-gray-500">
            You can connect YouTube in Settings → Integrations
          </div>
        </Card>
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
    );
  }

  return (
    <>
      {/* Platform Embedding Status */}
      <PlatformEmbeddingStatus 
        platform="youtube" 
        contentCount={displayItems.length} 
        userId={userId} 
      />

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