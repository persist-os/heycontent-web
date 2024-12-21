import { google, youtube_v3 } from 'googleapis';
import { validateToken } from '@/lib/auth-helpers';
import { getCompletion } from '../openai';

interface CommentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  isQuestion: boolean;
  isEngaging: boolean;
  suggestedAction?: string;
}

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

export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
    this.youtube = google.youtube('v3');
  }

  private async getAuthorizedClient() {
    try {
      const accessToken = await validateToken(this.accountId, 'youtube');
      
      // Log token for debugging
      console.log('Using YouTube access token:', accessToken ? 'Present' : 'Missing');
      
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

      console.log('Public API Response:', {
        status: 'success',
        data: publicResponse.data
      });

      // Then try with auth to get private data
      const auth = await this.getAuthorizedClient();
      
      // Get the token info to check scopes
      const tokenInfo = await auth.getTokenInfo(auth.credentials.access_token!);
      console.log('Token Info:', {
        scopes: tokenInfo.scopes,
        expires_in: tokenInfo.expiry_date,
        email: tokenInfo.email
      });

      // Try a minimal authenticated request
      const response = await this.youtube.channels.list({
        auth,
        part: ['snippet'],
        mine: true, // This requires youtube.readonly scope
        maxResults: 1
      });
      
      console.log('Authenticated API Response:', {
        status: response.status,
        data: response.data
      });

      return {
        success: true,
        tokenStatus: 'valid',
        channelTitle: response.data.items?.[0]?.snippet?.title,
        publicAccess: true,
        authenticatedAccess: true,
        grantedScopes: tokenInfo.scopes
      };
    } catch (error: any) {
      // Log the full error details
      console.error('YouTube API Error Details:', {
        status: error.response?.status,
        headers: error.response?.headers,
        data: error.response?.data,
        message: error.message,
        stack: error.stack
      });

      // Get token info even if the request failed
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

  async analyzeVideoContent(videoId: string): Promise<VideoAnalysis> {
    try {
      const auth = await this.getAuthorizedClient();

      // Get video details
      const videoResponse = await this.youtube.videos.list({
        auth,
        part: ['snippet', 'statistics'],
        id: [videoId]
      });

      const video = videoResponse.data.items?.[0];
      if (!video) throw new Error('Video not found');

      // Get comments for content analysis
      const comments = await this.getVideoComments(videoId, 50);
      const commentTexts = comments.map(c => c?.text || '').join('\n');

      // Analyze video content and comments using AI
      const prompt = `Analyze this YouTube video content and its comments:

Video Title: ${video.snippet?.title}
Description: ${video.snippet?.description}
Tags: ${video.snippet?.tags?.join(', ')}

Top Comments:
${commentTexts}

Please provide in a structured format:
1. Main topics discussed (as a JSON array)
2. Suggested related topics (as a JSON array)
3. Content type classification (as a single string)
4. Performance score (as a number between 0-100)
5. Engagement triggers (as a JSON array)
6. Audience reaction (as JSON arrays):
   - Positive aspects
   - Negative aspects
   - Questions asked
   - Suggestions made

Example format:
["topic1", "topic2"]
["suggested1", "suggested2"]
"Educational"
85
["trigger1", "trigger2"]
["positive1", "positive2"]
["negative1", "negative2"]
["question1", "question2"]
["suggestion1", "suggestion2"]`;

      const analysis = await getCompletion([
        { role: 'system', content: 'You are an AI that analyzes YouTube video content and audience engagement. Always respond in the exact format specified, using valid JSON arrays where requested.' },
        { role: 'user', content: prompt }
      ]);

      // Parse the AI response
      const lines = analysis.split('\n').filter(line => line.trim());
      
      try {
        return {
          mainTopics: JSON.parse(lines[0] || '[]'),
          suggestedTopics: JSON.parse(lines[1] || '[]'),
          contentType: lines[2]?.replace(/^"|"$/g, '') || 'Unknown',
          performanceScore: parseInt(lines[3] || '0') || 0,
          engagementTriggers: JSON.parse(lines[4] || '[]'),
          audienceReaction: {
            positiveAspects: JSON.parse(lines[5] || '[]'),
            negativeAspects: JSON.parse(lines[6] || '[]'),
            questions: JSON.parse(lines[7] || '[]'),
            suggestions: JSON.parse(lines[8] || '[]')
          }
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', {
          error: parseError,
          lines,
          rawResponse: analysis
        });
        
        // Return a safe default if parsing fails
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
      const prompt = `Analyze this YouTube comment:
"${text}"

Please provide in a structured format:
1. Sentiment (exactly one of: positive, negative, neutral)
2. Topics mentioned (as a JSON array)
3. Is it a question? (true/false)
4. Is it engaging? (true/false)
5. Suggested action for creator

Example format:
positive
["topic1", "topic2"]
true
false
"Create more content about topic1"`;

      const analysis = await getCompletion([
        { role: 'system', content: 'You are an AI that analyzes YouTube comments. Always respond in the exact format specified, using valid JSON arrays where requested.' },
        { role: 'user', content: prompt }
      ]);

      const lines = analysis.split('\n').filter(line => line.trim());
      try {
        const sentiment = lines[0]?.toLowerCase();
        if (sentiment !== 'positive' && sentiment !== 'negative' && sentiment !== 'neutral') {
          throw new Error('Invalid sentiment value');
        }

        return {
          sentiment: sentiment as 'positive' | 'negative' | 'neutral',
          topics: JSON.parse(lines[1] || '[]'),
          isQuestion: lines[2]?.toLowerCase().includes('true') ?? false,
          isEngaging: lines[3]?.toLowerCase().includes('true') ?? false,
          suggestedAction: lines[4]?.replace(/^"|"$/g, '')
        };
      } catch (parseError) {
        console.error('Error parsing comment analysis:', {
          error: parseError,
          lines,
          rawResponse: analysis
        });
        return {
          sentiment: 'neutral',
          topics: [],
          isQuestion: false,
          isEngaging: false
        };
      }
    } catch (error) {
      console.error('Error analyzing comment:', error);
      return {
        sentiment: 'neutral',
        topics: [],
        isQuestion: false,
        isEngaging: false
      };
    }
  }

  async getContentSuggestions(channelId: string): Promise<string[]> {
    try {
      const auth = await this.getAuthorizedClient();

      // Get recent videos
      const videosResponse = await this.youtube.search.list({
        auth,
        part: ['id'],
        channelId,
        order: 'date',
        type: ['video'],
        maxResults: 10
      });

      const videoIds = videosResponse.data.items
        ?.map(item => item.id?.videoId)
        .filter((id): id is string => !!id) || [];

      // Analyze each video's content
      const analyses = await Promise.all(
        videoIds.map(id => this.analyzeVideoContent(id))
      );

      // Aggregate topics and engagement data
      const allTopics = analyses.flatMap(a => [...a.mainTopics, ...a.suggestedTopics]);
      const allEngagementTriggers = analyses.flatMap(a => a.engagementTriggers);
      const allSuggestions = analyses.flatMap(a => a.audienceReaction.suggestions);

      // Generate content suggestions based on aggregated data
      const prompt = `Based on this channel's content analysis:

Popular Topics: ${allTopics.join(', ')}
Engagement Triggers: ${allEngagementTriggers.join(', ')}
Audience Suggestions: ${allSuggestions.join(', ')}

Provide a list of 10 specific content suggestions that would resonate with this audience and maximize engagement.`;

      const suggestions = await getCompletion([
        { role: 'system', content: 'You are an AI that provides strategic content suggestions for YouTube creators.' },
        { role: 'user', content: prompt }
      ]);

      return suggestions.split('\n');
    } catch (error) {
      console.error('Error generating content suggestions:', error);
      return [];
    }
  }

  async getRecentVideoIds(channelId: string): Promise<string[]> {
    try {
      const auth = await this.getAuthorizedClient();
      
      // Use search.list with minimal permissions
      const response = await this.youtube.search.list({
        auth,
        part: ['id'],
        channelId,
        maxResults: 1,
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

  async getMonthlyContentAnalysis(year: number, month: number): Promise<{
    videos: Array<{
      id: string;
      title: string;
      publishedAt: string;
      metrics: {
        views: number;
        likes: number;
        comments: number;
      };
      analysis: VideoAnalysis;
    }>;
    summary: {
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      topPerformingVideo: string;
      commonTopics: string[];
      engagementPatterns: string[];
      recommendedStrategies: string[];
    };
  }> {
    try {
      // Get videos for the specified month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      const videos = await this.getVideosByDate(startDate, endDate);

      if (!videos.length) {
        return {
          videos: [],
          summary: {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            topPerformingVideo: '',
            commonTopics: [],
            engagementPatterns: [],
            recommendedStrategies: ['No videos found for this month']
          }
        };
      }

      // Analyze each video
      const analyzedVideos = await Promise.all(
        videos.map(async (video) => {
          const videoId = video.id?.videoId;
          if (!videoId) return null;

          const metrics = await this.getVideoMetrics(videoId);
          const analysis = await this.analyzeVideoContent(videoId);

          return {
            id: videoId,
            title: video.snippet?.title || '',
            publishedAt: video.snippet?.publishedAt || '',
            metrics: {
              views: metrics.views,
              likes: metrics.likes,
              comments: metrics.comments
            },
            analysis
          };
        })
      );

      const validVideos = analyzedVideos.filter((v): v is NonNullable<typeof v> => v !== null);

      if (!validVideos.length) {
        return {
          videos: [],
          summary: {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            topPerformingVideo: '',
            commonTopics: [],
            engagementPatterns: [],
            recommendedStrategies: ['No valid videos found for this month']
          }
        };
      }

      // Aggregate data for summary
      const totalViews = validVideos.reduce((sum, v) => sum + v.metrics.views, 0);
      const totalLikes = validVideos.reduce((sum, v) => sum + v.metrics.likes, 0);
      const totalComments = validVideos.reduce((sum, v) => sum + v.metrics.comments, 0);
      
      // Find top performing video
      const topVideo = validVideos.reduce((top, current) => 
        (current.metrics.views > (top?.metrics.views || 0)) ? current : top
      , validVideos[0]);

      // Aggregate topics and patterns
      const allTopics = validVideos.flatMap(v => v.analysis.mainTopics);
      const allPatterns = validVideos.flatMap(v => v.analysis.engagementTriggers);

      // Generate strategic insights
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const prompt = `Based on the YouTube channel's performance in ${monthName} ${year}:

Total Videos: ${validVideos.length}
Total Views: ${totalViews}
Total Engagement: ${totalLikes} likes, ${totalComments} comments
Top Topics: ${allTopics.join(', ')}
Engagement Patterns: ${allPatterns.join(', ')}

Provide 5 specific strategic recommendations to improve content performance based on this data.`;

      const recommendations = await getCompletion([
        { role: 'system', content: 'You are an AI that provides strategic YouTube channel growth recommendations.' },
        { role: 'user', content: prompt }
      ]);

      return {
        videos: validVideos,
        summary: {
          totalViews,
          totalLikes,
          totalComments,
          topPerformingVideo: topVideo.title,
          commonTopics: [...new Set(allTopics)].slice(0, 10),
          engagementPatterns: [...new Set(allPatterns)].slice(0, 5),
          recommendedStrategies: recommendations.split('\n')
        }
      };
    } catch (error) {
      console.error('Error analyzing monthly content:', error);
      throw error;
    }
  }

  async getLatestVideoAnalysis(channelId: string): Promise<{
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
      // Get the latest video
      const videos = await this.getRecentVideoIds(channelId);
      if (!videos.length) throw new Error('No videos found');

      const videoId = videos[0];
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
} 