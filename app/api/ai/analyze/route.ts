import { NextResponse } from "next/server";
import { ChatAgent } from "@/app/lib/agent/chat-agent";
import { RAGSystem } from "@/app/lib/rag";
import { auth } from "../../../auth";
import { SocialMediaService } from "@/app/lib/services/social-media";
import { YouTubeService } from "@/app/lib/services/youtube";
import prisma from "@/app/lib/prisma";
import { SocialPlatform } from '@/app/lib/types/social';

interface VideoResult {
  id: string;
  title: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
  };
  analysis: {
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
  };
}

interface VideoHistory {
  [videoId: string]: {
    title: string;
    metrics: VideoResult['metrics'];
    analysis: VideoResult['analysis'];
  };
}

// Define the PlatformStatus type to match ChatAgent's expectation
interface PlatformStatus {
  platform: SocialPlatform;
  isConnected: boolean;
  lastSync: Date | null;
  error?: string;
}

interface YouTubeData {
  latestVideo: any;
  currentMonthAnalysis: any;
  historicalAnalysis: any;
  searchResults: any[];
  specificVideo: any | null;
  videoHistory: VideoHistory;
  currentVideoAnalysis: any | null;
}

interface AgentResult {
  output?: {
    content?: string;
    insights?: any[];
    suggestions?: any[];
  };
}

