import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

import { X, MessageSquare, Instagram, Sparkles, Bot, ExternalLink } from 'lucide-react';
import { getApiKey } from '@/app/lib/api-helpers';
import { InstagramContentItem } from '../types';
import { getMetricsDisplay } from '../utils';
import { Button } from '@/components/ui/button';

interface InstagramModalProps {
  selectedContent: InstagramContentItem;
  userId: string;
  onClose: () => void;
  onDiscussContent: (item: InstagramContentItem) => void;
}

export const InstagramModal: React.FC<InstagramModalProps> = ({
  selectedContent,
  userId,
  onClose,
  onDiscussContent
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoaded, setApiKeyLoaded] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      const key = await getApiKey();
      setApiKey(key);
      setApiKeyLoaded(true);
    };
    fetchApiKey();
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', fetchApiKey);
      return () => window.removeEventListener('focus', fetchApiKey);
    }
  }, []);

  const requestAiAnalysis = async () => {
    if (!apiKeyLoaded) {
      setError('Loading API key...');
      return;
    }
    setLoading(true);
    try {
      if (!apiKey) {
        throw new Error('API key not found. Please log in again.');
      }
      // Get the post ID from the selected content
      const postId = selectedContent.id;
      if (!postId) {
        throw new Error('Invalid Instagram post ID');
      }

      if (!userId) {
        throw new Error('Invalid user ID');
      }

      // Call our API endpoint
      const apiUrl = `${window.location.origin}/api/social/instagram/analyze`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          user_id: userId,
          post_id: postId
        })
      });

      // Read the response data once
      const responseData = await response.json();
      
      // Then check if the response was OK
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to analyze post: ${response.status} ${response.statusText}`);
      }
      
      // Format the analysis for display
      let formattedAnalysis = `AI Analysis for Instagram Post`;
      
      // Extract analysis from the response
      const analysis = responseData.analysis;
      
      if (analysis) {
        // Extract the most relevant parts of the analysis
        if (analysis.content_summary) {
          formattedAnalysis += '\n\n📝 Content Summary:\n' + analysis.content_summary;
        }
        
        if (analysis.performance_analysis) {
          formattedAnalysis += '\n\n📊 Performance Analysis:\n' + analysis.performance_analysis;
        }
        
        if (analysis.audience_insights) {
          formattedAnalysis += '\n\n👥 Audience Insights:\n' + analysis.audience_insights;
        }
        
        if (analysis.recommendations) {
          formattedAnalysis += '\n\n💡 Recommendations:\n' + analysis.recommendations;
        }
        
        // If none of the specific fields are available, show the full analysis
        if (!analysis.content_summary && !analysis.performance_analysis && 
            !analysis.audience_insights && !analysis.recommendations) {
          formattedAnalysis += '\n\n' + JSON.stringify(analysis, null, 2);
        }
      } else {
        // If no specific analysis format, show the raw data
        formattedAnalysis += '\n\n' + JSON.stringify(responseData, null, 2);
      }
      
      // Add metrics summary if not already included in the analysis
      if (selectedContent.metrics) {
        formattedAnalysis += '\n\nMetrics Summary:';
        if (selectedContent.metrics.reach) {
          formattedAnalysis += `\n- Reach: ${selectedContent.metrics.reach.toLocaleString()}`;
        }
        if (selectedContent.metrics.impressions) {
          formattedAnalysis += `\n- Impressions: ${selectedContent.metrics.impressions.toLocaleString()}`;
        }
        if (selectedContent.metrics.likes) {
          formattedAnalysis += `\n- Likes: ${selectedContent.metrics.likes.toLocaleString()}`;
        }
        if (selectedContent.metrics.comments) {
          formattedAnalysis += `\n- Comments: ${selectedContent.metrics.comments.toLocaleString()}`;
        }
      }
      
      setAiAnalysis(formattedAnalysis);
    } catch (error: any) {
      console.error('Error analyzing Instagram post:', error);
      setAiAnalysis(`Error: ${error.message || 'Failed to analyze post. Please try again.'}`);
    } finally {
      setLoading(false);
    }
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
                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
               />
            )}
            <div className="flex-grow">
              <p className="text-sm text-text-gray dark:text-white mb-1 line-clamp-3">{selectedContent.content.text || 'No caption provided.'}</p>
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
              <Button size="sm" onClick={requestAiAnalysis} disabled={loading || !!aiAnalysis}>
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? 'Analyzing...' : (aiAnalysis ? 'Analysis Complete' : 'Request Analysis')}
              </Button>
            </div>
            <Card className="p-4 bg-gradient-to-br from-pink-50 via-purple-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 min-h-[72px] flex flex-col justify-center">
              {aiAnalysis ? (
                <div className="space-y-3">
                  <p className="text-sm text-black dark:text-white whitespace-pre-line">{aiAnalysis}</p>
                  <Button variant="outline" size="sm" onClick={() => setChatOpen(!chatOpen)}>
                    <Bot className="w-4 h-4 mr-2" />
                    {chatOpen ? 'Close Chat' : 'Chat with Analysis'}
                  </Button>
                  {chatOpen && (
                    <div className="mt-2 p-3 border rounded-lg bg-gray-50 dark:bg-gray-700">
                      <p className="text-xs text-text-gray italic">Chat interface placeholder...</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-text-gray text-sm italic text-center">Click 'Request Analysis' to get AI insights.</p>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-800 flex items-center justify-end gap-3 flex-shrink-0">
          <Button onClick={() => onDiscussContent(selectedContent)} className="bg-heycontent-light-yellow hover:bg-heycontent-yellow/90 text-black">
            <MessageSquare className="w-4 h-4 mr-2" />
            Discuss with Content
          </Button>
        </div>
      </div>
    </div>
  );
};