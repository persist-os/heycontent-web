'use client'

import React, { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '../loading/LoadingState';
import { useAuth } from '@/app/context/auth-context';

// Platform-specific components
import { YouTubePlatform } from '../platforms/YouTubePlatform';
import { InstagramPlatform } from '../platforms/InstagramPlatform';
import { GmailPlatform } from '../platforms/GmailPlatform';

// Platform-specific hooks for the "all" tab
import { useYouTubeAnalytics } from '../hooks/useYouTubeAnalytics';
import { useInstagramAnalytics } from '../hooks/useInstagramAnalytics';
import { useGmailAnalytics } from '../hooks/useGmailAnalytics';

// Import existing components for "all" tab
import { YouTubeCard } from '../cards/YouTubeCard';
import { InstagramCard } from '../cards/InstagramCard';
import { GmailCard } from '../cards/GmailCard';
import { GmailModal } from '../modals/GmailModal';
import { InstagramModal } from '../modals/InstagramModal';
import { YoutubeModal } from '../modals/YoutubeModal';

import { AnyContentItem, PlatformType, YouTubeContentItem, InstagramContentItem, GmailContentItem } from '../types';
import { sortContent } from '../utils';
import { useRouter } from 'next/navigation';

export function ContentAnalyticsScreen() {
  const { firebaseUser, authLoading } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Platform hooks for "all" tab data
  const youtubeData = useYouTubeAnalytics(userId);
  const instagramData = useInstagramAnalytics(userId);
  const gmailData = useGmailAnalytics(userId);

  if (!firebaseUser || !userId) {
    return <LoadingState type="auth" />;
  }

  // Handle tab switching with immediate skeleton for Instagram
  const handlePlatformChange = useCallback((value: PlatformType) => {
    if (value === 'instagram') {
      setIsTabSwitching(true);
      
      // Show skeleton for minimum time, then let component take over
      setTimeout(() => {
        setIsTabSwitching(false);
      }, 600); // Show for 600ms minimum
    }
    
    setSelectedPlatform(value);
  }, []);

  // Combined data for "all" tab
  const allContentItems = useMemo(() => [
    ...youtubeData.items,
    ...gmailData.items,
    ...instagramData.items,
  ], [youtubeData.items, gmailData.items, instagramData.items]);

  // Sort items by date for "all" tab
  const allDisplayItems = useMemo(() => {
    return sortContent(allContentItems, 'date');
  }, [allContentItems]);

  const discussContent = async (item: AnyContentItem) => {
    try {
      // Create a compact context object to avoid URL length issues
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: item.platform === 'youtube'
          ? (item as YouTubeContentItem).content.title
          : item.platform === 'instagram'
            ? (item as InstagramContentItem).content?.text
            : (item as GmailContentItem).content?.data?.subject || 'Email Thread',
        thumbnailUrl: item.platform === 'youtube'
          ? (item as YouTubeContentItem).content?.thumbnailUrl || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
          : item.platform === 'instagram'
            ? (item as InstagramContentItem).content?.mediaUrl
            : undefined,
        publishedAt: item.publishedAt,
        metrics: item.metrics,
        // For Gmail, create a compact content object with only essential fields
        content: item.platform === 'gmail' ? {
          data: {
            subject: (item as GmailContentItem).content?.data?.subject || 'No Subject',
            from: (item as GmailContentItem).content?.data?.from || 'Unknown Sender',
            snippet: (item as GmailContentItem).content?.data?.snippet || 'No preview available',
            threadId: (item as GmailContentItem).content?.data?.threadId || (item as GmailContentItem).id,
            emailId: (item as GmailContentItem).content?.data?.emailId || (item as GmailContentItem).id,
            // Don't include the full payload to avoid URL length issues
          }
        } : item.content
      };
      
      const encodedContext = encodeURIComponent(JSON.stringify(context));
      
      // Check if the URL would be too long (browsers typically limit to ~2000 chars)
      const baseUrl = `/dashboard/chat?contentContext=`;
      const fullUrl = baseUrl + encodedContext;
      
      if (fullUrl.length > 1900) {
        // If URL is too long, use a more minimal context
        const minimalContext = {
          platform: item.platform,
          contentId: item.id,
          title: context.title,
          publishedAt: item.publishedAt,
          // For Gmail, include only the most essential data
          ...(item.platform === 'gmail' && {
            subject: (item as GmailContentItem).content?.data?.subject || 'No Subject',
            from: (item as GmailContentItem).content?.data?.from || 'Unknown Sender',
            threadId: (item as GmailContentItem).content?.data?.threadId || item.id,
          })
        };
        const minimalEncoded = encodeURIComponent(JSON.stringify(minimalContext));
        router.push(`/dashboard/chat?contentContext=${minimalEncoded}`);
      } else {
        router.push(fullUrl);
      }
    } catch (error) {
      console.error('Error creating discussion context:', error);
      // Fallback: navigate to chat without context
      router.push('/dashboard/chat');
    }
  };

  // Show loading state if data failed to load
  if (youtubeData.loading || gmailData.loading) {
    return <LoadingState type="content" />;
  }

  return (
    <div className="relative">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => handlePlatformChange(value as PlatformType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>

            {/* Platform-specific content */}
            {selectedPlatform === 'youtube' && (
              <YouTubePlatform userId={userId} selectedPlatform={selectedPlatform} />
            )}
            
            {selectedPlatform === 'instagram' && (
              <InstagramPlatform 
                userId={userId} 
                selectedPlatform={selectedPlatform}
                isTabSwitching={isTabSwitching}
              />
            )}
            
            {selectedPlatform === 'gmail' && (
              <GmailPlatform userId={userId} selectedPlatform={selectedPlatform} />
            )}

            {/* "All" tab content */}
            {selectedPlatform === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
                {allDisplayItems.length > 0 ? (
                  allDisplayItems.map((item, index) => {
                    // Ensure absolutely unique keys by combining platform, id, and index
                    const uniqueKey = `${item.platform}-${item.id}-${index}`;
                    const commonProps = {
                      onDiscussContent: () => discussContent(item),
                      onViewDetailedAnalytics: () => setSelectedContent(item)
                    };
                    
                    if (item.platform === 'instagram') {
                      return <InstagramCard key={item.id} {...commonProps} item={item as InstagramContentItem} userId={firebaseUser.uid} />;
                    }
                    if (item.platform === 'youtube') {
                      return <YouTubeCard key={uniqueKey} {...commonProps} item={item as YouTubeContentItem} />;
                    }
                    if (item.platform === 'gmail') {
                      return <GmailCard key={uniqueKey} {...commonProps} item={item as GmailContentItem} />;
                    }
                    return null;
                  })
                ) : (
                  <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
                    <div className="space-y-2">
                      <p className="text-lg font-medium">No content found</p>
                      <p className="text-sm">
                        Connect your social media accounts to see content analytics.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* Modals for "all" tab */}
      {selectedContent && selectedPlatform === 'all' && (
        <>
          {selectedContent.platform === 'gmail' && (
            <GmailModal
              selectedContent={selectedContent as GmailContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'instagram' && (
            <InstagramModal
              selectedContent={selectedContent as InstagramContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
          {selectedContent.platform === 'youtube' && (
            <YoutubeModal
              selectedContent={selectedContent as YouTubeContentItem}
              onClose={() => setSelectedContent(null)}
              onDiscussContent={() => discussContent(selectedContent)}
            />
          )}
        </>
      )}
    </div>
  );
}