"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Youtube, 
  ArrowLeft,
  Calendar,
  Users,
  Play,
  ExternalLink,
  FileText,
  Lightbulb,
  Target,
  TrendingUp,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

export default function YouTubeAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  
  const videoId = params.videoId as string;

  // Fetch video data using the direct YouTube query
  const videoData = useQuery(api.youtubeQueries.getFullVideoDetails, {
    videoId: videoId,
    userId: userId || ''
  });

  // Debug logging
  console.log('YouTube Analysis Page Debug:', {
    videoId,
    userId,
    videoData,
    hasAnalysisMarkdown: !!videoData?.analysisMarkdown,
    analysisMarkdownLength: videoData?.analysisMarkdown?.length,
    analysisMarkdownPreview: videoData?.analysisMarkdown?.substring(0, 100)
  });

  if (!videoData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
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
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (duration: string) => {
    // Convert YouTube duration format (PT4M13S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Youtube className="w-8 h-8 text-red-500" />
                <div>
                  <h1 className="text-2xl font-bold">{videoData.snippet?.title || 'YouTube Video'}</h1>
                  <p className="text-muted-foreground">YouTube Video Analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Video and Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Video */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group">
                  {videoData.snippet?.thumbnails?.high || videoData.snippet?.thumbnails?.medium ? (
                    <>
                      <img
                        src={videoData.snippet.thumbnails.high || videoData.snippet.thumbnails.medium}
                        alt={videoData.snippet?.title || 'YouTube Video'}
                        className="w-full h-full object-cover"
                      />
                      {/* Play overlay */}
                      <div 
                        className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => window.open(videoData.url || `https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                      >
                        <div className="bg-red-600 rounded-full p-4">
                          <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                      </div>
                      {/* Duration badge */}
                      {videoData.content_details?.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {formatDuration(videoData.content_details.duration)}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="p-4 space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-3">{videoData.snippet?.description || ''}</p>

                  {videoData.snippet?.tags && videoData.snippet.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {videoData.snippet.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Video Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.views || 0)}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.likes || 0)}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.comments || 0)}</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">
                      {videoData.content_details?.duration ? formatDuration(videoData.content_details.duration) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                </div>

                {/* Publication Date */}
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                  <div className="text-sm font-medium">
                    {formatDate(videoData.snippet?.published_at ? new Date(videoData.snippet.published_at).getTime() : videoData.createdAt)}
                  </div>
                  <div className="text-xs text-muted-foreground">Published</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Analysis Section */}
        <Card>
          <CardHeader>
            <CardTitle>Content Analysis</CardTitle>
            <CardDescription>AI-powered insights about your video content</CardDescription>
          </CardHeader>
          <CardContent>
            {videoData.analysisMarkdown ? (
              renderAnalysisContent(videoData.analysisMarkdown)
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No content analysis available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 