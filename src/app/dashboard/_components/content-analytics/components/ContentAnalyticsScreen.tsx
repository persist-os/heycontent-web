'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { YouTubeCard } from '../cards/YouTubeCard';
import { InstagramCard } from '../cards/InstagramCard';
import { GmailCard } from '../cards/GmailCard';
import { FilterDropdown } from '../filters/FilterDropdown';
import { EmailTypeFilter } from '../filters/EmailTypeFilter';
import { GmailModal } from '../modals/GmailModal';
import { InstagramModal } from '../modals/InstagramModal';
import { YoutubeModal } from '../modals/YoutubeModal';
import { Header } from '../header/Header';
import { LoadingState } from '../loading/LoadingState';

import {
  AnyContentItem, TimeRange, SortOption, PlatformType,
  EmailTypeFilter as TEmailTypeFilter,
  YouTubeContentItem, InstagramContentItem, GmailContentItem,
  PlatformFilterType
} from '../types';

import { sortAndFilterContent } from '../utils';
import { useAuth } from '@/app/context/auth-context';

// Instagram analysis type
interface InstagramAnalysis {
  last_post?: {
    date: string | null;
    type: string | null;
    time_ago: string | null;
  } | null;
  posting_frequency?: {
    average_days_between_posts: number | null;
    has_recent_posts: boolean | null;
    total_posts_last_7_days: string | null;
  } | null;
  media_distribution?: {
    regular_post: string | null;
    carousel: string | null;
    reel: string | null;
    story: string | null;
  } | null;
}

