"use client";

import React from 'react';
import { GmailOverlay } from '@/components/content/overlays/GmailOverlay';

interface GmailThreadCardProps {
  threadId: string;
  onClose: () => void;
}

export const GmailThreadCard: React.FC<GmailThreadCardProps> = ({
  threadId,
  onClose
}) => {
  return (
    <GmailOverlay
      threadId={threadId}
      onClose={onClose}
      showAnalysis={true}
    />
  );
}; 