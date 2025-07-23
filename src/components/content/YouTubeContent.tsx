"use client";

import React from 'react';
import { 
  Play,
  Eye,
  Heart,
  MessageCircle,
  Clock,
  Calendar,
  Sparkles,
  User,
  X,
  ChevronDown,
  ChevronUp,
  Subtitles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  formatNumber, 
  formatDate, 
  formatDuration
} from '@/lib/content-utils';
import { Button } from '@/components/ui/button';
import { getApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { YouTubeAnalysisCards } from './YouTubeAnalysisCards';

interface YouTubeContentProps {
  videoData: any;
  videoId: string;
  userId: string;
  showAnalysis?: boolean;
  onClose?: () => void;
}

interface CaptionEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}



// SRT time format regex pattern
const SRT_TIME_REGEX = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/;

// Parse SRT format captions
const parseSRTCaptions = (srtText: string): CaptionEntry[] => {
  if (!srtText || typeof srtText !== 'string') return [];
  
  const entries: CaptionEntry[] = [];
  const blocks = srtText.split('\n\n').filter(block => block.trim());
  
  blocks.forEach(block => {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length >= 3) {
      const index = parseInt(lines[0].trim(), 10);
      if (isNaN(index)) return; // Skip this block if the index is not a valid number
      
      const timeLine = lines[1].trim();
      const text = lines.slice(2).join('\n').trim();
      
      const timeMatch = timeLine.match(SRT_TIME_REGEX);
      if (timeMatch) {
        entries.push({
          index,
          startTime: timeMatch[1],
          endTime: timeMatch[2],
          text
        });
      }
    }
  });
  
  return entries;
};

// Format time for display (remove milliseconds for cleaner look)
const formatCaptionTime = (time: string): string => {
  return time.replace(/,\d{3}$/, '');
};

