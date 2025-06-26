"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/context/auth-context';
import { 
  Youtube, 
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  BarChart3,
  Calendar,
  Users,
  Clock,
  Target,
  Zap,
  Activity,
  Share2,
  Play,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function YouTubeAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const userId = firebaseUser?.uid;
  
  const videoId = params.videoId as string;

  // Fetch video data
  const videoData = useQuery(api.notes.getContentByPrefixedId, {
    prefixedId: `youtube:${videoId}`,
    userId: userId || ''
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'engagement' | 'content'>('overview');

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

  const getEngagementRate = () => {
    if (!videoData.statistics) return 0;
    const views = videoData.statistics.views || 0;
    const likes = videoData.statistics.likes || 0;
    return views > 0 ? ((likes / views) * 100) : 0;
  };

  const getLikeRatio = () => {
    if (!videoData.statistics) return 0;
    const views = videoData.statistics.views || 0;
    const likes = videoData.statistics.likes || 0;
    return views > 0 ? ((likes / views) * 100) : 0;
  };

  const getCommentRatio = () => {
    if (!videoData.statistics) return 0;
    const views = videoData.statistics.views || 0;
    const comments = videoData.statistics.comments || 0;
    return views > 0 ? ((comments / views) * 100) : 0;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'engagement', label: 'Engagement', icon: Target },
    { id: 'content', label: 'Content', icon: Activity }
  ];

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
                  <h1 className="text-2xl font-bold">YouTube Video Analysis</h1>
                  <p className="text-muted-foreground">{videoData.title}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => window.open(videoData.url || `https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                className="bg-red-600 hover:bg-red-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Video
              </Button>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.views || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    Published {formatDate(videoData.createdAt)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Likes</CardTitle>
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.likes || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {getLikeRatio().toFixed(3)}% of views
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comments</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(videoData.statistics?.comments || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {getCommentRatio().toFixed(3)}% of views
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getEngagementRate().toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">
                    Likes + Comments / Views
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Video Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Video Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
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
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">{videoData.title}</h3>
                    <p className="text-sm text-muted-foreground">{videoData.content}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Published {formatDate(videoData.createdAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Video ID: {videoId}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Engagement Rate</span>
                      <span className="font-medium">{getEngagementRate().toFixed(2)}%</span>
                    </div>
                    <Progress value={getEngagementRate()} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Like/View Ratio</span>
                      <span className="font-medium">{getLikeRatio().toFixed(3)}%</span>
                    </div>
                    <Progress value={getLikeRatio()} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Comment/View Ratio</span>
                      <span className="font-medium">{getCommentRatio().toFixed(3)}%</span>
                    </div>
                    <Progress value={getCommentRatio()} className="h-2" />
                  </div>

                  {videoData.tags && videoData.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {videoData.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Detailed performance analysis of your video</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">View Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Views</span>
                        <span className="font-medium">{formatNumber(videoData.statistics?.views || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average View Duration</span>
                        <span className="font-medium">N/A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>View Rate</span>
                        <span className="font-medium">N/A</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Interaction Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Likes</span>
                        <span className="font-medium">{formatNumber(videoData.statistics?.likes || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Comments</span>
                        <span className="font-medium">{formatNumber(videoData.statistics?.comments || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dislikes</span>
                        <span className="font-medium">{formatNumber(videoData.statistics?.dislikes || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'engagement' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Analysis</CardTitle>
                <CardDescription>How your audience interacts with your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{getEngagementRate().toFixed(2)}%</div>
                    <div className="text-sm text-muted-foreground">Overall Engagement</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{getLikeRatio().toFixed(3)}%</div>
                    <div className="text-sm text-muted-foreground">Like Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{getCommentRatio().toFixed(3)}%</div>
                    <div className="text-sm text-muted-foreground">Comment Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Analysis</CardTitle>
                <CardDescription>AI-powered insights about your video content</CardDescription>
              </CardHeader>
              <CardContent>
                {videoData.analysis ? (
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Content Summary</h4>
                      <p className="text-sm text-muted-foreground">
                        {typeof videoData.analysis === 'string' ? videoData.analysis : 'Analysis available'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No content analysis available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 