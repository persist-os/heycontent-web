import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Users, RefreshCw, MessageSquare, Heart, Forward } from 'lucide-react';

import { InstagramContentItem } from '../types';
import { useInstagramRefresh } from '@/app/hooks/useInstagramRefresh';

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
  const { content, metrics, publishedAt } = item;
  // Access children from the item directly (now passed through from mapping)
  const children = (item as any)?.children || [];
  const isCarousel = content.mediaType === 'carousel' && Array.isArray(children) && children.length > 0;
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

  const { refresh, loading, error } = useInstagramRefresh();

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

  return (
    <Card key={item.id} className="overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-pink-500/25 border-2 border-transparent hover:border-pink-500/30 bg-white dark:bg-gray-800">
      <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {isCarousel ? (
          <div className="relative w-full h-full">
            {children.map((child: any, idx: number) => (
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
                  src={child.media_type === 'VIDEO' ? child.thumbnail_url : child.media_url}
                  alt={content.text || `Instagram Carousel Item ${idx + 1}`}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                  onError={handleImgError}
                />
              </div>
            ))}
            
            {/* Carousel indicators */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2">
              {children.map((_: any, idx: number) => (
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
                src={content.mediaType === 'video' ? content.thumbnailUrl : content.mediaUrl || content.thumbnailUrl || fallbackImg}
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
        
        {/* Date Badge - only show if not carousel (carousel has slide counter) */}
        {!isCarousel && (
          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            {publishedAt ? formatTimestamp(publishedAt) : ''}
          </div>
        )}

        {/* Date Badge for carousel - positioned differently to avoid conflict with slide counter */}
        {isCarousel && (
          <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
            {publishedAt ? formatTimestamp(publishedAt) : ''}
          </div>
        )}

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Instagram className="w-8 h-8 text-[#C13584]" />
          </div>
          <div>
            <h3 className="font-medium text-text-dark dark:text-white line-clamp-2">{content.text}</h3>
            <p className="text-sm text-text-gray dark:text-gray-400">{publishedAt ? formatTimestamp(publishedAt) : ''}</p>
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="p-2 rounded-lg bg-heycontent-light-purple">
              <Users className="w-4 h-4 text-heycontent-purple" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(metrics?.reach)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Reach</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(metrics?.likes)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Forward className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(metrics?.shares)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Shares</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="p-2 rounded-lg bg-heycontent-light-green">
              <MessageSquare className="w-4 h-4 text-heycontent-green" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatNumber(metrics?.comments)}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Comments</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 bg-heycontent-yellow hover:bg-heycontent-yellow/90 text-black px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
            onClick={() => onDiscussContent(item)}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Discuss With Content
          </button>
          
          <button
            className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
            onClick={() => onViewDetailedAnalytics(item)}
          >
            Analytics
          </button>
          
          <button
            className={`relative px-3 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-text-dark dark:text-white`}
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