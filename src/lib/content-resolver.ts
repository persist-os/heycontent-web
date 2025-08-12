import { useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { UnifiedContent, PlatformContentData } from '@/types/content';
import { useContentStore } from '@/store/content-store';
import { useEffect, useMemo } from 'react';

// Content resolution utility that replaces getAllLinkableContent
export function useContentResolver(userId: string | undefined) {
  const convex = useConvex();
  const store = useContentStore();
  
  // Initialize content when userId is available
  useEffect(() => {
    if (userId && !store.isInitialized) {
      store.initializeContent(userId, convex);
    }
  }, [userId, store.isInitialized]);

  // Return content and utilities
  return {
    // Data
    allContent: store.allContent,
    content: store.content,
    isLoading: Object.values(store.loading).some(Boolean),
    isInitialized: store.isInitialized,
    errors: store.errors,
    hasErrors: Object.values(store.errors).some(Boolean),
    
    // Utilities (these replace getAllLinkableContent functionality)
    findContentById: (contentId: string) => store.findContentById(contentId),
    getContentByPlatform: (platform: keyof PlatformContentData) => 
      store.getContentByPlatform(platform),
    getAllLinkableContent: () => store.getAllLinkableContent(),
    getContentByTab: (currentTab: string) => store.getContentByTab(currentTab),
    
    // Actions
    refreshContent: () => userId && store.refreshContent(userId, convex),
    refreshPlatform: (platform: keyof PlatformContentData) => 
      userId && store.refreshPlatform(userId, platform, convex),
    invalidateContent: store.invalidateContent,
    
    // Infinite scroll actions
    loadMoreContent: (platform: keyof PlatformContentData) => 
      userId && store.loadMoreContent(userId, platform, convex),
    resetPlatformScroll: store.resetPlatformScroll,
    
    // Platform-specific infinite scroll state
    getPlatformScrollState: (platform: keyof PlatformContentData) => store.content[platform],
  };
}

// Helper function to resolve content IDs to titles (for api-utils.ts)
export async function resolveContentTitles(
  contentIds: string[], 
  userId: string,
  convex: any
): Promise<Record<string, string>> {
  const titles: Record<string, string> = {};
  
  try {
    // Fetch content from each platform in parallel
    const [notes, youtubeVideos, instagramPosts, gmailThreads] = await Promise.allSettled([
      convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 }), // Get up to 1000 notes
      convex.query(api.youtubeQueries.listUserYouTubeVideos, { userId, limit: 100 }),
      convex.query(api.instagramQueries.getAllInstagramPosts, { userId }),
      convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
        userId, 
        paginationOpts: { numItems: 100, cursor: null } 
      }),
    ]);
    
    // Process notes
    if (notes.status === 'fulfilled') {
      notes.value.page.forEach((note: any) => {
        titles[String(note._id)] = note.title || 'Untitled Note';
        titles[`note:${note._id}`] = note.title || 'Untitled Note';
        titles[`notes:${note._id}`] = note.title || 'Untitled Note';
      });
    }
    
    // Process YouTube videos
    if (youtubeVideos.status === 'fulfilled') {
      youtubeVideos.value.videos?.forEach((video: any) => {
        titles[`youtube:${video.videoId || video.id}`] = video.snippet?.title || 'Untitled Video';
      });
    }
    
    // Process Instagram posts
    if (instagramPosts.status === 'fulfilled') {
      instagramPosts.value.forEach((post: any) => {
        titles[`instagram:${post.postId}`] = post.data?.caption?.substring(0, 100) || 'Instagram Post';
      });
    }
    
    // Process Gmail threads
    if (gmailThreads.status === 'fulfilled') {
      gmailThreads.value.page.forEach((thread: any) => {
        titles[`gmail:${thread.threadId}`] = thread.subject || thread.data?.subject || 'No Subject';
      });
    }
    
    // Only return titles for the requested content IDs
    const requestedTitles: Record<string, string> = {};
    contentIds.forEach(id => {
      if (titles[id]) {
        requestedTitles[id] = titles[id];
      }
    });
    
    return requestedTitles;
  } catch (error) {
    console.error('Error resolving content titles:', error);
    return {};
  }
}

