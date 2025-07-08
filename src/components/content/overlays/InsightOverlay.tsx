"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Lightbulb } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InsightContent } from '@/components/content/InsightContent';

interface InsightOverlayProps {
  insightId: string;
  onClose: () => void;
  showAnalysis?: boolean;
}

export const InsightOverlay: React.FC<InsightOverlayProps> = ({
  insightId,
  onClose,
  showAnalysis = true
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Fetch insight data
  const insightData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: `insight:${insightId}`,
    userId: userId || ''
  });

  if (!insightData) {
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
      title={insightData.title || 'Content Insight'}
      subtitle="AI-Generated Insight"
      icon={<Lightbulb className="w-8 h-8 text-yellow-500" />}
    >
      <InsightContent
        insightData={insightData}
        showAnalysis={showAnalysis}
      />
    </ContentOverlay>
  );
}; 