"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Heart, MessageCircle, Eye, Share2, Bookmark, ExternalLink, Instagram, Sparkles, TrendingUp, Users, Calendar, Image as ImageIcon, BarChart3, Target, Zap, Lightbulb, ArrowUpRight, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { getApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';
import { formatNumber } from '@/lib/content-utils';
import { processContentIfNeeded } from '@/app/dashboard/content-analytics/utils/markdown-processor';

interface InstagramContentProps {
  postData: any;
  postId: string;
  showAnalysis?: boolean;
  onAnalysisGenerated?: () => void;
  hideDiscussButton?: boolean;
}

// Enhanced analysis data types
interface EnhancedAnalysis {
  content_type?: string;
  performance_metrics?: {
    engagement_rate?: string;
    save_rate?: string;
    share_rate?: string;
    comment_quality?: string;
    viral_potential?: string;
    reach_efficiency?: string;
  };
  audience_insights?: {
    primary_audience?: string;
    engagement_rate?: string;
    top_performing_demographics?: string[];
    audience_alignment?: string;
    growth_opportunities?: string[];
  };
  persona_alignment?: {
    content_pillar_alignment?: string;
    tone_consistency?: string;
    goal_progression?: string;
    unique_value_showcase?: string;
    audience_connection?: string;
  };
  content_strategy?: {
    content_themes?: string[];
    posting_timing?: string;
    caption_strategies?: string[];
    visual_elements?: string[];
    hashtag_strategy?: string;
  };
  top_insights?: Array<{
    insight_type?: string;
    title?: string;
    description?: string;
    impact?: string;
    action_steps?: string[];
    expected_outcome?: string;
  }>;
  creator_recommendations?: string[];
  summary?: string;
}

// Cycling loading messages for Instagram analysis
const LOADING_MESSAGES = [
  "Analyzing your Instagram magic... because even AI needs to understand your aesthetic",
  "Teaching our AI about your content style... it's learning, we promise!",
  "Processing your Instagram genius... this is like speed-reading a visual novel",
  "Decoding your Instagram algorithm... because we're nosy about what makes your posts pop",
  "AI is getting to know your brand... it's like a first date, but with data",
  "Fetching your Instagram insights... this might take a moment, but good things come to those who wait",
  "Crunching numbers and analyzing vibes... we're doing the heavy lifting so you don't have to",
  "Deep-diving into your content strategy... because surface-level insights are so 2020",
  "Processing your social media brilliance... we're basically your personal content detective",
  "Mining your Instagram gold... because every post has a story to tell",
];

