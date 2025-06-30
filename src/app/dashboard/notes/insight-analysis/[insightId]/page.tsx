"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Lightbulb, 
  ArrowLeft,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  FileText,
  ExternalLink,
  Clock,
  BarChart3,
  Zap,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

export default function InsightAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  
  const insightId = params.insightId as string;

  // Fetch all linkable content to get the insight data
  const allLinkableContent = useQuery(api.notes.getAllLinkableContent, {
    userId: userId || ''
  });

  // Find the specific insight
  const insight = allLinkableContent?.find(content => content.id === insightId);

  if (!allLinkableContent) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Insight Not Found</h1>
            <p className="text-muted-foreground">The insight you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to render insight content
  const renderInsightContent = (insightData: any) => {
    if (!insightData) return null;
    
    return (
      <div className="space-y-6">
        {/* Main insight content */}
        {insightData.analysis && (
          <div className="bg-muted/50 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Analysis
            </h4>
            <div className="text-sm text-muted-foreground">
              <MarkdownRenderer content={insightData.analysis} />
            </div>
          </div>
        )}

        {/* Additional insight data */}
        {insightData.recommendations && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Target className="w-4 h-4" />
              Recommendations
            </h4>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <MarkdownRenderer content={insightData.recommendations} />
            </div>
          </div>
        )}

        {insightData.keyTakeaways && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300">
              <Zap className="w-4 h-4" />
              Key Takeaways
            </h4>
            <div className="text-sm text-green-600 dark:text-green-400">
              <MarkdownRenderer content={insightData.keyTakeaways} />
            </div>
          </div>
        )}

        {insightData.trends && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <TrendingUp className="w-4 h-4" />
              Trends & Patterns
            </h4>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              <MarkdownRenderer content={insightData.trends} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Lightbulb className="w-8 h-8 text-yellow-500" />
                <div>
                  <h1 className="text-2xl font-bold">Insight Analysis</h1>
                  <p className="text-muted-foreground">{insight.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Insight and Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Insight */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-xl mb-2">{insight.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Generated from YouTube batch analysis
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <Lightbulb className="w-3 h-3 mr-1" />
                      Insight
                    </Badge>
                  </div>

                  {/* Tags */}
                  {insight.tags && insight.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {insight.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insight content preview */}
                  {insight.analysis && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Preview
                      </h4>
                      <div className="text-sm text-muted-foreground line-clamp-3">
                        {typeof insight.analysis === 'string' 
                          ? insight.analysis.substring(0, 200) + '...'
                          : 'Analysis content available'
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Insight Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-sm font-medium">
                      {formatDate(insight.createdAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">Created</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {insight.tags?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Tags</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Activity className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-sm font-medium">
                      {insight.contentType}
                    </div>
                    <div className="text-xs text-muted-foreground">Type</div>
                  </div>
                </div>

                {/* Platform info */}
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Target className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-sm font-medium">
                    {insight.platform}
                  </div>
                  <div className="text-xs text-muted-foreground">Platform</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
            <CardDescription>Comprehensive insights and recommendations from AI analysis</CardDescription>
          </CardHeader>
          <CardContent>
            {insight.analysis ? (
              renderInsightContent(insight.analysis)
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No detailed analysis available for this insight</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 