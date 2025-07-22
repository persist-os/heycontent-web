"use client";

import React, { useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { Instagram, Sparkles, MessageCircle, User, Heart, Info, ExternalLink, Eye, Users, Calendar, Bookmark, Share2 } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InstagramContent } from '../../content/InstagramContent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatDate } from '@/lib/content-utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InstagramOverlayProps {
  postId: string;
  onClose: () => void;
  showAnalysis?: boolean;
  hideDiscussButton?: boolean;
}

// Skeleton loading component
const InstagramSkeletonLoader = ({ onClose }: { onClose: () => void }) => (
  <ContentOverlay
    onClose={onClose}
    title="Loading Instagram Post..."
    subtitle={
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            Instagram Post
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-pink-500 rounded-full" />
            <Skeleton className="h-4 w-12" />
          </span>
        </div>
      </div>
    }
    icon={<Instagram className="w-8 h-8 text-pink-500" />}
  >
    <div className="space-y-6">
      {/* Media skeleton */}
      <div className="relative">
        <Skeleton className="w-full aspect-square rounded-lg" />
      </div>
      
      {/* Caption skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center space-y-1">
            <Skeleton className="h-6 w-8 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>
      
      {/* Analysis skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  </ContentOverlay>
);

// Error component with human-friendly messaging
const ErrorState = ({ onClose, error }: { onClose: () => void; error?: string }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 text-center">
      <div className="flex justify-center mb-4">
        <Sparkles className="w-12 h-12 text-pink-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Your content is being a little camera-shy!</h3>
      <p className="text-muted-foreground mb-4">
        {error === "Invalid post data received" 
          ? "We couldn't find that specific Instagram post, but that's perfectly fine! Your next viral moment might be just around the corner."
          : error === "Post contains no viewable content" 
          ? "This post seems to be taking a social media break. No worries—every creator has those mysterious posts that keep us guessing!"
          : "Even the most picture-perfect feeds have their quirky moments. Thanks for being patient while we figure this one out!"
        }
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        ✨ <strong>Creator spark:</strong> While you're here, think about what kind of content makes your audience stop scrolling. Those insights are pure gold!
      </p>
      <Button onClick={onClose} className="w-full">
        Keep Shining! 🌟
      </Button>
    </div>
  </div>
);

export const InstagramOverlay: React.FC<InstagramOverlayProps> = ({
  postId,
  onClose,
  showAnalysis = true,
  hideDiscussButton = false
}) => {
  const userId = getCurrentUserId();
  const [refreshKey, setRefreshKey] = useState(0);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
  const [infoOpen, setInfoOpen] = useState(false);

  // Always use Convex query for the post and its analysis
  const post = useQuery(api.instagramQueries.getInstagramPost, 
    userId && postId ? { postId, userId } : "skip"
  );

  // Callback to handle analysis generation - this will trigger a re-render if needed
  const handleAnalysisGenerated = useCallback(() => {
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 2000);
  }, []);

  // Handle loading state with skeleton
  if (!post) {
    return <InstagramSkeletonLoader onClose={onClose} />;
  }

  // Handle error state - check if post data is invalid
  if (!post.postId && !post.data) {
    return <ErrorState onClose={onClose} error="Invalid post data received" />;
  }

  // Extract and validate core data with proper null safety
  const postData = post.data || {};
  const caption = postData.caption || '';
  const mediaUrl = postData.media_url || '';
  const thumbnailUrl = postData.thumbnail_url || '';
  const permalink = postData.permalink || `https://www.instagram.com/p/${postId}`;
  const createdAt = postData.timestamp || post.createdAt || Date.now();
  const mediaType = post.mediaType || 'image';
  const insights = postData.insights || {};
  const likeCount = postData.like_count || 0;
  const commentsCount = postData.comments_count || 0;
  const hasInsights = insights && Object.keys(insights).length > 0 && (
    insights.reach !== undefined || insights.impressions !== undefined || insights.saved !== undefined
  );
  const statistics = {
    likes: insights.likes ?? likeCount,
    comments: insights.comments ?? commentsCount,
    reach: insights.reach ?? 0,
    impressions: insights.impressions ?? 0,
    saved: insights.saved ?? 0,
    shares: insights.shares ?? 0
  };
  if (!caption && !mediaUrl && !thumbnailUrl) {
    return <ErrorState onClose={onClose} error="Post contains no viewable content" />;
  }
  const comments = postData.comments || [];
  const displayComments = comments.slice(0, visibleCommentsCount);
  const hasMoreComments = comments.length > visibleCommentsCount;
  const commentsToLoad = Math.min(10, comments.length - visibleCommentsCount);
  const normalizedPostData = {
    id: `instagram:${postId}`,
    title: caption.length > 80 ? caption.substring(0, 80) + '...' : caption || 'Instagram Post',
    type: 'instagram',
    contentType: mediaType.toLowerCase(),
    platform: 'instagram',
    createdAt,
    important: false,
    tags: [],
    analysis: post.analysis || null,
    analysisMarkdown: post.analysisMarkdown || null,
    mediaUrl,
    thumbnailUrl,
    insights,
    statistics,
    data: {
      media_url: mediaUrl,
      thumbnail_url: thumbnailUrl,
      caption,
      insights,
      like_count: likeCount,
      comments_count: commentsCount,
      permalink,
      comments: comments
    },
    mediaType,
    permalink
  };
  return (
    <ContentOverlay
      onClose={onClose}
      title={normalizedPostData.title}
      subtitle={
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              Instagram Post
            </span>
            {mediaType && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
                {mediaType.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      }
      icon={<Instagram className="w-8 h-8 text-pink-500" />}
    >
      <div className="space-y-6">
        {/* Media Section */}
        <div className="relative rounded-xl overflow-hidden group">
          <div className="aspect-square lg:aspect-auto lg:min-h-[400px]">
            <img
              src={thumbnailUrl || mediaUrl}
              alt={normalizedPostData.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => window.open(permalink, '_blank')}
            />
            {/* Hover Overlay */}
            <div 
              className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => window.open(permalink, '_blank')}
            >
              <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-4 shadow-lg">
                <ExternalLink className="w-6 h-6 text-gray-900 dark:text-white" />
              </div>
            </div>
            {/* Media Type Badge */}
            {mediaType && (
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-white">
                {mediaType.replace('_', ' ')}
              </div>
            )}
          </div>
        </div>

        {/* Statistics Section - Compact Row */}
        {hasInsights ? (
          // Full statistics when insights are available
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm mt-4 mb-2 px-4 py-2 flex flex-wrap items-center justify-between gap-2 bg-background/80">
            {Object.entries(statistics).map(([key, value]) => (
              <div key={key} className="flex flex-col items-center min-w-[70px]">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1 bg-muted">
                  {key === 'likes' && <Heart className="w-4 h-4 text-red-500" />}
                  {key === 'comments' && <MessageCircle className="w-4 h-4 text-blue-500" />}
                  {key === 'impressions' && <Eye className="w-4 h-4 text-green-500" />}
                  {key === 'reach' && <Users className="w-4 h-4 text-purple-500" />}
                  {key === 'saved' && <Bookmark className="w-4 h-4 text-yellow-500" />}
                  {key === 'shares' && <Share2 className="w-4 h-4 text-indigo-500" />}
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {value === null || value === undefined ? 'N/A' : value.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
              </div>
            ))}
            {/* Date at the end */}
            {createdAt && (
              <div className="flex flex-col items-center min-w-[90px]">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1 bg-orange-100 dark:bg-orange-900/30">
                  <Calendar className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {new Date(createdAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">Published</div>
              </div>
            )}
          </div>
        ) : (
          // Fallback when insights are not available
          <div className="rounded-xl border-2 border-amber-200 dark:border-amber-700 shadow-sm mt-4 mb-2 px-4 py-3 bg-amber-50/50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 mt-0.5">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                  🔍 Detailed insights are loading...
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                  We're fetching detailed analytics for this post. This might take a moment, or insights may be unavailable for older posts. Check back later for reach, impressions, and saves data!
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ✨ Good news: You can still generate AI analysis with the data we have!
                </p>
              </div>
            </div>
            
            {/* Show basic metrics that are available */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-amber-200 dark:border-amber-700">
              {/* Likes */}
              <div className="flex flex-col items-center min-w-[70px]">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1 bg-red-100 dark:bg-red-900/30">
                  <Heart className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {likeCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
              
              {/* Comments */}
              <div className="flex flex-col items-center min-w-[70px]">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1 bg-blue-100 dark:bg-blue-900/30">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {commentsCount.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Comments</div>
              </div>
              
              {/* Date */}
              {createdAt && (
                <div className="flex flex-col items-center min-w-[90px]">
                  <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg mb-1 bg-orange-100 dark:bg-orange-900/30">
                    <Calendar className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {new Date(createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Published</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments Section */}
        {comments.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </CardTitle>
                <TooltipProvider>
                  <Popover open={infoOpen} onOpenChange={setInfoOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            tabIndex={0}
                            className="focus:outline-none"
                            onClick={() => setInfoOpen((v) => !v)}
                            aria-label="Comments info"
                          >
                            <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                          </button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Some usernames may be hidden due to Meta's privacy policy.</p>
                      </TooltipContent>
                    </Tooltip>
                    <PopoverContent side="right" align="start" className="p-2 text-xs max-w-xs min-w-[180px]">
                      <div className="flex items-center justify-between gap-2">
                        <span>Some usernames may be hidden due to Meta's privacy policy.</span>
                        <button onClick={() => setInfoOpen(false)} className="ml-2 text-muted-foreground hover:text-foreground text-xs font-bold">✕</button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {displayComments.map((comment: any, index: number) => (
                  <div key={comment.id || index} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                    <div className="flex-shrink-0">
                      <User className="w-8 h-8 text-muted-foreground bg-muted rounded-full p-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.username || 'Anonymous'}
                        </span>
                        {comment.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comment.timestamp)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{comment.text}</p>
                      {comment.like_count > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Heart className="w-3 h-3 text-red-500" />
                          <span className="text-xs text-muted-foreground">
                            {formatNumber(comment.like_count)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {hasMoreComments && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setVisibleCommentsCount(prev => prev + 10)}
                    className="w-full bg-muted/30 hover:bg-muted/50"
                  >
                    Load More Comments ({commentsToLoad} of {comments.length - visibleCommentsCount} remaining)
                  </Button>
                )}
                {visibleCommentsCount > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setVisibleCommentsCount(5)}
                    className="w-full mt-2"
                  >
                    Show Less Comments
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Section */}
        <InstagramContent
          key={refreshKey}
          postData={normalizedPostData}
          postId={postId}
          showAnalysis={showAnalysis}
          onAnalysisGenerated={handleAnalysisGenerated}
          hideDiscussButton={hideDiscussButton}
        />
      </div>
    </ContentOverlay>
  );
}; 