// Separate component for Instagram analytics
function InstagramAnalytics({ userId }: { userId: string }) {
  const [instagramAnalysis, setInstagramAnalysis] = useState<string | InstagramAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  const fetchInstagramAnalysis = async () => {
    if (hasAttemptedFetch) return;
    
    try {
      setIsAnalyzing(true);
      setHasAttemptedFetch(true);
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('Missing API key');

      const response = await fetch('/api/instagram/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Instagram analysis API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const data = await response.json();
      
      if (data?.analysis?.full_analysis?.content) {
        setInstagramAnalysis(data.analysis.full_analysis.content);
      } else if (data?.analysis?.content) {
        setInstagramAnalysis(data.analysis.content);
      } else if (data?.content) {
        setInstagramAnalysis(data.content);
      } else {
        setInstagramAnalysis('Unable to generate analysis at this time.');
      }
    } catch (err) {
      console.error('Instagram analysis fetch error:', err);
      setInstagramAnalysis('Error generating analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!hasAttemptedFetch) {
      fetchInstagramAnalysis();
    }
  }, [hasAttemptedFetch]);

  return (
    <div className="mb-6">
      <div className="p-4 bg-gradient-to-r from-pink-200 via-purple-200 to-yellow-200 rounded-lg text-black dark:text-black">
        <h3 className="font-semibold mb-2">Content Activity Tracker</h3>
        {isAnalyzing ? (
          <p className="text-sm">Analyzing your Instagram profile...</p>
        ) : instagramAnalysis ? (
          <div className="text-sm">
            {typeof instagramAnalysis === 'string' ? (
              <p>{instagramAnalysis}</p>
            ) : (
              <>
                {instagramAnalysis.last_post && (
                  <div className="mb-2">
                    <p className="font-medium">Last Post:</p>
                    <p>Date: {instagramAnalysis.last_post.date || 'N/A'}</p>
                    <p>Type: {instagramAnalysis.last_post.type || 'N/A'}</p>
                    <p>Time Ago: {instagramAnalysis.last_post.time_ago || 'N/A'}</p>
                  </div>
                )}
                {instagramAnalysis.posting_frequency && (
                  <div className="mb-2">
                    <p className="font-medium">Posting Frequency:</p>
                    <p>Average Days Between Posts: {instagramAnalysis.posting_frequency.average_days_between_posts ?? 'N/A'}</p>
                    <p>Recent Posts: {instagramAnalysis.posting_frequency.has_recent_posts ? 'Yes' : 'No'}</p>
                    <p>Posts Last 7 Days: {instagramAnalysis.posting_frequency.total_posts_last_7_days || '0'}</p>
                  </div>
                )}
                {instagramAnalysis.media_distribution && (
                  <div className="mb-2">
                    <p className="font-medium">Media Distribution:</p>
                    <p>Regular Posts: {instagramAnalysis.media_distribution.regular_post || '0%'}</p>
                    <p>Carousels: {instagramAnalysis.media_distribution.carousel || '0%'}</p>
                    <p>Reels: {instagramAnalysis.media_distribution.reel || '0%'}</p>
                    <p>Stories: {instagramAnalysis.media_distribution.story || '0%'}</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <p className="text-sm">Discover trends, best posting times, and engagement drivers for your Instagram content.</p>
        )}
      </div>
    </div>
  );
}

export function ContentAnalyticsScreen() {
  const { firebaseUser, authLoading } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedEmailType, setSelectedEmailType] = useState<TEmailTypeFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('90d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRef, setFilterRef] = useState<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<PlatformFilterType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);

  if (!firebaseUser || !userId) {
    return <LoadingState type="auth" />;
  }

  // Convex queries (never skip, just allow undefined)
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    { userId }
  );
  const gmailThreads = useQuery(
    api.gmailQueries.listUserGmailThreads,
    { userId }
  );
  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    { userId }
  );

  // Debug log: log the raw gmailThreads value
  console.log('ContentAnalyticsScreen: raw gmailThreads from Convex:', gmailThreads);

  useEffect(() => {
  }, [youtubeVideos, gmailThreads, instagramPosts]);

  // Map YouTube items - using the correctly structured data from listUserYouTubeVideos query
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any) => ({
        id: video.id || '',
        platform: 'youtube',
        publishedAt: video.publishedAt || new Date().toISOString(),
        content: {
          title: video.content?.title || 'Untitled Video',
          description: video.content?.description || '',
          thumbnailUrl: video.content?.thumbnailUrl || '',
          videoUrl: video.content?.videoUrl || `https://www.youtube.com/watch?v=${video.id}`,
          channelTitle: video.content?.channelTitle || '',
          channelId: video.content?.channelId || '',
        },
        metrics: {
          views: video.metrics?.views || 0,
          likes: video.metrics?.likes || 0,
          dislikes: video.metrics?.dislikes || 0,
          comments: video.metrics?.comments || 0,
          watchTimeMinutes: video.metrics?.watchTimeMinutes || 0,
          averageViewDurationSeconds: video.metrics?.averageViewDurationSeconds || 0,
        },
        analysis: video.analysis || null,
        aiAnalysis: video.aiAnalysis || null,
      }));
    }
    return [];
  }, [youtubeVideos]);

  // Map Gmail items - only use important_emails from agent analysis if available
  const mappedGmailItems = useMemo(() => {
    if (Array.isArray(gmailThreads)) {
      // If the threads array contains an 'analysis' field with important_emails, flatten and use those
      const importantEmails: any[] = [];
      gmailThreads.forEach((thread: any) => {
        if (thread.analysis && Array.isArray(thread.analysis.important_emails)) {
          thread.analysis.important_emails.forEach((email: any) => {
            importantEmails.push({
              id: email.id || thread._id || thread.id,
              platform: 'gmail',
              publishedAt: email.date || thread.publishedAt || '',
              content: {
                subject: email.subject || 'No Subject',
                snippet: email.snippet || 'No preview available',
                from: email.sender || 'Unknown Sender',
                emailType: email.emailType || 'important',
              },
              metrics: email.metrics || {},
            });
          });
        }
      });
      // If no important_emails found, fallback to mapping all threads (legacy)
      if (importantEmails.length > 0) return importantEmails;
      return gmailThreads.map((thread: any): GmailContentItem => ({
        id: thread._id || thread.id,
        platform: 'gmail',
        publishedAt: thread.publishedAt || '',
        content: {
          subject: thread.subject || thread.data?.subject || 'No Subject',
          snippet: thread.snippet || thread.data?.snippet || 'No preview available',
          from: thread.from || thread.data?.from || 'Unknown Sender',
          emailType: thread.emailType || thread.data?.emailType || 'all',
        },
        metrics: thread.metrics || {},
      }));
    }
    return [];
  }, [gmailThreads]);

  // Debug log: log the mappedGmailItems value
  console.log('ContentAnalyticsScreen: mappedGmailItems:', mappedGmailItems);

  const mappedInstagramItems = useMemo(() => {
    if (Array.isArray(instagramPosts)) {
      return instagramPosts.map((post: any): InstagramContentItem => {
        let mediaUrl = post.data.media_url;
        if (post.data.media_type === 'CAROUSEL_ALBUM' && post.data.children?.length > 0) {
          const imageChild = post.data.children.find((c: any) => c.media_type === 'IMAGE');
          mediaUrl = imageChild?.media_url || post.data.children[0]?.media_url || mediaUrl;
        }

        return {
          id: post.postId || post.data.id,
          platform: 'instagram',
          publishedAt: post.data.timestamp ? new Date(post.data.timestamp).toISOString() : new Date().toISOString(),
          content: {
            text: post.data.caption,
            mediaUrl,
            mediaType: post.data.media_type === 'IMAGE' ? 'image' : post.data.media_type === 'VIDEO' ? 'video' : 'carousel',
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
          },
          metrics: {
            impressions: undefined,
            reach: undefined,
            likes: post.data.like_count ?? 0,
            comments: post.data.comments_count ?? 0,
            shares: undefined,
          },
        };
      });
    }
    return [];
  }, [instagramPosts]);

  const allContentItems = useMemo(() => [
    ...mappedYouTubeItems,
    ...mappedGmailItems,
    ...mappedInstagramItems,
  ], [mappedYouTubeItems, mappedGmailItems, mappedInstagramItems]);

  // Platform-specific arrays using mapped items
  const youtubeItemsArray = mappedYouTubeItems;
  const gmailItemsArray = mappedGmailItems;
  const instagramItemsArray = mappedInstagramItems;

  // Apply filtering based on selected platform
  const filteredContent = useMemo(() => {
    if (selectedPlatform === 'youtube') return youtubeItemsArray;
    if (selectedPlatform === 'gmail') return gmailItemsArray;
    if (selectedPlatform === 'instagram') return instagramItemsArray;
    return sortAndFilterContent(
      allContentItems,
      selectedPlatform,
      selectedEmailType,
      sortBy,
      timeRange
    );
  }, [selectedPlatform, youtubeItemsArray, gmailItemsArray, instagramItemsArray, allContentItems, selectedEmailType, sortBy, timeRange]);

  // Final display items
  const displayItems = filteredContent;

  const discussContent = (item: AnyContentItem) => {
    // Create a context object with comprehensive content info
    const context = {
      platform: item.platform,
      contentId: item.id,
      analysis: (item as any).aiAnalysis || null,
      title: item.platform === 'youtube'
        ? (item as YouTubeContentItem).content.title
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content?.text
          : (item as GmailContentItem).content?.subject,
      // Include thumbnail URL for visual context
      thumbnailUrl: item.platform === 'youtube' 
        ? (item as YouTubeContentItem).content?.thumbnailUrl || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content?.mediaUrl
          : undefined,
      // Include published date
      publishedAt: item.publishedAt,
      // Include metrics for context
      metrics: item.metrics,
      // Include full content object for additional context
      content: item.content
    };
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    router.push(`/dashboard/chat?contentContext=${encodedContext}`);
  };

  const resetFilters = () => {
    setSortBy('date');
    setFilterType('all');
    setTimeRange('90d');
    setIsFilterOpen(false);
  };

  // Show a small spinner if auth is loading, but never gate the whole screen
  // Optionally, you can show a subtle spinner in the header or avatar area

  // Show loading state if not logged in
  if (!firebaseUser) {
    return <LoadingState type="auth" />;
  }

  // Show loading state if data failed to load
  if (youtubeVideos === undefined || gmailThreads === undefined) {
    return <LoadingState type="content" />;
  }

  return (
    <div className="relative">
      <Header
        timeRange={timeRange}
        isFilterOpen={isFilterOpen}
        onTimeRangeChange={setTimeRange}
        onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        filterRef={setFilterRef}
      />

      <FilterDropdown
        isOpen={isFilterOpen}
        timeRange={timeRange}
        sortBy={sortBy}
        filterType={filterType}
        onTimeRangeChange={setTimeRange}
        onSortByChange={setSortBy}
        onFilterTypeChange={setFilterType}
        onReset={resetFilters}
      />

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedPlatform(value as PlatformType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>

            {selectedPlatform === 'instagram' && userId && (
              <InstagramAnalytics userId={userId} />
            )}

            {selectedPlatform === 'gmail' && (
              <EmailTypeFilter
                selectedEmailType={selectedEmailType}
                onEmailTypeChange={setSelectedEmailType}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.length > 0 ? (
                filteredContent.map(item => {
                  const commonProps = {
                    onDiscussContent: () => discussContent(item),
                    onViewDetailedAnalytics: () => setSelectedContent(item)
                  };
                  if (item.platform === 'instagram') {
                    return <InstagramCard key={item.id} {...commonProps} item={item as InstagramContentItem} userId={firebaseUser.uid} />;
                  }
                  if (item.platform === 'youtube') {
                    return <YouTubeCard key={item.id} {...commonProps} item={item as YouTubeContentItem} />;
                  }
                  if (item.platform === 'gmail') {
                    return <GmailCard key={item.id} {...commonProps} item={item as GmailContentItem} />;
                  }
                  return null;
                })
              ) : (
                <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
                  No content found matching your criteria.
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {selectedContent && (
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
              userId={firebaseUser.uid}
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
