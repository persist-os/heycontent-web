import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create or update a file reference
export const upsertFileReference = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileType: v.union(
      v.literal("email"),
      v.literal("email_thread"), 
      v.literal("video"),
      v.literal("instagram_post"),
      v.literal("note"),
      v.literal("insight"),
      v.literal("analytics"),
      v.literal("persona"),
      v.literal("conversation"),
      v.literal("platform_gmail"),
      v.literal("platform_youtube"),
      v.literal("platform_instagram")
    ),
    platform: v.union(
      v.literal("gmail"),
      v.literal("youtube"), 
      v.literal("instagram"),
      v.literal("smart-notes"),
      v.literal("ai-insights"),
      v.literal("analytics"),
      v.literal("personas"),
      v.literal("conversations")
    ),
    fileId: v.string(),
    sourceTable: v.string(),
    metadata: v.object({
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      from: v.optional(v.string()),
      date: v.optional(v.string()),
      stats: v.optional(v.object({
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        messages: v.optional(v.number()),
        threads: v.optional(v.number()),
      })),
    }),
    searchKeywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if file reference already exists
    const existingFile = await ctx.db
      .query("usersFiles")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("fileType", args.fileType)
      )
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    const now = Date.now();
    
    // Generate search keywords from fileName and metadata
    const searchKeywords = [
      ...args.fileName.toLowerCase().split(' '),
      ...(args.metadata.subject?.toLowerCase().split(' ') || []),
      ...(args.metadata.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
      args.platform,
      args.fileType,
      ...(args.searchKeywords || [])
    ].filter(keyword => keyword.length > 2); // Remove short words

    if (existingFile) {
      // Update existing file reference
      await ctx.db.patch(existingFile._id, {
        fileName: args.fileName,
        metadata: args.metadata,
        searchKeywords,
        updatedAt: now,
      });
      return existingFile._id;
    } else {
      // Create new file reference
      const fileId = await ctx.db.insert("usersFiles", {
        userId: args.userId,
        fileName: args.fileName,
        fileType: args.fileType,
        platform: args.platform,
        fileId: args.fileId,
        sourceTable: args.sourceTable,
        metadata: args.metadata,
        searchKeywords,
        createdAt: now,
        updatedAt: now,
      });
      return fileId;
    }
  },
});

// Delete a file reference
export const deleteFileReference = mutation({
  args: {
    userId: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (file) {
      await ctx.db.delete(file._id);
      return true;
    }
    return false;
  },
});

