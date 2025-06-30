'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Lightbulb, 
  Target, 
  Calendar, 
  TrendingUp,
  MessageSquare,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateNoteButton } from '@/components/ui/CreateNoteButton';

export default function InsightAnalysisPage() {
  const params = useParams();
  const analysisId = params.analysisId as string;
  const insightIndex = parseInt(params.insightIndex as string, 10);
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  // Fetch the batch analysis data
  const batchAnalysis = useQuery(api.youtubeQueries.getYoutubeBatchAnalysis, {
    userId: userId || '',
    channelId: 'placeholder' // We'll need to modify this query to support analysis ID lookup
  });

  // For now, we'll show a placeholder since we need to modify the query
  // to support fetching by analysis ID instead of channel ID

  if (!userId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Authentication Required
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to view this insight.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!batchAnalysis) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 border-2 border-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Loading Insight...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fetching insight details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder insight data - this will be replaced with actual data
  const insight = {
    title: 'Sample Insight Title',
    impact: 'Impact: medium',
    whyNow: [
      'This insight is based on recent content performance analysis.',
      'Current trends indicate this is an optimal time to act.'
    ],
    actionSteps: [
      'Implement the suggested content strategy.',
      'Monitor performance metrics closely.',
      'Adjust approach based on results.'
    ],
    expectedOutcome: 'Improved content performance and audience engagement.',
    sourceDetails: [
      'Based on analysis of recent YouTube content.',
      'Generated from batch analysis of multiple videos.'
    ],
    relatedItems: [
      { label: 'Analysis ID', value: analysisId },
      { label: 'Insight Index', value: insightIndex.toString() }
    ]
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <Lightbulb className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Insight Analysis
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis ID: {analysisId} • Index: {insightIndex}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Insight Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Insight */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  {insight.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Impact */}
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {insight.impact}
                  </span>
                </div>

                {/* Why Now */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Why Now?</h4>
                  <ul className="space-y-2">
                    {insight.whyNow.map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="mt-1">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Steps */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Action Steps</h4>
                  <div className="space-y-2">
                    {insight.actionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                          {step}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Outcome */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Expected Outcome</h4>
                  <p className="text-sm text-green-700 dark:text-green-300">{insight.expectedOutcome}</p>
                </div>

                {/* Source Details */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Source Details</h4>
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full">
                      YouTube Insight
                    </span>
                  </div>
                  {insight.sourceDetails.map((detail, idx) => (
                    <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 mb-1">{detail}</p>
                  ))}
                  {insight.relatedItems && insight.relatedItems.length > 0 && (
                    <div className="mt-2">
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Related Items</h5>
                      <div className="max-h-32 overflow-y-auto">
                        {insight.relatedItems.map((item, idx) => (
                          <div key={idx} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            • {item.label}: {item.value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Analysis Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Analysis Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Created {formatDate(Date.now())}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Batch Analysis
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Insight #{insightIndex + 1}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Discuss With Content
                </Button>

                <CreateNoteButton
                  content={`Insight: ${insight.title}\n\nImpact: ${insight.impact}\n\nWhy Now:\n${insight.whyNow.map(r => `• ${r}`).join('\n')}\n\nAction Steps:\n${insight.actionSteps.map(s => `• ${s}`).join('\n')}\n\nExpected Outcome: ${insight.expectedOutcome}`}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 