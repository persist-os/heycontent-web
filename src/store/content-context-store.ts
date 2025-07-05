import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { Doc, Id } from '@/convex/_generated/dataModel';

// Type definitions for content context
export interface ContentContextState {
  // Current content context
  currentContext: {
    platform: 'instagram' | 'youtube' | 'gmail' | 'ai-insights';
    contentId: string;
    title?: string;
    analysis?: string | null;
    thumbnailUrl?: string;
    publishedAt?: string;
    metrics?: any;
    content?: any;
    type?: string; // For content-hub-insight and other special types
    source?: string; // For backwards compatibility
    // Full Convex document data
    convexData?: Doc<'instagramPosts'> | Doc<'youtubeVideos'> | Doc<'gmailThreads'> | any;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  
  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds
  
  // Error state
  error: string | null;
  
  // Actions
  setContentContext: (context: ContentContextState['currentContext']) => void;
  clearContentContext: () => void;
  setInstagramContext: (instagramPost: Doc<'instagramPosts'>) => void;
  setYouTubeContext: (youtubeVideo: Doc<'youtubeVideos'>) => void;
  setGmailContext: (gmailThread: Doc<'gmailThreads'>) => void;
  setAIInsightsContext: (insight: any) => void;
  isCacheValid: () => boolean;
}

// Helper function to get a header value by name
function getHeader(msg: any, name: string): string | undefined {
  if (!msg.headers) return undefined;
  const h = msg.headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : undefined;
}

export const useContentContextStore = create<ContentContextState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      currentContext: null,
      isLoading: false,
      isInitialized: false,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      error: null,

