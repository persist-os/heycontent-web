"use client";

import React, { useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Instagram } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InstagramContent } from '@/components/content/InstagramContent';

interface InstagramOverlayProps {
  postId: string;
  onClose: () => void;
  showAnalysis?: boolean;
}

// Helper function to parse structured analysis data for themes
const parseAnalysisThemes = (analysis: any) => {
  if (!analysis || typeof analysis !== 'object') return [];
  return analysis.content_themes || [];
};

export const InstagramOverlay: React.FC<InstagramOverlayProps> = ({
  postId,
  onClose,
  showAnalysis = true
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch Instagram post data (raw DB format)
  const post = useQuery(api.instagramQueries.getInstagramPost, {
    postId,
    userId: userId || ''
  });

  // Debug: Log the raw post data
  console.log('Raw Instagram post data:', post);

  // Callback to handle analysis generation - this will trigger a refetch
  const handleAnalysisGenerated = useCallback(() => {
    // Force a re-render by updating the key
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
      console.log('Analysis generated, triggering component refresh');
    }, 2000);
  }, []);

  // Normalize to the same format as getAllLinkableContent
  const postData = post && {
    id: `instagram:${post.postId}`,
    title: post.data?.caption?.substring(0, 100) || 'Instagram Post',
    type: 'instagram',
    contentType: post.mediaType?.toLowerCase() || 'image',
    platform: 'instagram',
    createdAt: post.data?.timestamp || post.createdAt || Date.now(),
    important: false,
    tags: [],
    analysis: post.analysis,
    analysisMarkdown: post.analysisMarkdown,
    mediaUrl: post.data?.media_url || '',
    thumbnailUrl: post.data?.thumbnail_url || '',
    insights: post.data?.insights || {},
    statistics: {
      likes: post.data?.insights?.likes ?? post.data?.like_count ?? 0,
      comments: post.data?.insights?.comments ?? post.data?.comments_count ?? 0,
      reach: post.data?.insights?.reach ?? 0,
      impressions: post.data?.insights?.impressions ?? 0,
      saved: post.data?.insights?.saved ?? 0,
      shares: post.data?.insights?.shares ?? 0
    },
    // Add the raw data structure that InstagramContent expects
    data: {
      media_url: post.data?.media_url || '',
      thumbnail_url: post.data?.thumbnail_url || '',
      caption: post.data?.caption || '',
      insights: post.data?.insights || {},
      like_count: post.data?.like_count || 0,
      comments_count: post.data?.comments_count || 0,
      permalink: post.data?.permalink || `https://www.instagram.com/p/${post.postId}`
    },
    mediaType: post.mediaType,
    // Add permalink at the top level for easy access
    permalink: post.data?.permalink || `https://www.instagram.com/p/${post.postId}`
  };

  // Debug: Log the normalized post data
  console.log('Normalized Instagram post data:', postData);

  // Extract content themes from analysis
  const contentThemes = postData ? parseAnalysisThemes(postData.analysis) : [];

  if (!postData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Loading...</h3>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <ContentOverlay
      onClose={onClose}
      title={postData.title}
      subtitle={
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              Instagram Post
            </span>
            {postData.mediaType && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
                {postData.mediaType.toUpperCase()}
              </span>
            )}
          </div>
          {/* Content Themes in header */}
          {contentThemes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contentThemes.map((theme, index) => (
                <span key={index} className="inline-block bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded text-xs border border-border/40">
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
        postData={postData}
        postId={postId}
        showAnalysis={showAnalysis}
        onAnalysisGenerated={handleAnalysisGenerated}
      />
    </ContentOverlay>
  );
}; 