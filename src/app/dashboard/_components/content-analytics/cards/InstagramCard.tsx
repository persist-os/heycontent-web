import React from 'react';
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
    <Card key={item.id} className="overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {isCarousel ? (
          <div className="flex flex-row gap-2 overflow-x-auto w-full h-full p-2">
            {children.map((child: any, idx: number) => (
              <img
                key={child.id || idx}
                src={child.media_type === 'VIDEO' ? child.thumbnail_url : child.media_url}
                alt={content.text || `Instagram Carousel Item ${idx + 1}`}
                className="object-cover rounded-xl shadow-sm"
                style={{ width: '100%', maxWidth: 220, height: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                onError={handleImgError}
              />
            ))}
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
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white capitalize">
          {content.mediaType}
        </div>
        
        {/* Date Badge */}
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-gray-700">
          {publishedAt ? formatTimestamp(publishedAt) : ''}
        </div>

        {/* Gradient Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-4 line-clamp-2 text-gray-900">{content.text}</h3>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{formatNumber(metrics?.reach)}</div>
              <div className="text-xs text-gray-500">Reach</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-red-100">
              <Heart className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{formatNumber(metrics?.likes)}</div>
              <div className="text-xs text-gray-500">Likes</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-blue-100">
              <Forward className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{formatNumber(metrics?.shares)}</div>
              <div className="text-xs text-gray-500">Shares</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-green-100">
              <MessageSquare className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{formatNumber(metrics?.comments)}</div>
              <div className="text-xs text-gray-500">Comments</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium text-sm hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg hover:shadow-xl"
            onClick={() => onViewDetailedAnalytics(item)}
          >
            View Analytics
          </button>
          
          <button
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium text-sm flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {error && <div className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
      </div>
    </Card>
  );
};