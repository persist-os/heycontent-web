'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

import { YouTubeCard } from '../cards/YouTubeCard';
import { InstagramCard } from '../cards/InstagramCard';
import { GmailCard } from '../cards/GmailCard';
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
function InstagramAnalytics({ userId, onDiscussContent }: { userId: string; onDiscussContent: (item: InstagramContentItem) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [selectedContent, setSelectedContent] = useState<InstagramContentItem | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Get Instagram account data from Convex
  const instagramAccount = useQuery(api.instagramQueries.getInstagramAccount, { userId });

  // Get Instagram tracker analysis from Convex
  const trackerAnalysis = useQuery(
    api.instagramQueries.getInstagramTrackerAnalysis,
    {
      userId,
      instagramAccountId: instagramAccount?.instagramAccountId || ""
    }
  );

  const fetchData = async () => {
    if (!instagramAccount) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Check if we have data in Convex
      if (trackerAnalysis !== undefined) {
        if (trackerAnalysis) {
          console.log('[DEBUG] Using existing Convex data');
          setAnalysis(trackerAnalysis);
          setLoading(false);
          return;
        }
      }

      console.log('[DEBUG] No existing data in Convex, fetching from backend...');
      const response = await fetch(`${window.location.origin}/api/social/instagram/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey()}`,
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram analysis: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[DEBUG] Received data:', data);
      
      if (data?.analysis?.full_analysis?.content) {
        console.log('[DEBUG] Setting analysis state:', data.analysis.full_analysis.content);
        setAnalysis(data.analysis.full_analysis.content);
      } else {
        console.log('[DEBUG] No analysis content in data:', data);
      }
    } catch (err) {
      console.error('[DEBUG] Error fetching Instagram analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[DEBUG] InstagramAnalytics useEffect triggered');
    console.log('[DEBUG] Current analysis state:', analysis);
    console.log('[DEBUG] Current trackerAnalysis:', trackerAnalysis);
    fetchData();
  }, [userId, instagramAccount, trackerAnalysis]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-heycontent-purple"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>No Instagram analysis available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Last Post Section */}
      {analysis.last_post && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Last Post</h3>
            <Button size="sm" onClick={fetchData} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Refreshing...' : 'Refresh Analysis'}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{analysis.last_post.date || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium">{analysis.last_post.type || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Time Ago</p>
              <p className="font-medium">{analysis.last_post.time_ago || 'N/A'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Posting Frequency Section */}
      {analysis.posting_frequency && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Posting Frequency</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Average Days Between Posts</p>
              <p className="font-medium">
                {analysis.posting_frequency.average_days_between_posts || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Recent Posts</p>
              <p className="font-medium">{analysis.posting_frequency.has_recent_posts ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Posts Last 7 Days</p>
              <p className="font-medium">{analysis.posting_frequency.total_posts_last_7_days || '0'}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Media Distribution Section */}
      {analysis.media_distribution && (
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Media Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Regular Posts</p>
              <p className="font-medium">{analysis.media_distribution.regular_post || '0%'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Carousels</p>
              <p className="font-medium">{analysis.media_distribution.carousel || '0%'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reels</p>
              <p className="font-medium">{analysis.media_distribution.reel || '0%'}</p>
            </div>
          </div>
        </Card>
      )}

      {selectedContent && (
        <InstagramModal
          selectedContent={selectedContent}
          onClose={() => setShowModal(false)}
          onDiscussContent={onDiscussContent}
        />
      )}
    </div>
  );
}

export function ContentAnalyticsScreen() {
  const { firebaseUser, authLoading } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  // Restore platform selection filter
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);
  const [loadingDiscuss, setLoadingDiscuss] = useState(false);

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
    userId ? { userId } : undefined
  );

  // Add this query near the other Convex queries
  const instagramPostInsights = useQuery(
    api.instagramQueries.getAllPostInsights,
    { userId: firebaseUser?.uid || '' }
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

  // Helper to get the received date for an email/thread
  const getReceivedDate = (email: any, thread: any) => {
    if (email && email.internalDate) return new Date(Number(email.internalDate)).toISOString();
    const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
    if (firstMessage && firstMessage.internalDate) return new Date(Number(firstMessage.internalDate)).toISOString();
    if (thread.createdAt) return new Date(thread.createdAt).toISOString();
    return '';
  };

  const mappedGmailItems = useMemo(() => {
    if (Array.isArray(gmailThreads)) {
      const importantEmails: any[] = [];
      gmailThreads.forEach((thread: any) => {
        if (thread.analysis && Array.isArray(thread.analysis.important_emails)) {
          thread.analysis.important_emails.forEach((email: any) => {
            const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
            importantEmails.push({
              id: email.id || thread._id || thread.id,
              platform: 'gmail',
              publishedAt: getReceivedDate(email, thread),
              content: {
                data: {
                  subject: email.subject || thread.subject || firstMessage?.subject || thread.data?.subject || 'No Subject',
                  snippet: email.snippet || thread.snippet || thread.data?.snippet || 'No preview available',
                  from: email.sender || thread.from || firstMessage?.from || thread.data?.from || 'Unknown Sender',
                  emailType: email.emailType || 'important',
                  threadId: thread.threadId,
                  emailId: firstMessage?.id,
                }
              },
              metrics: email.metrics || {},
            });
          });
        }
      });
      if (importantEmails.length > 0) return importantEmails;
      return gmailThreads.map((thread: any): GmailContentItem => {
        const firstMessage = thread.data?.messages?.[0] || thread.messages?.[0];
        console.log('THREAD DATA:', thread.data, 'TOP-LEVEL:', thread.subject, thread.from, 'FIRST MESSAGE:', firstMessage);
        return {
          id: thread.threadId,
          platform: 'gmail',
          publishedAt: getReceivedDate(null, thread),
          content: {
            data: {
              subject: firstMessage?.subject || thread.data?.subject || thread.subject || 'No Subject',
              snippet: thread.data?.snippet || thread.snippet || 'No preview available',
              from: firstMessage?.from || thread.data?.from || thread.from || 'Unknown Sender',
              emailType: thread.data?.emailType || 'all',
              threadId: thread.threadId,
              emailId: firstMessage?.id,
              messageCount: thread.data?.messageCount || thread.messageCount,
              messages: thread.data?.messages || thread.messages,
            }
          },
          metrics: thread.metrics || {},
        };
      });
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

        // Get insights for this post
        const postId = post.postId || post.data.id;
        const insights = instagramPostInsights?.find(insight => insight?.postId === postId);

        // Extract metrics from both post data and insights
        const metrics = {
          // From insights data
          impressions: insights?.data?.impressions ?? 0,
          reach: insights?.data?.reach ?? 0,
          shares: insights?.data?.shares ?? 0,
          // From post data (these might be more up-to-date)
          likes: post.data.like_count ?? insights?.data?.likes ?? 0,
          comments: post.data.comments_count ?? insights?.data?.comments ?? 0
        };

        return {
          id: postId,
          platform: 'instagram',
          publishedAt: post.data.timestamp ? new Date(post.data.timestamp).toISOString() : new Date().toISOString(),
          content: {
            text: post.data.caption,
            mediaUrl,
            mediaType: post.data.media_type === 'IMAGE' ? 'image' : post.data.media_type === 'VIDEO' ? 'video' : 'carousel',
            thumbnailUrl: post.data.thumbnail_url,
            permalink: post.data.permalink,
          },
          metrics,
        };
      });
    }
    return [];
  }, [instagramPosts, instagramPostInsights]);

  // Combine all content items
  const allContentItems = useMemo(() => [
    ...mappedYouTubeItems,
    ...mappedGmailItems,
    ...mappedInstagramItems,
  ], [mappedYouTubeItems, mappedGmailItems, mappedInstagramItems]);

  // Platform-specific arrays using mapped items
  const youtubeItemsArray = mappedYouTubeItems;
  const gmailItemsArray = mappedGmailItems;
  const instagramItemsArray = mappedInstagramItems;

  // Filtering by selected platform
  const displayItems = useMemo(() => {
    if (selectedPlatform === 'youtube') return youtubeItemsArray;
    if (selectedPlatform === 'gmail') return gmailItemsArray;
    if (selectedPlatform === 'instagram') return instagramItemsArray;
    return allContentItems;
  }, [selectedPlatform, youtubeItemsArray, gmailItemsArray, instagramItemsArray, allContentItems]);

  const discussContent = async (item: AnyContentItem) => {
    const context = {
      platform: item.platform,
      contentId: item.id,
      analysis: (item as any).aiAnalysis || null,
      title: item.platform === 'youtube'
        ? (item as YouTubeContentItem).content.title
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content?.text
          : (item as GmailContentItem).content?.data.subject,
      thumbnailUrl: item.platform === 'youtube'
        ? (item as YouTubeContentItem).content?.thumbnailUrl || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`
        : item.platform === 'instagram'
          ? (item as InstagramContentItem).content?.mediaUrl
          : undefined,
      publishedAt: item.publishedAt,
      metrics: item.metrics,
      content: item.content
    };
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    router.push(`/dashboard/chat?contentContext=${encodedContext}`);
  };

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
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Platform selection Tabs */}
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setSelectedPlatform(value as PlatformType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Email</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>

            {/* Instagram analytics only for Instagram tab */}
            {selectedPlatform === 'instagram' && userId && (
              <InstagramAnalytics
                userId={userId}
                onDiscussContent={(item) => {
                  discussContent(item);
                }}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {displayItems.length > 0 ? (
                displayItems.map(item => {
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
                  No content found.
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
