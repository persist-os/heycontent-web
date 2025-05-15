import React from 'react';
import { Card } from '@/src/components/ui/card';
import { BarChart3, Instagram, Eye, Users } from 'lucide-react';

import { InstagramContentItem } from '../types';

export interface InstagramCardProps {
  item: InstagramContentItem;
  onDiscussContent: (item: InstagramContentItem) => void;
  onViewDetailedAnalytics: (item: InstagramContentItem) => void;
}

export const InstagramCardPlaceholder: React.FC = () => (
  <Card className="overflow-hidden border-2 border-dashed border-pink-300 dark:border-pink-400 shadow-none bg-pink-50/70 dark:bg-black/30 flex flex-col items-center justify-center aspect-video py-8">
    <Instagram className="w-16 h-16 text-pink-300 opacity-30 mb-4" />
    <div className="text-center text-pink-400 dark:text-pink-200 text-base font-medium">
      No Instagram content yet<br />
      <span className="text-xs text-gray-400">Connect your Instagram to see analytics here.</span>
    </div>
  </Card>
);

export const InstagramCard: React.FC<InstagramCardProps> = ({ item, onDiscussContent, onViewDetailedAnalytics }) => {
  const { content, metrics, publishedAt } = item;
  // @ts-ignore: allow children on content for carousel support
  const children = (item as any)?.children || (item as any)?.content?.children || [];
  const isCarousel = content.mediaType === 'carousel' && Array.isArray(children) && children.length > 0;
  const fallbackImg = '/no-image.png';

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (e.currentTarget.src !== window.location.origin + fallbackImg) {
      e.currentTarget.src = fallbackImg;
    }
  };

  return (
    <Card key={item.id} className="overflow-hidden border-2 border-pink-500 dark:border-pink-400 shadow-lg">
      <div className="relative aspect-video bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100 flex items-center justify-center">
        {isCarousel ? (
          <div className="flex flex-row gap-2 overflow-x-auto w-full h-full">
            {children.filter((c: any) => c.media_type === 'IMAGE').map((child: any, idx: number) => (
              <img
                key={child.id || idx}
                src={child.media_url}
                alt={content.text || `Instagram Carousel Image ${idx + 1}`}
                className="object-cover rounded-lg"
                style={{ width: '100%', maxWidth: 220, height: '100%', aspectRatio: '16/9', objectFit: 'cover' }}
                onError={handleImgError}
              />
            ))}
          </div>
        ) : (
          content.permalink ? (
            <a href={content.permalink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <img
                src={content.mediaUrl || content.thumbnailUrl || fallbackImg}
                alt={content.text || 'Instagram Post'}
                className="w-full h-full object-cover"
                style={{ aspectRatio: '16/9', objectFit: 'cover', borderRadius: '0.5rem' }}
                onError={handleImgError}
              />
            </a>
          ) : (
            <img
              src={content.mediaUrl || content.thumbnailUrl || fallbackImg}
              alt={content.text || 'Instagram Post'}
              className="w-full h-full object-cover"
              style={{ aspectRatio: '16/9', objectFit: 'cover', borderRadius: '0.5rem' }}
              onError={handleImgError}
            />
          )
        )}

        <div className="absolute bottom-2 left-2 bg-white/80 dark:bg-black/60 rounded px-2 py-1 text-xs font-medium capitalize">
          {content.mediaType}
        </div>
        <div className="absolute bottom-2 right-2 bg-white/80 dark:bg-black/60 rounded px-2 py-1 text-xs font-medium">
          {publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{content.text}</h3>
        <div className="flex items-center gap-4 mb-2">
          <span className="flex items-center gap-1 text-pink-500"><Eye className="w-4 h-4" /> {(metrics?.impressions ?? 0).toLocaleString()} Impressions</span>
          <span className="flex items-center gap-1 text-purple-500"><Users className="w-4 h-4" /> {(metrics?.reach ?? 0).toLocaleString()} Reach</span>
        </div>
        <div className="flex items-center gap-4 mb-2 text-sm text-gray-500">
          <span className="flex items-center gap-1 text-gray-500"><BarChart3 className="w-4 h-4" /> {(metrics?.likes ?? 0).toLocaleString()} Likes</span>
        </div>
        <div className="text-xs text-gray-500 mb-2">{(metrics?.comments ?? 0).toLocaleString()} Comments • {(metrics?.shares ?? 0).toLocaleString()} Shares</div>
        <div className="text-sm text-purple-700 dark:text-purple-300 mb-2">
          {/* AI-generated insight placeholder */}
          <b>AI Insight:</b> Best time to post for max engagement is 6-8pm. Your carousel posts get 30% more saves!
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="px-3 py-1 rounded bg-heycontent-purple text-white hover:bg-purple-700 text-xs"
            onClick={() => onViewDetailedAnalytics(item)}
          >
            View Analytics
          </button>
          <button
            className="px-3 py-1 rounded border border-heycontent-purple text-heycontent-purple hover:bg-purple-50 text-xs"
            onClick={() => onDiscussContent(item)}
          >
            Discuss
          </button>
        </div>
      </div>
    </Card>
  );
};
