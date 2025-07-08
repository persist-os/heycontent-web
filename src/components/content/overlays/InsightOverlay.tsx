"use client";

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Lightbulb } from 'lucide-react';
import { ContentOverlay } from '@/components/ui/ContentOverlay';
import { InsightCard } from '@/components/content/InsightCard';

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
  const insightData = useQuery(api.notes.getInsightById, {
    insightId: insightId
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

  // Parse the insight ID to determine platform
  const parseInsightPlatform = (id: string): 'youtube' | 'instagram' | 'gmail' | 'content-hub' => {
    if (id.includes('youtube')) return 'youtube';
    if (id.includes('instagram')) return 'instagram';
    if (id.includes('gmail')) return 'gmail';
    return 'content-hub';
  };

  const platform = parseInsightPlatform(insightId);

  // Transform insight data to InsightCard format
  const transformInsightData = () => {
    if (!insightData) return null;

    const analysis = insightData.analysis || {};
    
    return {
      title: insightData.title,
      platform: platform,
      analysis: insightData.analysis ? JSON.stringify(insightData.analysis, null, 2) : undefined,
      impact: analysis.impact,
      whyNow: analysis.whyNow || [],
      actionSteps: analysis.actionSteps || [],
      expectedOutcome: analysis.expectedOutcome,
      sourceDetails: analysis.sourceDetails || [],
      relatedItems: analysis.relatedItems || [],
      expanded: true,
      showAnalysis: showAnalysis,
      onDiscuss: (content: string, title: string) => {
        // Navigate to chat with insight context
        const context = {
          platform: 'ai-insights',
          contentId: insightId,
          title: title,
          source: 'AI Insights Dashboard',
          originalPlatform: platform,
          fullInsight: {
            title: insightData.title,
            impact: analysis.impact,
            whyNow: analysis.whyNow || [],
            actionSteps: analysis.actionSteps || [],
            expectedOutcome: analysis.expectedOutcome,
            sourceDetails: analysis.sourceDetails || [],
            relatedItems: analysis.relatedItems || []
          },
          analysis: content
        };
        
        const encodedContext = encodeURIComponent(JSON.stringify(context));
        window.location.href = `/dashboard/chat?contentContext=${encodedContext}`;
      }
    };
  };

  const cardProps = transformInsightData();

  if (!cardProps) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center text-red-500">Insight not found</div>
        </div>
      </div>
    );
  }

  return (
    <ContentOverlay
      onClose={onClose}
      title={insightData.title}
      subtitle="AI Insight Analysis"
      icon={<Lightbulb className="w-8 h-8 text-yellow-500" />}
    >
      <div className="max-w-4xl mx-auto">
        <InsightCard {...cardProps} />
      </div>
    </ContentOverlay>
  );
}; 