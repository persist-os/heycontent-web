"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowLeft } from 'lucide-react';
import { InsightCard } from '@/components/content/InsightCard';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function InsightAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { insightId } = params;
  const decodedInsightId = decodeURIComponent(insightId as string);
  const fromChat = searchParams.get('fromChat') === 'true';
  const chatId = searchParams.get('chatId');
  const insightData = useQuery(api.notes.getInsightById, { insightId: decodedInsightId });

  let cardContent = null;
  if (insightData === undefined) {
    cardContent = <div className="text-center text-gray-500">Loading insight...</div>;
  } else if (insightData === null) {
    cardContent = <div className="text-center text-red-500">Insight not found.</div>;
  } else {
    // Map Convex result to InsightCardProps
    const analysis = insightData.analysis || {};
    
    // Parse the insight ID to determine platform
    const parseInsightPlatform = (id: string): 'youtube' | 'instagram' | 'gmail' | 'content-hub' => {
      if (id.includes('youtube')) return 'youtube';
      if (id.includes('instagram')) return 'instagram';
      if (id.includes('gmail')) return 'gmail';
      return 'content-hub';
    };

    const platform = parseInsightPlatform(decodedInsightId);
    
    cardContent = (
      <InsightCard
        title={insightData.title}
        platform={platform}
        impact={analysis.impact || ''}
        whyNow={analysis.whyNow || []}
        actionSteps={analysis.actionSteps || []}
        expectedOutcome={analysis.expectedOutcome || ''}
        sourceDetails={analysis.sourceDetails || []}
        relatedItems={analysis.relatedItems || []}
        expanded={true}
        showAnalysis={true}
        onDiscuss={(content: string, title: string) => {
          // Navigate to chat with insight context
          const context = {
            platform: 'ai-insights',
            contentId: decodedInsightId,
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
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => fromChat ? router.push(chatId ? `/dashboard/chat?id=${chatId}` : '/dashboard/chat') : router.push('/dashboard/notes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {fromChat ? 'Back to Chat' : 'Back to File System'}
            </Button>
            <div className="flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
              <div>
                <h1 className="text-2xl font-bold">Insight Analysis</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Card */}
      <div className="w-full flex items-center justify-center py-8">
        <div className="w-full max-w-3xl">
          {cardContent}
        </div>
      </div>
    </div>
  );
} 