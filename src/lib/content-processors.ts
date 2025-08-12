import { Doc } from '@/convex/_generated/dataModel';
import { UnifiedContent } from '@/types/content';

// Data transformation helpers - pure functions for converting API data to UnifiedContent

export function processNotesData(result: PromiseSettledResult<Doc<'notes'>[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch notes:', result.reason);
    return [];
  }

  return result.value.map(note => ({
    id: String(note._id),
    title: note.title || 'Untitled Note',
    type: 'note' as const,
    contentType: note.type || 'idea_bank',
    platform: 'smart-notes',
    createdAt: note.createdAt || Date.now(),
    updatedAt: note.updatedAt || Date.now(),
    important: note.important || false,
    tags: note.tags || [],
    analysis: note.analysis,
    content: note.content || '',
  }));
}

export function processYouTubeData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch YouTube data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🎥 [CONTENT PROCESSORS] processYouTubeData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🎥 [CONTENT PROCESSORS] processYouTubeData: Processing', result.value.length, 'videos');
  }

  const processed = result.value.map(video => ({
    id: `youtube:${video.id || video.videoId}`,
    title: video.content?.title || video.snippet?.title || 'Untitled Video',
    type: 'youtube' as const,
    contentType: 'video',
    platform: 'youtube',
    createdAt: new Date(video.publishedAt || video.snippet?.published_at || 0).getTime(),
    updatedAt: new Date(video.publishedAt || video.snippet?.published_at || 0).getTime(),
    important: false,
    tags: video.snippet?.tags || [],
    analysis: video.analysis,
    content: video.content?.description || video.snippet?.description || '',
    thumbnailUrl: video.content?.thumbnailUrl || video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium,
    statistics: video.metrics || video.statistics,
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('🎥 [CONTENT PROCESSORS] processYouTubeData: Processed', processed.length, 'videos successfully');
  }

  return processed;
}

export function processInstagramData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Instagram data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('📸 [CONTENT PROCESSORS] processInstagramData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📸 [CONTENT PROCESSORS] processInstagramData: Processing', result.value.length, 'posts');
  }

  const processed = result.value.map(post => {
    // Extract comprehensive insights data
    const postInsights = post.data?.insights || {};
    const statistics = {
      likes: postInsights?.likes || post.data?.like_count || 0,
      comments: postInsights?.comments || post.data?.comments_count || 0,
      reach: postInsights?.reach || 0,
      impressions: postInsights?.impressions || 0,
      saved: postInsights?.saved || 0,
      shares: postInsights?.shares || 0,
      total_interactions: postInsights?.total_interactions || 0,
      profile_visits: postInsights?.profile_visits || 0,
      profile_activity: postInsights?.profile_activity || 0,
      views: postInsights?.views || 0,
      follows: postInsights?.follows || 0,
      ig_reels_avg_watch_time: postInsights?.ig_reels_avg_watch_time || 0,
      ig_reels_video_view_total_time: postInsights?.ig_reels_video_view_total_time || 0,
    };

    return {
      id: `instagram:${post.postId}`,
      title: post.data?.caption?.substring(0, 100) || 'Instagram Post',
      type: 'instagram' as const,
      contentType: post.mediaType?.toLowerCase() || 'image',
      platform: 'instagram',
      createdAt: post.data?.timestamp || post.createdAt || Date.now(),
      updatedAt: post.updatedAt || post.createdAt || Date.now(),
      important: false,
      tags: [],
      analysis: post.analysis,
      analysisMarkdown: post.analysisMarkdown, // Preserve markdown analysis
      content: post.data?.caption || '',
      mediaUrl: post.data?.media_url,
      thumbnailUrl: post.data?.thumbnail_url,
      permalink: post.data?.permalink, // Add permalink
      insights: postInsights, // Full insights object
      statistics, // Comprehensive statistics
      mediaType: post.mediaType, // Preserve original media type
      // Include raw Convex data for complete access
      convexData: post,
      // Include comments if available
      comments: post.data?.comments || [],
      // Include children for carousel posts
      children: post.data?.children || [],
    };
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📸 [CONTENT PROCESSORS] processInstagramData: Processed', processed.length, 'posts successfully');
    // Log sample of processed data for debugging
    if (processed.length > 0) {
      console.log('📸 [CONTENT PROCESSORS] Sample processed post:', {
        id: processed[0].id,
        title: processed[0].title,
        hasStatistics: !!processed[0].statistics,
        statisticsKeys: Object.keys(processed[0].statistics || {}),
        hasInsights: !!processed[0].insights,
        insightsKeys: Object.keys(processed[0].insights || {}),
        hasAnalysis: !!processed[0].analysis,
        hasAnalysisMarkdown: !!processed[0].analysisMarkdown,
        hasConvexData: !!processed[0].convexData,
      });
    }
  }

  return processed;
}

