"use client";

import React from 'react';
import { 
  Youtube, 
  Play,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Calendar,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';
import { 
  formatNumber, 
  formatDate, 
  formatDuration, 
  getGridClasses, 
  getItemClasses 
} from '@/lib/content-utils';
import { Button } from '@/components/ui/button';
import { getApiKey } from '@/app/lib/api-helpers';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface YouTubeContentProps {
  videoData: any;
  videoId: string;
  userId: string;
  showAnalysis?: boolean;
}

// Add YouTube loading messages (can be YouTube/creator themed)
const LOADING_MESSAGES = [
  "Analyzing your YouTube magic... even AI needs to understand your channel's vibe!",
  "Teaching our AI about your video style... it's learning, we promise!",
  "Processing your YouTube genius... this is like speed-watching your playlist",
  "Decoding your YouTube algorithm... because we're nosy about what makes your videos pop",
  "AI is getting to know your brand... it's like a first date, but with data",
  "Fetching your YouTube insights... this might take a moment, but good things come to those who wait",
  "Crunching numbers and analyzing engagement... we're doing the heavy lifting so you don't have to",
  "Deep-diving into your content strategy... because surface-level insights are so 2020",
  "Processing your video brilliance... we're basically your personal content detective",
  "Mining your YouTube gold... because every video has a story to tell",
  "Analyzing your creative genius... because every upload is a masterpiece in the making",
  "Decoding your YouTube success... we're basically your personal video therapist",
  "Unpacking your content strategy... it's like reading your diary, but with analytics",
  "Mapping your audience connection... because engagement is just friendship with data",
  "Processing your YouTube personality... we're getting to know the real you (digitally)",
  "YouTube analysis in progress... even AI needs to understand your thumbnail game",
  "Decoding your YouTube story... we're basically your personal content whisperer",
  "Mining your channel gold... every like, comment, and share tells a story",
  "Analyzing your storytelling... because a video is worth a thousand insights",
  "Processing your YouTube algorithm... we're basically your personal video fortune teller",
  "Preparing your content insights... because every creator deserves to understand their impact",
  "Unlocking your YouTube potential... we're here to help you shine brighter",
  "Mapping your audience connection... because your content deserves to be seen",
  "Analyzing your creative journey... every upload is a step toward your goals",
  "Processing your growth story... because your YouTube journey is worth celebrating",
  "Running YouTube analysis protocols... our AI is having a moment with your content",
  "Processing your channel DNA... we're basically your personal content scientist",
  "Syncing with YouTube's algorithm... because we speak fluent creator",
  "Compiling your content insights... this is like speed-watching your YouTube autobiography",
  "Optimizing your content analysis... because efficiency is our love language",
  "AI is thinking about your videos... it's like having a really smart friend analyze your uploads",
  "Processing your YouTube personality... we're basically your personal video bestie",
  "Analyzing your creative fingerprint... because every creator has a unique style",
  "Decoding your content strategy... we're like your personal YouTube therapist",
  "Unpacking your channel magic... because every video has a story worth telling"
];

export const YouTubeContent: React.FC<YouTubeContentProps> = ({
  videoData,
  videoId,
  showAnalysis = true
}) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = React.useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);

  // Get the storeVideoAnalysis mutation
  const storeVideoAnalysis = useMutation(api.youtubeMutations.storeVideoAnalysis);

  // Cycling loading message effect
  React.useEffect(() => {
    if (!isGeneratingAnalysis) {
      setCurrentMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setCurrentMessageIndex(prevIndex => (prevIndex + 1) % LOADING_MESSAGES.length);
    }, 5000); // Switch every 5 seconds
    return () => clearInterval(interval);
  }, [isGeneratingAnalysis]);

  // Helper function to render analysis content
  const renderAnalysisContent = (analysisMarkdown: string) => {
    if (!analysisMarkdown) return null;
    
    return (
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Analysis
          </h4>
          <div className="text-sm text-muted-foreground">
            <MarkdownRenderer content={analysisMarkdown} />
          </div>
        </div>
      </div>
    );
  };

  // Handle YouTube analysis generation
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    try {
      console.log('[YouTube Analysis] Starting analysis for videoId:', videoId);
      const apiKey = await getApiKey();
      console.log('[YouTube Analysis] Retrieved API key:', apiKey ? '[REDACTED]' : 'MISSING');
      if (!apiKey) throw new Error('API key missing. Please connect your YouTube account or log in again.');
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const payload = { 
        video_url: videoUrl,
        force_refresh: true // Force refresh the analysis
      };
      console.log('[YouTube Analysis] Sending request to /api/social/youtube/analyze', payload);
      const response = await fetch('/api/social/youtube/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      console.log('[YouTube Analysis] Response status:', response.status);
      const data = await response.json().catch(() => ({}));
      console.log('[YouTube Analysis] Response data:', data);
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to start analysis.');
      }

      // Store the analysis in Convex
      if (data.markdown || data.analysis) {
        console.log('[YouTube Analysis] Storing analysis in Convex...');
        try {
          // Extract userId from the API key
          const apiKeyParts = apiKey.split('_');
          const userId = apiKeyParts.length >= 2 ? apiKeyParts[1] : null;
          
          if (!userId) {
            console.warn('[YouTube Analysis] Could not extract userId from API key');
          } else {
            const analysisData = {
              markdown: data.markdown,
              analysis: data.analysis || data
            };
            
            const result = await storeVideoAnalysis({
              userId,
              videoId,
              analysisData
            });
            
            console.log('[YouTube Analysis] Analysis stored in Convex:', result);
          }
        } catch (storeError) {
          console.error('[YouTube Analysis] Error storing analysis in Convex:', storeError);
          // Don't fail the whole operation if storage fails
        }
      }

      setAnalysisSuccess(true);
    } catch (err: any) {
      console.error('[YouTube Analysis] Error:', err);
      setAnalysisError(err.message || 'Unknown error');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Build array of available stat items
  const statItems = [];
  
  if (videoData.statistics?.views !== undefined) {
    statItems.push({
      icon: <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />,
      value: formatNumber(videoData.statistics.views),
      label: "Views"
    });
  }
  
  if (videoData.statistics?.likes !== undefined) {
    statItems.push({
      icon: <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />,
      value: formatNumber(videoData.statistics.likes),
      label: "Likes"
    });
  }
  
  if (videoData.statistics?.comments !== undefined) {
    statItems.push({
      icon: <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />,
      value: formatNumber(videoData.statistics.comments),
      label: "Comments"
    });
  }
  
  if (videoData.content_details?.duration) {
    statItems.push({
      icon: <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />,
      value: formatDuration(videoData.content_details.duration),
      label: "Duration"
    });
  }
  
  if (videoData.snippet?.published_at) {
    statItems.push({
      icon: <Calendar className="w-6 h-6 text-orange-500 mx-auto mb-2" />,
      value: formatDate(new Date(videoData.snippet.published_at).getTime()),
      label: "Published"
    });
  }

  return (
    <>
      {/* Video and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Video */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group">
            {videoData.snippet?.thumbnails?.high || videoData.snippet?.thumbnails?.medium ? (
              <>
                <img
                  src={videoData.snippet.thumbnails.high || videoData.snippet.thumbnails.medium}
                  alt={videoData.snippet?.title || 'YouTube Video'}
                  className="w-full h-full object-cover"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                />
                {/* Play overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                >
                  <div className="bg-red-600 rounded-full p-4">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Video Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={getGridClasses(statItems.length)}>
                {statItems.map((item, index) => (
                  <div 
                    key={index}
                    className={`text-center p-3 bg-muted/50 rounded-lg ${getItemClasses(index, statItems.length)}`}
                  >
                    {item.icon}
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Button Section */}
      <div className="flex flex-col items-center mb-6">
        <Button
          onClick={handleGenerateAnalysis}
          disabled={isGeneratingAnalysis}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-sm w-full max-w-xs"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {isGeneratingAnalysis ? 'Generating...' : 'Analysis'}
        </Button>
        {analysisError && !isGeneratingAnalysis && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg w-full max-w-xs text-center">
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">{analysisError}</p>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      {showAnalysis && (
        <Card className="w-full min-w-0 flex flex-col">
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
            <CardDescription>AI-powered insights about your video content</CardDescription>
          </CardHeader>
          <CardContent>
            {isGeneratingAnalysis ? (
              <div className="flex flex-col items-center justify-center py-8 w-full">
                <div className="relative w-64 h-8 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-60 animate-pulse"></div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed text-center">
                  {LOADING_MESSAGES[currentMessageIndex]}
                </p>
              </div>
            ) : (
              videoData.analysisMarkdown && renderAnalysisContent(videoData.analysisMarkdown)
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}; 