"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Youtube } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { YouTubeContent } from '@/components/content/YouTubeContent';

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

  return (
    <ContentOverlay
      onClose={onClose}
      title={videoData.snippet?.title || 'YouTube Video'}
      subtitle="YouTube Video Analysis"
      icon={<Youtube className="w-8 h-8 text-red-500" />}
    >
      <YouTubeContent
        videoData={videoData}
        videoId={videoId}
        showAnalysis={showAnalysis}
      />
    </ContentOverlay>
  );
}; 