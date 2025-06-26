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
import { useRouter } from 'next/navigation';
import { useContentContextActions } from '@/store/content-context-store';

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
  const router = useRouter();
  const { setInstagramContext } = useContentContextActions();

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
      postId: postId // Use post ID directly - no prefix logic needed
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
        console.log('📝 Storing markdown data:', markdownData.substring(0, 100) + '...');
      }

      if (analysisData) {
        dataToStore.analysis = analysisData;
        console.log('📊 Storing analysis data:', analysisData);
      }

      console.log('💾 Final data structure being stored:', {
        hasMarkdown: !!dataToStore.markdown,
        hasAnalysis: !!dataToStore.analysis,
        markdownLength: dataToStore.markdown?.length || 0,
        analysisKeys: dataToStore.analysis ? Object.keys(dataToStore.analysis) : 'none',
        dataToStore: dataToStore
      });

      await storeAnalysisMutation({
        userId: userId,
        postId: postId, // Use post ID directly - no prefix needed since we have dedicated table
        analysisData: dataToStore
      });

      console.log('Instagram analysis stored successfully in Convex with post ID:', postId);
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

      const apiUrl = `${window.location.origin}/api/social/instagram/analyze`;
      
      // Prepare the request body
      const requestBody = {
        user_id: extractedUserId,
        post_id: postId, // Use post ID directly - no cleaning needed
        format: 'both' // Request both JSON and markdown format
      };
      
      // Debug logging to see exactly what we're sending
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

      const responseData = await response.json();
      
      // Debug logging to see the response
      console.log('🔍 Instagram Analysis Response:', {
        status: response.status,
        responseData: responseData,
        hasMarkdown: !!responseData.data?.markdown,
        hasJson: !!responseData.data?.json || !!responseData.data,
        dataStructure: {
          topLevel: Object.keys(responseData),
          dataLevel: responseData.data ? Object.keys(responseData.data) : 'no data field',
          markdownType: typeof responseData.data?.markdown,
          jsonType: typeof responseData.data?.json,
          directAnalysisType: typeof responseData.analysis
        }
      });
      
      if (!response.ok) {
        throw new Error(responseData.error || `Analysis failed: ${response.status}`);
      }
      
      // Handle the response - Instagram API returns both 'data' and 'markdown' when format is 'both'
      let analysisContent = '';
      let analysisData = null;
      
      if (responseData.status === 'success') {
        // For 'both' format, check for nested data structure
        if (responseData.data?.markdown && responseData.data?.json) {
          // Expected format for 'both': { data: { json: {...}, markdown: "..." } }
          analysisData = responseData.data.json;
          analysisContent = responseData.data.markdown;
          console.log('✅ Found both JSON and markdown in responseData.data');
        } else if (responseData.data?.markdown) {
          // Markdown only format
          analysisContent = responseData.data.markdown;
          console.log('✅ Found markdown in responseData.data');
        } else if (responseData.data?.json) {
          // JSON only format  
          analysisData = responseData.data.json;
          console.log('✅ Found JSON in responseData.data');
        } else if (responseData.data && typeof responseData.data === 'object' && !responseData.data.markdown && !responseData.data.json) {
          // If data field contains the analysis directly (fallback for JSON format)
          analysisData = responseData.data;
          console.log('✅ Using responseData.data directly as analysis');
        }
        
        // Also check for direct markdown field at top level (backup)
        if (!analysisContent && responseData.markdown) {
          analysisContent = responseData.markdown;
          console.log('✅ Found markdown at top level');
        }
        
        // Also check for direct data as analysis at top level (backup)
        if (!analysisData && responseData.analysis) {
          analysisData = responseData.analysis;
          console.log('✅ Found analysis at top level');
        }
        
        if (!analysisContent && !analysisData) {
          console.error('❌ No valid analysis data found in response:', responseData);
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
    // Use the full Convex document if available, otherwise create a fallback
    if (selectedContent.convexData) {
      // Use the complete Convex document with all fields
      console.log('🔍 [INSTAGRAM MODAL] Using full Convex document:', {
        hasData: !!selectedContent.convexData.data,
        dataKeys: selectedContent.convexData.data ? Object.keys(selectedContent.convexData.data) : 'none',
        hasComments: !!selectedContent.convexData.data?.comments,
        commentsLength: selectedContent.convexData.data?.comments?.length || 0,
        hasInsights: !!selectedContent.convexData.data?.insights,
        insightsKeys: selectedContent.convexData.data?.insights ? Object.keys(selectedContent.convexData.data.insights) : 'none',
        fullConvexData: selectedContent.convexData
      });
      
      // Update the analysis markdown if we have fresh analysis
      const updatedConvexData = {
        ...selectedContent.convexData,
        analysisMarkdown: aiAnalysis || selectedContent.analysisMarkdown || selectedContent.convexData.analysisMarkdown
      };
      
      setInstagramContext(updatedConvexData);
    } else {
      // Fallback to creating a mock object (shouldn't happen with proper data)
      console.warn('🔍 [INSTAGRAM MODAL] No convexData available, using fallback mock object');
      
      const convexInstagramPost = {
        _id: selectedContent.id as any,
        _creationTime: Date.now(),
        userId: userId || '',
        instagramAccountId: '',
        postId: selectedContent.id,
        mediaType: selectedContent.content.mediaType,
        data: {
          id: selectedContent.id,
          caption: selectedContent.content.text || '',
          media_url: selectedContent.content.mediaUrl || '',
          permalink: selectedContent.content.permalink || '',
          timestamp: new Date(selectedContent.publishedAt || Date.now()).getTime(),
          username: '',
          like_count: selectedContent.metrics?.likes || selectedContent.metrics?.like_count || 0,
          comments_count: selectedContent.metrics?.comments || selectedContent.metrics?.comments_count || 0,
          thumbnail_url: selectedContent.content.thumbnailUrl || null,
          children: selectedContent.children || null,
          comments: selectedContent.content.comments || [],
          insights: selectedContent.metrics || null,
        },
        analysis: selectedContent.analysis || null,
        analysisMarkdown: aiAnalysis || selectedContent.analysisMarkdown || null,
        createdAt: new Date(selectedContent.publishedAt || Date.now()).getTime(),
        updatedAt: Date.now(),
      };

      setInstagramContext(convexInstagramPost as any);
    }
    
    // Navigate to chat
    router.push('/dashboard/chat');
  };

  const mediaUrl = selectedContent.content.mediaUrl || selectedContent.content.thumbnailUrl;

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
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