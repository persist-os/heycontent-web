"use client";

import React from 'react';
import { InstagramOverlay } from '@/components/content/overlays/InstagramOverlay';

interface InstagramPostCardProps {
  postId: string;
  onClose: () => void;
  onOpenAnalysis?: (postId: string) => void;
}

export const InstagramPostCard: React.FC<InstagramPostCardProps> = ({
  postId,
  onClose,
  onOpenAnalysis
}) => {
  return (
    <InstagramOverlay
      postId={postId}
      onClose={onClose}
      showAnalysis={true}
    />
  );
}; 