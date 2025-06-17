import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const checkUserPlatformData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check Gmail data
    const gmailMessages = await ctx.db
      .query("gmailMessages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    const gmailThreads = await ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check YouTube data
    const youtubeVideos = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Instagram data
    const instagramPosts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    return {
      gmail: {
        messages: gmailMessages.length,
        threads: gmailThreads.length,
        sampleMessage: gmailMessages[0] ? {
          subject: gmailMessages[0].subject,
          from: gmailMessages[0].from,
          snippet: gmailMessages[0].snippet?.slice(0, 100)
        } : null
      },
      youtube: {
        videos: youtubeVideos.length,
        sampleVideo: youtubeVideos[0] ? {
          videoId: youtubeVideos[0].videoId,
          hasSnippet: !!youtubeVideos[0].snippet
        } : null
      },
      instagram: {
        posts: instagramPosts.length,
        samplePost: instagramPosts[0] ? {
          caption: instagramPosts[0].data?.caption?.slice(0, 100),
          postId: instagramPosts[0].postId
        } : null
      }
    };
  },
});

export const checkYouTubeData = query({
  args: {},
  handler: async (ctx) => {
    // Get first 5 YouTube videos without filtering by userId
    const allYoutubeVideos = await ctx.db
      .query("youtubeVideos")
      .take(5);

    return {
      totalVideos: allYoutubeVideos.length,
      sampleVideos: allYoutubeVideos.map(video => ({
        id: video._id,
        userId: video.userId,
        title: video.snippet?.title,
        videoId: video.videoId,
        createdAt: video.createdAt
      }))
    };
  },
});

export const scanYouTubeData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Scan all YouTube videos without using index
    const allVideos = await ctx.db.query("youtubeVideos").collect();
    
    // Filter manually for the specific userId
    const userVideos = allVideos.filter(video => video.userId === args.userId);
    
    return {
      totalVideosInDB: allVideos.length,
      userVideosFound: userVideos.length,
      sampleUserVideo: userVideos[0] ? {
        id: userVideos[0]._id,
        userId: userVideos[0].userId,
        videoId: userVideos[0].videoId,
        title: userVideos[0].snippet?.title,
        createdAt: userVideos[0].createdAt
      } : null,
      allUserIds: [...new Set(allVideos.map(v => v.userId))].slice(0, 5) // First 5 unique userIds
    };
  },
});

export const workingYouTubeSync = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let syncedCount = 0;
    let errors = [];

    // Get YouTube videos
    const youtubeVideos = await ctx.db.query("youtubeVideos").collect();
    const userVideos = youtubeVideos.filter(video => video.userId === args.userId);

    // Remove existing YouTube videos first
    const existingVideos = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("platform"), "youtube"))
      .collect();

    for (const existing of existingVideos) {
      await ctx.db.delete(existing._id);
    }

    // Insert each video individually with working approach
    for (const video of userVideos) {
      try {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: video.snippet?.title || `YouTube Video - ${video.videoId}`,
          fileType: "video" as const,
          platform: "youtube" as const,
          fileId: video.videoId,
          sourceTable: "youtubeVideos",
          metadata: {
            subject: video.snippet?.title || ""
          },
          searchKeywords: ["youtube", "video"],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        syncedCount++;
      } catch (error) {
        errors.push({
          videoId: video.videoId,
          title: video.snippet?.title,
          error: error.message
        });
      }
    }

    return {
      success: syncedCount > 0,
      syncedCount,
      totalVideosFound: userVideos.length,
      removedExisting: existingVideos.length,
      errors,
      message: `Removed ${existingVideos.length} existing videos, synced ${syncedCount} YouTube videos. ${errors.length} errors.`
    };
  },
});

export const forceYouTubeSync = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let syncedCount = 0;
    let errors = [];

    // First, remove any existing YouTube videos for this user
    const existingVideos = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileType"), "video"))
      .collect();

    for (const existing of existingVideos) {
      await ctx.db.delete(existing._id);
    }

    // Get YouTube videos directly
    const youtubeVideos = await ctx.db.query("youtubeVideos").collect();
    const userVideos = youtubeVideos.filter(video => video.userId === args.userId);

    for (const video of userVideos) {
      try {
        // Insert with safe approach
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: video.snippet?.title || `YouTube Video - ${video.videoId}`,
          fileType: "video" as const,
          platform: "youtube" as const,
          fileId: video.videoId,
          sourceTable: "youtubeVideos",
          metadata: {
            subject: video.snippet?.title || "",
            snippet: video.snippet?.description || "",
            date: video.snippet?.published_at || video.createdAt?.toString(),
          },
          searchKeywords: [
            ...(video.snippet?.title?.toLowerCase().split(' ') || []),
            'youtube', 'video'
          ].filter(k => k && k.length > 2).slice(0, 20),
          createdAt: video.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        syncedCount++;
      } catch (error) {
        errors.push({
          videoId: video.videoId,
          title: video.snippet?.title,
          error: error.message
        });
      }
    }

    return {
      success: syncedCount > 0,
      syncedCount,
      totalVideosFound: userVideos.length,
      removedExisting: existingVideos.length,
      errors,
      message: `Removed ${existingVideos.length} existing videos, synced ${syncedCount} YouTube videos. ${errors.length} errors.`
    };
  },
});

