"use client";

import React from 'react';
import { YouTubeOverlay } from '@/components/content/overlays/YouTubeOverlay';

interface YouTubeVideoCardProps {
  videoId: string;
  onClose: () => void;
  onOpenAnalysis?: (videoId: string) => void;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  videoId,
  onClose,
  onOpenAnalysis
}) => {
  return (
    <YouTubeOverlay
      videoId={videoId}
      onClose={onClose}
      showAnalysis={true}
    />
  );
}; 