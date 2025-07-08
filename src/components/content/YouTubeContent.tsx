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
  FileText
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

interface YouTubeContentProps {
  videoData: any;
  videoId: string;
  showAnalysis?: boolean;
}

export const YouTubeContent: React.FC<YouTubeContentProps> = ({
  videoData,
  videoId,
  showAnalysis = true
}) => {
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

      {/* Analysis Section */}
      {showAnalysis && videoData.analysisMarkdown && (
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
    </>
  );
}; 