export const checkAllUserData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check Gmail data
    const gmailMessages = await ctx.db
      .query("gmailMessages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    const gmailThreads = await ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check YouTube data
    const youtubeVideos = await ctx.db
      .query("youtubeVideos")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Instagram data
    const instagramPosts = await ctx.db
      .query("instagramPosts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Notes
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Insights
    const insights = await ctx.db
      .query("ambientInsights")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Personas
    const personas = await ctx.db
      .query("personas")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(5);

    // Check Conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(5);

    return {
      gmail: {
        messages: gmailMessages.length,
        threads: gmailThreads.length,
        sampleMessage: gmailMessages[0] ? {
          subject: gmailMessages[0].subject,
          from: gmailMessages[0].from,
          snippet: gmailMessages[0].snippet?.slice(0, 100)
        } : null
      },
      youtube: {
        videos: youtubeVideos.length,
        sampleVideo: youtubeVideos[0] ? {
          videoId: youtubeVideos[0].videoId,
          hasSnippet: !!youtubeVideos[0].snippet
        } : null
      },
      instagram: {
        posts: instagramPosts.length,
        samplePost: instagramPosts[0] ? {
          caption: instagramPosts[0].data?.caption?.slice(0, 100),
          postId: instagramPosts[0].postId
        } : null
      },
      notes: {
        count: notes.length,
        sampleNote: notes[0] ? {
          title: notes[0].title,
          content: notes[0].content?.slice(0, 100),
          tags: notes[0].tags
        } : null
      },
      insights: {
        count: insights.length,
        sampleInsight: insights[0] ? {
          dataCount: insights[0].data?.length || 0,
          firstInsight: insights[0].data?.[0]?.title
        } : null
      },
      personas: {
        count: personas.length,
        samplePersona: personas[0] ? {
          currentName: personas[0].current_name,
          futureName: personas[0].future_name
        } : null
      },
      conversations: {
        count: conversations.length,
        sampleConversation: conversations[0] ? {
          title: conversations[0].title,
          messageCount: conversations[0].messages?.length || 0
        } : null
      }
    };
  },
});

export const checkInstagramAnalytics = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check instagramTrackerAnalysis
    const trackerAnalytics = await ctx.db
      .query("instagramTrackerAnalysis")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Check instagramBatchAnalysis
    const batchAnalytics = await ctx.db
      .query("instagramBatchAnalysis")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Check usersFiles for analytics
    const analyticsFiles = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileType"), "analytics"))
      .collect();

    return {
      trackerAnalytics: {
        count: trackerAnalytics.length,
        sample: trackerAnalytics[0] ? {
          id: trackerAnalytics[0]._id,
          hasAnalysis: !!trackerAnalytics[0].analysis,
          analysisKeys: trackerAnalytics[0].analysis ? Object.keys(trackerAnalytics[0].analysis) : [],
          sampleData: trackerAnalytics[0].analysis
        } : null
      },
      batchAnalytics: {
        count: batchAnalytics.length,
        sample: batchAnalytics[0] ? {
          id: batchAnalytics[0]._id,
          hasInsights: !!batchAnalytics[0].insights,
          insightKeys: batchAnalytics[0].insights ? Object.keys(batchAnalytics[0].insights) : []
        } : null
      },
      analyticsFiles: {
        count: analyticsFiles.length,
        samples: analyticsFiles.map(file => ({
          id: file._id,
          title: file.fileName,
          fileId: file.fileId,
          sourceTable: file.sourceTable,
          snippet: file.metadata?.snippet
        }))
      }
    };
  },
});

export const checkUsersFilesTable = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Check total count in usersFiles for this user
    const allUserFiles = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Check if any usersFiles exist at all (any user)
    const allFiles = await ctx.db
      .query("usersFiles")
      .take(10);

    // Check if this specific user has any records
    const userSpecificFiles = allUserFiles.slice(0, 10);

    return {
      userFilesCount: allUserFiles.length,
      sampleFiles: userSpecificFiles.map(file => ({
        id: file._id,
        fileName: file.fileName,
        fileType: file.fileType,
        platform: file.platform,
        fileId: file.fileId
      })),
      globalFilesCount: allFiles.length,
      globalSample: allFiles.map(file => ({
        userId: file.userId,
        fileName: file.fileName,
        fileType: file.fileType
      }))
    };
  },
});

