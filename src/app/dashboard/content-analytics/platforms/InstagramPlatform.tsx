'use client'

import React, { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Clock, BarChart3, RefreshCw, Instagram, Settings } from 'lucide-react';
import { InstagramCard } from '../cards/InstagramCard';
import { InstagramModal } from '../modals/InstagramModal';
import { PlatformEmbeddingStatus } from '../components/PlatformEmbeddingStatus';
import { InstagramContentItem, AnyContentItem } from '../types';
import { sortContent } from '../utils';
import CardSkeleton from './components/CardSkeleton';
import PieChartSkeleton from './components/PieChartSkeleton';
import { PlatformConnectionPrompt } from '../../_components/content-hub/PlatformConnectionPrompt';

interface InstagramPlatformProps {
  userId: string;
  items: InstagramContentItem[];
  analysis: any; // Can be more specific if you have the analysis type
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: () => void;
  refreshing: boolean;
  refreshSuccess?: boolean;
  instagramAccount: any; // Can be more specific
}

export function InstagramPlatform({ 
  userId,
  items,
  analysis,
  loading,
  error,
  isConnected,
  refresh,
  refreshing,
  refreshSuccess,
  instagramAccount,
}: InstagramPlatformProps) {
  const router = useRouter();
  const [selectedContent, setSelectedContent] = useState<InstagramContentItem | null>(null);
  
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

  // Check connection status first, before any loading states
  // Show Instagram connect card if no Instagram account found
  if (!isConnected) {
    return (
      <PlatformConnectionPrompt
        platformName="Instagram"
        platformIcon={
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Instagram className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
        }
       description="Connect your Instagram account to view detailed analytics, track content performance, and get insights on your content strategy."
       buttonColor="bg-gradient-to-r from-purple-500 to-pink-500"
       buttonHoverColor="hover:from-purple-600 hover:to-pink-600"
      />
    );
  }

  // Sort items by date
  const displayItems = sortContent(items, 'date');

  const discussContent = async (item: AnyContentItem) => {
    try {
      const context = {
        platform: item.platform,
        contentId: item.id,
        analysis: (item as any).aiAnalysis || null,
        title: (item as InstagramContentItem).content?.text || 'Instagram Post',
        thumbnailUrl: (item as InstagramContentItem).content?.mediaUrl,
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
          title: context.title,
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

  // Show skeleton only when we're loading and have no cached data to display
  const shouldShowSkeleton = loading && !analysis && instagramAccount !== null;
  
  if (shouldShowSkeleton) {
    return (
      <div className="space-y-6 mb-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <Button 
            size="sm" 
            disabled={true}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm ml-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading Analytics...
          </Button>
        </div>

        {/* Loading Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <PieChartSkeleton />
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4 mb-8">
        <p>Error: {error}</p>
        <Button onClick={refresh} className="mt-2">Try Again</Button>
      </div>
    );
  }

  return (
    <>
      {/* Instagram Analytics Section */}
      <div className="space-y-6 mb-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center">
          <div></div> {/* Empty div to push button to the right */}
          <Button 
            size="sm" 
            onClick={refresh}
            disabled={refreshing}
            className="bg-white/80 hover:bg-white border border-gray-200 text-gray-700 hover:text-gray-900 backdrop-blur-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing Instagram...' : 'Refresh Instagram'}
          </Button>
        </div>

        {refreshSuccess && (
          <div className="text-green-500 text-sm mb-2 text-center">Instagram analytics & posts refreshed!</div>
        )}

        {/* Platform Embedding Status */}
        <PlatformEmbeddingStatus 
          platform="instagram" 
          contentCount={displayItems.length} 
          userId={userId} 
        />

        {/* Analytics Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Last Post Card */}
          {analysis?.last_post && (
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
          {analysis?.posting_frequency && (
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
          {analysis?.media_distribution && mediaDistributionData.length > 0 && (
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
                        onAnimationEnd={() => {}}
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
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
        {displayItems.length > 0 ? (
          displayItems.map((item, index) => {
            return (
              <InstagramCard
                key={item.id}
                item={item as InstagramContentItem}
                userId={userId}
                onDiscussContent={() => discussContent(item)}
                onViewDetailedAnalytics={() => setSelectedContent(item as InstagramContentItem)}
              />
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 text-text-gray dark:text-gray-400">
            <div className="space-y-2">
              <p className="text-lg font-medium">No Instagram content found</p>
              <p className="text-sm">
                Connect your Instagram account to see tracker and insights.
              </p>
            </div>
          </div>
        )}
      </div>

      {selectedContent && (
        <InstagramModal
          selectedContent={selectedContent}
          onClose={() => setSelectedContent(null)}
          onDiscussContent={() => discussContent(selectedContent)}
        />
      )}
    </>
  );
} 