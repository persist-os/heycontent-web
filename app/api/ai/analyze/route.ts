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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query, context, type } = await req.json();
    
    const rag = new RAGSystem();
    const socialService = new SocialMediaService();
    const youtubeService = new YouTubeService(session.user.id);
    
    // Get platform status for all supported platforms
    const supportedPlatforms: SocialPlatform[] = ['youtube', 'instagram', 'tiktok', 'gmail'];
    
    const platformStatus: PlatformStatus[] = await Promise.all(
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
        return {
          platform,
          isConnected,
          lastSync: lastSync || null,  // Convert undefined to null
          error: isConnected ? undefined : 'Not connected'
        };
      })
    );
    
    // Get YouTube data if query is about YouTube
    let youtubeData = {};
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
          console.error('YouTube account not found or not connected');
          throw new Error('YouTube account not connected');
        }

        console.log('Fetching YouTube data...');
        
        try {
          // Get comprehensive video data including historical data
          const [latestVideo, currentMonthAnalysis, historicalAnalysis, searchResults, currentVideoAnalysis] = await Promise.all([
            youtubeService.getLatestVideoAnalysis().catch(e => {
              console.error('Error fetching latest video:', e);
              return null;
            }),
            youtubeService.getMonthlyContentAnalysis(
              new Date().getMonth() + 1,
              new Date().getFullYear()
            ).catch(e => {
              console.error('Error fetching current month analysis:', e);
              return null;
            }),
            youtubeService.getMonthlyContentAnalysis(11, 2022).catch(e => {
              console.error('Error fetching historical analysis:', e);
              return null;
            }),
            youtubeService.searchVideosByTitle(query, {
              includeMetrics: true,
              includeAnalysis: true,
              maxResults: 5
            }).catch(e => {
              console.error('Error searching videos:', e);
              return [];
            }),
            context?.currentVideo ? youtubeService.searchVideosByTitle(context.currentVideo, {
              includeMetrics: true,
              includeAnalysis: true,
              maxResults: 1
            }).then(results => results[0] || null).catch(e => {
              console.error('Error fetching current video:', e);
              return null;
            }) : Promise.resolve(null)
          ]);

          // Log raw historical analysis data
          console.log('Raw historical analysis:', {
            hasData: !!historicalAnalysis,
            videoCount: historicalAnalysis?.videos?.length,
            videos: historicalAnalysis?.videos?.map(v => ({
              id: v.id,
              title: v.title,
              metrics: v.metrics
            }))
          });

          console.log('YouTube data fetch results:', {
            latestVideoError: !latestVideo ? 'Failed to fetch' : null,
            currentMonthError: !currentMonthAnalysis ? 'Failed to fetch' : null,
            historicalError: !historicalAnalysis ? 'Failed to fetch' : null,
            searchResultsError: !searchResults?.length ? 'No results found' : null,
            currentVideoError: context?.currentVideo && !currentVideoAnalysis ? 'Failed to fetch' : null,
            latestVideoData: latestVideo ? {
              title: latestVideo.video?.title,
              hasMetrics: !!latestVideo.video?.metrics,
              hasAnalysis: !!latestVideo.contentAnalysis
            } : null,
            historicalData: historicalAnalysis ? {
              videoCount: historicalAnalysis.videos.length,
              hasMetrics: historicalAnalysis.videos.some(v => v.metrics),
              videos: historicalAnalysis.videos.map(v => v.title)  // Add video titles to log
            } : null
          });

          // Build comprehensive video history from both current and historical data
          const videoHistory: VideoHistory = {};
          
          // Add historical videos with complete data
          if (historicalAnalysis?.videos) {
            console.log('Historical videos found:', historicalAnalysis.videos.map(v => ({
              title: v.title,
              metrics: v.metrics
            })));
            
            historicalAnalysis.videos.forEach(video => {
              if (!videoHistory[video.id]) {  // Prevent duplicates
                videoHistory[video.id] = {
                  title: video.title,
                  metrics: video.metrics,
                  analysis: video.analysis
                };
              }
            });
          }

          // Add current month videos with complete data
          if (currentMonthAnalysis?.videos) {
            console.log('Current month videos found:', currentMonthAnalysis.videos.map(v => ({
              title: v.title,
              metrics: v.metrics
            })));
            
            currentMonthAnalysis.videos.forEach(video => {
              if (!videoHistory[video.id]) {  // Prevent duplicates
                videoHistory[video.id] = {
                  title: video.title,
                  metrics: video.metrics,
                  analysis: video.analysis
                };
              }
            });
          }

          // Log complete video history for debugging
          console.log('Complete video history:', Object.entries(videoHistory).map(([id, data]) => ({
            id,
            title: data.title,
            metrics: data.metrics
          })));

          // Log final data structure being sent to AI
          console.log('Data structure being sent to AI:', {
            hasLatestVideo: !!latestVideo,
            hasCurrentMonth: !!currentMonthAnalysis,
            hasHistorical: !!historicalAnalysis,
            searchResultsCount: searchResults?.length,
            videoHistoryCount: Object.keys(videoHistory).length,
            historicalVideos: historicalAnalysis?.videos?.map(v => v.title),
            allVideoTitles: Object.values(videoHistory).map(v => v.title)
          });

          youtubeData = {
            latestVideo,
            currentMonthAnalysis,
            historicalAnalysis,
            searchResults,
            videoHistory,
            recentVideos: searchResults,
            currentVideoAnalysis
          };

          console.log('Final YouTube data prepared:', {
            hasCurrentVideo: !!latestVideo,
            videoHistoryCount: Object.keys(videoHistory).length,
            totalDataPoints: Object.keys(youtubeData).length
          });
        } catch (error) {
          console.error('Error fetching YouTube data:', error);
        }
      } catch (error) {
        console.error('Error fetching YouTube data:', error);
      }
    }
    
    // Initialize chat agent with proper context
    const agent = new ChatAgent(session.user.id, rag, platformStatus);
    
    // Set the context using the proper method
    agent.setContext({
      userId: session.user.id,
      type,
      youtubeData,
      ...context
    });

    // Process the query
    const result = await agent.process(query);

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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
  }
} 