      // Check if cache is still valid
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        return state.cacheTimestamp > 0 && (now - state.cacheTimestamp) < state.cacheValidDuration;
      },

      // Set generic content context
      setContentContext: (context: ContentContextState['currentContext'] | null) => {
        console.log('🔍 [CONTENT CONTEXT STORE] Setting content context:', {
          platform: context?.platform,
          contentId: context?.contentId,
          title: context?.title,
          hasConvexData: !!context?.convexData,
          convexDataKeys: context?.convexData ? Object.keys(context.convexData) : 'none',
          fullContext: context
        });
        
        if (context?.convexData) {
          console.log('🔍 [CONTENT CONTEXT STORE] Convex data details:', {
            hasData: !!context.convexData.data,
            dataKeys: context.convexData.data ? Object.keys(context.convexData.data) : 'none',
            hasComments: !!context.convexData.data?.comments,
            commentsLength: context.convexData.data?.comments?.length || 0,
            commentsSample: context.convexData.data?.comments?.slice(0, 2) || 'none',
            hasInsights: !!context.convexData.data?.insights,
            insightsKeys: context.convexData.data?.insights ? Object.keys(context.convexData.data.insights) : 'none'
          });
        }
        
        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Clear content context
      clearContentContext: () => {
        set({
          currentContext: null,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Set Instagram context with full post data
      setInstagramContext: (instagramPost: Doc<'instagramPosts'>) => {
        const context = {
          platform: 'instagram' as const,
          contentId: instagramPost.postId,
          title: instagramPost.data?.caption || 'Instagram Post',
          analysis: instagramPost.analysisMarkdown || instagramPost.analysis?.summary || null,
          thumbnailUrl: instagramPost.data?.media_url || instagramPost.data?.thumbnail_url,
          publishedAt: instagramPost.data?.timestamp ? new Date(instagramPost.data.timestamp).toISOString() : new Date(instagramPost.createdAt || Date.now()).toISOString(),
          metrics: instagramPost.data?.insights || {
            likes: 0,
            comments: 0,
            shares: 0,
            saved: 0,
            reach: 0,
            impressions: 0,
          },
          content: {
            caption: instagramPost.data?.caption,
            mediaType: instagramPost.mediaType || 'IMAGE',
            permalink: instagramPost.data?.permalink,
            insights: instagramPost.data?.insights,
            children: instagramPost.data?.children,
            comments: instagramPost.data?.comments,
            analysis: instagramPost.analysis,
          },
          convexData: instagramPost, // Include the complete Convex document
        };

        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Set YouTube context with full video data
      setYouTubeContext: (youtubeVideo: Doc<'youtubeVideos'>) => {
        // Extract video metadata with fallbacks
        const title = youtubeVideo.snippet?.title || `YouTube Video ${youtubeVideo.videoId}`;
        const description = youtubeVideo.snippet?.description || '';
        const channelTitle = youtubeVideo.snippet?.channel?.title || youtubeVideo.snippet?.channel || 'Unknown Channel';
        const duration = youtubeVideo.content_details?.duration || '';
        const tags = youtubeVideo.snippet?.tags || [];
        
        // Extract captions/transcript if available
        const hasCaptions = youtubeVideo.content_details?.has_captions || false;
        const captionsData = youtubeVideo.captions;
        const captionsText = captionsData?.status === 'success' ? captionsData.caption_track?.text : null;
        
        // Extract comments if available
        const comments = youtubeVideo.comments?.comments || [];
        const hasComments = comments.length > 0;
        
        // Determine if we have analysis content
        const hasAnalysis = !!(youtubeVideo.analysisMarkdown || youtubeVideo.analysis?.summary);
        
        const context = {
          platform: 'youtube' as const,
          contentId: youtubeVideo.videoId,
          title: title,
          analysis: youtubeVideo.analysisMarkdown || youtubeVideo.analysis?.summary || null,
          thumbnailUrl: youtubeVideo.snippet?.thumbnails?.high || 
                       youtubeVideo.snippet?.thumbnails?.medium || 
                       youtubeVideo.snippet?.thumbnails?.default,
          publishedAt: youtubeVideo.snippet?.published_at || new Date(youtubeVideo.createdAt || Date.now()).toISOString(),
          metrics: youtubeVideo.statistics || {
            views: 0,
            likes: 0,
            comments: 0,
            shares: 0,
          },
          content: {
            title: title,
            description: description,
            channelTitle: channelTitle,
            duration: duration,
            videoUrl: `https://www.youtube.com/watch?v=${youtubeVideo.videoId}`,
            thumbnails: youtubeVideo.snippet?.thumbnails,
            analysis: youtubeVideo.analysis,
            tags: tags,
            // Include captions/transcript data
            captions: captionsText,
            hasCaptions: hasCaptions,
            captionsStatus: captionsData?.status || 'unknown',
            // Include comments for context
            comments: hasComments ? comments.slice(0, 5).map(comment => ({
              author: comment.author?.display_name || 'Unknown',
              text: comment.text,
              likes: comment.likes || 0,
              publishedAt: comment.published_at
            })) : [],
            hasComments: hasComments,
            totalComments: youtubeVideo.comments?.total_comments || 0,
            // Add additional metadata for videos without analysis
            ...(hasAnalysis ? {} : {
              // When no analysis, include comprehensive context for the AI
              richContext: {
                basicInfo: `YouTube video titled "${title}" by ${channelTitle}${description ? `. Description: ${description.substring(0, 500)}${description.length > 500 ? '...' : ''}` : ''}${duration ? `. Duration: ${duration}` : ''}`,
                contentDetails: {
                  publishedAt: youtubeVideo.snippet?.published_at,
                  tags: tags,
                  definition: youtubeVideo.content_details?.definition,
                  embeddable: youtubeVideo.status?.embeddable,
                  isLive: youtubeVideo.content_details?.is_live,
                },
                engagement: {
                  views: youtubeVideo.statistics?.views || 0,
                  likes: youtubeVideo.statistics?.likes || 0,
                  comments: youtubeVideo.statistics?.comments || 0,
                  commentsPreview: hasComments ? comments.slice(0, 3).map(c => c.text).join(' | ') : null
                },
                transcript: captionsText ? captionsText.substring(0, 1000) + (captionsText.length > 1000 ? '...' : '') : null,
                hasTranscript: !!captionsText
              }
            }),
          },
          convexData: youtubeVideo, // Include the complete Convex document
        };

        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Set Gmail context with pre-cleaned thread data
      setGmailContext: (gmailThread: Doc<'gmailThreads'>) => {
        // Data is now pre-cleaned in the backend, so we can use it directly
        const threadData = gmailThread.data;
        const messages = threadData?.messages || [];
        
        // Debug log the Gmail context being set
        console.log('🔍 [GMAIL CONTEXT STORE] Setting Gmail context with:', {
          threadId: gmailThread.threadId,
          hasThreadData: !!threadData,
          threadDataKeys: threadData ? Object.keys(threadData) : 'none',
          threadDataSubject: threadData?.subject || 'missing from threadData',
          threadDataFrom: threadData?.from || 'missing from threadData',
          threadDataSnippet: threadData?.snippet || 'missing from threadData',
          messagesLength: messages.length,
          topLevelSubject: gmailThread.subject || 'missing from top level',
          topLevelFrom: gmailThread.from || 'missing from top level',
          topLevelSnippet: gmailThread.snippet || 'missing from top level',
          messageCount: threadData?.messageCount || 'missing',
          emailField: gmailThread.email || 'missing',
          hasAnalysis: !!gmailThread.analysis,
          allTopLevelKeys: Object.keys(gmailThread)
        });
        
        // Show complete structure for debugging
        console.log('🔍 [GMAIL CONTEXT STORE] Complete Gmail thread structure:', JSON.stringify(gmailThread, null, 2));
        
        const context = {
          platform: 'gmail' as const,
          contentId: gmailThread.threadId,
          title: threadData?.subject || 'Gmail Thread',
          analysis: gmailThread.analysis || null,
          thumbnailUrl: undefined, // Gmail doesn't have thumbnails
          publishedAt: new Date(gmailThread.createdAt || Date.now()).toISOString(),
          metrics: {
            replies: threadData?.messageCount || 1,
            messageCount: threadData?.messageCount || 1,
          },
          content: {
            subject: threadData?.subject,
            snippet: threadData?.snippet,
            from: messages[0]?.from || threadData?.from,
            messageCount: threadData?.messageCount || 1,
            messages: messages, // Use pre-cleaned messages
            email: gmailThread.email,
          },
          convexData: gmailThread, // Store the complete Convex document
        };
        
        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Set AI Insights context
      setAIInsightsContext: (insight: any) => {
        const context = {
          platform: 'ai-insights' as const,
          contentId: `insight-${Date.now()}`,
          title: insight.title || 'AI Insight',
          analysis: insight.insight || insight.content || null,
          content: insight,
          type: insight.type || undefined, // Pass through the type if provided
          source: insight.source || undefined, // Pass through the source if provided
          convexData: insight // Store the complete insight data
        };

        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      }
    })),
    {
      name: 'content-context-store-cache',
      partialize: (state) => ({
        currentContext: state.currentContext,
        isInitialized: state.isInitialized,
        cacheTimestamp: state.cacheTimestamp
      }),
    }
  )
);

// Selector hooks for common use cases
export const useContentContext = () => {
  const currentContext = useContentContextStore(state => state.currentContext);
  const isLoading = useContentContextStore(state => state.isLoading);
  const error = useContentContextStore(state => state.error);
  
  return {
    context: currentContext,
    isLoading,
    isError: !!error,
    hasContext: !!currentContext,
    platform: currentContext?.platform,
    contentId: currentContext?.contentId,
    title: currentContext?.title,
    analysis: currentContext?.analysis,
    thumbnailUrl: currentContext?.thumbnailUrl,
    publishedAt: currentContext?.publishedAt,
    metrics: currentContext?.metrics,
    content: currentContext?.content,
    convexData: currentContext?.convexData
  };
};

// Platform-specific hooks
export const useInstagramContext = () => {
  const context = useContentContext();
  return {
    ...context,
    isInstagram: context.platform === 'instagram',
    instagramData: context.platform === 'instagram' ? context.convexData as Doc<'instagramPosts'> : null,
    caption: context.platform === 'instagram' ? context.content?.caption : null,
    mediaType: context.platform === 'instagram' ? context.content?.mediaType : null,
    permalink: context.platform === 'instagram' ? context.content?.permalink : null,
    children: context.platform === 'instagram' ? context.content?.children : null,
    comments: context.platform === 'instagram' ? context.content?.comments : null,
  };
};

export const useYouTubeContext = () => {
  const context = useContentContext();
  return {
    ...context,
    isYouTube: context.platform === 'youtube',
    youtubeData: context.platform === 'youtube' ? context.convexData as Doc<'youtubeVideos'> : null,
    description: context.platform === 'youtube' ? context.content?.description : null,
    duration: context.platform === 'youtube' ? context.content?.duration : null,
    channel: context.platform === 'youtube' ? context.content?.channel : null,
    tags: context.platform === 'youtube' ? context.content?.tags : null,
  };
};

export const useGmailContext = () => {
  const context = useContentContext();
  return {
    ...context,
    isGmail: context.platform === 'gmail',
    gmailData: context.platform === 'gmail' ? context.convexData as Doc<'gmailThreads'> : null,
    from: context.platform === 'gmail' ? context.content?.from : null,
    subject: context.platform === 'gmail' ? context.content?.subject : null,
    snippet: context.platform === 'gmail' ? context.content?.snippet : null,
    messages: context.platform === 'gmail' ? context.content?.messages : null,
  };
};

// Action hooks
export const useContentContextActions = () => {
  const setContentContext = useContentContextStore(state => state.setContentContext);
  const clearContentContext = useContentContextStore(state => state.clearContentContext);
  const setInstagramContext = useContentContextStore(state => state.setInstagramContext);
  const setYouTubeContext = useContentContextStore(state => state.setYouTubeContext);
  const setGmailContext = useContentContextStore(state => state.setGmailContext);
  const setAIInsightsContext = useContentContextStore(state => state.setAIInsightsContext);

  return {
    setContentContext,
    clearContentContext,
    setInstagramContext,
    setYouTubeContext,
    setGmailContext,
    setAIInsightsContext,
  };
}; 