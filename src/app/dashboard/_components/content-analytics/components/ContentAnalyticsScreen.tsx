'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FirebaseApp } from 'firebase/app';
import { app, getFirebaseApp, getFirebaseAuth } from '@/app/lib/firebase';
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
import { LoadingState } from '../loading/LoadingState';
import { Header } from '../header/Header';

import {
  AnyContentItem, TimeRange, SortOption, PlatformType,
  EmailTypeFilter as TEmailTypeFilter,
  YouTubeContentItem, InstagramContentItem, GmailContentItem,
  PlatformFilterType
} from '../types';

import {
  sortAndFilterContent,
  getMockGmailItems,
  getMockInstagramItem,
  getMockYouTubeItem
} from '../utils';

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

const typedApp: FirebaseApp | undefined = app;

export function ContentAnalyticsScreen() {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedEmailType, setSelectedEmailType] = useState<TEmailTypeFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterRef, setFilterRef] = useState<HTMLDivElement | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterType, setFilterType] = useState<PlatformFilterType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [instagramAnalysis, setInstagramAnalysis] = useState<string | InstagramAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typedApp) {
      const auth = getAuth(typedApp);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      console.error("Firebase app not initialized.");
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef && !filterRef.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterRef]);

  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  const gmailThreads = useQuery(
    api.gmailQueries.listUserGmailThreads,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  const instagramPosts = useQuery(
    api.instagramQueries.getAllInstagramPosts,
    !authLoading && firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  );

  useEffect(() => {
    console.log('YouTube Videos from Convex:', youtubeVideos);
    console.log('Gmail Threads from Convex:', gmailThreads);
    console.log('Instagram Posts from Convex:', instagramPosts);
  }, [youtubeVideos, gmailThreads, instagramPosts]);

  useEffect(() => {
    if (selectedPlatform === 'instagram' && !instagramAnalysis && firebaseUser?.uid) {
      fetchInstagramAnalysis();
    }
  }, [selectedPlatform, instagramAnalysis, firebaseUser]);

  const fetchInstagramAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('Missing API key');

      const response = await fetch('/api/social/instagram/analystics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ user_id: firebaseUser?.uid })
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

  const mappedYouTubeItems = useMemo(() => {
    if (Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any): YouTubeContentItem => ({
        id: video._id || video.id,
        platform: 'youtube',
        publishedAt: video.publishedAt || '',
        content: {
          title: video.title || '',
          description: video.description || '',
          thumbnailUrl: video.thumbnailUrl || '',
          videoUrl: video.videoUrl || '',
        },
        metrics: {
          views: video.metrics?.views ?? 0,
          likes: video.metrics?.likes ?? 0,
          comments: video.metrics?.comments ?? 0,
          shares: video.metrics?.shares ?? 0,
        },
        aiAnalysis: video.aiAnalysis || null,
      }));
    }
    return [];
  }, [youtubeVideos]);

  const mappedGmailItems = useMemo(() => {
    if (Array.isArray(gmailThreads)) {
      return gmailThreads.map((thread: any): GmailContentItem => ({
        id: thread._id || thread.id,
        platform: 'gmail',
        publishedAt: thread.publishedAt || '',
        content: {
          subject: thread.subject || '',
          snippet: thread.snippet || '',
          thread: thread.threadId || '',
          emailType: thread.emailType || 'all',
        },
        metrics: thread.metrics || {},
      }));
    }
    return [];
  }, [gmailThreads]);

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
            comments: post.data.comment_count ?? 0,
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

  const filteredContent = useMemo(() => {
    if (selectedPlatform === 'youtube') return mappedYouTubeItems;
    if (selectedPlatform === 'gmail') return mappedGmailItems;
    if (selectedPlatform === 'instagram') return mappedInstagramItems;
    return sortAndFilterContent(allContentItems, selectedPlatform, selectedEmailType, sortBy, timeRange);
  }, [selectedPlatform, mappedYouTubeItems, mappedGmailItems, mappedInstagramItems, allContentItems, sortBy, timeRange, selectedEmailType]);

  const discussContent = (item: AnyContentItem) => {
    const context = {
      platform: item.platform,
      contentId: item.id,
      analysis: (item as any).aiAnalysis || null,
      title: item.platform === 'youtube'
        ? (item as YouTubeContentItem).content.title
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content.text
          : (item as GmailContentItem).content.subject,
    };
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    router.push(`/dashboard/chat?contentContext=${encodedContext}`);
  };

  const resetFilters = () => {
    setSortBy('date');
    setFilterType('all');
    setTimeRange('7d');
    setIsFilterOpen(false);
  };

  if (authLoading) return <LoadingState type="auth" />;
  if (!firebaseUser) return <LoadingState type="error" />;
  if (youtubeVideos === undefined || gmailThreads === undefined) return <LoadingState type="content" />;

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

            {selectedPlatform === 'instagram' && (
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
