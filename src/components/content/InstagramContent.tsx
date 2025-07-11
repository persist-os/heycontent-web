"use client";

import React from 'react';
import { Heart, MessageCircle, Eye, Share2, Bookmark, ExternalLink, Instagram } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';


interface InstagramContentProps {
  postData: any;
  postId: string;
  showAnalysis?: boolean;
}

export const InstagramContent: React.FC<InstagramContentProps> = ({
  postData,
  postId,
  showAnalysis = true
}) => {
  // Extract data with type safety
  const { content, statistics, analysis, insights, mediaUrl, thumbnailUrl, contentType } = postData;
  
  // Format statistics for display with fallbacks
  const likes = statistics?.likes ? Number(statistics.likes) : 0;
  const comments = statistics?.comments ? Number(statistics.comments) : 0;
  const reach = statistics?.reach ? Number(statistics.reach) : 0;
  const impressions = statistics?.impressions ? Number(statistics.impressions) : 0;
  const saved = statistics?.saved ? Number(statistics.saved) : 0;
  const shares = statistics?.shares ? Number(statistics.shares) : 0;

  // Calculate engagement rate
  const engagementRate = impressions > 0 ? ((likes + comments) / impressions * 100) : 0;

  return (
    <>
      {/* Post and Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Post Media */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group">
            {thumbnailUrl || mediaUrl ? (
              <>
                <img
                  src={thumbnailUrl || mediaUrl}
                  alt={postData.title || 'Instagram Post'}
                  className="w-full h-full object-cover"
                  onClick={() => window.open(`https://www.instagram.com/p/${postId}`, '_blank')}
                />
                {/* External link overlay */}
                <div 
                  className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(`https://www.instagram.com/p/${postId}`, '_blank')}
                >
                  <div className="bg-pink-600 rounded-full p-4">
                    <ExternalLink className="w-8 h-8 text-white" />
                  </div>
                </div>
                {/* Media type badge */}
                {contentType && (
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {contentType.toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Instagram className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Caption */}
              {content && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Caption</h4>
                  <p className="text-sm leading-relaxed">{content}</p>
                </div>
              )}

              {/* Media Type */}
              {contentType && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Media Type</h4>
                  <Badge variant="outline">{contentType.toUpperCase()}</Badge>
                </div>
              )}

              {/* Published Date */}
              {postData.createdAt && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">Published</h4>
                  <p className="text-sm">{new Date(postData.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">{likes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{comments.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{impressions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Impressions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{shares.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{saved.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Saved</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded" />
                  <div>
                    <p className="text-sm font-medium">{reach.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                </div>
              </div>

              {/* Engagement Rate */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <span className="text-sm font-bold text-green-600">
                    {engagementRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analysis Section */}
      {showAnalysis && analysis && (
        <>
          <div className="border-t my-8" />
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">AI Analysis</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    {typeof analysis === 'string' ? (
                      <div className="whitespace-pre-wrap">{analysis}</div>
                    ) : (
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(analysis, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Insights Section */}
      {showAnalysis && insights && (
        <>
          <div className="border-t my-8" />
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Key Insights</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    {typeof insights === 'string' ? (
                      <div className="whitespace-pre-wrap">{insights}</div>
                    ) : (
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(insights, null, 2)}
                      </pre>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-8">
        <Button
          onClick={() => window.open(`https://www.instagram.com/p/${postId}`, '_blank')}
          className="bg-pink-600 hover:bg-pink-700"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Instagram
        </Button>
      </div>
    </>
  );
}; 