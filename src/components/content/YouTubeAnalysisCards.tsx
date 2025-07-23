"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useRotatingLoadingMessage } from '@/lib/loading-messages';
import { PerformanceOverviewCard } from './PerformanceOverviewCard';
import { AudienceInsightsCard } from './AudienceInsightsCard';
import { ContentAnalysisCard } from './ContentAnalysisCard';
import { RecommendationsCard } from './RecommendationsCard';
import { GrowthOpportunitiesCard } from './GrowthOpportunitiesCard';
import { AnalysisLoadingState } from './AnalysisLoadingState';
import { AnalysisEmptyState } from './AnalysisEmptyState';
import { YouTubeAnalysisCardsProps } from './types';

export const YouTubeAnalysisCards: React.FC<YouTubeAnalysisCardsProps> = ({
  videoData,
  isGeneratingAnalysis,
  analysisError
}) => {
  const loadingMessage = useRotatingLoadingMessage(3000);

  if (isGeneratingAnalysis) {
    return <AnalysisLoadingState loadingMessage={loadingMessage} />;
  }

  // Check if analysis exists but aiAnalysis is malformed
  if (videoData.analysis && !videoData.analysis.aiAnalysis) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Analysis data appears to be incomplete. Please try generating the analysis again.
        </p>
      </div>
    );
  }

  if (!videoData.analysis?.aiAnalysis) {
    return <AnalysisEmptyState />;
  }

  return (
    <div className="space-y-4">
      <PerformanceOverviewCard analysis={videoData.analysis.aiAnalysis} />
      <AudienceInsightsCard analysis={videoData.analysis.aiAnalysis} />
      <ContentAnalysisCard analysis={videoData.analysis.aiAnalysis} />
      <RecommendationsCard analysis={videoData.analysis.aiAnalysis} />
      <GrowthOpportunitiesCard analysis={videoData.analysis.aiAnalysis} />
    </div>
  );
}; 