export const testSingleVideoInsert = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get one YouTube video for this user
      const videos = await ctx.db.query("youtubeVideos").collect();
      const userVideo = videos.find(video => video.userId === args.userId);
      
      if (!userVideo) {
        return { success: false, error: "No YouTube videos found for user" };
      }

      // Try to insert with minimal data first
      const insertResult = await ctx.db.insert("usersFiles", {
        userId: args.userId,
        fileName: "Test YouTube Video",
        fileType: "video" as const,
        platform: "youtube" as const,
        fileId: userVideo.videoId,
        sourceTable: "youtubeVideos",
        metadata: {},
        searchKeywords: ["test", "video", "youtube"],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return { 
        success: true, 
        insertedId: insertResult,
        testVideo: {
          videoId: userVideo.videoId,
          title: userVideo.snippet?.title
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        errorDetails: error.toString()
      };
    }
  },
});

export const debugSingleVideoInsert = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Get ONE YouTube video
      const youtubeVideos = await ctx.db.query("youtubeVideos").collect();
      const userVideos = youtubeVideos.filter(video => video.userId === args.userId);
      
      if (userVideos.length === 0) {
        return { success: false, error: "No YouTube videos found for user" };
      }

      const video = userVideos[0]; // Take first video

      // Log video details
      console.log("Video details:", {
        videoId: video.videoId,
        title: video.snippet?.title,
        hasSnippet: !!video.snippet,
        createdAt: video.createdAt,
        userId: video.userId
      });

      // Try different insertion approaches
      const approaches = [
        // Approach 1: Minimal data
        {
          name: "minimal",
          data: {
            userId: args.userId,
            fileName: "Test Video 1",
            fileType: "video" as const,
            platform: "youtube" as const,
            fileId: video.videoId,
            sourceTable: "youtubeVideos",
            metadata: {},
            searchKeywords: ["test"],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        },
        // Approach 2: With title
        {
          name: "with_title",
          data: {
            userId: args.userId,
            fileName: video.snippet?.title || "YouTube Video",
            fileType: "video" as const,
            platform: "youtube" as const,
            fileId: video.videoId,
            sourceTable: "youtubeVideos",
            metadata: {
              subject: video.snippet?.title || ""
            },
            searchKeywords: ["youtube", "video"],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
        }
      ];

      const results = [];

      for (const approach of approaches) {
        try {
          console.log(`Trying approach: ${approach.name}`);
          const insertResult = await ctx.db.insert("usersFiles", approach.data);
          results.push({
            approach: approach.name,
            success: true,
            insertId: insertResult
          });
          
          // Clean up after each test
          await ctx.db.delete(insertResult);
        } catch (error) {
          console.log(`Approach ${approach.name} failed:`, error.message);
          results.push({
            approach: approach.name,
            success: false,
            error: error.message,
            stack: error.stack
          });
        }
      }

      return {
        success: true,
        videoDetails: {
          videoId: video.videoId,
          title: video.snippet?.title,
          hasSnippet: !!video.snippet
        },
        results
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  },
});

export const enhanceYouTubeVideoKeywords = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    let enhancedCount = 0;
    let errors = [];

    // Find all YouTube videos for this user
    const existingVideos = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("platform"), "youtube"))
      .collect();

    for (const video of existingVideos) {
      try {
        // Get the actual YouTube video data for richer metadata
        const youtubeVideo = await ctx.db
          .query("youtubeVideos")
          .filter((q) => q.eq(q.field("videoId"), video.fileId))
          .first();

        // Enhanced search keywords for performance queries
        const enhancedKeywords = [
          "youtube",
          "video",
          "content",
          "performance", 
          "analytics",
          "views",
          "engagement",
          "metrics",
          "channel",
          "audience",
          "reach",
          "social",
          "media",
          "marketing",
          "brand",
          "business",
          "growth",
          "strategy",
          // Video-specific keywords
          ...video.fileName.toLowerCase().split(/[\s\-_]+/).filter(word => word.length > 2),
          // Analysis keywords if available
          ...(youtubeVideo?.analysis?.content ? ["insights", "analysis", "data", "results"] : [])
        ];

        // Enhanced metadata (only using schema-compliant fields)
        const enhancedMetadata = {
          subject: video.fileName,
          snippet: youtubeVideo?.snippet?.description || `YouTube video: ${video.fileName}. Keywords: performance, analytics, views, engagement, metrics, channel growth, audience reach, social media marketing, brand strategy`,
          date: youtubeVideo?.snippet?.published_at || youtubeVideo?.createdAt?.toString(),
          // Add stats if we have analysis data
          ...(youtubeVideo?.analysis?.content && {
            stats: {
              views: youtubeVideo.analysis.content.views || 0,
              likes: youtubeVideo.analysis.content.likes || 0,
              comments: youtubeVideo.analysis.content.comments || 0,
            }
          })
        };

        // Update the video with enhanced metadata
        await ctx.db.patch(video._id, {
          searchKeywords: enhancedKeywords,
          metadata: enhancedMetadata,
          updatedAt: Date.now(),
        });

        enhancedCount++;
      } catch (error) {
        errors.push({
          videoId: video.fileId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      success: true,
      enhancedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Enhanced ${enhancedCount} YouTube videos with performance-focused keywords`
    };
  },
}); 