import React, { useState } from 'react';
import { getApiKey } from '@/app/(dashboard)/_components/chat/utils/api-utils';
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
      
      // Call our API endpoint
      const response = await fetch('/api/youtube/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          video_url: videoUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze video');
      }

      const data = await response.json();
      
      // Set the analysis result (adjust based on your backend response format)
      setAiAnalysis(data.analysis || 
        `AI Analysis for "${selectedContent.content.title}":\n\n${data.summary || 'Analysis completed successfully.'}`);
    } catch (error: any) {
      console.error('Error analyzing YouTube video:', error);
      setAiAnalysis(`Error: ${error.message || 'Failed to analyze video. Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const videoId = selectedContent.id; // Assuming ID corresponds to YouTube video ID

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
              <Button size="sm" onClick={requestAiAnalysis} disabled={loading || !!aiAnalysis}>
                <Sparkles className="w-4 h-4 mr-2" />
                {loading ? 'Analyzing...' : (aiAnalysis ? 'Analysis Complete' : 'Request Analysis')}
              </Button>
            </div>
            <Card className="p-4 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 min-h-[72px] flex flex-col justify-center">
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