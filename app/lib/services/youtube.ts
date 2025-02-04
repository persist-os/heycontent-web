import { google, youtube_v3 } from 'googleapis';
import { validateToken } from '../../lib/auth-helpers';
import { getCompletion } from '../openai';
import { PrismaClient } from '@prisma/client';
import prisma from '../../lib/prisma';  // Import the singleton instance
import { 
  CommentAnalysis, 
  CommentAnalysisResponse, 
  DEFAULT_COMMENT_ANALYSIS, 
  ValidSentiment 
} from '../types/youtube';

// Remove direct instantiation and use imported singleton
// const prisma = new PrismaClient();

interface VideoAnalysis {
  mainTopics: string[];
  suggestedTopics: string[];
  contentType: string;
  performanceScore: number;
  engagementTriggers: string[];
  audienceReaction: {
    positiveAspects: string[];
    negativeAspects: string[];
    questions: string[];
    suggestions: string[];
  };
}

// Add interface for video input
interface VideoInput {
  id: string;
  snippet: {
    title?: string;
    description?: string;
    publishedAt?: string;
    tags?: string[];
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
    shareCount?: string;
  };
}

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.youtube = google.youtube('v3');
  }

  private async getGoogleAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        userId: this.userId,
        provider: 'google'
      }
    });

    if (!account) {
      throw new Error('No Google account found');
    }

    return account.id;
  }

  private async getAuthorizedClient() {
    try {
      const accessToken = await validateToken(this.userId, 'youtube');
      
      if (!accessToken) {
        throw new Error('Failed to get valid YouTube access token');
      }
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );
      
      oauth2Client.setCredentials({ 
        access_token: accessToken
      });
      
      return oauth2Client;
    } catch (error: any) {
      console.error('YouTube authorization error:', error);
      throw new Error(`YouTube authorization failed: ${error.message}`);
    }
  }

  async testConnection(channelId: string) {
    try {
      // First try without auth (public data)
      const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY
      });

      const publicResponse = await youtube.channels.list({
        part: ['snippet'],
        id: [channelId],
        fields: 'items(id,snippet/title)'
      });

      // Log response without using pager
      console.log('Public API Response:', JSON.stringify({
        status: 'success',
        data: publicResponse.data
      }, null, 2));

      // Then try with auth to get private data
      const auth = await this.getAuthorizedClient();
      
      // Get the token info to check scopes
      const tokenInfo = await auth.getTokenInfo(auth.credentials.access_token!);
      console.log('Token Info:', JSON.stringify({
        scopes: tokenInfo.scopes,
        expires_in: tokenInfo.expiry_date,
        email: tokenInfo.email
      }, null, 2));

      // Try a minimal authenticated request
      const response = await this.youtube.channels.list({
        auth,
        part: ['snippet'],
        mine: true,
        maxResults: 1
      });
      
      console.log('Authenticated API Response:', JSON.stringify({
        status: response.status,
        data: response.data
      }, null, 2));

      return {
        success: true,
        tokenStatus: 'valid',
        channelTitle: response.data.items?.[0]?.snippet?.title,
        publicAccess: true,
        authenticatedAccess: true,
        grantedScopes: tokenInfo.scopes
      };
    } catch (error: any) {
      // Log the full error details without pager
      console.error('YouTube API Error Details:', JSON.stringify({
        status: error.response?.status,
        headers: error.response?.headers,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      }, null, 2));

      try {
        const auth = await this.getAuthorizedClient();
        const tokenInfo = await auth.getTokenInfo(auth.credentials.access_token!);
        
        return {
          success: false,
          error: 'Insufficient Permission',
          status: 'error',
          details: {
            grantedScopes: tokenInfo.scopes,
            tokenType: 'Bearer',
            expiresAt: new Date(tokenInfo.expiry_date).toISOString()
          }
        };
      } catch (tokenError: any) {
        return {
          success: false,
          error: error.message,
          status: 'error',
          details: {
            response: error.response?.data,
            tokenError: tokenError.message
          }
        };
      }
    }
  }

  async getVideoComments(videoId: string, maxResults: number = 100) {
    try {
      const auth = await this.getAuthorizedClient();
      
      // Get comment threads
      const response = await this.youtube.commentThreads.list({
        auth,
        part: ['snippet', 'replies'],
        videoId,
        maxResults,
        order: 'relevance'
      });

      const comments = response.data.items || [];
      const analyzedComments = await Promise.all(
        comments.map(async (thread) => {
          const comment = thread.snippet?.topLevelComment?.snippet;
          if (!comment) return null;

          // Analyze comment content
          const analysis = await this.analyzeComment(comment.textDisplay || '');

          return {
            id: thread.id!,
            authorDisplayName: comment.authorDisplayName,
            authorChannelUrl: comment.authorChannelUrl,
            text: comment.textDisplay,
            likeCount: comment.likeCount,
            publishedAt: comment.publishedAt,
            updatedAt: comment.updatedAt,
            analysis,
            replies: thread.replies?.comments || []
          };
        })
      );

      return analyzedComments.filter(Boolean);
    } catch (error) {
      console.error('Error fetching video comments:', error);
      throw error;
    }
  }

  private async analyzeVideoContent(input: string | VideoInput): Promise<VideoAnalysis> {
    try {
      let video: VideoInput;
      if (typeof input === 'string') {
        const auth = await this.getAuthorizedClient();
        const videoResponse = await this.youtube.videos.list({
          auth,
          part: ['snippet', 'statistics'],
          id: [input]
        });

        const videoData = videoResponse.data.items?.[0];
        if (!videoData) throw new Error('Video not found');

        video = this.createVideoInput(
          input,
          videoData.snippet,
          videoData.statistics
        );
      } else {
        video = input;
      }

      const prompt = [
        'Analyze this YouTube video content:\n',
        `Title: ${video.snippet.title}`,
        `Description: ${video.snippet.description}`,
        'Statistics:',
        `- Views: ${video.statistics.viewCount}`,
        `- Likes: ${video.statistics.likeCount}`,
        `- Comments: ${video.statistics.commentCount}\n`,
        'Please provide:',
        '1. Main topics covered (as a JSON array)',
        '2. Suggested related topics (as a JSON array)',
        '3. Content type (e.g., tutorial, vlog, review)',
        '4. Performance score (0-100)',
        '5. Engagement triggers (what aspects drive engagement)',
        '6. Audience reaction analysis (positive aspects, negative aspects, questions, suggestions)\n',
        'Format the response exactly as shown in the example:',
        '{',
        '  "mainTopics": ["topic1", "topic2"],',
        '  "suggestedTopics": ["related1", "related2"],',
        '  "contentType": "tutorial",',
        '  "performanceScore": 85,',
        '  "engagementTriggers": ["hook", "pacing"],',
        '  "audienceReaction": {',
        '    "positiveAspects": ["aspect1", "aspect2"],',
        '    "negativeAspects": ["aspect1"],',
        '    "questions": ["question1"],',
        '    "suggestions": ["suggestion1"]',
        '  }',
        '}'
      ].join('\n');

      const analysis = await getCompletion([
        { 
          role: 'system', 
          content: 'You are an AI that analyzes YouTube video content and metrics to provide insights.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4-1106-preview',
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      try {
        const result = JSON.parse(analysis);
        return {
          mainTopics: result.mainTopics || [],
          suggestedTopics: result.suggestedTopics || [],
          contentType: result.contentType || 'Unknown',
          performanceScore: result.performanceScore || 0,
          engagementTriggers: result.engagementTriggers || [],
          audienceReaction: {
            positiveAspects: result.audienceReaction?.positiveAspects || [],
            negativeAspects: result.audienceReaction?.negativeAspects || [],
            questions: result.audienceReaction?.questions || [],
            suggestions: result.audienceReaction?.suggestions || []
          }
        };
      } catch (parseError) {
        console.error('Error parsing video analysis:', parseError);
        return {
          mainTopics: [],
          suggestedTopics: [],
          contentType: 'Unknown',
          performanceScore: 0,
          engagementTriggers: [],
          audienceReaction: {
            positiveAspects: [],
            negativeAspects: [],
            questions: [],
            suggestions: []
          }
        };
      }
    } catch (error) {
      console.error('Error analyzing video content:', error);
      throw error;
    }
  }

  private async analyzeComment(text: string): Promise<CommentAnalysis> {
    try {
      const prompt = this.buildCommentAnalysisPrompt(text);
      const analysis = await this.getAICommentAnalysis(prompt);
      return this.validateAndNormalizeAnalysis(analysis);
    } catch (error) {
      console.error('Error in comment analysis:', {
        error,
        comment: text.substring(0, 100)
      });
      return DEFAULT_COMMENT_ANALYSIS;
    }
  }

  private buildCommentAnalysisPrompt(text: string): string {
    return [
      'Analyze this YouTube comment:',
      `"${text}"\n`,
      'Provide a detailed analysis in the following format:',
      '{',
      '  "sentiment": "positive" | "negative" | "neutral", // Overall sentiment of the comment',
      '  "topics": string[],                              // Main topics or themes discussed',
      '  "isQuestion": boolean,                           // Whether the comment asks a question',
      '  "isEngaging": boolean,                           // Whether the comment invites discussion',
      '  "suggestedAction": string                        // Suggested action for the creator',
      '}'
    ].join('\n');
  }

  private async getAICommentAnalysis(prompt: string): Promise<CommentAnalysisResponse> {
    const completion = await getCompletion([
      { 
        role: 'system', 
        content: 'You are an AI that analyzes YouTube comments. Respond with valid JSON that exactly matches the specified schema.' 
      },
      { role: 'user', content: prompt }
    ], {
      model: 'gpt-4-1106-preview',
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    return JSON.parse(completion.trim());
  }

  private validateAndNormalizeAnalysis(result: CommentAnalysisResponse): CommentAnalysis {
    const normalizedSentiment = result.sentiment?.toLowerCase();
    const validSentiments: ValidSentiment[] = ['positive', 'negative', 'neutral'];

    if (!validSentiments.includes(normalizedSentiment as ValidSentiment)) {
      console.warn('Invalid sentiment value:', result.sentiment, 'defaulting to neutral');
      return { 
        ...DEFAULT_COMMENT_ANALYSIS, 
        topics: Array.isArray(result.topics) ? result.topics : [] 
      };
    }

    return {
      sentiment: normalizedSentiment as ValidSentiment,
      topics: Array.isArray(result.topics) ? result.topics : [],
      isQuestion: Boolean(result.isQuestion),
      isEngaging: Boolean(result.isEngaging),
      suggestedAction: typeof result.suggestedAction === 'string' ? result.suggestedAction : undefined
    };
  }

  async getContentSuggestions(channelId: string): Promise<string[]> {
    try {
      const auth = await this.getAuthorizedClient();
      
      // First get channel stats to know actual video count
      const channelResponse = await this.youtube.channels.list({
        auth,
        part: ['statistics'],
        id: [channelId]
      });
      
      const videoCount = parseInt(channelResponse.data.items?.[0]?.statistics?.videoCount || '0');
      const maxResults = Math.min(videoCount, 10); // Limit to actual videos or 10, whichever is smaller
      
      const response = await this.youtube.search.list({
        auth,
        part: ['snippet', 'id'],
        channelId,
        type: ['video'],
        maxResults
      });

      if (!response.data.items?.length) return [];

      // Get full video details
      const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
      const videoDetails = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: videoIds as string[]
      });

      const analyses = await Promise.all(
        videoDetails.data.items?.map(video => {
          const videoInput = this.createVideoInput(
            video.id!,
            video.snippet,
            video.statistics
          );
          return this.analyzeVideoContent(videoInput);
        }) || []
      );

      // Aggregate topics and patterns
      const allTopics = analyses.flatMap(a => a.mainTopics);
      const allEngagementTriggers = analyses.flatMap(a => a.engagementTriggers);
      const allSuggestions = analyses.flatMap(a => a.audienceReaction.suggestions);

      const prompt = [
        'Based on the channel\'s recent video performance:\n',
        'Popular Topics:',
        allTopics.join(', '),
        '\nEngagement Triggers:',
        allEngagementTriggers.join(', '),
        '\nAudience Suggestions:',
        allSuggestions.join(', '),
        '\nProvide a list of specific content suggestions that would resonate with the audience and maximize engagement.',
        'Format each suggestion as a complete, actionable content idea.'
      ].join('\n');

      const suggestions = await getCompletion([
        { 
          role: 'system', 
          content: 'You are an AI that provides strategic content suggestions based on YouTube channel performance data.' 
        },
        { role: 'user', content: prompt }
      ]);

      return suggestions.split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    } catch (error) {
      console.error('Error getting content suggestions:', error);
      throw error;
    }
  }

  async getRecentVideoIds(channelId: string): Promise<string[]> {
    try {
      const auth = await this.getAuthorizedClient();
      
      // Get channel stats to know actual video count
      const channelResponse = await this.youtube.channels.list({
        auth,
        part: ['statistics'],
        mine: true
      });
      
      const videoCount = parseInt(channelResponse.data.items?.[0]?.statistics?.videoCount || '0');
      const maxResults = Math.min(videoCount, 10); // Limit to actual videos or 10, whichever is smaller
      
      // Use search.list with minimal permissions
      const response = await this.youtube.search.list({
        auth,
        part: ['id'],
        channelId,
        maxResults,
        order: 'date',
        type: ['video'],
        fields: 'items(id/videoId)'
      });

      return response.data.items
        ?.map(item => item.id?.videoId)
        .filter((id): id is string => !!id) || [];
    } catch (error) {
      console.error('Error fetching recent videos:', error);
      throw error;
    }
  }

  async getVideoMetrics(videoId: string) {
    try {
      const auth = await this.getAuthorizedClient();
      
      // First try to get basic video info
      const videoResponse = await this.youtube.videos.list({
        auth,
        part: ['statistics', 'snippet'],
        id: [videoId]
      });

      const video = videoResponse.data.items?.[0];
      if (!video) {
        throw new Error('Video not found');
      }

      // Then try to get analytics data
      const analyticsResponse = await this.youtube.channels.list({
        auth,
        part: ['statistics'],
        id: [video.snippet?.channelId || '']
      });

      const channel = analyticsResponse.data.items?.[0];

      return {
        views: parseInt(video.statistics?.viewCount || '0'),
        likes: parseInt(video.statistics?.likeCount || '0'),
        comments: parseInt(video.statistics?.commentCount || '0'),
        title: video.snippet?.title || '',
        publishedAt: video.snippet?.publishedAt || '',
        channelStats: channel ? {
          subscribers: parseInt(channel.statistics?.subscriberCount || '0'),
          totalViews: parseInt(channel.statistics?.viewCount || '0'),
          videoCount: parseInt(channel.statistics?.videoCount || '0')
        } : undefined
      };
    } catch (error) {
      console.error('Error fetching video metrics:', error);
      throw error;
    }
  }

  async getVideosByDate(startDate: Date, endDate: Date) {
    try {
      const auth = await this.getAuthorizedClient();
      
      // Get channel ID first
      const channelResponse = await this.youtube.channels.list({
        auth,
        part: ['id'],
        mine: true
      });

      const channelId = channelResponse.data.items?.[0]?.id;
      if (!channelId) throw new Error('Channel not found');

      // Search for videos in date range
      const response = await this.youtube.search.list({
        auth,
        part: ['id', 'snippet'],
        channelId,
        type: ['video'],
        order: 'date',
        maxResults: 50,
        publishedAfter: startDate.toISOString(),
        publishedBefore: endDate.toISOString()
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching videos by date:', error);
      throw error;
    }
  }

  async getMonthlyAnalysis(channelId: string, month: number, year: number) {
    try {
      const auth = await this.getAuthorizedClient();
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const response = await this.youtube.search.list({
        auth,
        part: ['snippet', 'id'],
        channelId,
        publishedAfter: startDate,
        publishedBefore: endDate,
        type: ['video'],
        maxResults: 50
      });

      if (!response.data.items?.length) {
        return {
          videos: [],
          summary: {
            totalVideos: 0,
            totalViews: 0,
            avgViews: 0,
            avgEngagement: 0,
            topVideo: null,
            trends: {
              views: 'stable',
              engagement: 'stable'
            }
          }
        };
      }

      const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
      const videoDetails = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: videoIds as string[]
      });

      const videos = await Promise.all(
        videoDetails.data.items?.map(async video => {
          const videoInput = this.createVideoInput(
            video.id!,
            video.snippet,
            video.statistics
          );
          const analysis = await this.analyzeVideoContent(videoInput);

          return {
            id: video.id!,
            title: video.snippet?.title || '',
            publishedAt: video.snippet?.publishedAt || '',
            metrics: {
              views: parseInt(video.statistics?.viewCount || '0'),
              likes: parseInt(video.statistics?.likeCount || '0'),
              comments: parseInt(video.statistics?.commentCount || '0')
            },
            analysis
          };
        }) || []
      );

      // Calculate monthly summary
      const totalViews = videos.reduce((sum, v) => sum + v.metrics.views, 0);
      const totalLikes = videos.reduce((sum, v) => sum + v.metrics.likes, 0);
      const totalComments = videos.reduce((sum, v) => sum + v.metrics.comments, 0);

      // Find top performing video
      const topVideo = videos.reduce((top, current) => 
        current.metrics.views > (top?.metrics.views || 0) ? current : top
      , videos[0]);

      // Extract common topics and patterns
      const allTopics = videos.flatMap(v => v.analysis.mainTopics);
      const allPatterns = videos.flatMap(v => v.analysis.engagementTriggers);

      // Generate strategic insights
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const prompt = [
        `Based on the YouTube channel's performance in ${monthName} ${year}:\n`,
        `Total Videos: ${videos.length}`,
        `Total Views: ${totalViews}`,
        `Total Engagement: ${totalLikes} likes, ${totalComments} comments`,
        `Top Topics: ${[...new Set(allTopics)].join(', ')}`,
        `Engagement Patterns: ${[...new Set(allPatterns)].join(', ')}\n`,
        'Provide 5 specific strategic recommendations to improve content performance based on this data.',
        'Format each recommendation as an actionable insight with clear implementation steps.'
      ].join('\n');

      const recommendations = await getCompletion([
        { 
          role: 'system', 
          content: 'You are an AI that provides strategic YouTube channel growth recommendations based on performance data.' 
        },
        { role: 'user', content: prompt }
      ]);

      return {
        videos,
        summary: {
          totalVideos: videos.length,
          totalViews,
          avgViews: Math.round(totalViews / videos.length),
          avgEngagement: Math.round((totalLikes + totalComments) / videos.length),
          topVideo: {
            title: topVideo.title,
            views: topVideo.metrics.views,
            engagement: topVideo.metrics.likes + topVideo.metrics.comments
          },
          trends: {
            views: this.calculateTrend(videos.map(v => v.metrics.views)),
            engagement: this.calculateTrend(videos.map(v => v.metrics.likes + v.metrics.comments))
          },
          insights: recommendations.split('\n')
            .map(r => r.trim())
            .filter(r => r.length > 0)
        }
      };
    } catch (error) {
      console.error('Error analyzing monthly content:', error);
      throw error;
    }
  }

  async getLatestVideoAnalysis(): Promise<{
    video: {
      id: string;
      title: string;
      publishedAt: string;
      metrics: {
        views: number;
        likes: number;
        comments: number;
      };
    };
    commentAnalysis: {
      mainTopics: string[];
      sentiment: {
        positive: number;
        negative: number;
        neutral: number;
      };
      questions: string[];
      suggestions: string[];
      topComments: Array<{
        text: string;
        likes: number;
        analysis: CommentAnalysis;
      }>;
    };
    contentAnalysis: VideoAnalysis;
  }> {
    try {
      const channelId = await this.getChannelId();
      
      // Get the latest video
      const auth = await this.getAuthorizedClient();
      const response = await this.youtube.search.list({
        auth,
        part: ['id'],
        channelId,
        order: 'date',
        type: ['video'],
        maxResults: 1
      });

      if (!response.data.items?.length) throw new Error('No videos found');

      const videoId = response.data.items[0].id?.videoId;
      if (!videoId) throw new Error('Video ID not found');

      const metrics = await this.getVideoMetrics(videoId);
      const comments = await this.getVideoComments(videoId);
      const contentAnalysis = await this.analyzeVideoContent(videoId);

      // Analyze comment sentiment distribution
      const sentimentCounts = comments.reduce((acc, comment) => {
        if (!comment?.analysis) return acc;
        acc[comment.analysis.sentiment]++;
        return acc;
      }, { positive: 0, negative: 0, neutral: 0 });

      // Get questions and suggestions from comments
      const questions = comments
        .filter((c): c is NonNullable<typeof c> => c?.analysis?.isQuestion ?? false)
        .map(c => c.text)
        .filter((text): text is string => !!text)
        .slice(0, 5);

      const suggestions = comments
        .filter((c): c is NonNullable<typeof c> => !!c?.analysis?.suggestedAction)
        .map(c => c.analysis.suggestedAction!)
        .slice(0, 5);

      // Get top comments by likes
      const topComments = comments
        .filter((c): c is NonNullable<typeof c> & { text: string } => 
          !!c?.text && !!c?.analysis && typeof c.text === 'string'
        )
        .sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
        .slice(0, 5)
        .map(c => ({
          text: c.text,
          likes: c.likeCount || 0,
          analysis: c.analysis
        }));

      return {
        video: {
          id: videoId,
          title: metrics.title,
          publishedAt: metrics.publishedAt,
          metrics: {
            views: metrics.views,
            likes: metrics.likes,
            comments: metrics.comments
          }
        },
        commentAnalysis: {
          mainTopics: [...new Set(comments.flatMap(c => c?.analysis?.topics || []))],
          sentiment: sentimentCounts,
          questions,
          suggestions,
          topComments
        },
        contentAnalysis
      };
    } catch (error) {
      console.error('Error analyzing latest video:', error);
      throw error;
    }
  }

  async getMonthlyVideos(month: number, year: number) {
    try {
      const auth = await this.getAuthorizedClient();
      const startDate = new Date(year, month-1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();
      
      const response = await this.youtube.search.list({
        auth,
        part: ['snippet', 'id'],
        channelId: await this.getChannelId(),
        publishedAfter: startDate,
        publishedBefore: endDate,
        type: ['video'],
        maxResults: 50
      });

      if (!response.data.items?.length) {
        return {
          videos: [],
          summary: {
            totalVideos: 0,
            totalViews: 0,
            avgViews: 0,
            avgEngagement: 0
          }
        };
      }

      // Get detailed video stats
      const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
      const videoDetails = await this.youtube.videos.list({
        auth,
        part: ['statistics', 'snippet'],
        id: videoIds as string[]
      });

      const videos = await Promise.all(videoDetails.data.items?.map(async video => {
        const stats = video.statistics || {};
        const snippet = video.snippet || {};
        
        // Get video comments for sentiment analysis
        const comments = await this.getVideoComments(video.id!, 100);
        const commentAnalysis = await this.analyzeComments(comments);

        return {
          id: video.id!,
          title: snippet.title || '',
          description: snippet.description || '',
          publishedAt: snippet.publishedAt || '',
          metrics: {
            views: parseInt(stats.viewCount || '0'),
            likes: parseInt(stats.likeCount || '0'),
            comments: parseInt(stats.commentCount || '0'),
            engagement: this.calculateEngagementRate(stats)
          },
          analysis: await this.analyzeVideoContent({
            id: video.id!,
            snippet,
            statistics: stats
          } as VideoInput),
          commentAnalysis
        };
      }) || []);

      // Calculate monthly summary
      const summary = this.calculateMonthlySummary(videos);

      return {
        videos,
        summary
      };
    } catch (error) {
      console.error('Error getting monthly videos:', error);
      throw error;
    }
  }

  private calculateEngagementRate(stats: any) {
    const views = parseInt(stats.viewCount || '0');
    if (!views) return 0;
    
    const likes = parseInt(stats.likeCount || '0');
    const comments = parseInt(stats.commentCount || '0');
    const shares = parseInt(stats.shareCount || '0');
    
    return ((likes + comments * 2 + shares * 3) / views) * 100;
  }

  private calculateMonthlySummary(videos: any[]) {
    const totalVideos = videos.length;
    const totalViews = videos.reduce((sum, v) => sum + v.metrics.views, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.metrics.likes, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.metrics.comments, 0);
    
    // Find top performing video
    const topVideo = videos.reduce((top, current) => 
      current.metrics.views > (top?.metrics.views || 0) ? current : top
    , null);

    // Calculate engagement trends
    const engagementTrend = videos
      .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
      .map(v => ({
        date: v.publishedAt,
        engagement: v.metrics.engagement
      }));

    // Extract common topics
    const topics = videos.flatMap(v => v.analysis.mainTopics);
    const topTopics = [...new Set(topics)]
      .map(topic => ({
        topic,
        count: topics.filter(t => t === topic).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalVideos,
      totalViews,
      avgViews: totalVideos ? Math.round(totalViews / totalVideos) : 0,
      avgEngagement: totalVideos ? 
        videos.reduce((sum, v) => sum + v.metrics.engagement, 0) / totalVideos : 0,
      topVideo: topVideo ? {
        title: topVideo.title,
        views: topVideo.metrics.views,
        engagement: topVideo.metrics.engagement
      } : null,
      engagementTrend,
      topTopics,
      performance: {
        views: {
          total: totalViews,
          average: Math.round(totalViews / totalVideos),
          trend: this.calculateTrend(videos.map(v => v.metrics.views))
        },
        engagement: {
          likes: totalLikes,
          comments: totalComments,
          averageRate: videos.reduce((sum, v) => sum + v.metrics.engagement, 0) / totalVideos,
          trend: this.calculateTrend(videos.map(v => v.metrics.engagement))
        }
      }
    };
  }

  private calculateTrend(values: number[]): 'up' | 'down' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (percentChange > 10) return 'up';
    if (percentChange < -10) return 'down';
    return 'stable';
  }

  private async getChannelId(): Promise<string> {
    const auth = await this.getAuthorizedClient();
    const response = await this.youtube.channels.list({
      auth,
      part: ['id'],
      mine: true
    });

    const channelId = response.data.items?.[0]?.id;
    if (!channelId) {
      throw new Error('No channel found for authenticated user');
    }

    return channelId;
  }

  private async analyzeComments(comments: any[]): Promise<{
    sentiment: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topics: string[];
    questions: number;
    engagement: number;
  }> {
    const analyses = await Promise.all(
      comments.map(comment => this.analyzeComment(comment.snippet.topLevelComment.snippet.textDisplay))
    );

    const sentiment = analyses.reduce(
      (acc, curr) => {
        acc[curr.sentiment]++;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const topics = [...new Set(analyses.flatMap(a => a.topics))];
    const questions = analyses.filter(a => a.isQuestion).length;
    const engagement = analyses.filter(a => a.isEngaging).length;

    return {
      sentiment,
      topics,
      questions,
      engagement
    };
  }

  async getVideoAnalysis(videoId: string): Promise<VideoAnalysis> {
    const auth = await this.getAuthorizedClient();
    
    // Get video details
    const videoResponse = await this.youtube.videos.list({
      auth,
      part: ['snippet', 'statistics', 'contentDetails'],
      id: [videoId]
    });

    const video = videoResponse.data.items?.[0];
    if (!video) throw new Error('Video not found');

    return this.analyzeVideoContent({
      id: videoId,
      snippet: video.snippet || {},
      statistics: video.statistics || {}
    } as VideoInput);
  }

  async getMonthlyContent(channelId: string, month: number, year: number) {
    try {
      const auth = await this.getAuthorizedClient();
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0).toISOString();

      const response = await this.youtube.search.list({
        auth,
        part: ['snippet', 'id'],
        channelId,
        publishedAfter: startDate,
        publishedBefore: endDate,
        type: ['video'],
        maxResults: 50
      });

      if (!response.data.items?.length) return [];

      const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
      const videoDetails = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: videoIds as string[]
      });

      return Promise.all(
        videoDetails.data.items?.map(async video => {
          const videoInput = this.createVideoInput(
            video.id!,
            video.snippet,
            video.statistics
          );
          const analysis = await this.analyzeVideoContent(videoInput);

          return {
            video,
            analysis
          };
        }) || []
      );
    } catch (error) {
      console.error('Error analyzing monthly content:', error);
      throw error;
    }
  }

  async getVideoSuggestions(videoId: string): Promise<string[]> {
    try {
      const auth = await this.getAuthorizedClient();
      const videoResponse = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error('Video not found');

      const videoInput = this.createVideoInput(
        videoId,
        video.snippet,
        video.statistics
      );

      const analysis = await this.analyzeVideoContent(videoInput);

      return [
        ...analysis.suggestedTopics,
        ...analysis.audienceReaction.suggestions
      ];
    } catch (error) {
      console.error('Error getting video suggestions:', error);
      throw error;
    }
  }

  async getVideoPerformance(videoId: string): Promise<{
    metrics: {
      views: number;
      likes: number;
      comments: number;
      engagement: number;
    };
    analysis: VideoAnalysis;
  }> {
    try {
      const auth = await this.getAuthorizedClient();
      const videoResponse = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error('Video not found');

      const stats = video.statistics || {};
      const videoInput = this.createVideoInput(
        videoId,
        video.snippet,
        stats
      );

      const analysis = await this.analyzeVideoContent(videoInput);

      return {
        metrics: {
          views: parseInt(stats.viewCount || '0'),
          likes: parseInt(stats.likeCount || '0'),
          comments: parseInt(stats.commentCount || '0'),
          engagement: this.calculateEngagementRate(stats)
        },
        analysis
      };
    } catch (error) {
      console.error('Error getting video performance:', error);
      throw error;
    }
  }

  async analyzeVideo(videoId: string): Promise<VideoAnalysis> {
    const auth = await this.getAuthorizedClient();
    const videoResponse = await this.youtube.videos.list({
      auth,
      part: ['snippet', 'statistics'],
      id: [videoId]
    });

    const video = videoResponse.data.items?.[0];
    if (!video) throw new Error('Video not found');

    const videoInput = this.createVideoInput(
      videoId,
      video.snippet,
      video.statistics
    );

    return this.analyzeVideoContent(videoInput);
  }

  async getContentInsights(videoId: string): Promise<VideoAnalysis> {
    const auth = await this.getAuthorizedClient();
    const videoResponse = await this.youtube.videos.list({
      auth,
      part: ['snippet', 'statistics'],
      id: [videoId]
    });

    const video = videoResponse.data.items?.[0];
    if (!video) throw new Error('Video not found');

    const videoInput = this.createVideoInput(
      videoId,
      video.snippet,
      video.statistics
    );

    return this.analyzeVideoContent(videoInput);
  }

  private createVideoInput(videoId: string, snippet: any = {}, statistics: any = {}): VideoInput {
    return {
      id: videoId,
      snippet: {
        title: snippet.title || '',
        description: snippet.description || '',
        publishedAt: snippet.publishedAt || '',
        tags: snippet.tags || []
      },
      statistics: {
        viewCount: statistics.viewCount || '0',
        likeCount: statistics.likeCount || '0',
        commentCount: statistics.commentCount || '0',
        shareCount: statistics.shareCount || '0'
      }
    };
  }

  async searchVideosByTitle(query: string, options: {
    includeMetrics?: boolean;
    includeAnalysis?: boolean;
    startDate?: Date;
    endDate?: Date;
    maxResults?: number;
  } = {}) {
    try {
      const auth = await this.getAuthorizedClient();
      const { includeMetrics = true, includeAnalysis = true, maxResults = 10 } = options;

      // Search for videos
      const searchResponse = await this.youtube.search.list({
        auth,
        part: ['snippet'],
        type: ['video'],
        q: query,
        maxResults,
        order: 'relevance',
        ...(options.startDate && { publishedAfter: options.startDate.toISOString() }),
        ...(options.endDate && { publishedBefore: options.endDate.toISOString() })
      });

      if (!searchResponse.data.items?.length) {
        return [];
      }

      // Get video IDs
      const videoIds = searchResponse.data.items.map(item => item.id?.videoId).filter(Boolean) as string[];

      // Get detailed video information
      const videosResponse = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics', 'contentDetails'],
        id: videoIds
      });

      const videos = await Promise.all(
        (videosResponse.data.items || []).map(async (video) => {
          const result: any = {
            id: video.id,
            title: video.snippet?.title,
            description: video.snippet?.description,
            publishedAt: video.snippet?.publishedAt,
            thumbnail: video.snippet?.thumbnails?.high?.url,
            metrics: includeMetrics ? {
              views: parseInt(video.statistics?.viewCount || '0'),
              likes: parseInt(video.statistics?.likeCount || '0'),
              comments: parseInt(video.statistics?.commentCount || '0')
            } : undefined
          };

          if (includeAnalysis) {
            try {
              const analysis = await this.analyzeVideoContent(video.id!);
              result.analysis = analysis;
            } catch (error) {
              console.error(`Error analyzing video ${video.id}:`, error);
            }
          }

          return result;
        })
      );

      return videos;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  async getMonthlyContentAnalysis(month: number, year: number) {
    try {
      const auth = await this.getAuthorizedClient();
      const channelId = await this.getChannelId();
      
      // Calculate start and end dates for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Search for videos in the date range
      const response = await this.youtube.search.list({
        auth,
        part: ['snippet', 'id'],
        channelId,
        type: ['video'],
        maxResults: 50,
        publishedAfter: startDate.toISOString(),
        publishedBefore: endDate.toISOString(),
        order: 'date'
      });

      if (!response.data.items?.length) {
        return {
          videos: [],
          summary: {
            totalVideos: 0,
            totalViews: 0,
            avgViews: 0,
            avgEngagement: 0,
            topVideo: null,
            trends: {
              views: 'stable',
              engagement: 'stable'
            }
          }
        };
      }

      // Get detailed video information
      const videoIds = response.data.items.map(item => item.id?.videoId).filter(Boolean);
      const videoDetails = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: videoIds as string[]
      });

      const videos = await Promise.all(
        videoDetails.data.items?.map(async (video) => {
          const performance = await this.getVideoPerformance(video.id!);
          const comments = await this.getVideoComments(video.id!);
          
          return {
            id: video.id!,
            title: video.snippet?.title || '',
            publishedAt: video.snippet?.publishedAt || '',
            metrics: performance.metrics,
            analysis: performance.analysis,
            comments: comments.slice(0, 5)
          };
        }) || []
      );

      const totalViews = videos.reduce((sum, v) => sum + v.metrics.views, 0);
      const totalEngagement = videos.reduce((sum, v) => sum + v.metrics.engagement, 0);

      const topVideo = videos.reduce((top, current) => 
        current.metrics.views > (top?.metrics.views || 0) ? current : top
      , videos[0]);

      return {
        videos,
        summary: {
          totalVideos: videos.length,
          totalViews,
          avgViews: Math.round(totalViews / videos.length),
          avgEngagement: Math.round(totalEngagement / videos.length),
          topVideo: topVideo ? {
            title: topVideo.title,
            views: topVideo.metrics.views,
            engagement: topVideo.metrics.engagement
          } : null,
          trends: {
            views: this.calculateTrend(videos.map(v => v.metrics.views)),
            engagement: this.calculateTrend(videos.map(v => v.metrics.engagement))
          }
        }
      };
    } catch (error) {
      console.error('Error analyzing monthly content:', error);
      throw error;
    }
  }
} 