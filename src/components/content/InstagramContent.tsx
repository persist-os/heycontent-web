"use client";

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Eye, Share2, Bookmark, ExternalLink, Instagram, Sparkles, TrendingUp, Users, Calendar, Image as ImageIcon, BarChart3, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { getApiKey } from '@/app/lib/api-helpers';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';
import { formatNumber } from '@/lib/content-utils';

interface InstagramContentProps {
  postData: any;
  postId: string;
  showAnalysis?: boolean;
  onAnalysisGenerated?: () => void; // Callback to trigger data refresh
}

// Cycling loading messages for Instagram analysis
const LOADING_MESSAGES = [
  // Funny & Relatable
  "Analyzing your Instagram magic... because even AI needs to understand your aesthetic",
  "Teaching our AI about your content style... it's learning, we promise!",
  "Processing your Instagram genius... this is like speed-reading a visual novel",
  "Decoding your Instagram algorithm... because we're nosy about what makes your posts pop",
  "AI is getting to know your brand... it's like a first date, but with data",
  
  // Transparent & Honest
  "Fetching your Instagram insights... this might take a moment, but good things come to those who wait",
  "Crunching numbers and analyzing vibes... we're doing the heavy lifting so you don't have to",
  "Deep-diving into your content strategy... because surface-level insights are so 2020",
  "Processing your social media brilliance... we're basically your personal content detective",
  "Mining your Instagram gold... because every post has a story to tell",
  
  // Creator-Focused
  "Analyzing your creative genius... because every post is a masterpiece in the making",
  "Decoding your Instagram success... we're basically your personal social media therapist",
  "Unpacking your content strategy... it's like reading your diary, but with analytics",
  "Mapping your audience connection... because engagement is just friendship with data",
  "Processing your Instagram personality... we're getting to know the real you (digitally)",
  
  // Playful & Specific
  "Instagram analysis in progress... because even AI needs to understand your filter game",
  "Decoding your Instagram story... we're basically your personal content whisperer",
  "Mining your social media gold... every like, comment, and share tells a story",
  "Analyzing your visual storytelling... because a picture is worth a thousand insights",
  "Processing your Instagram algorithm... we're basically your personal social media fortune teller",
  
  // Encouraging & Supportive
  "Preparing your content insights... because every creator deserves to understand their impact",
  "Unlocking your Instagram potential... we're here to help you shine brighter",
  "Mapping your audience connection... because your content deserves to be seen",
  "Analyzing your creative journey... every post is a step toward your goals",
  "Processing your growth story... because your Instagram journey is worth celebrating",
  
  // Tech-Savvy but Friendly
  "Running Instagram analysis protocols... our AI is having a moment with your content",
  "Processing your social media DNA... we're basically your personal content scientist",
  "Syncing with Instagram's algorithm... because we speak fluent social media",
  "Compiling your content insights... this is like speed-reading your Instagram autobiography",
  "Optimizing your content analysis... because efficiency is our love language",
  
  // Relatable & Human
  "AI is thinking about your content... it's like having a really smart friend analyze your posts",
  "Processing your Instagram personality... we're basically your personal social media bestie",
  "Analyzing your creative fingerprint... because every creator has a unique style",
  "Decoding your content strategy... we're like your personal Instagram therapist",
  "Unpacking your social media magic... because every post has a story worth telling"
];

// Helper function to parse structured analysis data
const parseAnalysisData = (analysis: any) => {
  if (!analysis || typeof analysis !== 'object') return null;
  
  const metrics = [];
  
  // Parse engagement metrics
  if (analysis.engagement_metrics) {
    const engagementMetrics = analysis.engagement_metrics;
    
    if (engagementMetrics.engagement_rate) {
      metrics.push({
        label: 'Engagement Rate',
        value: engagementMetrics.engagement_rate,
        icon: TrendingUp,
        color: 'text-green-600'
      });
    }
    
    if (engagementMetrics.save_rate) {
      metrics.push({
        label: 'Save Rate',
        value: engagementMetrics.save_rate,
        icon: Bookmark,
        color: 'text-yellow-600'
      });
    }
    
    if (engagementMetrics.share_rate) {
      metrics.push({
        label: 'Share Rate',
        value: engagementMetrics.share_rate,
        icon: Share2,
        color: 'text-blue-600'
      });
    }
    
    if (engagementMetrics.comment_quality) {
      metrics.push({
        label: 'Comment Quality',
        value: engagementMetrics.comment_quality.charAt(0).toUpperCase() + engagementMetrics.comment_quality.slice(1),
        icon: MessageCircle,
        color: 'text-purple-600'
      });
    }
    
    if (engagementMetrics.viral_potential) {
      metrics.push({
        label: 'Viral Potential',
        value: engagementMetrics.viral_potential.charAt(0).toUpperCase() + engagementMetrics.viral_potential.slice(1),
        icon: Zap,
        color: 'text-orange-600'
      });
    }
  }
  
  return {
    metrics,
    contentThemes: analysis.content_themes || [],
    contentType: analysis.content_type || '',
    keyPhrases: analysis.key_phrases || [],
    performanceInsights: analysis.performance_insights || [],
    recommendations: analysis.recommendations || [],
    summary: analysis.summary || ''
  };
};