export function processGmailData(result: PromiseSettledResult<any[]>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch Gmail data:', result.reason);
    return [];
  }

  if (!Array.isArray(result.value)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('📧 [CONTENT PROCESSORS] processGmailData: Expected array but got:', typeof result.value, result.value);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 [CONTENT PROCESSORS] processGmailData: Processing', result.value.length, 'threads');
    console.log('📧 [CONTENT PROCESSORS] processGmailData: Sample raw threads:', result.value.slice(0, 2).map(thread => ({
      threadId: thread.threadId,
      subject: thread.subject,
      from: thread.from,
      snippet: thread.snippet?.substring(0, 50)
    })));
  }

  const processed = result.value.map(thread => ({
    id: `gmail:${thread.threadId}`,
    title: thread.subject || thread.data?.subject || 'No Subject',
    type: 'gmail' as const,
    contentType: 'email',
    platform: 'gmail',
    createdAt: thread.createdAt || Date.now(),
    updatedAt: thread.updatedAt || Date.now(),
    important: false,
    tags: [],
    analysis: thread.analysis,
    content: thread.snippet || thread.data?.snippet || '',
    from: thread.from || thread.data?.from || 'Unknown Sender',
    messageCount: thread.message_count || thread.data?.message_count || 1,
    category: thread.category,
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 [CONTENT PROCESSORS] processGmailData: Processed', processed.length, 'threads successfully');
    console.log('📧 [CONTENT PROCESSORS] processGmailData: Sample processed items:', processed.slice(0, 2).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type,
      platform: item.platform
    })));
  }

  return processed;
}