export const InstagramContent: React.FC<InstagramContentProps> = ({
  postData,
  postId,
  showAnalysis = true,
  onAnalysisGenerated,
  hideDiscussButton = false
}) => {
  const router = useRouter();
  const { setInstagramContext } = useContentContextActions();
  
  // State for AI analysis generation
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
  // Get current user ID
  const [userId, setUserId] = useState<string | null>(null);
  
  // Mutation to store analysis in Convex
  const storeAnalysisMutation = useMutation(api.instagramMutations.storePostAnalysis);
  
  // Get current user ID on component mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId);
  }, []);
  
  // Query to check if analysis exists
  const existingAnalysis = useQuery(api.instagramQueries.getPostAnalysis, 
    userId && postId ? {
      userId: userId,
      postId: postId
    } : "skip"
  );
  
  // Cycling loading message effect
  useEffect(() => {
    if (!isGeneratingAnalysis) {
      setCurrentMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => 
        (prevIndex + 1) % LOADING_MESSAGES.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isGeneratingAnalysis]);
  
  // Extract data from Instagram post structure
  const { data, analysis, analysisMarkdown, mediaType } = postData;
  
  // Parse enhanced analysis data
  const enhancedAnalysis: EnhancedAnalysis = analysis || {};
  
  // Extract statistics from insights
  const insights = data?.insights;
  const likes = insights?.likes || data?.like_count || 0;
  const comments = insights?.comments || data?.comments_count || 0;
  const reach = insights?.reach || 0;
  const impressions = insights?.impressions || 0;
  const saved = insights?.saved || 0;
  const shares = insights?.shares || 0;
  
  // Get media URLs
  const mediaUrl = data?.media_url;
  const thumbnailUrl = data?.thumbnail_url;
  
  // Get caption and permalink
  const caption = data?.caption;
  const permalink = postData.permalink || data?.permalink || `https://www.instagram.com/p/${postId}`;

  // Handle AI analysis generation
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    
    try {
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      const userIdMatch = apiKey.match(/heycontent_([^_]+)_/);
      const extractedUserId = userIdMatch ? userIdMatch[1] : null;
      
      if (!extractedUserId) {
        throw new Error('Invalid API key format');
      }

      const apiUrl = `${window.location.origin}/api/social/instagram/analyze`;
      
      const requestBody = {
        user_id: extractedUserId,
        post_id: postId,
        format: 'both'
      };
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      if (responseData.status !== 'success') {
        throw new Error(responseData.error || 'Analysis failed');
      }

      console.log('✅ Instagram analysis successful:', responseData);
      
      // Store the analysis in Convex
      const analysisData = responseData.data?.json || responseData.data;
      const markdownData = responseData.data?.markdown;
      
      if (analysisData || markdownData) {
        try {
          await storeAnalysisMutation({
            userId: userId || extractedUserId,
            postId: postId,
            analysisData: {
              markdown: markdownData,
              analysis: analysisData
            }
          });
          console.log('✅ Analysis stored in Convex successfully');
        } catch (storeError) {
          console.error('❌ Failed to store analysis in Convex:', storeError);
        }
      }
      
      setAnalysisError(null);
      setAnalysisSuccess(true);
      
      onAnalysisGenerated?.();
      
    } catch (error: any) {
      console.error('Error generating Instagram analysis:', error);
      setAnalysisError(error.message || 'Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Handle "Discuss with Content" functionality
  const handleDiscussContent = () => {
    const instagramContext = {
      _id: postId as any,
      _creationTime: Date.now(),
      userId: userId || '',
      instagramAccountId: postData.instagramAccountId || '',
      postId: postId,
      mediaType: mediaType || 'IMAGE',
      data: {
        id: postId,
        caption: caption || '',
        media_url: mediaUrl || '',
        permalink: permalink,
        timestamp: postData.createdAt || Date.now(),
        username: postData.username || '',
        like_count: likes || 0,
        comments_count: comments || 0,
        thumbnail_url: thumbnailUrl || null,
        children: postData.children || null,
        comments: postData.comments || [],
        insights: insights || null,
      },
      analysis: analysis || null,
      analysisMarkdown: analysisMarkdown || null,
      createdAt: postData.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    setInstagramContext(instagramContext as any);
    router.push('/dashboard/chat');
  };

  // Helper function to get impact color
  const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  // Helper function to get impact icon
  const getImpactIcon = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case 'high': return <ArrowUpRight className="w-4 h-4" />;
      case 'medium': return <CheckCircle className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Main Content Layout */}
      <div className="space-y-8">
        {/* Analysis Section */}
        {showAnalysis && (
          <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Analysis
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Deep insights powered by artificial intelligence
                  </p>
                </div>
                <Button 
                  onClick={handleGenerateAnalysis} 
                  disabled={isGeneratingAnalysis}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingAnalysis ? 'Generating...' : 
                   (enhancedAnalysis || analysisMarkdown || (existingAnalysis && (existingAnalysis.analysis || existingAnalysis.analysisMarkdown))) 
                   ? 'Refresh Analysis' : 'Generate Analysis'}
                </Button>
              </div>

              {/* Analysis Content */}
              {analysisError && (
                <div className={`mb-6 p-4 rounded-lg border ${
                  analysisSuccess 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}>
                  <p className={`text-sm ${
                    analysisSuccess ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>{analysisError}</p>
                  {!analysisSuccess && (
                    <Button 
                      onClick={handleGenerateAnalysis}
                      size="sm"
                      className="mt-3 bg-red-500 hover:bg-red-600 text-white"
                    >
                      Try Again
                    </Button>
                  )}
                </div>
              )}
              
              {isGeneratingAnalysis ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="relative w-64 h-8 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-60 animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                      {LOADING_MESSAGES[currentMessageIndex]}
                    </p>
                  </div>
                </div>
              ) : (enhancedAnalysis || analysisMarkdown) ? (
                <div className="space-y-6">
                  {/* Enhanced Analysis Display */}
                  {enhancedAnalysis && Object.keys(enhancedAnalysis).length > 0 && (
                    <>
                      {/* Performance Metrics */}
                      {enhancedAnalysis.performance_metrics && (
                        <Card className="border-l-4 border-l-green-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <BarChart3 className="w-5 h-5 text-green-500" />
                              Performance Metrics
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {enhancedAnalysis.performance_metrics.engagement_rate && (
                                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">{enhancedAnalysis.performance_metrics.engagement_rate}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Engagement Rate</div>
                                </div>
                              )}
                              {enhancedAnalysis.performance_metrics.save_rate && (
                                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                  <div className="text-2xl font-bold text-yellow-600">{enhancedAnalysis.performance_metrics.save_rate}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Save Rate</div>
                                </div>
                              )}
                              {enhancedAnalysis.performance_metrics.share_rate && (
                                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">{enhancedAnalysis.performance_metrics.share_rate}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">Share Rate</div>
                                </div>
                              )}
                            </div>
                            {/* Viral Potential full-width row */}
                            {enhancedAnalysis.performance_metrics.viral_potential && (
                              <div className="mt-4 w-full">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex flex-col items-start">
                                  <div className="text-sm font-semibold text-purple-600 mb-1">Viral Potential</div>
                                  <div className="text-base text-purple-800 dark:text-purple-200 whitespace-pre-line break-words w-full">{enhancedAnalysis.performance_metrics.viral_potential}</div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Audience Insights */}
                      {enhancedAnalysis.audience_insights && (
                        <Card className="border-l-4 border-l-blue-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Users className="w-5 h-5 text-blue-500" />
                              Audience Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {enhancedAnalysis.audience_insights.primary_audience && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Primary Audience</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.audience_insights.primary_audience}</div>
                              </div>
                            )}
                            {enhancedAnalysis.audience_insights.top_performing_demographics && enhancedAnalysis.audience_insights.top_performing_demographics.length > 0 && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white mb-2">Top Demographics</div>
                                <div className="flex flex-wrap gap-2">
                                  {enhancedAnalysis.audience_insights.top_performing_demographics.map((demo, index) => (
                                    <Badge key={index} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                                      {demo}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {enhancedAnalysis.audience_insights.audience_alignment && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Audience Alignment</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.audience_insights.audience_alignment}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Persona Alignment */}
                      {enhancedAnalysis.persona_alignment && (
                        <Card className="border-l-4 border-l-purple-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Target className="w-5 h-5 text-purple-500" />
                              Creator Alignment
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {enhancedAnalysis.persona_alignment.content_pillar_alignment && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Content Pillar Alignment</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.persona_alignment.content_pillar_alignment}</div>
                              </div>
                            )}
                            {enhancedAnalysis.persona_alignment.tone_consistency && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Tone Consistency</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.persona_alignment.tone_consistency}</div>
                              </div>
                            )}
                            {enhancedAnalysis.persona_alignment.goal_progression && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Goal Progression</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.persona_alignment.goal_progression}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Top Insights */}
                      {enhancedAnalysis.top_insights && enhancedAnalysis.top_insights.length > 0 && (
                        <Card className="border-l-4 border-l-orange-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Lightbulb className="w-5 h-5 text-orange-500" />
                              Key Insights
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {enhancedAnalysis.top_insights.map((insight, index) => (
                                <div key={index} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                                    <Badge className={`${getImpactColor(insight.impact || 'low')} px-2 py-1 text-xs`}>
                                      <span className="flex items-center gap-1">
                                        {getImpactIcon(insight.impact || 'low')}
                                        {insight.impact?.toUpperCase() || 'LOW'}
                                      </span>
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
                                  {insight.action_steps && insight.action_steps.length > 0 && (
                                    <div>
                                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Action Steps:</div>
                                      <ul className="space-y-1">
                                        {insight.action_steps.map((step, stepIndex) => (
                                          <li key={stepIndex} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                            <span className="text-green-500 mt-1">•</span>
                                            {step}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Content Strategy */}
                      {enhancedAnalysis.content_strategy && (
                        <Card className="border-l-4 border-l-pink-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Zap className="w-5 h-5 text-pink-500" />
                              Content Strategy
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {enhancedAnalysis.content_strategy.content_themes && enhancedAnalysis.content_strategy.content_themes.length > 0 && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Themes</div>
                                <div className="flex flex-wrap gap-2">
                                  {enhancedAnalysis.content_strategy.content_themes.map((theme, index) => (
                                    <Badge key={index} variant="outline" className="bg-pink-50 dark:bg-pink-900/20 text-pink-800 dark:text-pink-200">
                                      {theme}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {enhancedAnalysis.content_strategy.posting_timing && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">Optimal Timing</div>
                                <div className="text-gray-600 dark:text-gray-400">{enhancedAnalysis.content_strategy.posting_timing}</div>
                              </div>
                            )}
                            {enhancedAnalysis.content_strategy.caption_strategies && enhancedAnalysis.content_strategy.caption_strategies.length > 0 && (
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white mb-2">Caption Strategies</div>
                                <ul className="space-y-1">
                                  {enhancedAnalysis.content_strategy.caption_strategies.map((strategy, index) => (
                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                      <span className="text-pink-500 mt-1">•</span>
                                      {strategy}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Creator Recommendations */}
                      {enhancedAnalysis.creator_recommendations && enhancedAnalysis.creator_recommendations.length > 0 && (
                        <Card className="border-l-4 border-l-indigo-500">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <CheckCircle className="w-5 h-5 text-indigo-500" />
                              Creator Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {enhancedAnalysis.creator_recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                  <span className="text-indigo-500 mt-1">•</span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                      {/* Summary */}
                      {enhancedAnalysis.summary && (
                        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Sparkles className="w-5 h-5 text-purple-500" />
                              Summary
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{enhancedAnalysis.summary}</p>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Fallback for Markdown Analysis */}
                  {!enhancedAnalysis && (analysisMarkdown || analysis) && (
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Content Analysis
                      </h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {analysisMarkdown ? (
                          <MarkdownRenderer content={processContentIfNeeded(analysisMarkdown)} />
                        ) : typeof analysis === 'string' ? (
                          <MarkdownRenderer content={processContentIfNeeded(analysis)} />
                        ) : (
                          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <pre className="text-sm overflow-x-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                              {JSON.stringify(analysis, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    {(enhancedAnalysis || analysisMarkdown || (existingAnalysis && (existingAnalysis.analysis || existingAnalysis.analysisMarkdown))) 
                     ? 'Click "Refresh Analysis" to get updated AI-powered insights about this post.'
                     : 'Click "Generate Analysis" to get AI-powered insights about this post\'s content, engagement, and performance.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {!hideDiscussButton && (
            <Button 
              onClick={handleDiscussContent} 
              disabled={!enhancedAnalysis && !analysisMarkdown}
              size="lg"
              data-discuss-button
              className={`flex-1 ${
                !enhancedAnalysis && !analysisMarkdown 
                  ? 'opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300' 
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black font-medium'
              }`}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {!enhancedAnalysis && !analysisMarkdown ? 'Generate Analysis First' : 'Discuss with Content'}
            </Button>
          )}
          
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className={`${hideDiscussButton ? 'w-full' : 'flex-1'} border-gray-300 dark:border-gray-600`}
          >
            <a href={permalink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-5 h-5 mr-2" />
              View on Instagram
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}; 