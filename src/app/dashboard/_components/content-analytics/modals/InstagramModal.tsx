import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, Instagram, Sparkles, Bot, ExternalLink } from 'lucide-react';
import { getCurrentUserId, getApiKey } from '@/app/lib/api-helpers';
import { InstagramContentItem } from '../types';
import { getMetricsDisplay } from '../utils';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '../../chat/markdown-renderer';

interface InstagramModalProps {
  selectedContent: InstagramContentItem;
  onClose: () => void;
  onDiscussContent: (item: InstagramContentItem) => void;
}

export const InstagramModal: React.FC<InstagramModalProps> = ({
  selectedContent,
  onClose,
  onDiscussContent
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | null>(null);
  const [isStoredAnalysis, setIsStoredAnalysis] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const postId = selectedContent.id;

  // Extract user ID from the API key on component mount
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
      setUserId(currentUserId);
    }
  }, []);

  // Type for the stored analysis data
  type StoredAnalysis = {
    _id: string;
    postId: string;
    userId: string;
    analysis: any;
    updatedAt?: number;
    _creationTime?: number;
    analysisMarkdown?: string;
  };

  // Query for stored analysis - only if we have both userId and postId
  const storedAnalysisQuery = useQuery(
    api.instagramQueries.getPostAnalysis, 
    userId && postId ? {
      userId: userId,
      postId: postId
    } : 'skip'
  ) as StoredAnalysis | null;

  // Mutation to store analysis
  const storeAnalysisMutation = useMutation(api.instagramMutations.storePostAnalysis);

  // Load stored analysis when component mounts or when storedAnalysisQuery changes
  useEffect(() => {
    if (loading || !storedAnalysisQuery || aiAnalysis) return;
    
    console.log('Loading stored Instagram analysis:', storedAnalysisQuery);
    
    if (storedAnalysisQuery?.analysis || storedAnalysisQuery?.analysisMarkdown) {
      // Prefer markdown over JSON analysis for display
      let storedAnalysisContent = '';
      
      if (storedAnalysisQuery.analysisMarkdown) {
        // Use the dedicated markdown field
        storedAnalysisContent = storedAnalysisQuery.analysisMarkdown;
        console.log('Using stored markdown analysis');
      } else if (storedAnalysisQuery.analysis) {
        const analysisData = storedAnalysisQuery.analysis;
        
        // Handle different analysis data formats for backward compatibility
        if (typeof analysisData === 'string') {
          // If it's already a string, use it as is
          storedAnalysisContent = analysisData;
        } else if (analysisData.markdown) {
          // Handle legacy format where markdown was stored in analysis object
          storedAnalysisContent = analysisData.markdown;
        } else if (analysisData.aiAnalysis) {
          // Handle old JSON format
          storedAnalysisContent = typeof analysisData.aiAnalysis === 'string' 
            ? analysisData.aiAnalysis 
            : JSON.stringify(analysisData.aiAnalysis, null, 2);
        } else {
          // Default case: stringify the entire analysis object
          storedAnalysisContent = JSON.stringify(analysisData, null, 2);
        }
      }
      
      if (storedAnalysisContent) {
        setAiAnalysis(storedAnalysisContent);
        
        // Handle the updatedAt timestamp
        const timestamp = storedAnalysisQuery.updatedAt || storedAnalysisQuery._creationTime || Date.now();
        setAnalysisTimestamp(typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
        setIsStoredAnalysis(true);
      }
    }
  }, [storedAnalysisQuery, loading, aiAnalysis]);

  // Store analysis in Convex
  const storeAnalysisInConvex = async (markdownData: string, analysisData: any = null) => {
    try {
      if (!userId || !postId) {
        console.warn('Cannot store analysis: missing userId or postId');
        return;
      }

      // Prepare the data to store - include both markdown and analysis data
      const dataToStore: any = {
        timestamp: Date.now()
      };

      if (markdownData) {
        dataToStore.markdown = markdownData;
      }

      if (analysisData) {
        dataToStore.analysis = analysisData;
      }

      await storeAnalysisMutation({
        userId: userId,
        postId: postId,
        analysisData: dataToStore
      });

      console.log('Instagram analysis stored successfully in Convex');
    } catch (error) {
      console.error('Error storing Instagram analysis in Convex:', error);
      // Don't throw - storage failure shouldn't break the analysis display
    }
  };

  const requestAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Extract user_id from the API key (similar to YouTube modal)
      const userIdMatch = apiKey.match(/heycontent_([^_]+)_/);
      const extractedUserId = userIdMatch ? userIdMatch[1] : null;
      
      if (!extractedUserId) {
        throw new Error('Invalid API key format');
      }

      // Strip "instagram-" prefix from post ID for backend compatibility
      const cleanPostId = postId.startsWith('instagram-') ? postId.replace('instagram-', '') : postId;

      const apiUrl = `${window.location.origin}/api/social/instagram/analyze`;
      
      // Prepare the request body
      const requestBody = {
        user_id: extractedUserId,
        post_id: cleanPostId, // Use cleaned post ID without "instagram-" prefix
        format: 'both' // Request both JSON and markdown format
      };
      
      // Debug logging to see exactly what we're sending
      console.log('🚀 Instagram Analysis Request Debug:');
      console.log('📡 URL:', apiUrl);
      console.log('📦 Original Post ID:', postId);
      console.log('🧹 Cleaned Post ID:', cleanPostId);
      console.log('📦 Request Body:', requestBody);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      
      // Debug logging to see the response
      console.log('🔍 Instagram Analysis Response:', {
        status: response.status,
        responseData: responseData,
        hasMarkdown: !!responseData.data?.markdown,
        hasJson: !!responseData.data?.json || !!responseData.data
      });
      
      if (!response.ok) {
        throw new Error(responseData.error || `Analysis failed: ${response.status}`);
      }
      
      // Handle the response - Instagram API returns both 'data' and 'markdown' when format is 'both'
      let analysisContent = '';
      let analysisData = null;
      
      if (responseData.status === 'success') {
        // For 'both' format, check for nested data structure
        if (responseData.data?.markdown) {
          analysisContent = responseData.data.markdown;
        } else if (responseData.data?.json) {
          // If we have separate json/markdown fields
          analysisData = responseData.data.json;
          analysisContent = responseData.data.markdown || '';
        } else if (responseData.data) {
          // If data field contains the analysis directly
          analysisData = responseData.data;
        }
        
        // Also check for direct markdown field (backup)
        if (!analysisContent && responseData.markdown) {
          analysisContent = responseData.markdown;
        }
        
        if (!analysisContent && !analysisData) {
          throw new Error('No analysis data received');
        }
      } else {
        throw new Error(responseData.error || 'Analysis failed');
      }
      
      setAiAnalysis(analysisContent);
      setAnalysisTimestamp(Date.now());
      setIsStoredAnalysis(false);
      
      // Store both the markdown and analysis data in Convex
      if (analysisContent || analysisData) {
        storeAnalysisInConvex(analysisContent, analysisData);
      }
      
    } catch (error: any) {
      console.error('Error analyzing Instagram post:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = () => {
    // Create a more suitable title for Instagram content
    const caption = selectedContent.content.text || 'Instagram Post';
    const truncatedTitle = caption.length > 60 
      ? caption.substring(0, 60) + '...' 
      : caption;
    
    const context = {
      platform: 'instagram',
      contentId: postId,
      title: truncatedTitle, // Use truncated caption as title
      fullCaption: selectedContent.content.text, // Include full caption separately
      analysis: aiAnalysis,
      metrics: selectedContent.metrics,
      // Additional context for better chat experience
      mediaType: selectedContent.content.mediaType,
      publishedAt: selectedContent.publishedAt,
      thumbnailUrl: selectedContent.content.mediaUrl || selectedContent.content.thumbnailUrl,
      permalink: selectedContent.content.permalink
    };
    
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    window.location.href = `/dashboard/chat?contentContext=${encodedContext}`;
  };

  const mediaUrl = selectedContent.content.mediaUrl || selectedContent.content.thumbnailUrl;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
              <Instagram className="w-5 h-5 text-pink-500" /> Instagram Analytics
            </h2>
            <p className="text-sm text-text-gray dark:text-gray-400">
              Post • {selectedContent.content.mediaType.charAt(0).toUpperCase() + selectedContent.content.mediaType.slice(1)}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {/* Preview */}
          <Card className="p-4 bg-gray-50 dark:bg-gray-800 flex gap-4">
            {mediaUrl && (
               <img
                  src={mediaUrl}
                  alt="Instagram content"
                  className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
               />
            )}
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-black dark:text-white mb-1 line-clamp-3 text-sm leading-relaxed">
                {selectedContent.content.text || 'No caption provided.'}
              </h3>
              <p className="text-xs text-text-gray dark:text-gray-400">
                Published: {new Date(selectedContent.publishedAt).toLocaleString()}
              </p>
              {selectedContent.content.permalink && (
                <a
                  href={selectedContent.content.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-heycontent-purple hover:underline inline-flex items-center gap-1 mt-1"
                >
                  View on Instagram <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </Card>

          {/* Metrics */}
          <div>
            <h3 className="text-base font-medium mb-4 text-black dark:text-white">Performance Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {getMetricsDisplay(selectedContent)}
            </div>
          </div>

          {/* AI Analysis */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-medium text-black dark:text-white">AI Analysis</h3>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={requestAiAnalysis} disabled={loading}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {loading ? 'Analyzing...' : (aiAnalysis ? 'New Analysis' : 'Request Analysis')}
                </Button>
                {analysisTimestamp && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isStoredAnalysis ? 'Saved' : 'Created'}: {new Date(analysisTimestamp).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            
            <Card className="p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 min-h-[120px]">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heycontent-purple"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-600 dark:text-red-400">
                  <p className="text-sm mb-2">Error: {error}</p>
                  <Button size="sm" variant="outline" onClick={requestAiAnalysis}>
                    Try Again
                  </Button>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3">
                  <MarkdownRenderer content={aiAnalysis} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-24">
                  <p className="text-text-gray text-sm italic text-center">
                    Click 'Request Analysis' to get AI insights about this post content.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <Button 
            onClick={navigateToChat} 
            disabled={!aiAnalysis}
            className={`${!aiAnalysis ? 'opacity-50 cursor-not-allowed bg-gray-300 hover:bg-gray-300' : 'bg-heycontent-light-yellow hover:bg-heycontent-yellow/90'} text-black`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {!aiAnalysis ? 'Generate Analysis First' : 'Discuss with AI'}
          </Button>
          {selectedContent.content.permalink && (
            <a href={selectedContent.content.permalink} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" /> View on Instagram
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};