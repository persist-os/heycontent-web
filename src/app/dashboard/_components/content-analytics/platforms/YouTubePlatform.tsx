'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { YouTubeCard } from '../cards/YouTubeCard';
import { YoutubeModal } from '../modals/YoutubeModal';
import { LoadingState } from '../loading/LoadingState';
import { useYouTubeAnalytics } from '../hooks/useYouTubeAnalytics';
import { YouTubeContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';
import { YouTubeBrandIcon } from '../../YoutubeBrandIcon';

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

  // Show YouTube connect card if no YouTube account found
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center">
              <YouTubeBrandIcon href="https://youtube.com/" className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
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

  return (
    <>
      {displayItems.length > 0 ? (
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
      ) : (
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <Card className="p-6 sm:p-8 max-w-md w-full bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl text-center">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-600 flex items-center justify-center">
                <YouTubeBrandIcon href="https://youtube.com/" className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
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
      )}

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