// Bulk sync file references from existing data
export const syncFileReferencesFromExistingData = mutation({
  args: {
    userId: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 50;
    let syncedCount = 0;

    try {
      // Sync Gmail Messages
      const gmailMessages = await ctx.db
        .query("gmailMessages")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${gmailMessages.length} Gmail messages`);

      for (const message of gmailMessages) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: message.subject || `Email from ${message.from}` || 'Email Message',
          fileType: "email",
          platform: "gmail",
          fileId: message.messageId,
          sourceTable: "gmailMessages",
          metadata: {
            subject: message.subject,
            snippet: message.snippet,
            from: message.from,
            date: message.internalDate,
          },
          searchKeywords: [
            ...(message.subject?.toLowerCase().split(' ') || []),
            ...(message.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
            ...(message.from?.toLowerCase().split(' ') || []),
            'gmail', 'email'
          ].filter(k => k && k.length > 2),
          createdAt: message.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Gmail Threads
      const gmailThreads = await ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${gmailThreads.length} Gmail threads`);

      for (const thread of gmailThreads) {
        // Create better display names based on available data
        let displayName = 'Email Thread';
        
        if (thread.data?.messageCount) {
          displayName = `Email Thread (${thread.data.messageCount} message${thread.data.messageCount > 1 ? 's' : ''})`;
        }
        
        // If there's a subject in the messages array, use it
        if (thread.data?.messages && thread.data.messages.length > 0) {
          const firstMessage = thread.data.messages[0];
          if (firstMessage.subject) {
            displayName = firstMessage.subject;
          } else if (firstMessage.snippet) {
            displayName = firstMessage.snippet.length > 50 ? 
              firstMessage.snippet.substring(0, 50) + '...' : 
              firstMessage.snippet;
          }
        }

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: displayName,
          fileType: "email_thread",
          platform: "gmail",
          fileId: thread.threadId || thread._id,
          sourceTable: "gmailThreads",
          metadata: {
            subject: displayName,
            snippet: thread.data?.messages?.[0]?.snippet || `Thread with ${thread.data?.messageCount || 1} messages`,
            from: thread.data?.messages?.[0]?.from || 'Gmail',
            date: thread.data?.messages?.[0]?.internalDate ? 
              new Date(parseInt(thread.data.messages[0].internalDate)).toISOString() : 
              new Date(thread.createdAt || Date.now()).toISOString(),
            stats: {
              messages: thread.data?.messageCount || 1,
            },
          },
          searchKeywords: [
            ...displayName.toLowerCase().split(' '),
            'gmail', 'thread', 'email',
            ...(thread.data?.messages?.[0]?.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
          ].filter(k => k && k.length > 2),
          createdAt: thread.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync YouTube Videos
      console.log(`Attempting to query YouTube videos for userId: ${args.userId}`);
      
      try {
        const youtubeVideos = await ctx.db
          .query("youtubeVideos")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .take(batchSize);

        console.log(`Found ${youtubeVideos.length} YouTube videos`);

        for (const video of youtubeVideos) {
          await ctx.db.insert("usersFiles", {
            userId: args.userId,
            fileName: video.snippet?.title || 'YouTube Video',
            fileType: "video",
            platform: "youtube",
            fileId: video.videoId,
            sourceTable: "youtubeVideos",
            metadata: {
              subject: video.snippet?.title,
              snippet: video.snippet?.description,
              thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || video.snippet?.thumbnails?.default,
              date: video.snippet?.published_at,
              stats: {
                views: video.statistics?.views,
                likes: video.statistics?.likes,
                comments: video.statistics?.comments,
              },
            },
            searchKeywords: [
              ...(video.snippet?.title?.toLowerCase().split(' ') || []),
              ...(video.snippet?.description?.toLowerCase().split(' ').slice(0, 15) || []),
              ...(video.snippet?.tags || []).map(tag => tag.toLowerCase()),
              'youtube', 'video'
            ].filter(k => k && k.length > 2),
            createdAt: video.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          syncedCount++;
        }
      } catch (youtubeError) {
        console.error('Error querying YouTube videos:', youtubeError);
        // Try without index if the index doesn't exist
        const allYoutubeVideos = await ctx.db
          .query("youtubeVideos")
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .take(batchSize);
        
        console.log(`Found ${allYoutubeVideos.length} YouTube videos without index`);

        for (const video of allYoutubeVideos) {
          await ctx.db.insert("usersFiles", {
            userId: args.userId,
            fileName: video.snippet?.title || 'YouTube Video',
            fileType: "video",
            platform: "youtube",
            fileId: video.videoId,
            sourceTable: "youtubeVideos",
            metadata: {
              subject: video.snippet?.title,
              snippet: video.snippet?.description,
              thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || video.snippet?.thumbnails?.default,
              date: video.snippet?.published_at,
              stats: {
                views: video.statistics?.views,
                likes: video.statistics?.likes,
                comments: video.statistics?.comments,
              },
            },
            searchKeywords: [
              ...(video.snippet?.title?.toLowerCase().split(' ') || []),
              ...(video.snippet?.description?.toLowerCase().split(' ').slice(0, 15) || []),
              ...(video.snippet?.tags || []).map(tag => tag.toLowerCase()),
              'youtube', 'video'
            ].filter(k => k && k.length > 2),
            createdAt: video.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          syncedCount++;
        }
      }

      // Sync Instagram Posts
      const instagramPosts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const post of instagramPosts) {
        const postTitle = post.data.caption ? 
          (post.data.caption.length > 50 ? post.data.caption.substring(0, 50) + '...' : post.data.caption) :
          'Instagram Post';

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: postTitle,
          fileType: "instagram_post",
          platform: "instagram",
          fileId: post.postId,
          sourceTable: "instagramPosts",
          metadata: {
            snippet: post.data.caption,
            thumbnailUrl: post.data.media_url,
            date: post.data.timestamp ? new Date(post.data.timestamp * 1000).toISOString() : undefined,
            stats: {
              likes: post.data.like_count,
              comments: post.data.comments_count,
            },
          },
          searchKeywords: [
            ...(post.data.caption?.toLowerCase().split(' ').slice(0, 15) || []),
            post.data.username?.toLowerCase(),
            'instagram', 'post'
          ].filter(k => k && k.length > 2),
          createdAt: post.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Smart Notes
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const note of notes) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: note.title,
          fileType: "note",
          platform: "smart-notes",
          fileId: note._id,
          sourceTable: "notes",
          metadata: {
            subject: note.title,
            snippet: note.content,
            date: new Date(note.createdAt).toISOString(),
          },
          searchKeywords: [
            ...note.title.toLowerCase().split(' '),
            ...(note.content?.toLowerCase().split(' ').slice(0, 10) || []),
            ...note.tags.map(tag => tag.toLowerCase()),
            'note', 'smart-notes'
          ].filter(k => k && k.length > 2),
          createdAt: note.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Ambient Insights
      const insights = await ctx.db
        .query("ambientInsights")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${insights.length} ambient insights`);

      for (const insight of insights) {
        // Create a title from the first insight data if available
        let insightTitle = 'AI Insights';
        if (insight.data && insight.data.length > 0) {
          insightTitle = insight.data[0].title || 'AI Insights';
        }

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: insightTitle,
          fileType: "insight",
          platform: "ai-insights",
          fileId: insight._id,
          sourceTable: "ambientInsights",
          metadata: {
            subject: insightTitle,
            snippet: insight.data && insight.data.length > 0 ? 
              insight.data.slice(0, 2).map(d => d.content).join('. ') : 
              'AI-generated insights',
            date: new Date(insight.createdAt).toISOString(),
          },
          searchKeywords: [
            ...insightTitle.toLowerCase().split(' '),
            ...(insight.data ? insight.data.flatMap(d => 
              [...d.title.toLowerCase().split(' '), ...d.content.toLowerCase().split(' ').slice(0, 5)]
            ) : []),
            'insight', 'ai', 'recommendations'
          ].filter(k => k && k.length > 2),
          createdAt: insight.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync YouTube Channel Analysis (AI Insights from AI Insights screen)
      const youtubeAnalyses = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.neq(q.field("analysis"), null))
        .take(batchSize);

      console.log(`Found ${youtubeAnalyses.length} YouTube videos with analysis`);

      for (const video of youtubeAnalyses) {
        // Check if this has channel-level insights (not just individual video analysis)
        if (video.analysis && video.analysis.insights && Array.isArray(video.analysis.insights)) {
          const insightTitle = `YouTube AI Insights`;
          const insightsSnippet = video.analysis.insights.length > 0 ? 
            video.analysis.insights.slice(0, 2).map(insight => insight.title).join('; ') :
            'YouTube channel insights and recommendations';

          await ctx.db.insert("usersFiles", {
            userId: args.userId,
            fileName: insightTitle,
            fileType: "insight",
            platform: "ai-insights",
            fileId: video._id,
            sourceTable: "youtubeVideos",
            metadata: {
              subject: insightTitle,
              snippet: insightsSnippet,
              date: video.snippet?.published_at || new Date(video.createdAt || Date.now()).toISOString(),
            },
            searchKeywords: [
              'youtube', 'insights', 'ai', 'recommendations', 'channel',
              'analysis', 'content', 'strategy', 'optimization'
            ].filter(k => k && k.length > 2),
            createdAt: video.createdAt || Date.now(),
            updatedAt: Date.now(),
          });
          syncedCount++;
        }
      }

      // Sync Personas
      const personas = await ctx.db
        .query("personas")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${personas.length} personas`);

      for (const persona of personas) {
        const personaTitle = persona.current_name || persona.future_name || 'Content Persona';

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: personaTitle,
          fileType: "persona",
          platform: "personas",
          fileId: persona._id,
          sourceTable: "personas",
          metadata: {
            subject: personaTitle,
            snippet: persona.current_description || persona.future_description || 'Content creator persona',
            date: new Date(persona.createdAt).toISOString(),
          },
          searchKeywords: [
            ...personaTitle.toLowerCase().split(' '),
            ...(persona.current_description?.toLowerCase().split(' ').slice(0, 10) || []),
            ...(persona.content_pillars || []).map(pillar => pillar.toLowerCase()),
            ...(persona.primary_topics || []).map(topic => topic.toLowerCase()),
            'persona', 'content', 'creator'
          ].filter(k => k && k.length > 2),
          createdAt: persona.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Conversations
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${conversations.length} conversations`);

      for (const conversation of conversations) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: conversation.title,
          fileType: "conversation",
          platform: "conversations",
          fileId: conversation._id,
          sourceTable: "conversations",
          metadata: {
            subject: conversation.title,
            snippet: conversation.messages && conversation.messages.length > 0 ? 
              conversation.messages[conversation.messages.length - 1].content.substring(0, 200) : 
              'Chat conversation',
            date: new Date(conversation.createdAt).toISOString(),
            stats: {
              messages: conversation.messages?.length || 0,
            },
          },
          searchKeywords: [
            ...conversation.title.toLowerCase().split(' '),
            ...(conversation.messages ? conversation.messages.flatMap(msg => 
              msg.content.toLowerCase().split(' ').slice(0, 5)
            ) : []),
            'conversation', 'chat'
          ].filter(k => k && k.length > 2),
          createdAt: conversation.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Instagram Analytics (Tracker Analysis)
      const instagramTrackerAnalytics = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${instagramTrackerAnalytics.length} Instagram tracker analytics records`);

      for (const analytics of instagramTrackerAnalytics) {
        const analyticsTitle = `Instagram Analytics`;
        
        // Extract key metrics from the analysis for snippet
        let metricsSnippet = 'Instagram profile analytics';
        if (analytics.analysis) {
          const data = analytics.analysis;
          const snippetParts = [];
          
          if (data.last_post) {
            snippetParts.push(`Last post: ${data.last_post.time_ago || 'Unknown'}`);
          }
          if (data.posting_frequency) {
            snippetParts.push(`Avg ${data.posting_frequency.average_days_between_posts || 'N/A'} days between posts`);
          }
          if (data.media_distribution) {
            const mediaTypes = Object.entries(data.media_distribution)
              .filter(([key, value]) => value && value !== '0%')
              .map(([key, value]) => `${key}: ${value}`)
              .slice(0, 2);
            if (mediaTypes.length > 0) {
              snippetParts.push(mediaTypes.join(', '));
            }
          }
          
          if (snippetParts.length > 0) {
            metricsSnippet = snippetParts.join('; ');
          }
        }

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: analyticsTitle,
          fileType: "analytics",
          platform: "analytics",
          fileId: analytics._id,
          sourceTable: "instagramTrackerAnalysis",
          metadata: {
            subject: analyticsTitle,
            snippet: metricsSnippet,
            date: new Date(analytics.createdAt).toISOString(),
          },
          searchKeywords: [
            'instagram', 'analytics', 'insights', 'metrics', 'performance',
            'posting', 'frequency', 'media', 'distribution', 'tracker'
          ].filter(k => k && k.length > 2),
          createdAt: analytics.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Instagram Batch Analytics
      const instagramBatchAnalytics = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      console.log(`Found ${instagramBatchAnalytics.length} Instagram batch analytics records`);

      for (const analytics of instagramBatchAnalytics) {
        const analyticsTitle = `Instagram Batch Insights`;
        
        // Extract insights summary for snippet
        let insightsSnippet = 'Batch analysis insights';
        if (analytics.insights) {
          insightsSnippet = 'AI-generated insights from content analysis';
        }

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: analyticsTitle,
          fileType: "analytics",
          platform: "analytics",
          fileId: analytics._id,
          sourceTable: "instagramBatchAnalysis",
          metadata: {
            subject: analyticsTitle,
            snippet: insightsSnippet,
            date: new Date(analytics.createdAt).toISOString(),
          },
          searchKeywords: [
            'instagram', 'analytics', 'insights', 'batch', 'analysis',
            'content', 'performance', 'ai', 'generated'
          ].filter(k => k && k.length > 2),
          createdAt: analytics.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      return {
        success: true,
        syncedCount,
        message: `Successfully synced ${syncedCount} file references`,
      };

    } catch (error) {
      console.error('Error syncing file references:', error);
      return {
        success: false,
        syncedCount,
        error: error.message,
      };
    }
  },
});

// Update file reference metadata (for when source data changes)
export const updateFileMetadata = mutation({
  args: {
    userId: v.string(),
    fileId: v.string(),
    metadata: v.object({
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      from: v.optional(v.string()),
      date: v.optional(v.string()),
      stats: v.optional(v.object({
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        messages: v.optional(v.number()),
        threads: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (file) {
      await ctx.db.patch(file._id, {
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  },
}); 