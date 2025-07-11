import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Users, RefreshCw, MessageSquare, Heart, Forward, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { InstagramContentItem } from '../types';
import { useInstagramRefresh } from '@/app/hooks/useInstagramRefresh';
import { useContentContextActions } from '@/store/content-context-store';

export interface InstagramCardProps {
  item: InstagramContentItem;
  userId: string;
  onDiscussContent: (item: InstagramContentItem) => void;
  onViewDetailedAnalytics: (item: InstagramContentItem) => void;
}

export const InstagramCardPlaceholder: React.FC = () => (
  <Card className="overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl flex flex-col items-center justify-center aspect-video py-8 hover:shadow-xl transition-all duration-300">
    <Instagram className="w-16 h-16 text-gray-300 opacity-50 mb-4" />
    <div className="text-center text-gray-500 text-base font-medium">
      No Instagram content yet<br />
      <span className="text-xs text-gray-400">Connect your Instagram to see analytics here.</span>
    </div>
  </Card>
);

export const InstagramCard: React.FC<InstagramCardProps> = ({ item, userId, onDiscussContent, onViewDetailedAnalytics }) => {
  const { content, metrics, publishedAt, children = [] } = item;
  // Use properly typed children from the item
  const isCarousel = content.mediaType === 'CAROUSEL_ALBUM' && Array.isArray(children) && children.length > 0;
  const fallbackImg = '/no-image.png';

  // Carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect for carousels
  useEffect(() => {
    if (!isCarousel || children.length <= 1) return;

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % children.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(slideInterval);
  }, [isCarousel, children.length]);

  // Create a callback to trigger refetch of posts data
  const handleRefreshComplete = useCallback(() => {
    // This will be called after successful refresh
    // The parent component should handle the refetch
    console.log('🔄 Instagram: Post refresh completed, triggering refetch');
  }, []);

  const { refresh, loading, error } = useInstagramRefresh(handleRefreshComplete);
  const router = useRouter();
  const { setInstagramContext } = useContentContextActions();

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== window.location.origin + fallbackImg) {
      e.currentTarget.src = fallbackImg;
    }
  };

  const handleRefresh = async () => {
    await refresh(item.id, content.permalink || '');
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return num.toLocaleString();
  };

  const formatTimestamp = (timestamp: string) => {
    // Ensure we're working with UTC
    const date = new Date(timestamp);
    // Format in UTC to avoid timezone issues
    return date.toLocaleDateString('en-US', { 
      timeZone: 'UTC',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const renderStat = (label: string, value: number | null | undefined, icon: React.ReactNode, colorClass: string) => {
    if (value === null || value === undefined) {
      return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">N/A</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          </div>
        </div>
      );
    }
    // Show 0 if value is actually 0
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className={`p-2 rounded-lg ${colorClass}`}>{icon}</div>
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        </div>
      </div>
    );
  };

  // Handle discuss content with Zustand store
  const handleDiscussContent = () => {
    // Use the full Convex document if available, otherwise create a fallback
    if (item.convexData) {
      // Use the complete Convex document with all fields
      console.log('🔍 [INSTAGRAM CARD] Using full Convex document:', {
        hasData: !!item.convexData.data,
        dataKeys: item.convexData.data ? Object.keys(item.convexData.data) : 'none',
        hasComments: !!item.convexData.data?.comments,
        commentsLength: item.convexData.data?.comments?.length || 0,
        hasInsights: !!item.convexData.data?.insights,
        insightsKeys: item.convexData.data?.insights ? Object.keys(item.convexData.data.insights) : 'none',
        fullConvexData: item.convexData
      });
      
      setInstagramContext(item.convexData);
    } else {
      // Fallback to creating a mock object (shouldn't happen with proper data)
      console.warn('🔍 [INSTAGRAM CARD] No convexData available, using fallback mock object');
      
      const convexInstagramPost = {
        _id: item.id as any,
        _creationTime: Date.now(),
        userId: userId,
        instagramAccountId: '',
        postId: item.id,
        mediaType: content.mediaType,
        data: {
          id: item.id,
          caption: content.text || '',
          media_url: content.mediaUrl || '',
          permalink: content.permalink || '',
          timestamp: new Date(publishedAt || Date.now()).getTime(),
          username: '',
          like_count: metrics?.likes || metrics?.like_count || 0,
          comments_count: metrics?.comments || metrics?.comments_count || 0,
          thumbnail_url: content.thumbnailUrl || null,
          children: children || null,
          comments: content.comments || [],
          insights: metrics || null,
        },
        analysis: item.analysis || null,
        analysisMarkdown: item.analysisMarkdown || null,
        createdAt: new Date(publishedAt || Date.now()).getTime(),
        updatedAt: Date.now(),
      };

      setInstagramContext(convexInstagramPost as any);
    }
    
    // Navigate to chat
    router.push('/dashboard/chat');
  };

  return (
    <Card key={item.id} className="overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-pink-500/25 border-2 border-transparent hover:border-pink-500/30 bg-white dark:bg-gray-800">
      <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {isCarousel ? (
          <div className="relative w-full h-full">
            {children.map((child, idx: number) => (
              <div
                key={child.id || idx}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  idx === currentSlide 
                    ? 'opacity-100 translate-x-0 scale-100' 
                    : idx < currentSlide 
                      ? 'opacity-0 -translate-x-full scale-95'
                      : 'opacity-0 translate-x-full scale-95'
                }`}
              >
                <img
                  src={child.media_type === 'VIDEO' ? child.thumbnail_url || child.media_url : child.media_url}
                  alt={content.text || `Instagram Carousel Item ${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  onError={handleImgError}
                />
              </div>
            ))}
            
            {/* Carousel indicators */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              {children.map((_, idx: number) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === currentSlide 
                      ? 'bg-white shadow-lg scale-110' 
                      : 'bg-white/50 hover:bg-white/70'
                  }`}
                  onClick={() => setCurrentSlide(idx)}
                />
              ))}
            </div>

            {/* Slide counter */}
            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white">
              {currentSlide + 1} / {children.length}
            </div>
          </div>
                  ) : (
            content.permalink ? (
              <a href={content.permalink} target="_blank" rel="noopener noreferrer" className="block w-full h-full group-hover:scale-105 transition-transform duration-300">
                <img
                  src={content.mediaType === 'VIDEO' || content.mediaType === 'REELS' ? content.thumbnailUrl : content.mediaUrl || content.thumbnailUrl || fallbackImg}
                  alt={content.text || 'Instagram Post'}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  onError={handleImgError}
                />
              </a>
            ) : (
              <img
                src={content.mediaUrl || content.thumbnailUrl || fallbackImg}
                alt={content.text || 'Instagram Post'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                onError={handleImgError}
              />
            )
          )}

        {/* Media Type Badge */}
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white capitalize">
          {content.mediaType}
        </div>
        


        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Instagram className="w-8 h-8 text-[#C13584]" />
          </div>
          <div>
            <h3 className="font-medium text-text-dark dark:text-white line-clamp-2">
              {content.text && content.text.length > 80 
                ? `${content.text.substring(0, 80)}...` 
                : content.text}
            </h3>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metrics && (
            <>
              {metrics.reach !== undefined && renderStat('Reach', metrics.reach, <Users className="w-4 h-4 text-heycontent-purple" />, 'bg-heycontent-light-purple')}
              {metrics.likes !== undefined && renderStat('Likes', metrics.likes, <Heart className="w-4 h-4 text-red-500" />, 'bg-red-100 dark:bg-red-900/30')}
              {metrics.saved !== undefined && renderStat('Saves', metrics.saved, <Forward className="w-4 h-4 text-blue-600" />, 'bg-blue-100 dark:bg-blue-900/30')}
              {metrics.comments !== undefined && renderStat('Comments', metrics.comments, <MessageSquare className="w-4 h-4 text-heycontent-green" />, 'bg-heycontent-light-green')}
            </>
          )}
          {/* Date - always last, takes full width if odd number of items */}
          {publishedAt && (
            <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg ${
              [metrics?.reach, metrics?.likes, metrics?.saved, metrics?.comments].filter(m => m !== undefined).length % 2 === 0 
                ? 'col-span-1' 
                : 'col-span-2'
            }`}>
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatTimestamp(publishedAt)}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Published</div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            onClick={handleDiscussContent}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Discuss With Content
          </button>
          
          <button
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
            onClick={() => onViewDetailedAnalytics(item)}
          >
            Analytics
          </button>
          
          <button
            className={`relative px-2 py-2 rounded-lg font-medium flex items-center gap-1 transition-colors disabled:opacity-50 bg-gray-100 dark:bg-gray-700 text-text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600`}
            onClick={handleRefresh}
            disabled={loading}
            title={error ? `Refresh needed: ${error}` : "Refresh data"}
          >
            {/* Subtle error indicator dot */}
            {error && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            )}
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <RefreshCw className={`w-4 h-4 ${error ? 'text-amber-600 dark:text-amber-400' : ''}`} />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
};