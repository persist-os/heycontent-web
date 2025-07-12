"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Youtube } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { YouTubeContent } from '@/components/content/YouTubeContent';
import { useContentContextActions } from '@/store/content-context-store';
import { MessageSquare } from 'lucide-react';

interface YouTubeOverlayProps {
  videoId: string;
  onClose: () => void;
  showAnalysis?: boolean;
}

export const YouTubeOverlay: React.FC<YouTubeOverlayProps> = ({
  videoId,
  onClose,
  showAnalysis = true
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();
  const { setYouTubeContext } = useContentContextActions();

  // Fetch video data
  const videoData = useQuery(api.youtubeQueries.getFullVideoDetails, {
    videoId: videoId,
    userId: userId || ''
  });

  if (!videoData) {
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

  // Discuss With Content logic (copied from YouTubeCard)
  const handleDiscussContent = () => {
    if (videoData) {
      setYouTubeContext(videoData);
    } else {
      const mockConvexData = {
        _id: videoId as any,
        _creationTime: Date.now(),
        userId: userId || '',
        channelId: '',
        videoId: videoId,
        snippet: {
          title: videoData?.snippet?.title || '',
          description: videoData?.snippet?.description || '',
          channel: videoData?.snippet?.channel || '',
          published_at: videoData?.snippet?.published_at || '',
          thumbnails: {
            high: videoData?.snippet?.thumbnails?.high || ''
          }
        },
        statistics: videoData?.statistics || {},
        content_details: videoData?.content_details || {},
        analysis: videoData?.analysis || null,
        analysisMarkdown: videoData?.analysisMarkdown || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setYouTubeContext(mockConvexData as any);
    }
    router.push('/dashboard/chat');
  };

  return (
    <ContentOverlay
      onClose={onClose}
      title={videoData.snippet?.title || 'YouTube Video'}
      subtitle="YouTube Video Analysis"
      icon={<Youtube className="w-8 h-8 text-red-500" />}
    >
      <div className="relative min-h-[60vh] flex flex-col">
        <YouTubeContent
          videoData={videoData}
          videoId={videoId}
          userId={userId || ''}
          showAnalysis={showAnalysis}
        />
        {/* Chat With Content Button below insights */}
        <div className="w-full max-w-2xl px-4 mx-auto mt-6">
          <button
            className="flex-1 bg-primary text-primary-foreground dark:text-black hover:bg-primary/90 hover:text-primary-foreground dark:hover:text-black px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full flex items-center justify-center gap-2"
            onClick={handleDiscussContent}
          >
            <MessageSquare className="w-4 h-4 inline" />
            Discuss With Content
          </button>
        </div>
      </div>
    </ContentOverlay>
  );
}; 