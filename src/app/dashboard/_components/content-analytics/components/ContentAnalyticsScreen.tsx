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
  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    console.log('🚀 Instagram Analytics fetchData called with:', {
      userId,
      hasInstagramAccount: !!instagramAccountId,
      hasTrackerAnalysis: memoizedTrackerAnalysis !== undefined,
      forceRefresh
    });
    
    // STEP 1: Wait for Instagram account to exist before proceeding
    if (!instagramAccountId) {
      console.log('⚠️ No Instagram account found, skipping analytics fetch');
      setLoading(false);
      setError('No Instagram account connected');
      return;
    }

    // STEP 2: If NOT force refresh, wait for Convex tracker analysis to complete loading
    if (!forceRefresh && memoizedTrackerAnalysis === undefined) {
      console.log('🔄 Tracker analysis still loading from Convex, waiting...');
      setLoading(true); // Keep showing skeleton while waiting
      return;
    }

    setLoading(true);
    setError(null);
    
    // Add minimum loading time to ensure skeleton is visible
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // STEP 3: Check if we have valid cached data from Convex (unless force refresh)
      if (!forceRefresh && memoizedTrackerAnalysis !== undefined) {
        const hasValidData = memoizedTrackerAnalysis && 
          Object.keys(memoizedTrackerAnalysis).length > 0 &&
          (memoizedTrackerAnalysis.last_post || memoizedTrackerAnalysis.posting_frequency || memoizedTrackerAnalysis.media_distribution ||
           (memoizedTrackerAnalysis.content && (memoizedTrackerAnalysis.content.last_post || memoizedTrackerAnalysis.content.posting_frequency || memoizedTrackerAnalysis.content.media_distribution)));
        
        if (hasValidData) {
          await minLoadingTime; // Ensure skeleton shows for at least 200ms
          console.log('✅ Using cached tracker analysis from Convex:', memoizedTrackerAnalysis);
          
          // Extract the content from the tracker analysis if it's nested
          let analysisToSet = memoizedTrackerAnalysis;
          if (memoizedTrackerAnalysis.content && !memoizedTrackerAnalysis.last_post) {
            analysisToSet = memoizedTrackerAnalysis.content;
            console.log('🔧 Extracted content from nested structure:', analysisToSet);
          }
          
          setAnalysis(analysisToSet);
          setLoading(false);
          return; // ✅ SUCCESS - Using Convex data
        } else {
          console.log('⚠️ Tracker analysis from Convex is null or empty, making backend API call');
        }
      }

      // STEP 4: Make backend API call (only if no valid Convex data OR force refresh)
      console.log('🔄 Making backend API call to refresh Instagram data...', { forceRefresh });

      const response = await fetch(`${window.location.origin}/api/social/instagram/full-refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey()}`,
        },
        body: JSON.stringify({
          user_id: userId,
          instagram_account_id: instagramAccountId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Instagram analysis: ${response.statusText}`);
      }

      const data = await response.json();
      await minLoadingTime; // Ensure skeleton shows for at least 200ms
      
      console.log('🔍 Instagram Analytics API Response:', data);
      
      // Process response data
      let analysisToSet = null;
      
      if (data?.status === 'success' && data?.data) {
        if (data.data.content && !data.data.last_post) {
          analysisToSet = data.data.content;
          console.log('✅ Using nested content from API response:', analysisToSet);
        } else {
          analysisToSet = data.data;
          console.log('✅ Using data from API response:', analysisToSet);
        }
      } else if (data?.analysis) {
        if (data.analysis.content) {
          analysisToSet = data.analysis.content;
          console.log('✅ Using analysis.content:', analysisToSet);
        } else {
          analysisToSet = data.analysis;
          console.log('✅ Using direct analysis:', analysisToSet);
        }
      }
      
      if (analysisToSet) {
        setAnalysis(analysisToSet);
        console.log('✅ Successfully set analysis data from API');
      } else {
        console.warn('⚠️ No valid analysis data found in API response');
        setError('No analysis data available');
      }
    } catch (err) {
      await minLoadingTime; // Ensure skeleton shows even on error
      console.error('❌ Instagram analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch Instagram analysis');
    } finally {
      setLoading(false);
    }
  }, [userId, instagramAccountId, memoizedTrackerAnalysis]);

  // Only fetch data when dependencies actually change
  useEffect(() => {
    // Run fetchData when:
    // 1. We have an Instagram account AND
    // 2. Tracker analysis query has completed (either with data or null)
    if (instagramAccountId && memoizedTrackerAnalysis !== undefined) {
      fetchData(false);
    }
  }, [fetchData, instagramAccountId, memoizedTrackerAnalysis]);

  // Reset analysis when userId changes
  useEffect(() => {
    setAnalysis(null);
    setError(null);
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

  // Show skeleton on initial mount, loading, or while render is not complete
  if (loading || !analysis) {
    console.log('💀 Showing skeleton because:', {
      loading,
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
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-heycontent-yellow/10 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-heycontent-yellow/5 via-transparent to-heycontent-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-heycontent-yellow/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <div className="relative p-2 rounded-xl bg-gradient-to-br from-heycontent-yellow/10 to-heycontent-yellow/20 backdrop-blur-sm border border-heycontent-yellow/30">
                    <Calendar className="w-4 h-4 text-heycontent-yellow" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Last Post</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Most recent content</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Date</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{analysis.last_post.date || 'N/A'}</span>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Type</span>
                  <div className="px-2 py-1 bg-gradient-to-r from-heycontent-purple/10 to-heycontent-purple/20 text-heycontent-purple rounded-full text-xs font-semibold border border-heycontent-purple/20 backdrop-blur-sm">
                    {analysis.last_post.type || 'N/A'}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Time Ago</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{analysis.last_post.time_ago || 'N/A'}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Posting Frequency Card */}
        {analysis.posting_frequency && (
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-heycontent-green/10 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-heycontent-green/5 via-transparent to-heycontent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-heycontent-green/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <div className="relative p-2 rounded-xl bg-gradient-to-br from-heycontent-green/10 to-heycontent-green/20 backdrop-blur-sm border border-heycontent-green/30">
                    <Clock className="w-4 h-4 text-heycontent-green" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Posting Frequency</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Content consistency</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center py-3 px-3 bg-gradient-to-br from-heycontent-green/5 to-heycontent-green/10 rounded-xl border border-heycontent-green/20 backdrop-blur-sm">
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Average Days Between Posts</div>
                  <div className="text-2xl font-bold text-heycontent-green mb-2">
                    {analysis.posting_frequency.average_days_between_posts || 'N/A'}
                  </div>
                  <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2 backdrop-blur-sm">
                    <div 
                      className="bg-gradient-to-r from-heycontent-green to-heycontent-green/80 h-2 rounded-full transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${progressBarWidth}%` }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Recent Posts</div>
                    <div className={`text-lg font-bold ${analysis.posting_frequency.has_recent_posts ? 'text-heycontent-green' : 'text-gray-400'}`}>
                      {analysis.posting_frequency.has_recent_posts ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="text-center p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last 7 Days</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {analysis.posting_frequency.total_posts_last_7_days || '0'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Media Distribution Card with Pie Chart */}
        {analysis.media_distribution && mediaDistributionData.length > 0 && (
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:shadow-heycontent-purple/10 transition-all duration-300 hover:scale-[1.01] hover:-translate-y-0.5">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-heycontent-purple/5 via-transparent to-heycontent-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-heycontent-purple/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
                  <div className="relative p-2 rounded-xl bg-gradient-to-br from-heycontent-purple/10 to-heycontent-purple/20 backdrop-blur-sm border border-heycontent-purple/30">
                    <BarChart3 className="w-4 h-4 text-heycontent-purple" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Media Distribution</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Content type breakdown</p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Pie Chart */}
                <div className="relative">
                  <div className="w-24 h-24 lg:w-28 lg:h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mediaDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={45}
                          paddingAngle={1}
                          dataKey="value"
                          onAnimationStart={() => {}}
                          onAnimationEnd={() => {}}
                        >
                          {mediaDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Clean center text for donut chart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">100%</div>
                      <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-1">Total</div>
                    </div>
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex-1 space-y-2 w-full lg:w-auto">
                  {mediaDistributionData.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.value}%</span>
                    </div>
                  ))}
                </div>
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