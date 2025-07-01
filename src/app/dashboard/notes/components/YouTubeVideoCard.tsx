"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Youtube, 
  ExternalLink,
  Play,
  Calendar,
  X,
  BarChart3,
  TrendingUp,
  FileText,
  Lightbulb,
  Target,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface YouTubeVideoCardProps {
  videoId: string;
  onClose: () => void;
  onOpenAnalysis?: (videoId: string) => void;
}

export const YouTubeVideoCard: React.FC<YouTubeVideoCardProps> = ({
  videoId,
  onClose,
  onOpenAnalysis
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  const router = useRouter();

  // Fetch video data
  const videoData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: `youtube:${videoId}`,
    userId: userId || ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Directly navigate to the analysis page
  React.useEffect(() => {
    if (onOpenAnalysis) {
      onOpenAnalysis(videoId);
    } else {
      // Fallback: navigate directly to the analysis page
      router.push(`/dashboard/notes/youtube-analysis/${videoId}`);
    }
    // Close the modal after navigation
    onClose();
  }, [videoId, onOpenAnalysis, router, onClose]);

  if (!videoData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Opening Analysis...</h3>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Helper function to render analysis content
  const renderAnalysisContent = (analysis: any) => {
    if (!analysis) return null;
    
    // Handle different analysis formats
    if (typeof analysis === 'string') {
      return (
        <div className="bg-background rounded-lg p-3">
          <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Content Analysis
          </h5>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {analysis}
          </p>
        </div>
      );
    }
    
    if (typeof analysis === 'object') {
      return (
        <div className="space-y-3">
          {analysis.keyInsights && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Key Insights
              </h5>
              <p className="text-sm text-muted-foreground">
                {analysis.keyInsights}
              </p>
            </div>
          )}
          
          {analysis.contentSummary && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Content Summary
              </h5>
              <p className="text-sm text-muted-foreground">
                {analysis.contentSummary}
              </p>
            </div>
          )}
          
          {analysis.targetAudience && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Audience
              </h5>
              <p className="text-sm text-muted-foreground">
                {analysis.targetAudience}
              </p>
            </div>
          )}
          
          {analysis.recommendations && (
            <div className="bg-background rounded-lg p-3">
              <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </h5>
              <p className="text-sm text-muted-foreground">
                {analysis.recommendations}
              </p>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        "bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden",
        isExpanded ? "w-full max-w-6xl" : ""
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Youtube className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold">YouTube Video Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            {onOpenAnalysis && (
              <button
                onClick={() => onOpenAnalysis(videoId)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Analysis
              </button>
            )}
            <button
              title="Toggle Analysis"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              title="Close"
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row h-full">
          {/* Video Section */}
          <div className="flex-1 p-4">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
              {videoData.thumbnailUrl ? (
                <img
                  src={videoData.thumbnailUrl}
                  alt={videoData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-semibold mb-2 line-clamp-2">
              {videoData.title}
            </h2>
            
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
              {videoData.content}
            </p>

            {/* Video Details */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Published {formatDate(videoData.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Video ID: {videoId}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => window.open(videoData.url || `https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Watch on YouTube
              </button>
              <button
                onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
            </div>
          </div>

          {/* Analysis Section */}
          {isExpanded && (
            <div className="w-full lg:w-80 border-l bg-muted/30 p-4 overflow-y-auto">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Content Analysis
              </h4>
              
              <div className="space-y-4">
                {/* Textual Analysis */}
                {videoData.analysis ? (
                  renderAnalysisContent(videoData.analysis)
                ) : (
                  <div className="bg-background rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">
                      No analysis available for this video.
                    </p>
                  </div>
                )}

                {/* Tags */}
                {videoData.tags && videoData.tags.length > 0 && (
                  <div className="bg-background rounded-lg p-3">
                    <h5 className="text-sm font-medium mb-2">Tags</h5>
                    <div className="flex flex-wrap gap-1">
                      {videoData.tags.slice(0, 8).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-accent/20 text-accent-foreground px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {videoData.tags.length > 8 && (
                        <span className="text-xs text-muted-foreground">
                          +{videoData.tags.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 