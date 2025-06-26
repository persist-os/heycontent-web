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

// Helper function to extract plain text from HTML or base64 content
function extractPlainText(content: string): string {
  if (!content) return "";
  
  // If it's base64 encoded, decode it first
  let decodedContent = content;
  try {
    if (content.includes('PCFET0NUWVBFIGh0bWw') || content.includes('<!DOCTYPE html')) {
      // This looks like base64 encoded HTML, try to decode
      decodedContent = atob(content);
    }
  } catch (e) {
    // If decoding fails, use the original content
    decodedContent = content;
  }
  
  // Remove HTML tags and clean up whitespace
  return decodedContent
    .replace(/<[^>]+>/g, " ") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Replace &amp; with &
    .replace(/&lt;/g, "<") // Replace &lt; with <
    .replace(/&gt;/g, ">") // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

// Function to clean Gmail thread data
function cleanGmailThread(thread: Doc<'gmailThreads'>) {
  return {
    threadId: thread.threadId,
    subject: thread.subject || thread.data?.subject,
    messages: (thread.data?.messages || []).map((msg: any) => ({
      subject: msg.subject || getHeader(msg, "Subject"),
      from: msg.from || getHeader(msg, "From"),
      to: msg.to || getHeader(msg, "To"),
      date: msg.date || getHeader(msg, "Date"),
      snippet: msg.snippet,
      // Try to extract plain text from body, fallback to snippet
      body: extractPlainText(msg.body || msg.snippet || ""),
    })),
  };
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
        const context = {
          platform: 'youtube' as const,
          contentId: youtubeVideo.videoId,
          title: youtubeVideo.snippet?.title || 'YouTube Video',
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
            title: youtubeVideo.snippet?.title,
            description: youtubeVideo.snippet?.description,
            channelTitle: youtubeVideo.snippet?.channel?.title,
            videoUrl: `https://www.youtube.com/watch?v=${youtubeVideo.videoId}`,
            thumbnails: youtubeVideo.snippet?.thumbnails,
            analysis: youtubeVideo.analysis,
          },
          convexData: youtubeVideo, // Include the complete Convex document
        };

        set({
          currentContext: context,
          cacheTimestamp: Date.now(),
          error: null
        });
      },

      // Set Gmail context with cleaned thread data
      setGmailContext: (gmailThread: Doc<'gmailThreads'>) => {
        // Clean the Gmail thread data before storing
        const cleanedThread = cleanGmailThread(gmailThread);
        
        const context = {
          platform: 'gmail' as const,
          contentId: gmailThread.threadId,
          title: cleanedThread.subject || 'Gmail Thread',
          analysis: gmailThread.analysis || null,
          thumbnailUrl: undefined, // Gmail doesn't have thumbnails
          publishedAt: new Date(gmailThread.createdAt || Date.now()).toISOString(),
          metrics: {
            replies: gmailThread.message_count || 1,
            messageCount: gmailThread.message_count || 1,
          },
          content: {
            subject: cleanedThread.subject,
            snippet: gmailThread.snippet,
            from: cleanedThread.messages[0]?.from || gmailThread.from,
            messageCount: gmailThread.message_count || 1,
            messages: cleanedThread.messages, // Use cleaned messages
            email: gmailThread.email,
          },
          convexData: cleanedThread, // Store the cleaned data instead of raw
        };
        
        console.log('🔍 [CONTENT STORE] Setting Gmail context:', {
          threadId: gmailThread.threadId,
          hasData: !!gmailThread.data,
          dataKeys: gmailThread.data ? Object.keys(gmailThread.data) : 'none',
          messageCount: gmailThread.message_count,
          messages: gmailThread.messages?.length || 0,
          dataMessages: gmailThread.data?.messages?.length || 0,
          fullContext: context
        });
        
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

// Export the cleaning function for use elsewhere if needed
export { cleanGmailThread }; 