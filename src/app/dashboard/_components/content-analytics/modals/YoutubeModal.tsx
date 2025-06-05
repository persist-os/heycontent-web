import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, Sparkles, Bot, ExternalLink } from 'lucide-react';
import { getCurrentUserId, getApiKey } from '@/app/lib/api-helpers';
import { YouTubeContentItem } from '../types';
import { getMetricsDisplay } from '../utils';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '../../chat/markdown-renderer';
import { YouTubeBrandIcon } from '../../YoutubeBrandIcon';

interface YoutubeModalProps {
  selectedContent: YouTubeContentItem;
  onClose: () => void;
  onDiscussContent: (item: YouTubeContentItem) => void;
}

export const YoutubeModal: React.FC<YoutubeModalProps> = ({
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

  const videoId = selectedContent.id;

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
    videoId: string;
    userId: string;
    analysis: any;
    updatedAt?: number;
    _creationTime?: number;
  };

  // Query for stored analysis - only if we have both userId and videoId
  const storedAnalysisQuery = useQuery(
    api.youtubeQueries.getVideoAnalysis, 
    userId && videoId ? {
      userId: userId,
      videoId: videoId
    } : 'skip'
  ) as StoredAnalysis | null;

  // Mutation to store analysis
  const storeAnalysisMutation = useMutation(api.youtubeMutations.storeVideoAnalysis);

  // Load stored analysis when component mounts or when storedAnalysisQuery changes
  useEffect(() => {
    if (loading || !storedAnalysisQuery || aiAnalysis) return;
    
    console.log('Loading stored analysis:', storedAnalysisQuery);
    
    if (storedAnalysisQuery?.analysis) {
      const analysisData = storedAnalysisQuery.analysis;
      
      // Handle different analysis data formats - prioritize markdown format
      let storedAnalysisContent = '';
      
      if (typeof analysisData === 'string') {
        // If it's already a string, use it as is
        storedAnalysisContent = analysisData;
      } else if (analysisData.markdown) {
        // Prefer markdown format if available
        storedAnalysisContent = analysisData.markdown;
      } else if (analysisData.aiAnalysis) {
        // Handle legacy format
        storedAnalysisContent = typeof analysisData.aiAnalysis === 'string' 
          ? analysisData.aiAnalysis 
          : JSON.stringify(analysisData.aiAnalysis, null, 2);
      } else {
        // Default case: stringify the entire analysis object
        storedAnalysisContent = JSON.stringify(analysisData, null, 2);
      }
      
      setAiAnalysis(storedAnalysisContent);
      
      // Handle the updatedAt timestamp
      const timestamp = storedAnalysisQuery.updatedAt || storedAnalysisQuery._creationTime || Date.now();
      setAnalysisTimestamp(typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
      setIsStoredAnalysis(true);
    }
  }, [storedAnalysisQuery, loading, aiAnalysis]);

  // Store analysis in Convex
  const storeAnalysisInConvex = async (analysisData: string) => {
    try {
      if (!userId || !videoId) {
        console.warn('Cannot store analysis: missing userId or videoId');
        return;
      }

      await storeAnalysisMutation({
        userId: userId,
        videoId: videoId,
        analysisData: {
          markdown: analysisData, // Store the raw markdown with delimiters
          timestamp: Date.now()
        }
      });

      console.log('Analysis stored successfully in Convex');
    } catch (error) {
      console.error('Error storing analysis in Convex:', error);
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

      const videoUrl = `https://youtu.be/${videoId}`;
      const apiUrl = `${window.location.origin}/api/social/youtube/analyze`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          video_url: videoUrl,
          format: 'markdown' // Request markdown format directly
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `Analysis failed: ${response.status}`);
      }
      
      // Handle the markdown response
      let analysisContent = '';
      if (responseData.markdown) {
        analysisContent = responseData.markdown;
      } else if (responseData.status === 'success' && responseData.data) {
        // Fallback for other response formats
        analysisContent = JSON.stringify(responseData.data, null, 2);
      } else {
        throw new Error('No analysis data received');
      }
      
      setAiAnalysis(analysisContent);
      setAnalysisTimestamp(Date.now());
      setIsStoredAnalysis(false);
      
      // Store the analysis in Convex asynchronously
      storeAnalysisInConvex(analysisContent);
      
    } catch (error: any) {
      console.error('Error analyzing YouTube video:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToChat = () => {
    const context = {
      platform: 'youtube',
      contentId: videoId,
      title: selectedContent.content?.title,
      analysis: aiAnalysis,
      metrics: selectedContent.metrics
    };
    
    const encodedContext = encodeURIComponent(JSON.stringify(context));
    window.location.href = `/dashboard/chat?contentContext=${encodedContext}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
              <YouTubeBrandIcon size={24} className="mr-2" /> YouTube Analytics
            </h2>
            <p className="text-sm text-text-gray dark:text-gray-400">
              Video • {selectedContent.content.channelTitle || 'Channel Unknown'}
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
            <img
              src={selectedContent.content.thumbnailUrl}
              alt="YouTube video thumbnail"
              className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-grow">
              <h3 className="font-medium text-black dark:text-white mb-1 line-clamp-2">
                {selectedContent.content.title}
              </h3>
              <p className="text-xs text-text-gray dark:text-gray-400">
                Published: {new Date(selectedContent.publishedAt).toLocaleString()}
              </p>
              <a
                href={`https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-heycontent-purple hover:underline inline-flex items-center gap-1 mt-1"
              >
                View on YouTube <ExternalLink className="w-3 h-3" />
              </a>
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
            
            <Card className="p-4 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 min-h-[120px]">
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
                    Click 'Request Analysis' to get AI insights about this video content.
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
            {!aiAnalysis ? 'Generate Analysis to Chat' : 'Discuss with Content'}
          </Button>
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" /> View on YouTube
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};