// Process all insight sources into unified format
export function processAllInsightsData(results: {
  youtubeBatchAnalysis: PromiseSettledResult<any>;
  instagramBatchAnalysis: PromiseSettledResult<any>;
  gmailBatchAnalysis: PromiseSettledResult<any>;
}): UnifiedContent[] {
  const allInsights: UnifiedContent[] = [];

  // Process YouTube Video Analyses
  if (results.youtubeBatchAnalysis.status === 'fulfilled' && results.youtubeBatchAnalysis.value?.analyses) {
    const ytAnalyses = results.youtubeBatchAnalysis.value.analyses;
    if (Array.isArray(ytAnalyses)) {
      ytAnalyses.forEach((video: any, index: number) => {
        if (video.analysis || video.analysisMarkdown) {
          // Build comprehensive YouTube insight content
          const insightContent = [
            `Title: ${video.title || 'Untitled Video'}`,
            '',
            'Analysis:',
            video.analysisMarkdown || video.analysis?.summary || video.analysis || 'YouTube video analysis'
          ].join('\n');
          
          allInsights.push({
            id: `insight:youtube:${video.id}:${index}`,
            title: `${video.title} - Analysis`,
            type: 'insight' as const,
            contentType: 'youtube_analysis',
            platform: 'insights',
            createdAt: new Date(video.publishedAt || Date.now()).getTime(),
            updatedAt: new Date(video.publishedAt || Date.now()).getTime(),
            important: false,
            tags: ['youtube', 'analysis'],
            analysis: video.analysis,
            content: insightContent
          });
        }
      });
    }
  }

  // Process Instagram Batch Analysis
  if (results.instagramBatchAnalysis.status === 'fulfilled' && results.instagramBatchAnalysis.value?.insights) {
    const igAnalysis = results.instagramBatchAnalysis.value;
    
    // Handle different insight structures
    let insightArray: any[] = [];
    if (igAnalysis.insights.insights && Array.isArray(igAnalysis.insights.insights)) {
      insightArray = igAnalysis.insights.insights;
    } else if (Array.isArray(igAnalysis.insights)) {
      insightArray = igAnalysis.insights;
    } else if (igAnalysis.insights.content && Array.isArray(igAnalysis.insights.content)) {
      insightArray = igAnalysis.insights.content;
    }
    
    if (insightArray.length > 0) {
      insightArray.forEach((insight: any, index: number) => {
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
        
        allInsights.push({
          id: `insight:instagram:${igAnalysis._id}:${index}`,
          title: insight.title || insight.heading || 'Instagram Insight',
          type: 'insight' as const,
          contentType: 'instagram_analysis',
          platform: 'insights',
          createdAt: igAnalysis.updatedAt || Date.now(),
          updatedAt: igAnalysis.updatedAt || Date.now(),
          important: false,
          tags: ['instagram', insight.category || 'engagement'],
          analysis: insight,
          content: insightContent
        });
      });
    } else {
      // If no structured insights, create a single insight from the batch analysis
      allInsights.push({
        id: `insight:instagram:${igAnalysis._id}:batch`,
        title: 'Instagram Batch Analysis',
        type: 'insight' as const,
        contentType: 'instagram_analysis',
        platform: 'insights',
        createdAt: igAnalysis.updatedAt || Date.now(),
        updatedAt: igAnalysis.updatedAt || Date.now(),
        important: false,
        tags: ['instagram', 'batch-analysis'],
        analysis: igAnalysis.insights,
        content: JSON.stringify(igAnalysis.insights, null, 2)
      });
    }
  }

  // Process Gmail Batch Analysis
  if (results.gmailBatchAnalysis.status === 'fulfilled' && results.gmailBatchAnalysis.value?.insights) {
    const gmailAnalysis = results.gmailBatchAnalysis.value;
    if (gmailAnalysis.insights.insights && Array.isArray(gmailAnalysis.insights.insights)) {
      gmailAnalysis.insights.insights.forEach((insight: any, index: number) => {
        // Build comprehensive Gmail insight content
        const insightContent = [
          `Title: ${insight.title || 'Gmail Insight'}`,
          '',
          'Analysis:',
          insight.analysis || insight.content || insight.description || 'Gmail analysis insight'
        ].join('\n');
        
        allInsights.push({
          id: `insight:gmail:${gmailAnalysis._id}:${index}`,
          title: insight.title || 'Gmail Insight',
          type: 'insight' as const,
          contentType: 'gmail_insight',
          platform: 'insights',
          createdAt: gmailAnalysis.updatedAt || Date.now(),
          updatedAt: gmailAnalysis.updatedAt || Date.now(),
          important: false,
          tags: ['gmail', insight.category || 'communication'],
          analysis: insight,
          content: insightContent
        });
      });
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT PROCESSORS] processAllInsightsData: Processed', allInsights.length, 'total insights');
    console.log('💡 [CONTENT PROCESSORS] processAllInsightsData: Breakdown by source:', {
      youtubeAnalyses: allInsights.filter(i => i.contentType === 'youtube_analysis').length,
      instagramAnalyses: allInsights.filter(i => i.contentType === 'instagram_analysis').length,
      gmailAnalyses: allInsights.filter(i => i.contentType === 'gmail_insight').length,
      sampleTitles: allInsights.slice(0, 5).map(i => i.title)
    });
  }

  // Sort by creation time (most recent first)
  return allInsights.sort((a, b) => b.createdAt - a.createdAt);
}

// Legacy function for backward compatibility
export function processInsightsData(result: PromiseSettledResult<any>): UnifiedContent[] {
  if (result.status === 'rejected') {
    console.error('Failed to fetch insights data:', result.reason);
    return [];
  }

  const insights = result.value;
  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT PROCESSORS] processInsightsData: Raw insights data:', insights);
  }

  if (!insights) {
    if (process.env.NODE_ENV === 'development') {
      console.log('💡 [CONTENT PROCESSORS] processInsightsData: No insights data found');
    }
    return [];
  }

  // Handle different insight data structures
  let insightArray: any[] = [];
  if (Array.isArray(insights)) {
    insightArray = insights;
  } else if (insights.insights && Array.isArray(insights.insights)) {
    insightArray = insights.insights;
  } else if (insights.insights && insights.insights.insights && Array.isArray(insights.insights.insights)) {
    insightArray = insights.insights.insights;
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn('💡 [CONTENT PROCESSORS] processInsightsData: Unexpected insights structure:', insights);
    }
    return [];
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT PROCESSORS] processInsightsData: Processing', insightArray.length, 'insights');
  }

  const processed = insightArray.map((insight: any, index: number) => ({
    id: `insight:${insight.id || index}`,
    title: insight.title || 'Content Insight',
    type: 'insight' as const,
    contentType: 'analysis',
    platform: 'insights',
    createdAt: insight.createdAt || Date.now(),
    updatedAt: insight.updatedAt || Date.now(),
    important: false,
    tags: [],
    analysis: insight,
    content: insight.description || insight.summary || '',
  }));

  if (process.env.NODE_ENV === 'development') {
    console.log('💡 [CONTENT PROCESSORS] processInsightsData: Processed', processed.length, 'insights successfully');
  }

  return processed;
} 