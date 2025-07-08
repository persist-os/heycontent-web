"use client";

import React from 'react';
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
  Users,
  Activity,
  Eye,
  Heart,
  MessageCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/app/dashboard/chat/markdown-renderer';

interface ChatOverlayProps {
  contentType: 'youtube' | 'insight' | 'note';
  contentId: string;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  contentType,
  contentId,
  onClose
}) => {
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;

  // Fetch content data based on type
  const contentData = useQuery(
    contentType === 'youtube' 
      ? api.youtubeQueries.getFullVideoDetails
      : contentType === 'insight'
      ? api.notes.getContentByPrefixedId
      : api.notes.getContentByPrefixedId,
    {
      ...(contentType === 'youtube' 
        ? { videoId: contentId, userId: userId || '' }
        : { prefixedId: `${contentType}:${contentId}`, userId: userId || '' }
      )
    }
  );

  if (!contentData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <h3 className="text-lg font-semibold">Loading...</h3>
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

  // Helper function to get grid classes based on item count
  const getGridClasses = (itemCount: number) => {
    if (itemCount === 0) return "grid grid-cols-1 gap-4";
    if (itemCount === 1) return "grid grid-cols-1 gap-4";
    if (itemCount === 2) return "grid grid-cols-2 gap-4";
    if (itemCount === 3) return "grid grid-cols-2 gap-4";
    if (itemCount === 4) return "grid grid-cols-2 gap-4";
    if (itemCount === 5) return "grid grid-cols-2 gap-4";
    return "grid grid-cols-2 gap-4"; // Default for 6+ items
  };

  // Helper function to get item classes based on position and total count
  const getItemClasses = (index: number, totalCount: number) => {
    if (totalCount === 1) return "col-span-1";
    if (totalCount === 2) return "col-span-1";
    if (totalCount === 3 && index === 2) return "col-span-2"; // Last item spans full width
    if (totalCount === 4) return "col-span-1";
    if (totalCount === 5 && index === 4) return "col-span-2"; // Last item spans full width
    return "col-span-1"; // Default
  };

  // Render YouTube content
  if (contentType === 'youtube') {
    const videoData = contentData as any;
    const videoId = contentId;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Youtube className="w-8 h-8 text-red-500" />
                    <div>
                      <h1 className="text-2xl font-bold">{videoData.snippet?.title || 'YouTube Video'}</h1>
                      <p className="text-muted-foreground">YouTube Video Analysis</p>
                    </div>
                  </div>
                </div>
                <button
                  title="Close"
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-6 overflow-y-auto flex-1">
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
                    {(() => {
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
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analysis Section */}
            {videoData.analysisMarkdown && (
              <Card>
                <CardHeader>
                  <CardTitle>Content Analysis</CardTitle>
                  <CardDescription>AI-powered insights about your video content</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderAnalysisContent(videoData.analysisMarkdown)}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render insight content
  if (contentType === 'insight') {
    const insightData = contentData as any;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-8 h-8 text-yellow-500" />
                    <div>
                      <h1 className="text-2xl font-bold">{insightData.title || 'Content Insight'}</h1>
                      <p className="text-muted-foreground">AI-Generated Insight</p>
                    </div>
                  </div>
                </div>
                <button
                  title="Close"
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-6 overflow-y-auto flex-1">
            {/* Insight Content */}
            <Card>
              <CardHeader>
                <CardTitle>Insight Analysis</CardTitle>
                <CardDescription>AI-powered analysis of your content</CardDescription>
              </CardHeader>
              <CardContent>
                {insightData.content ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Analysis
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        <MarkdownRenderer content={insightData.content} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No analysis available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Render note content
  if (contentType === 'note') {
    const noteData = contentData as any;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div>
                      <h1 className="text-2xl font-bold">{noteData.title || 'Smart Note'}</h1>
                      <p className="text-muted-foreground">Smart Note</p>
                    </div>
                  </div>
                </div>
                <button
                  title="Close"
                  onClick={onClose}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto p-6 overflow-y-auto flex-1">
            {/* Note Content */}
            <Card>
              <CardHeader>
                <CardTitle>Note Content</CardTitle>
                <CardDescription>Your smart note content</CardDescription>
              </CardHeader>
              <CardContent>
                {noteData.content ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Content
                      </h4>
                      <div className="text-sm text-muted-foreground">
                        <MarkdownRenderer content={noteData.content} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No content available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 