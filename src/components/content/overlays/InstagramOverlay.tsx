"use client";

import React from 'react';
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

export const InstagramOverlay: React.FC<InstagramOverlayProps> = ({
  postId,
  onClose,
  showAnalysis = true
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Fetch Instagram post data
  const postData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: `instagram:${postId}`,
    userId: userId || ''
  });

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
      title={postData.title || 'Instagram Post'}
      subtitle="Instagram Post Analysis"
      icon={<Instagram className="w-8 h-8 text-pink-500" />}
    >
      <InstagramContent
        postData={postData}
        postId={postId}
        showAnalysis={showAnalysis}
      />
    </ContentOverlay>
  );
}; 