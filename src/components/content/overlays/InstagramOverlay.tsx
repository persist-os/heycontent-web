"use client";

import React, { useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Instagram, Sparkles } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InstagramContent } from '../../content/InstagramContent';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface InstagramOverlayProps {
  postId: string;
  onClose: () => void;
  showAnalysis?: boolean;
  // Optional pre-fetched data to avoid Convex query
  preFetchedData?: any;
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
        {/* Content Themes skeleton */}
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-5 w-16 rounded" />
          ))}
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

// Helper function to parse structured analysis data for themes
const parseAnalysisThemes = (analysis: any): string[] => {
  if (!analysis || typeof analysis !== 'object') return [];
  return analysis.content_themes || [];
};

export const InstagramOverlay: React.FC<InstagramOverlayProps> = ({
  postId,
  onClose,
  showAnalysis = true,
  preFetchedData,
  hideDiscussButton = false
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [refreshKey, setRefreshKey] = useState(0);

  // Always call the hook, but only use the result if no pre-fetched data
  const queryResult = useQuery(api.instagramQueries.getInstagramPost, {
    postId,
    userId: userId || ''
  });
  
  // Use pre-fetched data if available, otherwise use query result
  const post = preFetchedData || queryResult;

  // Callback to handle analysis generation - this will trigger a refetch
  const handleAnalysisGenerated = useCallback(() => {
    // Force a re-render by updating the key
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('Analysis generated, triggering component refresh');
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
  
  // Core properties with single null checks
  const caption = postData.caption || '';
  const mediaUrl = postData.media_url || '';
  const thumbnailUrl = postData.thumbnail_url || '';
  const permalink = postData.permalink || `https://www.instagram.com/p/${postId}`;
  const createdAt = postData.timestamp || post.createdAt || Date.now();
  const mediaType = post.mediaType || 'image';
  
  // Safely extract insights with proper null checks
  const insights = postData.insights || {};
  const likeCount = postData.like_count || 0;
  const commentsCount = postData.comments_count || 0;
  
  // Create statistics object with safe property access
  const statistics = {
    likes: insights.likes ?? likeCount,
    comments: insights.comments ?? commentsCount,
    reach: insights.reach ?? 0,
    impressions: insights.impressions ?? 0,
    saved: insights.saved ?? 0,
    shares: insights.shares ?? 0
  };

  // Validate that we have meaningful data
  if (!caption && !mediaUrl && !thumbnailUrl) {
    return <ErrorState onClose={onClose} error="Post contains no viewable content" />;
  }

  // Prepare normalized post data with proper null safety
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
    // Add the raw data structure that InstagramContent expects
    data: {
      media_url: mediaUrl,
      thumbnail_url: thumbnailUrl,
      caption,
      insights,
      like_count: likeCount,
      comments_count: commentsCount,
      permalink
    },
    mediaType,
    // Add permalink at the top level for easy access
    permalink
  };

  // Extract content themes from analysis with null safety
  const contentThemes = normalizedPostData.analysis ? parseAnalysisThemes(normalizedPostData.analysis) : [];

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
          {/* Content Themes in header */}
          {contentThemes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contentThemes.map((theme, index) => (
                <span 
                  key={index} 
                  className="inline-block bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded text-xs border border-border/40"
                >
                  #{theme}
                </span>
              ))}
            </div>
          )}
        </div>
      }
      icon={<Instagram className="w-8 h-8 text-pink-500" />}
    >
      <InstagramContent
        key={refreshKey} // Force re-render when analysis is generated
        postData={normalizedPostData}
        postId={postId}
        showAnalysis={showAnalysis}
        onAnalysisGenerated={handleAnalysisGenerated}
        hideDiscussButton={hideDiscussButton}
      />
    </ContentOverlay>
  );
}; 