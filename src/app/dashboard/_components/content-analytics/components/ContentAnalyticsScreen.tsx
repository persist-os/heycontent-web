'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getApiKey } from '@/app/lib/api-helpers';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, TrendingUp, BarChart3, RefreshCw } from 'lucide-react';

import { YouTubeCard } from '../cards/YouTubeCard';
import { InstagramCard } from '../cards/InstagramCard';
import { GmailCard } from '../cards/GmailCard';
import { GmailModal } from '../modals/GmailModal';
import { InstagramModal } from '../modals/InstagramModal';
import { YoutubeModal } from '../modals/YoutubeModal';
import { LoadingState } from '../loading/LoadingState';

import {
  AnyContentItem, TimeRange, SortOption, PlatformType,
  EmailTypeFilter as TEmailTypeFilter,
  YouTubeContentItem, InstagramContentItem, GmailContentItem,
  PlatformFilterType
} from '../types';

import { sortAndFilterContent } from '../utils';
import { useAuth } from '@/app/context/auth-context';

// Skeleton Components
const CardSkeleton = memo(() => (
  <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gray-200 animate-pulse">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  </Card>
));

const PieChartSkeleton = memo(() => (
  <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gray-200 animate-pulse">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row items-center justify-between">
      <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 sm:mb-0 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1 sm:ml-4 space-y-3 w-full sm:w-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </Card>
));

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