// Helper function to resolve all link content (for api-utils.ts)
export async function resolveAllLinkContent(
  content: string,
  userId: string,
  convex: any
): Promise<any[]> {
  const contentIdPattern = /@\[([^\]]+)\]@/g;
  const matches = Array.from(content.matchAll(contentIdPattern));
  
  if (matches.length === 0) {
    return [];
  }
  
  const contentIds = matches.map(match => match[1]);
  const resolvedContent: any[] = [];
  
  try {
    // Fetch content from each platform in parallel
    const [notes, youtubeVideos, instagramPosts, gmailThreads] = await Promise.allSettled([
      convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 }), // Get up to 1000 notes
      convex.query(api.youtubeQueries.listUserYouTubeVideos, { userId, limit: 100 }),
      convex.query(api.instagramQueries.getAllInstagramPosts, { userId }),
      convex.query(api.gmailQueries.getGmailThreadsPaginated, { 
        userId, 
        paginationOpts: { numItems: 100, cursor: null } 
      }),
    ]);
    
    for (const contentId of contentIds) {
      let foundContent = null;
      
      // Check if it's a prefixed ID
      if (contentId.includes(':')) {
        const [prefix, id] = contentId.split(':', 2);
        
        switch (prefix) {
          case 'note':
          case 'notes':
            if (notes.status === 'fulfilled') {
              foundContent = notes.value.page.find((note: any) => String(note._id) === id);
              if (foundContent) {
                resolvedContent.push({
                  type: 'note',
                  id: contentId,
                  title: foundContent.title || 'Untitled Note',
                  content: foundContent.content || '',
                  platform: 'smart-notes',
                  createdAt: foundContent.createdAt || Date.now(),
                });
              }
            }
            break;
            
          case 'youtube':
            if (youtubeVideos.status === 'fulfilled') {
              foundContent = youtubeVideos.value.videos?.find((video: any) => (video.videoId || video.id) === id);
              if (foundContent) {
                resolvedContent.push({
                  type: 'youtube',
                  id: contentId,
                  title: foundContent.snippet?.title || 'Untitled Video',
                  content: foundContent.snippet?.description || '',
                  platform: 'youtube',
                  createdAt: new Date(foundContent.snippet?.published_at || foundContent.createdAt || 0).getTime(),
                  thumbnailUrl: foundContent.snippet?.thumbnails?.high || foundContent.snippet?.thumbnails?.medium,
                  statistics: foundContent.statistics,
                });
              }
            }
            break;
            
          case 'instagram':
            if (instagramPosts.status === 'fulfilled') {
              foundContent = instagramPosts.value.find((post: any) => post.postId === id);
              if (foundContent) {
                // Build comprehensive content including caption, insights, statistics, analysis, etc.
                let contentParts = [];

                // Add caption
                if (foundContent.data?.caption) {
                  contentParts.push(`Caption: ${foundContent.data.caption}`);
                }

                // Add media type
                if (foundContent.mediaType) {
                  contentParts.push(`Media Type: ${foundContent.mediaType.toUpperCase()}`);
                }

                // Add comprehensive statistics from insights
                const insights = foundContent.data?.insights || {};
                if (insights && Object.keys(insights).length > 0) {
                  const statsParts = [];
                  if (insights.likes !== undefined && insights.likes !== null) statsParts.push(`Likes: ${insights.likes.toLocaleString()}`);
                  if (insights.comments !== undefined && insights.comments !== null) statsParts.push(`Comments: ${insights.comments.toLocaleString()}`);
                  if (insights.reach !== undefined && insights.reach !== null) statsParts.push(`Reach: ${insights.reach.toLocaleString()}`);
                  if (insights.impressions !== undefined && insights.impressions !== null) statsParts.push(`Impressions: ${insights.impressions.toLocaleString()}`);
                  if (insights.saved !== undefined && insights.saved !== null) statsParts.push(`Saved: ${insights.saved.toLocaleString()}`);
                  if (insights.shares !== undefined && insights.shares !== null) statsParts.push(`Shares: ${insights.shares.toLocaleString()}`);
                  if (insights.total_interactions !== undefined && insights.total_interactions !== null) statsParts.push(`Total Interactions: ${insights.total_interactions.toLocaleString()}`);
                  if (insights.profile_visits !== undefined && insights.profile_visits !== null) statsParts.push(`Profile Visits: ${insights.profile_visits.toLocaleString()}`);
                  if (insights.views !== undefined && insights.views !== null) statsParts.push(`Views: ${insights.views.toLocaleString()}`);
                  
                  if (statsParts.length > 0) {
                    contentParts.push(`Statistics: ${statsParts.join(', ')}`);
                  }
                }

                // Add analysis content if available
                if (foundContent.analysis) {
                  const analysisText = typeof foundContent.analysis === 'string' ? foundContent.analysis : JSON.stringify(foundContent.analysis, null, 2);
                  contentParts.push(`Analysis: ${analysisText}`);
                }

                // Add additional insights if available
                if (foundContent.insights && foundContent.insights !== foundContent.data?.insights) {
                  const additionalInsights = typeof foundContent.insights === 'string' ? foundContent.insights : JSON.stringify(foundContent.insights, null, 2);
                  contentParts.push(`Additional Insights: ${additionalInsights}`);
                }

                // Add platform and content type info
                if (foundContent.platform || foundContent.mediaType) {
                  const platformInfo = [];
                  if (foundContent.platform) platformInfo.push(foundContent.platform);
                  if (foundContent.mediaType) platformInfo.push(foundContent.mediaType);
                  contentParts.push(`Platform: ${platformInfo.join(' - ')}`);
                }

                // Add creation date if available
                if (foundContent.data?.timestamp || foundContent.createdAt) {
                  const timestamp = foundContent.data?.timestamp || foundContent.createdAt;
                  const date = new Date(timestamp).toLocaleDateString();
                  contentParts.push(`Published: ${date}`);
                }

                // Add media URLs for reference
                if (foundContent.data?.media_url) {
                  contentParts.push(`Media URL: ${foundContent.data.media_url}`);
                }
                if (foundContent.data?.thumbnail_url && foundContent.data.thumbnail_url !== foundContent.data.media_url) {
                  contentParts.push(`Thumbnail URL: ${foundContent.data.thumbnail_url}`);
                }

                // Add permalink if available
                if (foundContent.data?.permalink) {
                  contentParts.push(`Permalink: ${foundContent.data.permalink}`);
                }

                const fullContent = contentParts.join('\n\n');

                console.log('🔗 [CONTENT RESOLVER] Built comprehensive Instagram content:', {
                  postId: id,
                  contentLength: fullContent.length,
                  hasInsights: !!foundContent.data?.insights,
                  hasAnalysis: !!foundContent.analysis,
                  insightsKeys: foundContent.data?.insights ? Object.keys(foundContent.data.insights) : 'none',
                  contentPreview: fullContent.substring(0, 200) + '...'
                });

                resolvedContent.push({
                  type: 'instagram',
                  id: contentId,
                  title: foundContent.data?.caption?.substring(0, 100) || 'Instagram Post',
                  content: fullContent, // Now includes comprehensive data
                  platform: 'instagram',
                  createdAt: foundContent.data?.timestamp || foundContent.createdAt || Date.now(),
                  mediaUrl: foundContent.data?.media_url,
                  statistics: {
                    likes: foundContent.data?.insights?.likes || foundContent.data?.like_count || 0,
                    comments: foundContent.data?.insights?.comments || foundContent.data?.comments_count || 0,
                    reach: foundContent.data?.insights?.reach || 0,
                    impressions: foundContent.data?.insights?.impressions || 0,
                    saved: foundContent.data?.insights?.saved || 0,
                    shares: foundContent.data?.insights?.shares || 0,
                    total_interactions: foundContent.data?.insights?.total_interactions || 0,
                    profile_visits: foundContent.data?.insights?.profile_visits || 0,
                    views: foundContent.data?.insights?.views || 0,
                  },
                  metadata: {
                    mediaType: foundContent.mediaType,
                    insights: foundContent.data?.insights,
                    analysis: foundContent.analysis,
                    permalink: foundContent.data?.permalink
                  }
                });
              }
            }
            break;
            
          case 'gmail':
            if (gmailThreads.status === 'fulfilled') {
              foundContent = gmailThreads.value.page.find((thread: any) => thread.threadId === id);
              if (foundContent) {
                // Extract comprehensive Gmail content similar to link-content-resolver
                const threadData = foundContent.data || {};
                const messages = threadData.messages || foundContent.messages || [];
                
                let gmailContent = '';
                if (messages && messages.length > 0) {
                  const contentParts = [];
                  const subject = threadData.subject || foundContent.subject || (messages[0]?.subject) || 'No Subject';
                  const from = threadData.from || foundContent.from || (messages[0]?.from) || 'Unknown Sender';
                  
                  contentParts.push(`Subject: ${subject}`);
                  contentParts.push(`From: ${from}`);
                  contentParts.push('\n--- Email Content ---');
                  
                  messages.forEach((message: any, index: number) => {
                    contentParts.push(`\nMessage ${index + 1}:`);
                    if (message.from) {
                      contentParts.push(`From: ${message.from}`);
                    }
                    if (message.subject) {
                      contentParts.push(`Subject: ${message.subject}`);
                    }
                    
                    // Extract the actual message content - check multiple possible fields
                    let messageContent = '';
                    if (message.snippet) {
                      messageContent = message.snippet;
                    } else if (message.body) {
                      messageContent = message.body;
                    } else if (message.content) {
                      messageContent = message.content;
                    } else if (message.data?.snippet) {
                      messageContent = message.data.snippet;
                    } else if (message.data?.body) {
                      messageContent = message.data.body;
                    }
                    
                    if (messageContent) {
                      contentParts.push(`Content: ${messageContent}`);
                    }
                  });
                  
                  gmailContent = contentParts.join('\n');
                } else {
                  // Fall back to snippet if no messages are available
                  gmailContent = foundContent.snippet || foundContent.data?.snippet || 'No content available';
                }
                
                resolvedContent.push({
                  type: 'gmail',
                  id: contentId,
                  title: foundContent.subject || foundContent.data?.subject || 'No Subject',
                  content: gmailContent,
                  platform: 'gmail',
                  createdAt: foundContent.createdAt || Date.now(),
                  from: foundContent.from || foundContent.data?.from || 'Unknown Sender',
                  messageCount: foundContent.message_count || foundContent.data?.message_count || 1,
                });
              }
            }
            break;
            
          case 'insight':
          case 'insights':
            // Handle insight content
            console.log('🔍 [CONTENT RESOLVER] Processing insight:', contentId);
            
            // Parse the insight ID to get platform, analysisId, and index
            const insightParts = contentId.split(':');
            if (insightParts.length >= 4) {
              const platform = insightParts[1];
              const analysisId = insightParts[2];
              const indexStr = insightParts[3];
              const index = parseInt(indexStr, 10);
              
              if (!isNaN(index)) {
                // Try to find the insight in the content store or fetch it
                try {
                  let insightData = null;
                  
                  // Try to fetch the insight based on platform
                  if (platform === 'youtube') {
                    const youtubeAnalyses = await convex.query(api.youtubeQueries.getVideoAnalyses, { userId });
                    if (youtubeAnalyses?.analyses) {
                      const video = youtubeAnalyses.analyses.find((v: any) => v.id === analysisId);
                      if (video && video.analysis) {
                        // Build comprehensive YouTube insight content
                        const insightContent = [
                          `Title: ${video.title || 'Untitled Video'}`,
                          '',
                          'Analysis:',
                          video.analysisMarkdown || video.analysis?.summary || video.analysis || 'YouTube video analysis'
                        ].join('\n');
                        
                        insightData = {
                          id: contentId,
                          title: `${video.title} - Analysis`,
                          type: 'insight',
                          contentType: 'youtube_analysis',
                          platform: 'insights',
                          analysis: video.analysis,
                          content: insightContent
                        };
                      }
                    }
                  } else if (platform === 'instagram') {
                    const instagramAccount = await convex.query(api.instagramQueries.getInstagramAccount, { userId });
                    if (instagramAccount?.instagramAccountId) {
                      const instagramAnalysis = await convex.query(api.instagramQueries.getInstagramBatchAnalysis, { userId, instagramAccountId: instagramAccount.instagramAccountId });
                      if (instagramAnalysis?.insights?.insights && instagramAnalysis.insights.insights[index]) {
                        const insight = instagramAnalysis.insights.insights[index];
                        
                        // Build comprehensive insight content with all available fields
                        const insightContent = [
                          `Title: ${insight.title || 'Untitled Insight'}`,
                          '',
                          'Action Steps:',
                          ...(insight.actionSteps || []).map((step: string, i: number) => `${i + 1}. ${step}`),
                          '',
                          `Expected Outcome: ${insight.expectedOutcome || 'Not specified'}`,
                          '',
                          `Impact: ${insight.impact || 'Not specified'}`,
                          '',
                          'Why Now:',
                          ...(insight.whyNow || []).map((reason: string, i: number) => `${i + 1}. ${reason}`),
                          '',
                          'Source Details:',
                          ...(insight.sourceDetails || []).map((detail: string, i: number) => `${i + 1}. ${detail}`),
                          '',
                          'Related Items:',
                          ...(insight.relatedItems || []).map((item: any) => `${item.label}: ${item.value}`),
                          '',
                          `Platform: ${insight.platform || 'instagram'}`,
                          '',
                          `Highlight Color: ${insight.highlightColor || 'Not specified'}`,
                          `Outcome Color: ${insight.outcomeColor || 'Not specified'}`
                        ].join('\n');
                        
                        insightData = {
                          id: contentId,
                          title: insight.title || insight.heading || 'Instagram Insight',
                          type: 'insight',
                          contentType: 'instagram_analysis',
                          platform: 'insights',
                          analysis: insight,
                          content: insightContent
                        };
                      }
                    }
                  } else if (platform === 'gmail') {
                    const gmailAccounts = await convex.query(api.gmailQueries.getGmailAccounts, { userId });
                    if (gmailAccounts.length > 0) {
                      const gmailAnalysis = await convex.query(api.gmailQueries.getGmailBatchAnalysis, { userId, gmailAccountId: gmailAccounts[0]._id });
                      if (gmailAnalysis?.insights?.insights && gmailAnalysis.insights.insights[index]) {
                        const insight = gmailAnalysis.insights.insights[index];
                        
                        // Build comprehensive Gmail insight content
                        const insightContent = [
                          `Title: ${insight.title || 'Gmail Insight'}`,
                          '',
                          'Analysis:',
                          insight.analysis || insight.content || insight.description || 'Gmail analysis insight'
                        ].join('\n');
                        
                        insightData = {
                          id: contentId,
                          title: insight.title || 'Gmail Insight',
                          type: 'insight',
                          contentType: 'gmail_insight',
                          platform: 'insights',
                          analysis: insight,
                          content: insightContent
                        };
                      }
                    }
                  }
                  
                  if (insightData) {
                    resolvedContent.push(insightData);
                  } else {
                    // If insight not found, create a placeholder
                    resolvedContent.push({
                      id: contentId,
                      title: `${platform} Insight`,
                      type: 'insight',
                      contentType: `${platform}_analysis`,
                      platform: 'insights',
                      analysis: null,
                      content: `Insight not found for ${platform} analysis ${analysisId} at index ${index}`
                    });
                  }
                } catch (error) {
                  console.warn('Failed to fetch insight:', error);
                  // Add a placeholder insight even if fetching fails
                  resolvedContent.push({
                    id: contentId,
                    title: `${platform} Insight`,
                    type: 'insight',
                    contentType: `${platform}_analysis`,
                    platform: 'insights',
                    analysis: null,
                    content: `Failed to fetch insight: ${error}`
                  });
                }
              }
            }
            break;
        }
      } else {
        // Handle non-prefixed IDs (assume they're notes)
        if (notes.status === 'fulfilled') {
          foundContent = notes.value.find((note: any) => String(note._id) === contentId);
          if (foundContent) {
            resolvedContent.push({
              type: 'note',
              id: contentId,
              title: foundContent.title || 'Untitled Note',
              content: foundContent.content || '',
              platform: 'smart-notes',
              createdAt: foundContent.createdAt || Date.now(),
            });
          }
        }
      }
    }
    
    return resolvedContent;
  } catch (error) {
    console.error('Error resolving all link content:', error);
    return [];
  }
}

// Helper to get content by platform with infinite scroll support
export function useContentByPlatform(platform: 'smart-notes' | 'youtube' | 'instagram' | 'gmail' | 'insights') {
  const content = useContentStore(state => state.content);
  const loading = useContentStore(state => state.loading);
  const errors = useContentStore(state => state.errors);
  
  const platformKey = platform === 'smart-notes' ? 'notes' : platform;
  
  return useMemo(() => {
    const platformContent = content[platformKey as keyof typeof content];
    return {
      content: platformContent.items || [],
      loading: loading[platformKey as keyof typeof loading],
      error: errors[platformKey as keyof typeof errors],
      hasError: !!errors[platformKey as keyof typeof errors],
      // Infinite scroll state
      hasMore: platformContent.hasMore,
      isLoadingMore: platformContent.isLoadingMore,
      totalLoaded: platformContent.totalLoaded,
      nextCursor: platformContent.nextCursor,
      scrollState: platformContent,
    };
  }, [content, loading, errors, platformKey]);
} 