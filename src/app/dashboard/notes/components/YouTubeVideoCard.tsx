"use client";

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Youtube, 
  ExternalLink,
  Play,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  X,
  BarChart3,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  // Fetch video data
  const videoData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: `youtube:${videoId}`,
    userId: userId || ''
  });

  const [isExpanded, setIsExpanded] = useState(false);

  if (!videoData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Loading Video...</h3>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full h-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getEngagementRate = () => {
    if (!videoData.statistics) return 0;
    const views = videoData.statistics.views || 0;
    const likes = videoData.statistics.likes || 0;
    return views > 0 ? ((likes / views) * 100).toFixed(2) : '0';
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
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

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-blue-500" />
                <span>{formatNumber(videoData.statistics?.views || 0)} views</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{formatNumber(videoData.statistics?.likes || 0)} likes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="w-4 h-4 text-green-500" />
                <span>{formatNumber(videoData.statistics?.comments || 0)} comments</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-purple-500" />
                <span>{getEngagementRate()}% engagement</span>
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

          {/* Analytics Section */}
          {isExpanded && (
            <div className="w-full lg:w-80 border-l bg-muted/30 p-4">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Performance Analytics
              </h4>
              
              <div className="space-y-4">
                {/* Engagement Metrics */}
                <div className="bg-background rounded-lg p-3">
                  <h5 className="text-sm font-medium mb-2">Engagement Metrics</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Engagement Rate</span>
                      <span className="font-medium">{getEngagementRate()}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Like/View Ratio</span>
                      <span className="font-medium">
                        {videoData.statistics?.views ? 
                          ((videoData.statistics.likes || 0) / videoData.statistics.views * 100).toFixed(3) + '%' : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Comment/View Ratio</span>
                      <span className="font-medium">
                        {videoData.statistics?.views ? 
                          ((videoData.statistics.comments || 0) / videoData.statistics.views * 100).toFixed(3) + '%' : 
                          '0%'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video Details */}
                <div className="bg-background rounded-lg p-3">
                  <h5 className="text-sm font-medium mb-2">Video Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Published</span>
                      <span>{formatDate(videoData.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Video ID</span>
                      <span className="font-mono text-xs">{videoId}</span>
                    </div>
                  </div>
                </div>

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