// Memoized Instagram Analytics Component
const InstagramAnalytics = memo(({ userId, onDiscussContent }: { userId: string; onDiscussContent: (item: InstagramContentItem) => void }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [selectedContent, setSelectedContent] = useState<InstagramContentItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const [skeletonStartTime, setSkeletonStartTime] = useState<number | null>(null);
  const [renderComplete, setRenderComplete] = useState(false);
  const [contentReady, setContentReady] = useState(false);

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

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!instagramAccount) {
      console.log('🚫 [SKELETON DEBUG] No Instagram account, ending skeleton immediately');
      setLoading(false);
      setIsInitialMount(false);
      setRenderComplete(true);
      setContentReady(true);
      return;
    }

    console.log('⏳ [SKELETON DEBUG] Starting fetch, skeleton should be showing...');
    const fetchStartTime = Date.now();
    setLoading(true);
    setRenderComplete(false); // Reset render complete state
    setContentReady(false); // Reset content ready state
    
    // Add minimum loading time to ensure skeleton is visible
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Check if we have data in Convex
      if (trackerAnalysis !== undefined) {
        if (trackerAnalysis) {
          console.log('💾 [SKELETON DEBUG] Found cached Convex data, waiting minimum time...');
          await minLoadingTime; // Ensure skeleton shows for at least 300ms
          const totalTime = Date.now() - fetchStartTime;
          console.log(`✅ [SKELETON DEBUG] Using cached data, skeleton was visible for ${totalTime}ms`);
          setAnalysis(trackerAnalysis);
          setLoading(false);
          setIsInitialMount(false);
          // Don't set renderComplete or contentReady here - let the render finish first
          return;
        }
      }

      console.log('🌐 [SKELETON DEBUG] No cached data, fetching from backend...');
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
      console.log('📊 [SKELETON DEBUG] Received backend data, waiting minimum time...');
      console.log('🔍 [DATA DEBUG] Full backend response:', data);
      console.log('🔍 [DATA DEBUG] Checking data.analysis:', data?.analysis);
      console.log('🔍 [DATA DEBUG] Checking data.analysis.full_analysis:', data?.analysis?.full_analysis);
      console.log('🔍 [DATA DEBUG] Checking data.analysis.full_analysis.content:', data?.analysis?.full_analysis?.content);
      
      await minLoadingTime; // Ensure skeleton shows for at least 200ms
      const totalTime = Date.now() - fetchStartTime;
      console.log(`✅ [SKELETON DEBUG] Backend fetch complete, skeleton was visible for ${totalTime}ms`);
      
      if (data?.analysis?.full_analysis?.content) {
        console.log('✅ [DATA DEBUG] Found expected data structure, setting analysis');
        setAnalysis(data.analysis.full_analysis.content);
      } else if (data?.analysis) {
        console.log('⚠️ [DATA DEBUG] Found data.analysis but not full_analysis.content, trying data.analysis');
        setAnalysis(data.analysis);
      } else if (data?.content) {
        console.log('⚠️ [DATA DEBUG] Found data.content, trying that');
        setAnalysis(data.content);
      } else {
        console.log('❌ [DATA DEBUG] No analysis data found in any expected location');
        console.log('🔍 [DATA DEBUG] Available keys in response:', Object.keys(data || {}));
      }
    } catch (err) {
      console.error('❌ [SKELETON DEBUG] Error occurred:', err);
      await minLoadingTime; // Ensure skeleton shows even on error
      const totalTime = Date.now() - fetchStartTime;
      console.log(`🚫 [SKELETON DEBUG] Error state, skeleton was visible for ${totalTime}ms`);
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
    } finally {
      setLoading(false);
      setIsInitialMount(false);
      // Don't set renderComplete or contentReady here - let the render finish first
    }
  }, [userId, instagramAccount, trackerAnalysis]);

  useEffect(() => {
    console.log('🔄 [SKELETON DEBUG] Instagram Analytics component mounted/updated');
    fetchData();
  }, [fetchData]);

  // Memoized pie chart data calculation
  const mediaDistributionData = useMemo(() => {
    if (!analysis?.media_distribution) {
      console.log('📊 [PIE CHART DEBUG] No media distribution data available');
      return [];
    }
    
    const data = [
      { name: 'Regular Posts', value: parseInt(analysis.media_distribution.regular_post?.replace('%', '') || '0'), color: '#FFDF39' },
      { name: 'Carousels', value: parseInt(analysis.media_distribution.carousel?.replace('%', '') || '0'), color: '#9046FF' },
      { name: 'Reels', value: parseInt(analysis.media_distribution.reel?.replace('%', '') || '0'), color: '#45E290' }
    ].filter(item => item.value > 0);
    
    console.log('🥧 [PIE CHART DEBUG] Pie chart data calculated:', data);
    return data;
  }, [analysis?.media_distribution]);

  // Memoized progress bar width calculation
  const progressBarWidth = useMemo(() => {
    if (!analysis?.posting_frequency?.average_days_between_posts) return 0;
    return Math.max(0, Math.min(100, 100 - ((analysis.posting_frequency.average_days_between_posts || 0) / 365 * 100)));
  }, [analysis?.posting_frequency?.average_days_between_posts]);

  // Track skeleton start time and render completion
  useEffect(() => {
    const shouldShowSkeleton = loading || isInitialMount || !renderComplete || !contentReady;
    
    if (shouldShowSkeleton && !skeletonStartTime) {
      const startTime = Date.now();
      setSkeletonStartTime(startTime);
      console.log('💀 [SKELETON DEBUG] Skeleton started showing at:', new Date(startTime).toLocaleTimeString());
    } else if (!shouldShowSkeleton && skeletonStartTime) {
      const endTime = Date.now();
      const duration = endTime - skeletonStartTime;
      console.log(`💀 [SKELETON DEBUG] Skeleton stopped showing at: ${new Date(endTime).toLocaleTimeString()}, Total duration: ${duration}ms`);
      setSkeletonStartTime(null);
    }
  }, [loading, isInitialMount, renderComplete, contentReady, skeletonStartTime]);

  // Handle render completion
  const handleRenderComplete = useCallback(() => {
    console.log('🎨 [RENDER DEBUG] Render complete - hiding skeleton');
    setRenderComplete(true);
    setContentReady(true);
  }, []);

  // Set content ready and render complete after analysis is available
  useEffect(() => {
    if (!loading && !isInitialMount && analysis) {
      if (!analysis.media_distribution || mediaDistributionData.length === 0) {
        // No pie chart to wait for, set content ready after short delay
        console.log('🎨 [RENDER DEBUG] No pie chart - setting content ready after delay');
        const timer = setTimeout(() => {
          setContentReady(true);
          handleRenderComplete();
        }, 100);
        return () => clearTimeout(timer);
      } else {
        // Has pie chart - set content ready immediately, but wait for animation to complete for renderComplete
        console.log('🎨 [RENDER DEBUG] Has pie chart - setting content ready, waiting for animation');
        setContentReady(true);
      }
    }
  }, [loading, isInitialMount, analysis, mediaDistributionData.length, handleRenderComplete]);

  // Show skeleton on initial mount, loading, or while render is not complete
  if (loading || isInitialMount || !renderComplete || !contentReady) {
    console.log('💀 [SKELETON DEBUG] Rendering skeleton - loading:', loading, 'isInitialMount:', isInitialMount, 'renderComplete:', renderComplete, 'contentReady:', contentReady);
    return (
      <div className="space-y-6 mb-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            onClick={fetchData} 
            disabled={loading}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Refreshing...
          </Button>
        </div>

        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <PieChartSkeleton />
        </div>
      </div>
    );
  }

  // Show loading state while waiting for Instagram account to load
  if (instagramAccount === undefined) {
    console.log('⏳ [SKELETON DEBUG] Waiting for Instagram account to load...');
    return (
      <div className="space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            disabled={true}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading account...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <PieChartSkeleton />
        </div>
      </div>
    );
  }

  // Show error if no Instagram account found
  if (instagramAccount === null) {
    console.log('❌ [SKELETON DEBUG] No Instagram account found');
    return (
      <div className="text-center text-gray-500 p-4 mb-8">
        <p>No Instagram account connected</p>
        <p className="text-sm text-gray-400 mt-2">Please connect your Instagram account to view analytics</p>
      </div>
    );
  }

  // Show loading state while waiting for tracker analysis query to complete
  if (trackerAnalysis === undefined) {
    console.log('⏳ [SKELETON DEBUG] Waiting for tracker analysis query to complete...');
    return (
      <div className="space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            disabled={true}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading analytics...
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <PieChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    console.log('❌ [SKELETON DEBUG] Rendering error state');
    return (
      <div className="text-center text-red-500 p-4 mb-8">
        <p>Error: {error}</p>
        <Button onClick={fetchData} className="mt-2">Try Again</Button>
      </div>
    );
  }

  if (!analysis) {
    console.log('⚠️ [SKELETON DEBUG] Rendering no data state');
    return (
      <div className="text-center text-gray-500 p-4 mb-8">
        <p>No Instagram analysis available</p>
        <Button onClick={fetchData} className="mt-2">Load Analytics</Button>
      </div>
    );
  }

  console.log('✨ [SKELETON DEBUG] Rendering actual content with analysis data');
  return (
    <div className="space-y-6 mb-8">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div></div> {/* Empty div to push button to the right */}
        <Button 
          size="sm" 
          onClick={fetchData} 
          disabled={loading}
          className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Last Post Card */}
        {analysis.last_post && (
          <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-heycontent-yellow/20">
                  <Calendar className="w-5 h-5 text-heycontent-yellow" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Last Post</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Date</span>
                <span className="font-medium text-gray-900">{analysis.last_post.date || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Type</span>
                <span className="px-2 py-1 bg-heycontent-purple/10 text-heycontent-purple rounded-lg text-sm font-medium">
                  {analysis.last_post.type || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Time Ago</span>
                <span className="font-medium text-gray-900">{analysis.last_post.time_ago || 'N/A'}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Posting Frequency Card */}
        {analysis.posting_frequency && (
          <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-heycontent-green/20">
                  <Clock className="w-5 h-5 text-heycontent-green" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Posting Frequency</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Average Days Between Posts</span>
                  <span className="text-2xl font-bold text-heycontent-green">
                    {analysis.posting_frequency.average_days_between_posts || 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-heycontent-green h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressBarWidth}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <div className="text-sm text-gray-600">Recent Posts</div>
                  <div className={`text-lg font-semibold ${analysis.posting_frequency.has_recent_posts ? 'text-heycontent-green' : 'text-gray-400'}`}>
                    {analysis.posting_frequency.has_recent_posts ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-xl">
                  <div className="text-sm text-gray-600">Last 7 Days</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {analysis.posting_frequency.total_posts_last_7_days || '0'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Media Distribution Card with Pie Chart */}
        {analysis.media_distribution && mediaDistributionData.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-heycontent-purple/20">
                  <BarChart3 className="w-5 h-5 text-heycontent-purple" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Media Distribution</h3>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between">
              {/* Pie Chart */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 sm:mb-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={mediaDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={15}
                      outerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                      onAnimationStart={() => console.log('🥧 [PIE CHART DEBUG] Pie chart animation started')}
                      onAnimationEnd={() => {
                        console.log('🥧 [PIE CHART DEBUG] Pie chart animation completed');
                        handleRenderComplete();
                      }}
                    >
                      {mediaDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="flex-1 sm:ml-4 space-y-3 w-full sm:w-auto">
                {mediaDistributionData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {selectedContent && (
        <InstagramModal
          selectedContent={selectedContent}
          onClose={() => setShowModal(false)}
          onDiscussContent={onDiscussContent}
        />
      )}
    </div>
  );
});

InstagramAnalytics.displayName = 'InstagramAnalytics';

export function ContentAnalyticsScreen() {
  const { firebaseUser, authLoading } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  // Restore platform selection filter
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('all');
  const [selectedContent, setSelectedContent] = useState<AnyContentItem | null>(null);
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Handle tab switching with immediate skeleton
  const handlePlatformChange = useCallback((value: PlatformType) => {
    console.log('🔄 [TAB DEBUG] Switching to platform:', value);
    
    if (value === 'instagram') {
      console.log('💀 [TAB DEBUG] Switching to Instagram - showing immediate skeleton');
      setIsTabSwitching(true);
      
      // Show skeleton for minimum time, then let component take over
      setTimeout(() => {
        console.log('💀 [TAB DEBUG] Tab switching skeleton timeout - letting component take over');
        setIsTabSwitching(false);
      }, 600); // Show for 600ms minimum
    }
    
    setSelectedPlatform(value);
  }, []);

  // Convex queries (never skip, just allow undefined)
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    userId ? { userId } : undefined
  );
  const gmailThreads = useQuery(
    api.gmailQueries.listUserGmailThreads,
    userId ? { userId } : undefined
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
          // Include children array for carousel posts
          children: post.data.children || [],
        };
      });
    }
    return [];
  }, [instagramPosts, instagramPostInsights]);

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
          <Tabs defaultValue="all" className="w-full" onValueChange={(value) => handlePlatformChange(value as PlatformType)}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Platforms</TabsTrigger>
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="instagram">Instagram</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
            </TabsList>

            {/* Instagram analytics only for Instagram tab */}
            {selectedPlatform === 'instagram' && userId && (
              <>
                {isTabSwitching ? (
                  <div className="space-y-6 mb-8">
                    <div className="flex justify-between items-center">
                      <Button 
                        size="sm" 
                        disabled={true}
                        className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
                      >
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <CardSkeleton />
                      <CardSkeleton />
                      <PieChartSkeleton />
                    </div>
                  </div>
                ) : (
                  <InstagramAnalytics
                    key={`instagram-${selectedPlatform}-${Date.now()}`}
                    userId={userId}
                    onDiscussContent={(item) => {
                      discussContent(item);
                    }}
                  />
                )}
              </>
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