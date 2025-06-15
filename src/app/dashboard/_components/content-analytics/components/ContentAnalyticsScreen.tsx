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

import { sortAndFilterContent, sortContent } from '../utils';
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
  const [hasDataFetched, setHasDataFetched] = useState(false);

  // Get Instagram account data from Convex
  const instagramAccount = useQuery(api.instagramQueries.getInstagramAccount, { userId });

  // Get Instagram tracker analysis from Convex
  const trackerAnalysis = useQuery(
    api.instagramQueries.getInstagramTrackerAnalysis,
    instagramAccount?.instagramAccountId ? {
      userId,
      instagramAccountId: instagramAccount.instagramAccountId
    } : "skip"
  );

  // Memoize the Instagram account ID to prevent unnecessary re-renders
  const instagramAccountId = useMemo(() => instagramAccount?.instagramAccountId, [instagramAccount?.instagramAccountId]);
  
  // Memoize tracker analysis to prevent unnecessary re-renders
  const memoizedTrackerAnalysis = useMemo(() => trackerAnalysis, [trackerAnalysis]);

  // Memoized fetch function with stable dependencies
  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (hasDataFetched && !isInitialMount) {
      console.log('🛑 Data already fetched, skipping duplicate call');
      return;
    }

    console.log('🚀 Instagram Analytics fetchData called with:', {
      userId,
      hasInstagramAccount: !!instagramAccountId,
      hasTrackerAnalysis: memoizedTrackerAnalysis !== undefined,
      hasDataFetched

    });
    
    if (!instagramAccountId) {
      console.log('⚠️ No Instagram account found, skipping analytics fetch');
      setLoading(false);
      setIsInitialMount(false);
      setRenderComplete(true);
      setContentReady(true);
      setHasDataFetched(true);
      return;
    }

    const fetchStartTime = Date.now();
    setLoading(true);
    setRenderComplete(false);
    setContentReady(false);
    
    // Add minimum loading time to ensure skeleton is visible
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));
    
    try {

      // Enhanced Convex data validation - check if we have meaningful data for this specific account
      if (trackerAnalysis !== undefined && !forceRefresh) {
        const hasValidData = trackerAnalysis && 
          Object.keys(trackerAnalysis).length > 0 &&
          (trackerAnalysis.last_post || trackerAnalysis.posting_frequency || trackerAnalysis.media_distribution ||
           (trackerAnalysis.content && (trackerAnalysis.content.last_post || trackerAnalysis.content.posting_frequency || trackerAnalysis.content.media_distribution)));
        
        if (hasValidData) {
          await minLoadingTime; // Ensure skeleton shows for at least 200ms
          console.log('✅ Using cached tracker analysis from Convex:', trackerAnalysis);
          
          // Extract the content from the tracker analysis if it's nested
          let analysisToSet = memoizedTrackerAnalysis;
          if (memoizedTrackerAnalysis.content && !memoizedTrackerAnalysis.last_post) {
            analysisToSet = memoizedTrackerAnalysis.content;
            console.log('🔧 Extracted content from nested structure:', analysisToSet);
          }
          
          setAnalysis(analysisToSet);
          setLoading(false);
          setIsInitialMount(false);
          setHasDataFetched(true);
          setRenderComplete(true);
          setContentReady(true);
          return; // ✅ RETURN EARLY - Don't make API call when cached data exists

        } else {
          console.log('⚠️ Tracker analysis from Convex is null, empty, or lacks meaningful data, falling back to API call');
        }
      } else if (!forceRefresh) {
        console.log('🔄 Tracker analysis still loading from Convex...');

        // Don't make API call while Convex is still loading, unless it's a forced refresh
        setLoading(false);
        setIsInitialMount(false);
        return;
      }

      // Only make API call if:
      // 1. forceRefresh is true (refresh button clicked), OR
      // 2. No valid cached data exists
      console.log('🔄 Making API call to refresh Instagram data...', { forceRefresh, hasValidCachedData: false });

      // Enhanced refresh: Call full-profile-collect to refresh both analytics and posts
      const response = await fetch(`${window.location.origin}/api/social/instagram/full-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey()}`,
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccount.instagramAccountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram analysis: ${response.statusText}`);
      }

      const data = await response.json();
      
      await minLoadingTime;

      await minLoadingTime; // Ensure skeleton shows for at least 200ms

      
      console.log('🔍 Instagram Analytics API Response Debug:', {
        fullResponse: data,
        hasAnalysis: !!data?.analysis,
        hasData: !!data?.data,
        hasContent: !!data?.content
      });
      
      // Fixed response processing logic
      let analysisToSet = null;
      
      if (data?.status === 'success' && data?.data) {
        if (data.data.content && !data.data.last_post) {
          analysisToSet = data.data.content;
          console.log('✅ Using nested content from status.success response:', analysisToSet);
        } else {
          analysisToSet = data.data;
          console.log('✅ Using data from status.success response:', analysisToSet);
        }
      } else if (data?.analysis) {
        if (data.analysis.full_analysis?.content) {
          analysisToSet = data.analysis.full_analysis.content;
          console.log('✅ Using nested full_analysis.content:', analysisToSet);
        } else if (data.analysis.content) {
          analysisToSet = data.analysis.content;
          console.log('✅ Using analysis.content:', analysisToSet);
        } else {
          analysisToSet = data.analysis;
          console.log('✅ Using direct analysis:', analysisToSet);
        }
      } else if (data?.content) {
        analysisToSet = data.content;
        console.log('✅ Using direct content:', analysisToSet);
      }
      
      if (analysisToSet) {
        setAnalysis(analysisToSet);
        console.log('✅ Successfully set analysis data');
      } else {
        console.warn('⚠️ No valid analysis data found in response');
        setError('No analysis data available');
      }
    } catch (err) {

      await minLoadingTime; // Ensure skeleton shows even on error
      console.error('❌ Instagram analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
    } finally {
      setLoading(false);
      setIsInitialMount(false);
      setHasDataFetched(true);

      setRenderComplete(true);
      setContentReady(true);

    }
  }, [userId, instagramAccountId, memoizedTrackerAnalysis, hasDataFetched, isInitialMount]);

  // Only fetch data when dependencies actually change
  useEffect(() => {

    if (!hasDataFetched || isInitialMount) {
      fetchData();
    }
  }, [fetchData, hasDataFetched, isInitialMount]);

  // Reset hasDataFetched when userId changes
  useEffect(() => {
    setHasDataFetched(false);
    setIsInitialMount(true);
  }, [userId]);


  // Memoized pie chart data calculation
  const mediaDistributionData = useMemo(() => {
    if (!analysis?.media_distribution) {
      return [];
    }
    
    const data = [
      { name: 'Regular Posts', value: parseInt(analysis.media_distribution.regular_post?.replace('%', '') || '0'), color: '#FFDF39' },
      { name: 'Carousels', value: parseInt(analysis.media_distribution.carousel?.replace('%', '') || '0'), color: '#9046FF' },
      { name: 'Reels', value: parseInt(analysis.media_distribution.reel?.replace('%', '') || '0'), color: '#45E290' }
    ].filter(item => item.value > 0);
    
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
    } else if (!shouldShowSkeleton && skeletonStartTime) {
      const endTime = Date.now();
      const duration = endTime - skeletonStartTime;
      setSkeletonStartTime(null);
    }
  }, [loading, isInitialMount, renderComplete, contentReady, skeletonStartTime]);

  // Handle render completion
  const handleRenderComplete = useCallback(() => {
    setRenderComplete(true);
    setContentReady(true);
  }, []);

  // Set content ready and render complete after analysis is available
  useEffect(() => {
    console.log('🎯 Render completion check:', {
      loading,
      isInitialMount,
      hasAnalysis: !!analysis,
      analysisKeys: analysis ? Object.keys(analysis) : null,
      mediaDistributionLength: mediaDistributionData.length,
      currentContentReady: contentReady,
      currentRenderComplete: renderComplete
    });
    
    if (!loading && !isInitialMount && analysis) {
      console.log('🚀 Setting content ready and render complete');
      setContentReady(true);
      setRenderComplete(true);
    }
  }, [loading, isInitialMount, analysis, mediaDistributionData.length, contentReady, renderComplete]);

  // Show skeleton on initial mount, loading, or while render is not complete
  if (loading || isInitialMount || !renderComplete || !contentReady) {
    console.log('💀 Showing skeleton because:', {
      loading,
      isInitialMount,
      renderComplete,
      contentReady,
      hasAnalysis: !!analysis,
      analysisStructure: analysis ? {
        hasLastPost: !!analysis.last_post,
        hasPostingFrequency: !!analysis.posting_frequency,
        hasMediaDistribution: !!analysis.media_distribution
      } : null
    });
    
    return (
      <div className="space-y-6 mb-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            onClick={() => fetchData(true)}
            disabled={loading}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Refreshing Analytics & Posts...
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
    return (
      <div className="space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            disabled={true}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading Analytics & Posts...
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
    return (
      <div className="text-center text-gray-500 p-4 mb-8">
        <p>No Instagram account connected</p>
        <p className="text-sm text-gray-400 mt-2">Please connect your Instagram account to view analytics</p>
      </div>
    );
  }

  // Show loading state while waiting for tracker analysis query to complete
  if (trackerAnalysis === undefined) {
    return (
      <div className="space-y-6 mb-8">
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            disabled={true}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading Analytics & Posts...
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
    return (
      <div className="text-center text-red-500 p-4 mb-8">
        <p>Error: {error}</p>
        <Button onClick={() => fetchData(true)} className="mt-2">Try Again</Button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center text-gray-500 p-4 mb-8">
        <p>No Instagram analysis available</p>
        <Button onClick={() => fetchData(true)} className="mt-2">Load Analytics</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Header with Refresh Button */}
      <div className="flex justify-between items-center">
        <div></div> {/* Empty div to push button to the right */}
        <Button 
          size="sm" 
          onClick={() => fetchData(true)}
          disabled={loading}
          className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing Analytics & Posts...' : 'Refresh Analytics & Posts'}
        </Button>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        
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
                      onAnimationStart={() => {}}
                      onAnimationEnd={() => {
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
  const [loadingDiscuss, setLoadingDiscuss] = useState(false);

  if (!firebaseUser || !userId) {
    return <LoadingState type="auth" />;
  }
  const [isTabSwitching, setIsTabSwitching] = useState(false);

  // Handle tab switching with immediate skeleton
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

  // Convex queries (never skip, just allow undefined)
  const youtubeVideos = useQuery(
    api.youtubeQueries.listUserYouTubeVideos,
    { userId }
  );
  const gmailThreads = useQuery(
    api.gmailQueries.getGmailThreadsWithMessages,
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

  // Map YouTube items - using the correctly structured data from listUserYouTubeVideos query
  const mappedYouTubeItems: YouTubeContentItem[] = useMemo(() => {
    if (youtubeVideos && Array.isArray(youtubeVideos)) {
      return youtubeVideos.map((video: any) => ({
        id: `youtube-${video.id || ''}`,
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
      gmailThreads.forEach((thread: any, threadIndex: number) => {
        if (thread.analysis && Array.isArray(thread.analysis.important_emails)) {
          thread.analysis.important_emails.forEach((email: any, emailIndex: number) => {
            const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
            // Ensure unique ID by prefixing with 'important-' and including indices
            const uniqueId = `gmail-important-${thread.threadId || thread._id || thread.id}-${emailIndex}`;
            importantEmails.push({
              id: uniqueId,
              platform: 'gmail',
              publishedAt: getReceivedDate(email, thread),
              content: {
                data: {
                  subject: email.subject || thread.data?.subject || thread.subject || 'No Subject',
                  snippet: email.snippet || thread.data?.snippet || thread.snippet || 'No preview available',
                  from: email.sender || thread.data?.from || thread.from || 'Unknown Sender',
                  emailType: email.emailType || 'important',
                  threadId: thread.threadId,
                  emailId: firstMessage?.messageId || firstMessage?.id,
                }
              },
              metrics: email.metrics || {},
            });
          });
        }
      });
      if (importantEmails.length > 0) return importantEmails;
      
      // Use the enhanced data structure from getGmailThreadsWithMessages
      return gmailThreads.map((thread: any, index: number): GmailContentItem => {
        // Handle different data structures:
        // 1. thread.data.messages[0] (for gmailThreads with messages array)
        // 2. thread.data (for individual gmailMessages)
        // 3. Direct thread properties (fallback)
        
        let emailData = null;
        
        // Check if thread has data.messages array (from gmailThreads)
        if (thread.data?.messages && Array.isArray(thread.data.messages) && thread.data.messages.length > 0) {
          emailData = thread.data.messages[0]; // Get first message from thread
        }
        // Check if thread.data has direct email properties (from gmailMessages)
        else if (thread.data?.subject || thread.data?.from) {
          emailData = thread.data;
        }
        // Fallback to thread.messages if available
        else if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
          emailData = thread.messages[0];
        }
        
        // Extract data with proper fallbacks
        const subject = emailData?.subject || 
                       thread.subject || 
                       'No Subject';
                       
        const snippet = emailData?.snippet || 
                       emailData?.body || // Sometimes body contains the snippet
                       thread.snippet || 
                       'No preview available';
                       
        const from = emailData?.from || 
                    thread.from || 
                    'Unknown Sender';
                    
        // Get thread ID and message count
        const threadId = thread.threadId || thread.data?.threadId || thread.data?.id || thread._id;
        const messageCount = thread.data?.messages?.length || thread.messages?.length || 1;
        
        // Ensure unique ID
        const uniqueId = `gmail-${threadId || `thread-${thread._id || thread.id || index}`}`;
        
        return {
          id: uniqueId,
          platform: 'gmail',
          publishedAt: getReceivedDate(emailData, thread),
          content: {
            data: {
              subject: subject,
              snippet: snippet, 
              from: from,
              emailType: emailData?.emailType || 'all',
              threadId: threadId,
              emailId: emailData?.messageId || emailData?.id || threadId,
              messageCount: messageCount,
              messages: thread.data?.messages || thread.messages || [],
            }
          },
          metrics: thread.metrics || { replies: Math.max(0, messageCount - 1) },
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
          id: `instagram-${postId}`,
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
    let items: AnyContentItem[] = [];
    
    if (selectedPlatform === 'youtube') {
      items = youtubeItemsArray;
    } else if (selectedPlatform === 'gmail') {
      items = gmailItemsArray;
    } else if (selectedPlatform === 'instagram') {
      items = instagramItemsArray;
    } else {
      items = allContentItems;
    }
    
    // Apply only date sorting without additional filtering since we already filtered by platform above
    return sortContent(items, 'date');
  }, [selectedPlatform, youtubeItemsArray, gmailItemsArray, instagramItemsArray, allContentItems]);

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
                        Loading Analytics & Posts...
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
                    key={`instagram-${selectedPlatform}`}
                    userId={userId}
                    onDiscussContent={(item) => {
                      discussContent(item);
                    }}
                  />
                )}
              </>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
              {displayItems.length > 0 ? (
                displayItems.map((item, index) => {
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
                  {selectedPlatform === 'gmail' ? (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">No Gmail content found</p>
                      <p className="text-sm">Connect your Gmail account to see email analytics and insights.</p>
                      <p className="text-xs text-gray-500">
                        Only meaningful emails are stored and displayed for better content analysis.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium">No content found</p>
                      <p className="text-sm">
                        {selectedPlatform === 'all' 
                          ? 'Connect your social media accounts to see content analytics.'
                          : `Connect your ${selectedPlatform} account to see analytics and insights.`
                        }
                      </p>
                    </div>
                  )}
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