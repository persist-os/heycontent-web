"use client";

import React, { useState } from 'react';
import { Heart, MessageCircle, Eye, Share2, Bookmark, ExternalLink, Instagram, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';
import { getApiKey } from '@/app/lib/api-helpers';

interface InstagramContentProps {
  postData: any;
  postId: string;
  showAnalysis?: boolean;
}

export const InstagramContent: React.FC<InstagramContentProps> = ({
  postData,
  postId,
  showAnalysis = true
}) => {
  // Debug: Log the received postData
  console.log('InstagramContent received postData:', postData);
  
  const router = useRouter();
  const { setInstagramContext } = useContentContextActions();
  
  // State for AI analysis generation
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Extract data from Instagram post structure
  const { data, analysis, analysisMarkdown, mediaType } = postData;
  
  // Debug: Log extracted data
  console.log('Extracted data:', { data, analysis, analysisMarkdown, mediaType });
  
  // Debug: Log the full data structure to see where permalink is
  console.log('Full data structure:', JSON.stringify(data, null, 2));
  
  // Extract statistics from insights
  const insights = data?.insights;
  const likes = insights?.likes || data?.like_count || 0;
  const comments = insights?.comments || data?.comments_count || 0;
  const reach = insights?.reach || 0;
  const impressions = insights?.impressions || 0;
  const saved = insights?.saved || 0;
  const shares = insights?.shares || 0;
  
  // Get media URL
  const mediaUrl = data?.media_url;
  const thumbnailUrl = data?.thumbnail_url;
  
  // Debug: Log media URLs
  console.log('Media URLs:', { mediaUrl, thumbnailUrl });
  
  // Get caption
  const caption = data?.caption;

  // Get permalink - use the permalink from postData (added by InstagramOverlay)
  const permalink = postData.permalink || data?.permalink || `https://www.instagram.com/p/${postId}`;
  
  console.log('Permalink resolution:', {
    postDataPermalink: postData.permalink,
    dataPermalink: data?.permalink,
    finalPermalink: permalink
  });

  // Calculate engagement rate
  const engagementRate = impressions > 0 ? ((likes + comments) / impressions * 100) : 0;

  // Handle AI analysis generation - same logic as InstagramModal
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Extract user_id from the API key (same as InstagramModal)
      const userIdMatch = apiKey.match(/heycontent_([^_]+)_/);
      const extractedUserId = userIdMatch ? userIdMatch[1] : null;
      
      if (!extractedUserId) {
        throw new Error('Invalid API key format');
      }

      const apiUrl = `${window.location.origin}/api/social/instagram/analyze`;
      
      // Prepare the request body
      const requestBody = {
        user_id: extractedUserId,
        post_id: postId,
        format: 'both' // Request both JSON and markdown format
      };
      
      console.log('🚀 Instagram Analysis Request Debug:');
      console.log('📡 URL:', apiUrl);
      console.log('📦 Post ID:', postId);
      console.log('📦 Request Body:', requestBody);
      
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
      
      // Refresh the page to show the new analysis
      window.location.reload();
      
    } catch (error: any) {
      console.error('Error generating Instagram analysis:', error);
      setAnalysisError(error.message || 'Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Handle "Discuss with Content" functionality
  const handleDiscussContent = () => {
    // Create the Instagram context using the same logic as InstagramModal
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
    
    // Navigate to chat
    router.push('/dashboard/chat');
  };

  return (
    <>
      {/* Post and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Post Media */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group">
            {thumbnailUrl || mediaUrl ? (
              <>
                <img
                  src={thumbnailUrl || mediaUrl}
                  alt={postData.title || 'Instagram Post'}
                  className="w-full h-full object-cover"
                  onClick={() => window.open(permalink, '_blank')}
                />
                {/* External link overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(permalink, '_blank')}
                >
                  <div className="bg-pink-600 rounded-full p-4">
                    <ExternalLink className="w-8 h-8 text-white" />
                  </div>
                </div>
                {/* Media type badge */}
                {mediaType && (
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {mediaType.toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Instagram className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Caption */}
              {caption && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Caption</h4>
                  <p className="text-sm leading-relaxed">{caption}</p>
                </div>
              )}

              {/* Media Type */}
              {mediaType && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Media Type</h4>
                  <Badge variant="outline">{mediaType.toUpperCase()}</Badge>
                </div>
              )}

              {/* Published Date */}
              {postData.createdAt && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Published</h4>
                  <p className="text-sm">{new Date(postData.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{likes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{comments.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{shares.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{saved.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded" />
                  <div>
                    <p className="text-sm font-medium">{reach.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {engagementRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Section */}
      {showAnalysis && (
        <>
          <div className="border-t my-8" />
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">AI Analysis</h2>
                <Button 
                  onClick={handleGenerateAnalysis} 
                  disabled={isGeneratingAnalysis}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isGeneratingAnalysis ? 'Generating...' : 'Generate New Analysis'}
                </Button>
              </div>
              
              {analysisError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{analysisError}</p>
                  <Button 
                    onClick={handleGenerateAnalysis}
                    size="sm"
                    className="mt-2 bg-red-500 hover:bg-red-600 text-white"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              <Card>
                <CardContent className="pt-6">
                  {isGeneratingAnalysis ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                      <span className="ml-3 text-sm text-muted-foreground">Generating AI analysis...</span>
                    </div>
                  ) : (analysis || analysisMarkdown) ? (
                    <div className="prose prose-sm max-w-none">
                      {analysisMarkdown ? (
                        <div className="whitespace-pre-wrap">{analysisMarkdown}</div>
                      ) : typeof analysis === 'string' ? (
                        <div className="whitespace-pre-wrap">{analysis}</div>
                      ) : (
                        <pre className="text-sm overflow-x-auto">
                          {JSON.stringify(analysis, null, 2)}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24">
                      <p className="text-muted-foreground text-sm italic text-center">
                        Click 'Generate New Analysis' to get AI insights about this post content.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons - Exact copy from InstagramModal */}
      <div className="flex gap-4 mt-8">
        <Button 
          onClick={handleDiscussContent} 
          disabled={!analysis && !analysisMarkdown}
          className={`${!analysis && !analysisMarkdown ? 'opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300' : 'bg-heycontent-light-yellow hover:bg-heycontent-yellow/90'} text-black`}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          {!analysis && !analysisMarkdown ? 'Generate Analysis First' : 'Discuss with Content'}
        </Button>
        <a href={permalink} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-2" /> View on Instagram
          </Button>
        </a>
      </div>
    </>
  );
}; 