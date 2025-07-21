import React, { useState, useEffect } from 'react';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { InstagramContentItem } from '../types';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { InstagramOverlay } from '@/components/content/overlays/InstagramOverlay';

interface InstagramModalProps {
  selectedContent: InstagramContentItem;
  onClose: () => void;
  onDiscussContent: (item: InstagramContentItem) => void;
}

export const InstagramModal: React.FC<InstagramModalProps> = ({
  selectedContent,
  onClose,
  onDiscussContent
}) => {
  // No need for userId or preFetchedData logic
  return (
    <InstagramOverlay
      postId={selectedContent.id}
      onClose={onClose}
      showAnalysis={true}
      // hideDiscussButton={false} // pass if needed
    />
  );
};