export const YouTubeContent: React.FC<YouTubeContentProps> = ({
  videoData,
  videoId,
  showAnalysis = true,
  onClose
}) => {
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = React.useState(false);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [visibleCommentsCount, setVisibleCommentsCount] = React.useState(5);
  const [showCaptions, setShowCaptions] = React.useState(false);

  const storeVideoAnalysis = useMutation(api.youtubeMutations.storeVideoAnalysis);

  // Handle click outside to close modal
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);



  // Handle YouTube analysis generation
  const handleGenerateAnalysis = async () => {
    setIsGeneratingAnalysis(true);
    setAnalysisError(null);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('Please connect your YouTube account to generate analysis.');
      
      const response = await fetch('/api/social/youtube/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({ 
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          force_refresh: true 
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate analysis.');
      }

      // Store analysis in Convex
      if (data.markdown || data.analysis) {
        const userId = getCurrentUserId();
        
        if (userId) {
          await storeVideoAnalysis({
            userId,
            videoId,
            analysisData: {
              markdown: data.markdown,
              analysis: data.analysis || data
            }
          });
        }
      }
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to generate analysis');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Get comments from video data
  const comments = videoData?.comments?.comments || [];
  const displayComments = comments.slice(0, visibleCommentsCount);
  const hasMoreComments = comments.length > visibleCommentsCount;
  const commentsToLoad = Math.min(10, comments.length - visibleCommentsCount);

  // Get captions from video data
  const captionsData = videoData?.captions?.caption_track;
  const captions = captionsData ? parseSRTCaptions(captionsData.text) : [];

  // Debug logging for video data and comments structure
  React.useEffect(() => {
    console.log(`[YouTubeContent] Full videoData structure:`, {
      videoData: videoData,
      hasComments: !!videoData?.comments,
      commentsStructure: videoData?.comments,
      commentsArray: videoData?.comments?.comments,
      commentsLength: videoData?.comments?.comments?.length || 0,
      hasCaptions: !!captionsData,
      captionsLength: captions.length,
      videoId: videoId
    });
    
    if (comments.length > 0) {
      console.log(`[YouTubeContent] Comments processing:`, {
        totalComments: comments.length,
        visibleComments: visibleCommentsCount,
        hasMoreComments: hasMoreComments,
        commentsToLoad: commentsToLoad,
        firstComment: comments[0]
      });
    } else {
      console.log(`[YouTubeContent] No comments found - checking data path:`, {
        videoDataExists: !!videoData,
        commentsFieldExists: !!videoData?.comments,
        commentsArrayExists: !!videoData?.comments?.comments,
        fullCommentsField: videoData?.comments
      });
    }
  }, [videoData, comments.length, visibleCommentsCount, hasMoreComments, commentsToLoad, videoId, captionsData, captions.length]);

  const content = (
    <div className="space-y-6">
      {/* Full-width video */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden cursor-pointer group">
        {videoData.snippet?.thumbnails?.high || videoData.snippet?.thumbnails?.medium ? (
          <>
            <img
              src={videoData.snippet.thumbnails.high || videoData.snippet.thumbnails.medium}
              alt={videoData.snippet?.title || 'YouTube Video'}
              className="w-full h-full object-cover"
              onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
            />
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {videoData.statistics?.views !== undefined && (
          <div className="text-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border">
            <Eye className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatNumber(videoData.statistics.views)}</div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
        )}
        
        {videoData.statistics?.likes !== undefined && (
          <div className="text-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border">
            <Heart className="w-5 h-5 text-red-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatNumber(videoData.statistics.likes)}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </div>
        )}
        
        {videoData.statistics?.comments !== undefined && (
          <div className="text-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border">
            <MessageCircle className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatNumber(videoData.statistics.comments)}</div>
            <div className="text-xs text-muted-foreground">Comments</div>
          </div>
        )}
        
        {videoData.content_details?.duration && (
          <div className="text-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border">
            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatDuration(videoData.content_details.duration)}</div>
            <div className="text-xs text-muted-foreground">Duration</div>
          </div>
        )}
        
        {videoData.snippet?.published_at && (
          <div className="text-center p-4 bg-muted/20 rounded-lg hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer border border-border/30 hover:border-border">
            <Calendar className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <div className="text-lg font-semibold">{formatDate(new Date(videoData.snippet.published_at).getTime())}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </div>
        )}
      </div>

      {/* Captions Section */}
      {captions.length > 0 && (
        <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Subtitles className="w-5 h-5" />
                  Captions & Transcript
                </CardTitle>
                <CardDescription>
                  {captionsData?.language && (
                    <span className="text-xs bg-muted px-2 py-1 rounded mr-2">
                      {captionsData.language.toUpperCase()}
                    </span>
                  )}
                  {captions.length} caption entries
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCaptions(!showCaptions)}
                className="flex items-center gap-1"
              >
                {showCaptions ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {showCaptions && (
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                {captions.map((caption, index) => (
                  <div key={caption.index || index} className="flex gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 text-xs text-muted-foreground font-mono min-w-[80px]">
                      {formatCaptionTime(caption.startTime)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{caption.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Total duration: {captions.length > 0 ? (() => {
                    const lastCaption = captions[captions.length - 1];
                    return formatCaptionTime(lastCaption.endTime);
                  })() : 'N/A'}</span>
                  <span>{captions.length} entries</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Comments Section */}
      {comments.length > 0 && (
        <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border border-border/50 hover:border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayComments.map((comment: any, index: number) => (
                <div key={comment.id || index} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                  <div className="flex-shrink-0">
                    {comment.author?.profile_image ? (
                      <img 
                        src={comment.author.profile_image} 
                        alt={comment.author.display_name || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground bg-muted rounded-full p-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{comment.author?.display_name || 'Anonymous'}</span>
                      {comment.published_at && (
                        <span className="text-xs text-muted-foreground">
                          {formatDate(new Date(comment.published_at).getTime())}
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{comment.text}</p>
                    {comment.likes > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <Heart className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-muted-foreground">{formatNumber(comment.likes)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {hasMoreComments && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    console.log(`[YouTubeContent] Loading more comments. Current: ${visibleCommentsCount}, Total: ${comments.length}`);
                    setVisibleCommentsCount(prev => prev + 10);
                  }}
                  className="w-full bg-muted/30 hover:bg-muted/50"
                >
                  Load More Comments ({commentsToLoad} of {comments.length - visibleCommentsCount} remaining)
                </Button>
              )}
              {visibleCommentsCount > 5 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    console.log(`[YouTubeContent] Showing less comments. Resetting to 5`);
                    setVisibleCommentsCount(5);
                  }}
                  className="w-full mt-2"
                >
                  Show Less Comments
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Section */}
      {showAnalysis && (
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Performance Analysis</CardTitle>
                <CardDescription>AI insights for your content</CardDescription>
              </div>
              <Button
                onClick={handleGenerateAnalysis}
                disabled={isGeneratingAnalysis}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGeneratingAnalysis ? 'Analyzing...' : 'Generate Analysis'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analysisError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <p className="text-sm text-red-600 dark:text-red-300">{analysisError}</p>
              </div>
            )}
            
            <YouTubeAnalysisCards 
              videoData={videoData}
              isGeneratingAnalysis={isGeneratingAnalysis}
              analysisError={analysisError}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );

  // If onClose is provided, render as modal
  if (onClose) {
    return (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleOverlayClick}
      >
        <div 
          className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Content with padding */}
          <div className="p-6">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // If no onClose, render as regular content
  return content;
}; 