export async function POST(req: Request) {
  console.log('Starting AI analysis request');
  try {
    const session = await auth();
    if (!session?.user) {
      console.log('Unauthorized request - no session user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, context, type, options } = await req.json();
    console.log('Request parameters:', { type, query, hasContext: !!context, options });
    
    const rag = new RAGSystem();
    const socialService = new SocialMediaService(rag);
    const youtubeService = new YouTubeService(session.user.id, rag);
    
    // Get platform status for all supported platforms
    const supportedPlatforms: SocialPlatform[] = ['youtube', 'instagram', 'tiktok', 'gmail'];
    
    const platformStatus = await Promise.all(
      supportedPlatforms.map(async (platform) => {
        let isConnected = false;
        switch (platform) {
          case 'youtube':
            isConnected = await socialService.isYouTubeConnected();
            break;
          case 'instagram':
            isConnected = await socialService.isInstagramConnected();
            break;
          case 'tiktok':
            isConnected = await socialService.isTikTokConnected();
            break;
          case 'gmail':
            isConnected = await socialService.isGmailConnected();
            break;
        }
        const lastSync = await socialService.getLastSyncDate(platform);
        console.log(`Platform status - ${platform}:`, { isConnected, lastSync });
        return {
          platform,
          isConnected,
          lastSync: lastSync || null,
          error: isConnected ? undefined : 'Not connected'
        };
      })
    );
    
    // Get YouTube data if query is about YouTube
    let youtubeData: YouTubeData | Record<string, never> = {};
    if (type === 'youtube') {
      try {
        console.log('Processing YouTube query:', query);
        
        // Get user's YouTube account first
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          include: {
            socialAccounts: {
              where: { 
                platform: 'youtube',
                isConnected: true
              }
            }
          }
        });

        console.log('YouTube account status:', {
          connected: !!user?.socialAccounts[0],
          accountId: user?.socialAccounts[0]?.id,
          metadata: user?.socialAccounts[0]?.metadata
        });

        const youtubeAccount = user?.socialAccounts[0];
        if (!youtubeAccount) {
          console.error('YouTube account not connected');
          throw new Error('YouTube account not connected');
        }

        console.log('Fetching YouTube data...');
        
        // Extract video title from query if present
        const titleMatch = query.match(/video\s+"([^"]+)"/i) || query.match(/video\s+(.+?)(?:\s+and|\s*$)/i);
        const videoTitle = titleMatch ? titleMatch[1] : null;
        console.log('Extracted video title:', videoTitle);

        try {
          console.log('Fetching latest video analysis...');
          const latestVideo = await youtubeService.getLatestVideoAnalysis()
            .catch(e => {
              console.error('Error fetching latest video:', e);
              return null;
            });

          console.log('Latest video data:', {
            hasData: !!latestVideo,
            title: latestVideo?.video?.title,
            metrics: latestVideo?.video?.metrics
          });

          const currentDate = new Date();
          console.log('Fetching additional YouTube data...');
          
          const [currentMonthAnalysis, historicalAnalysis, searchResults, currentVideoAnalysis] = await Promise.all([
            youtubeService.getMonthlyContentAnalysis(
              currentDate.getMonth() + 1,
              currentDate.getFullYear()
            ).catch(e => {
              console.error('Error fetching current month analysis:', e);
              return null;
            }),
            youtubeService.getMonthlyContentAnalysis(11, 2022).catch(e => {
              console.error('Error fetching historical analysis:', e);
              return null;
            }),
            videoTitle ? youtubeService.searchVideosByTitle(videoTitle, {
              includeMetrics: true,
              includeAnalysis: true,
              maxResults: 1
            }).catch(e => {
              console.error('Error searching videos:', e);
              return [];
            }) : Promise.resolve([]),
            context?.currentVideo ? youtubeService.searchVideosByTitle(context.currentVideo, {
              includeMetrics: true,
              includeAnalysis: true,
              maxResults: 1
            }).then(results => results[0] || null).catch(e => {
              console.error('Error fetching current video:', e);
              return null;
            }) : Promise.resolve(null)
          ]);

          // Build comprehensive video history
          const videoHistory: VideoHistory = {};
          
          // Add historical videos
          if (historicalAnalysis?.videos) {
            historicalAnalysis.videos.forEach(video => {
              if (!videoHistory[video.id]) {
                videoHistory[video.id] = {
                  title: video.title,
                  metrics: video.metrics,
                  analysis: video.analysis
                };
              }
            });
          }

          // Add current month videos
          if (currentMonthAnalysis?.videos) {
            currentMonthAnalysis.videos.forEach(video => {
              if (!videoHistory[video.id]) {
                videoHistory[video.id] = {
                  title: video.title,
                  metrics: video.metrics,
                  analysis: video.analysis
                };
              }
            });
          }

          youtubeData = {
            latestVideo: latestVideo ? {
              video: latestVideo.video,
              commentAnalysis: latestVideo.commentAnalysis,
              contentAnalysis: latestVideo.contentAnalysis
            } : null,
            currentMonthAnalysis,
            historicalAnalysis,
            searchResults,
            specificVideo: searchResults[0] || null,
            videoHistory,
            currentVideoAnalysis
          };

          console.log('Final YouTube data prepared:', {
            hasLatestVideo: !!youtubeData.latestVideo,
            hasSpecificVideo: !!youtubeData.specificVideo,
            videoHistoryCount: Object.keys(youtubeData.videoHistory).length,
            totalDataPoints: Object.keys(youtubeData).length,
            latestVideoTitle: youtubeData.latestVideo?.video?.title
          });

          // Store the video data in memory for context
          if (youtubeData.latestVideo) {
            await rag.addDocument(
              JSON.stringify({
                type: 'insight',
                content: youtubeData.latestVideo
              }),
              {
                type: 'insight',
                category: 'youtube_analysis',
                user_id: session.user.id,
                timestamp: new Date().toISOString()
              }
            );
          }

        } catch (error) {
          console.error('Error fetching YouTube data:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in YouTube data processing:', error);
        return NextResponse.json({ 
          error: 'Failed to process YouTube data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    console.log('Initializing chat agent');
    const agent = new ChatAgent(session.user.id, rag, platformStatus);
    
    console.log('Setting agent context with data:', {
      userId: session.user.id,
      type,
      hasYoutubeData: Object.keys(youtubeData).length > 0,
      contextProvided: !!context
    });

    agent.setContext({
      userId: session.user.id,
      type,
      youtubeData,
      ...context
    });

    console.log('Processing query through agent');
    const result = await agent.process(query) as AgentResult;

    console.log('Query processing complete:', {
      hasResponse: !!result?.output,
      hasInsights: result?.output?.insights?.length ?? 0 > 0,
      hasSuggestions: result?.output?.suggestions?.length ?? 0 > 0,
      content: result?.output?.content
    });

    // Store the interaction for future context
    await rag.addDocument(
      JSON.stringify({ query, result }),
      {
        type: 'insight',
        category: 'interaction',
        user_id: session.user.id,
        timestamp: new Date().toISOString()
      }
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 