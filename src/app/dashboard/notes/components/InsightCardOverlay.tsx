"use client";

import React from 'react';
import { InsightOverlay } from '@/components/content/overlays/InsightOverlay';

interface InsightCardOverlayProps {
  insightId: string;
  onClose: () => void;
  onOpenAnalysis?: (insightId: string) => void;
}

export const InsightCardOverlay: React.FC<InsightCardOverlayProps> = ({
  insightId,
  onClose,
  onOpenAnalysis
}) => {
  return (
    <InsightOverlay
      insightId={insightId}
      onClose={onClose}
      showAnalysis={true}
    />
  );
}; 