export const InstagramContent: React.FC<InstagramContentProps> = ({
  postData,
  postId,
  showAnalysis = true,
  onAnalysisGenerated
}) => {
  // Debug: Log the received postData
  console.log('InstagramContent received postData:', postData);
  
  const router = useRouter();
  const { setInstagramContext } = useContentContextActions();
  
  // State for AI analysis generation
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  
  // Carousel state - using content hub logic
  const [currentSlide, setCurrentSlide] = useState(0);
  
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
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, [isGeneratingAnalysis]);
  
  // Extract data from Instagram post structure
  const { data, analysis, analysisMarkdown, mediaType } = postData;
  
  // Debug: Log extracted data
  console.log('Extracted data:', { data, analysis, analysisMarkdown, mediaType });
  
  // Parse structured analysis data
  const parsedAnalysis = parseAnalysisData(analysis);
  
  // Extract statistics from insights
  const insights = data?.insights;
  const likes = insights?.likes || data?.like_count || 0;
  const comments = insights?.comments || data?.comments_count || 0;
  const reach = insights?.reach || 0;
  const impressions = insights?.impressions || 0;
  const saved = insights?.saved || 0;
  const shares = insights?.shares || 0;
  
  // Get media URLs - handle carousel posts
  const mediaUrl = data?.media_url;
  const thumbnailUrl = data?.thumbnail_url;
  const children = data?.children || [];
  
  // Check if this is a carousel post
  const isCarousel = mediaType === 'CAROUSEL_ALBUM' && Array.isArray(children) && children.length > 0;
  
  // Auto-slide effect for carousels (same as content hub)
  useEffect(() => {
    if (!isCarousel || children.length <= 1) return;

    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % children.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(slideInterval);
  }, [isCarousel, children.length]);
  
  // Get caption
  const caption = data?.caption;

  // Get permalink
  const permalink = postData.permalink || data?.permalink || `https://www.instagram.com/p/${postId}`;

  // Calculate engagement rate
  const engagementRate = impressions > 0 ? ((likes + comments) / impressions * 100) : 0;

  // Handle AI analysis generation
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    
    try {
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
      
      setAnalysisError(null);
      setAnalysisSuccess(true);
      
      setAnalysisError('Analysis generated successfully! The new analysis will appear shortly.');
      setTimeout(() => {
        setAnalysisError(null);
        setAnalysisSuccess(false);
      }, 3000);
      
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
      userId: postData.userId || '',
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

    console.log('🔍 [INSTAGRAM CONTENT] Setting Instagram context:', instagramContext);
    setInstagramContext(instagramContext as any);
    
    router.push('/dashboard/chat');
  };

  // Build the stats array
  const stats = [
    { key: 'likes', label: 'Likes', value: likes, icon: <Heart className="w-6 h-6" />, color: 'text-red-500' },
    { key: 'comments', label: 'Comments', value: comments, icon: <MessageCircle className="w-6 h-6" />, color: 'text-blue-500' },
    { key: 'impressions', label: 'Impressions', value: impressions, icon: <Eye className="w-6 h-6" />, color: 'text-green-500' },
    { key: 'reach', label: 'Reach', value: reach, icon: <Users className="w-6 h-6" />, color: 'text-purple-500' },
    { key: 'saved', label: 'Saved', value: saved, icon: <Bookmark className="w-6 h-6" />, color: 'text-yellow-500' },
    { key: 'shares', label: 'Shares', value: shares, icon: <Share2 className="w-6 h-6" />, color: 'text-indigo-500' },
  ];
  const visibleStats = stats.filter(stat => stat.value !== null && stat.value !== undefined);
  const statCount = visibleStats.length;

  const renderStat = (stat: typeof stats[0]) => (
    <div
      key={stat.key}
      className="text-center p-3 bg-muted/50 rounded-lg flex flex-col items-center justify-center"
      aria-label={stat.label}
    >
      <div className={`mb-2 flex justify-center ${stat.color}`}>{stat.icon}</div>
      <div className="text-2xl font-bold">{stat.value === null || stat.value === undefined ? 'N/A' : stat.value.toLocaleString()}</div>
      <div className="text-xs text-muted-foreground">{stat.label}</div>
    </div>
  );

  return (
    <>
      {/* Main Content Layout */}
      <div className="space-y-8">
        {/* Image and Stats Container */}
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Image Section - 60% width on desktop */}
          <div className="lg:col-span-3 space-y-4">
            {/* Post Media */}
            <div className="relative rounded-xl overflow-hidden group">
              <div className="aspect-square lg:aspect-auto lg:min-h-[400px]">
                {isCarousel ? (
                  <div className="relative w-full h-full">
                    {children.map((child: any, idx: number) => (
                      <div
                        key={child.id || idx}
                        className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                          idx === currentSlide 
                            ? 'opacity-100 translate-x-0 scale-100' 
                            : idx < currentSlide 
                              ? 'opacity-0 -translate-x-full scale-95'
                              : 'opacity-0 translate-x-full scale-95'
                        }`}
                      >
                        <img
                          src={child.media_type === 'VIDEO' ? child.thumbnail_url || child.media_url : child.media_url}
                          alt={caption || `Instagram Carousel Item ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => window.open(permalink, '_blank')}
                        />
                      </div>
                    ))}
                    
                    {/* Carousel Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {children.map((_: any, idx: number) => (
                        <button
                          key={idx}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            idx === currentSlide 
                              ? 'bg-white shadow-lg scale-110' 
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                          onClick={() => setCurrentSlide(idx)}
                        />
                      ))}
                    </div>

                    {/* Slide Counter */}
                    <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-white">
                      {currentSlide + 1} / {children.length}
                    </div>
                  </div>
                ) : (
                  <img
                    src={thumbnailUrl || mediaUrl}
                    alt={postData.title || 'Instagram Post'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => window.open(permalink, '_blank')}
                  />
                )}
                
                {/* Hover Overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => window.open(permalink, '_blank')}
                >
                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-full p-4 shadow-lg">
                    <ExternalLink className="w-6 h-6 text-gray-900 dark:text-white" />
                  </div>
                </div>
                
                {/* Media Type Badge */}
                {mediaType && (
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1 text-sm font-medium text-white">
                    {mediaType.replace('_', ' ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Section - 40% width on desktop */}
          <div className="lg:col-span-2 mt-6 lg:mt-0">
            <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm h-full">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Post Statistics
                </h3>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 flex-1">
                  {visibleStats.map((stat) => (
                    <div
                      key={stat.key}
                      className="bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center"
                    >
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2 mx-auto ${stat.color.replace('text-', 'bg-').replace('-500', '-100')} dark:${stat.color.replace('text-', 'bg-').replace('-500', '-900/30')}`}>
                        {React.cloneElement(stat.icon as React.ReactElement, { 
                          className: `w-4 h-4 ${stat.color}` 
                        })}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value === null || stat.value === undefined ? 'N/A' : stat.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                  
                  {/* Date - Always last, spans full width if total stats count is odd */}
                  {postData.createdAt && (
                    <div className={`bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 flex flex-col justify-center ${(visibleStats.length + 1) % 2 === 1 ? 'col-span-2' : 'col-span-1'}`}>
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 mb-2 mx-auto">
                        <Calendar className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {new Date(postData.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Published
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  {isGeneratingAnalysis ? 'Generating...' : 'Generate Analysis'}
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
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500 mx-auto"></div>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-20 animate-pulse"></div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                      {LOADING_MESSAGES[currentMessageIndex]}
                    </p>
                  </div>
                </div>
              ) : (parsedAnalysis || analysis || analysisMarkdown) ? (
                <div className="space-y-6">
                  {/* Summary */}
                  {parsedAnalysis && parsedAnalysis.summary && (
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Summary
                      </h4>
                      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{parsedAnalysis.summary}</p>
                    </div>
                  )}

                  {/* Performance Insights */}
                  {parsedAnalysis && parsedAnalysis.performanceInsights.length > 0 && (
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        Performance Insights
                      </h4>
                      <ul className="space-y-2">
                        {parsedAnalysis.performanceInsights.map((insight, index) => (
                          <li key={index} className="text-sm leading-relaxed flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <span className="text-purple-500 mt-1 flex-shrink-0">•</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {parsedAnalysis && parsedAnalysis.recommendations.length > 0 && (
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Target className="w-4 h-4 text-blue-500" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {parsedAnalysis.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm leading-relaxed flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <span className="text-green-500 mt-1 flex-shrink-0">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Fallback for Markdown Analysis */}
                  {!parsedAnalysis && (analysisMarkdown || analysis) && (
                    <div className="rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Content Analysis
                      </h4>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {analysisMarkdown ? (
                          <MarkdownRenderer content={analysisMarkdown} />
                        ) : typeof analysis === 'string' ? (
                          <MarkdownRenderer content={analysis} />
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
                    Click 'Generate Analysis' to get AI-powered insights about this post's content, engagement, and performance.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleDiscussContent} 
            disabled={!analysis && !analysisMarkdown}
            size="lg"
            className={`flex-1 ${
              !analysis && !analysisMarkdown 
                ? 'opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-black font-medium'
            }`}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {!analysis && !analysisMarkdown ? 'Generate Analysis First' : 'Discuss with Content'}
          </Button>
          
          <Button 
            asChild
            variant="outline" 
            size="lg"
            className="flex-1 border-gray-300 dark:border-gray-600"
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