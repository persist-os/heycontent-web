import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getCurrentUserId, getApiKey } from '@/app/lib/api-helpers';
import { Card } from '@/src/components/ui/card';
import { X, MessageSquare, Youtube, Sparkles, Bot, ExternalLink } from 'lucide-react';
import { YouTubeContentItem } from '../types';
import { getMetricsDisplay } from '../utils';
import { Button } from '@/src/components/ui/button';

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
  const [chatOpen, setChatOpen] = useState(false);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<number | null>(null);
  const [isStoredAnalysis, setIsStoredAnalysis] = useState(false);
  
  // Type for the stored analysis data
  type StoredAnalysis = {
    _id: string;
    videoId: string;
    userId: string;
    analysis: any;
    updatedAt?: number;
    _creationTime?: number;
  };
  
  // We need to extract the user ID from the API key
  const [userId, setUserId] = useState<string | null>(null);
  const videoId = selectedContent.id;
  
  // Extract user ID from the API key on component mount
  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      setUserId(userId);
    }
  }, []);
  
  // Add logging to help debug
  useEffect(() => {
    console.log('YoutubeModal - User ID state:', userId);
    console.log('YoutubeModal - Video ID:', videoId);
  }, [userId, videoId]);
  
  // Only query if we have both userId and videoId
  const storedAnalysisQuery = useQuery(
    api.youtubeQueries.getVideoAnalysis, 
    userId && videoId ? {
      userId: userId,
      videoId: videoId
    } : 'skip'
  ) as StoredAnalysis | null;
  
  // This effect runs when the userId gets set from the API key
  useEffect(() => {
    console.log('YoutubeModal - UserId changed, will attempt to query analysis:', userId);
  }, [userId]);
  
  // Log the query result for debugging
  useEffect(() => {
    console.log('YoutubeModal - Convex Analysis Query Result:', storedAnalysisQuery);
  }, [storedAnalysisQuery]);
  
  // Only retrieve analysis, don't store it

  // Load stored analysis when component mounts or when storedAnalysisQuery changes
  useEffect(() => {
    // Skip if still loading or if we don't have a valid result
    if (loading || !storedAnalysisQuery) return;
    
    console.log('YoutubeModal - Processing stored analysis:', storedAnalysisQuery);
    
    if (storedAnalysisQuery) {
      console.log('YoutubeModal - Analysis object:', storedAnalysisQuery);
      
      if (storedAnalysisQuery.analysis) {
        console.log('YoutubeModal - Analysis data:', storedAnalysisQuery.analysis);
        
        // Format the analysis for display
        let formattedAnalysis = `AI Analysis for "${selectedContent.content.title}":\n\n`;
        
        // Add the actual analysis content
        const analysisData = storedAnalysisQuery.analysis;
        
        // Handle different analysis data formats
        if (typeof analysisData === 'string') {
          // If it's already a string, use it as is
          formattedAnalysis += analysisData;
        } else if (analysisData.aiAnalysis) {
          // Handle the case where analysis has an aiAnalysis field
          formattedAnalysis += typeof analysisData.aiAnalysis === 'string' 
            ? analysisData.aiAnalysis 
            : JSON.stringify(analysisData.aiAnalysis, null, 2);
        } else if (analysisData.content || analysisData.summary) {
          // Handle the case where analysis has content or summary fields
          if (analysisData.content) {
            formattedAnalysis += typeof analysisData.content === 'string' 
              ? analysisData.content 
              : JSON.stringify(analysisData.content, null, 2);
          }
          if (analysisData.summary) {
            formattedAnalysis += '\n\n' + (typeof analysisData.summary === 'string' 
              ? analysisData.summary 
              : JSON.stringify(analysisData.summary, null, 2));
          }
        } else {
          // Default case: stringify the entire analysis object
          formattedAnalysis += JSON.stringify(analysisData, null, 2);
        }
        
        console.log('YoutubeModal - Formatted Analysis:', formattedAnalysis);
        
        setAiAnalysis(formattedAnalysis);
        
        // Handle the updatedAt timestamp, which could be a number or a string
        const timestamp = storedAnalysisQuery.updatedAt || storedAnalysisQuery._creationTime || Date.now();
        setAnalysisTimestamp(typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime());
        
        setIsStoredAnalysis(true);
      }
    }
  }, [storedAnalysisQuery, selectedContent, loading]);

  const requestAiAnalysis = async () => {
    setLoading(true);
    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      // Extract video ID from the YouTube URL
      const videoId = selectedContent.id;
      if (!videoId) {
        throw new Error('Invalid YouTube video ID');
      }

      // Create a video URL from the ID
      const videoUrl = `https://youtu.be/${videoId}`;
      
      // Call our API endpoint - use the current window location origin to handle port changes
      const apiUrl = `${window.location.origin}/api/social/youtube/analyze`;
      console.log('Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          video_url: videoUrl
        })
      });

      // Read the response data once
      const responseData = await response.json();
      console.log('Backend analysis response:', responseData);
      
      // Then check if the response was OK
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to analyze video: ${response.status} ${response.statusText}`);
      }
      
      // If we're here, the response was OK, so use the already parsed data
      const data = responseData;
      
      // Extract all relevant analysis data and format it properly
      const analysisContent = data.analysis || data.content || data.insights?.analysis;
      const summaryContent = data.summary || data.content_summary || data.insights?.summary;
      const keyPointsContent = data.key_points || data.keyPoints || data.insights?.keyPoints;
      const sentimentContent = data.sentiment || data.insights?.sentiment;
      
      // Build a comprehensive analysis display
      let formattedAnalysis = `AI Analysis for "${selectedContent.content.title}":\n\n`;
      
      if (analysisContent) {
        formattedAnalysis += typeof analysisContent === 'string' 
          ? analysisContent 
          : JSON.stringify(analysisContent, null, 2);
      } else if (summaryContent) {
        formattedAnalysis += typeof summaryContent === 'string'
          ? summaryContent
          : JSON.stringify(summaryContent, null, 2);
      }
      
      // Add key points if available
      if (keyPointsContent) {
        formattedAnalysis += '\n\nKey Points:\n';
        if (Array.isArray(keyPointsContent)) {
          keyPointsContent.forEach((point, idx) => {
            formattedAnalysis += `\n${idx + 1}. ${point}`;
          });
        } else if (typeof keyPointsContent === 'string') {
          formattedAnalysis += keyPointsContent;
        } else {
          formattedAnalysis += JSON.stringify(keyPointsContent, null, 2);
        }
      }
      
      // Add sentiment if available
      if (sentimentContent) {
        formattedAnalysis += '\n\nSentiment: ';
        formattedAnalysis += typeof sentimentContent === 'string'
          ? sentimentContent
          : JSON.stringify(sentimentContent, null, 2);
      }
      
      // If we still don't have meaningful content, display the entire response
      if (formattedAnalysis.endsWith(':\n\n')) {
        formattedAnalysis += JSON.stringify(data, null, 2);
      }
      
      // Set the analysis in the component state
      setAiAnalysis(formattedAnalysis);
      const now = Date.now();
      setAnalysisTimestamp(now);
      setIsStoredAnalysis(false);
    } catch (error: any) {
      console.error('Error analyzing YouTube video:', error);
      setAiAnalysis(`Error: ${error.message || 'Failed to analyze video. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // videoId is already declared at the top of the component

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-medium text-black dark:text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" /> YouTube Analytics
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
              className="w-32 h-20 object-cover rounded-lg flex-shrink-0" // Adjusted size for YT thumbnail aspect
            />
            <div className="flex-grow">
              <h3 className="font-medium text-black dark:text-white mb-1 line-clamp-2">{selectedContent.content.title}</h3>
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
            <Card className="p-4 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 min-h-[120px] flex flex-col justify-center">
              {loading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-heycontent-purple"></div>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-3">
                  <p className="text-sm text-black dark:text-white whitespace-pre-line leading-relaxed">{aiAnalysis}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      // Create a modified content item with the analysis included
                      const contentWithAnalysis = {
                        ...selectedContent,
                        aiAnalysis: aiAnalysis // Add the analysis to the content item
                      };
                      // Call onDiscussContent with the enhanced content item
                      onDiscussContent(contentWithAnalysis);
                    }}>
                      <Bot className="w-4 h-4 mr-2" />
                      Chat with Analysis
                    </Button>
                    {videoId && (
                      <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="secondary" size="sm">
                          <Youtube className="w-4 h-4 mr-2" /> Watch Video
                        </Button>
                      </a>
                    )}
                  </div>
                  {/* Chat interface removed as we now redirect to the chat page */}
                </div>
              ) : (
                <p className="text-text-gray text-sm italic text-center">Click 'Request Analysis' to get AI insights about this video content.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <Button 
            onClick={() => {
              // Include analysis in the content item if it exists
              if (aiAnalysis) {
                const contentWithAnalysis = {
                  ...selectedContent,
                  aiAnalysis: aiAnalysis
                };
                onDiscussContent(contentWithAnalysis);
              } else {
                onDiscussContent(selectedContent);
              }
            }} 
            className="bg-heycontent-light-yellow hover:bg-heycontent-yellow/90 text-black"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Discuss with Content
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