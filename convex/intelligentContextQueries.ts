import { query } from "./_generated/server";
import { v } from "convex/values";

// Intelligent context search - automatically find relevant user content based on query
export const intelligentContextSearch = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    excludeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const searchQuery = args.query.toLowerCase().trim();
    
    if (!searchQuery || searchQuery.length < 3) {
      return [];
    }

    // Extract keywords from the user query
    const keywords = searchQuery
      .split(/[^\w]+/)
      .filter(word => 
        word.length > 2 && 
        !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'should', 'would', 'will', 'did', 'does', 'is', 'are', 'was', 'were', 'have', 'has', 'had'].includes(word.toLowerCase())
      )
      .slice(0, 8); // Limit to top 8 keywords

    if (keywords.length === 0) {
      return [];
    }

    console.log(`🧠 Intelligent search for query: "${searchQuery}" with keywords:`, keywords);

    // Multi-stage search strategy
    let relevantFiles: any[] = [];

    // 1. Search by full query first (highest relevance)
    const fullQueryResults = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", searchQuery)
          .eq("userId", args.userId)
      )
      .take(limit * 2);

    relevantFiles.push(...fullQueryResults.map(file => ({ ...file, relevanceScore: 3 })));

    // 2. Search by individual keywords (medium relevance)
    for (const keyword of keywords) {
      const keywordResults = await ctx.db
        .query("usersFiles")
        .withSearchIndex("search_fileName", (q) => 
          q.search("fileName", keyword)
            .eq("userId", args.userId)
        )
        .take(Math.ceil(limit / 2));

      relevantFiles.push(...keywordResults.map(file => ({ ...file, relevanceScore: 2 })));
    }

    // 3. Search in keywords array (lower relevance)
    const keywordSearchResults = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          ...keywords.map(keyword => 
            q.gte(q.field("searchKeywords"), [keyword])
          )
        )
      )
      .take(limit * 2);

    relevantFiles.push(...keywordSearchResults.map(file => ({ ...file, relevanceScore: 1 })));

    // Remove duplicates and apply filters
    const uniqueFiles = relevantFiles.filter((file, index, self) => {
      const firstIndex = self.findIndex(f => f._id === file._id);
      if (index !== firstIndex) return false;
      
      // Apply exclude types filter
      if (args.excludeTypes && args.excludeTypes.includes(file.fileType)) {
        return false;
      }
      
      return true;
    });

    // Score and rank results
    const scoredFiles = uniqueFiles.map(file => {
      let score = file.relevanceScore;
      
      // 🎯 MAJOR BOOST: Prioritize actual data content over conversations about topics
      const isActualDataContent = ['video', 'analytics', 'instagram_post', 'email', 'email_thread', 'note'].includes(file.fileType);
      const isConversationAboutTopic = file.fileType === 'conversation';
      const isPerformanceQuery = keywords.some(k => ['performance', 'analytics', 'views', 'engagement', 'stats', 'metrics', 'data'].includes(k.toLowerCase()));
      
      if (isActualDataContent && isPerformanceQuery) {
        score += 2.0; // Big boost for actual data when asking about performance
      } else if (isActualDataContent) {
        score += 1.0; // General boost for actual content over conversations
      } else if (isConversationAboutTopic && isPerformanceQuery) {
        score -= 0.5; // Slight penalty for conversations when asking about performance
      }
      
      // 🎯 PLATFORM-SPECIFIC BOOST: Match query platform with content platform
      if (keywords.includes('youtube') && file.platform === 'youtube') {
        score += 1.5;
      } else if (keywords.includes('instagram') && file.platform === 'instagram') {
        score += 1.5;
      } else if (keywords.includes('email') && file.platform === 'gmail') {
        score += 1.5;
      }
      
      // Boost score for exact keyword matches in title
      keywords.forEach(keyword => {
        if (file.fileName.toLowerCase().includes(keyword)) {
          score += 0.5;
        }
      });
      
      // Boost score for recent content
      const daysSinceUpdate = (Date.now() - file.updatedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 0.3;
      else if (daysSinceUpdate < 30) score += 0.1;
      
      // Boost score for content with rich metadata
      if (file.metadata.snippet && file.metadata.snippet.length > 50) score += 0.2;
      if (file.metadata.stats) score += 0.1;
      
      return { ...file, finalScore: score };
    });

    // Sort by final score and return top results
    const topResults = scoredFiles
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);

    console.log(`🧠 Found ${topResults.length} relevant files with scores:`, 
      topResults.map(f => ({ title: f.fileName, score: f.finalScore, type: f.fileType }))
    );

    return topResults.map(file => ({
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      subtype: file.fileType,
      platform: file.platform,
      fileName: file.fileName,
      title: file.fileName,
      snippet: file.metadata.snippet,
      thumbnailUrl: file.metadata.thumbnailUrl,
      from: file.metadata.from,
      date: file.metadata.date,
      stats: file.metadata.stats,
      sourceTable: file.sourceTable,
      relevanceScore: file.finalScore,
      _createdAt: file.createdAt,
      _updatedAt: file.updatedAt,
    }));
  },
});

// Get intelligent context with actual content data
export const getIntelligentContextData = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    excludeTypes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // First get the relevant file references by calling the function directly
    const limit = args.limit || 5;
    const searchQuery = args.query.toLowerCase().trim();
    
    if (!searchQuery || searchQuery.length < 3) {
      return [];
    }

    // Extract keywords from the user query (duplicate from intelligentContextSearch)
    const keywords = searchQuery
      .split(/[^\w]+/)
      .filter(word => 
        word.length > 2 && 
        !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who', 'can', 'could', 'should', 'would', 'will', 'did', 'does', 'is', 'are', 'was', 'were', 'have', 'has', 'had'].includes(word.toLowerCase())
      )
      .slice(0, 8);

    if (keywords.length === 0) {
      return [];
    }

    console.log(`🧠 Intelligent context search for query: "${searchQuery}" with keywords:`, keywords);

    // Multi-stage search strategy (same as intelligentContextSearch)
    let relevantFiles: any[] = [];

    // 1. Search by full query first
    const fullQueryResults = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", searchQuery)
          .eq("userId", args.userId)
      )
      .take(limit * 2);

    relevantFiles.push(...fullQueryResults.map(file => ({ ...file, relevanceScore: 3 })));

    // 2. Search by individual keywords
    for (const keyword of keywords) {
      const keywordResults = await ctx.db
        .query("usersFiles")
        .withSearchIndex("search_fileName", (q) => 
          q.search("fileName", keyword)
            .eq("userId", args.userId)
        )
        .take(Math.ceil(limit / 2));

      relevantFiles.push(...keywordResults.map(file => ({ ...file, relevanceScore: 2 })));
    }

    // 3. Search in keywords array
    const keywordSearchResults = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.or(
          ...keywords.map(keyword => 
            q.gte(q.field("searchKeywords"), [keyword])
          )
        )
      )
      .take(limit * 2);

    relevantFiles.push(...keywordSearchResults.map(file => ({ ...file, relevanceScore: 1 })));

    // Remove duplicates and apply filters
    const uniqueFiles = relevantFiles.filter((file, index, self) => {
      const firstIndex = self.findIndex(f => f._id === file._id);
      if (index !== firstIndex) return false;
      
      if (args.excludeTypes && args.excludeTypes.includes(file.fileType)) {
        return false;
      }
      
      return true;
    });

    // Score and rank results
    const scoredFiles = uniqueFiles.map(file => {
      let score = file.relevanceScore;
      
      // 🎯 MAJOR BOOST: Prioritize actual data content over conversations about topics
      const isActualDataContent = ['video', 'analytics', 'instagram_post', 'email', 'email_thread', 'note'].includes(file.fileType);
      const isConversationAboutTopic = file.fileType === 'conversation';
      const isPerformanceQuery = keywords.some(k => ['performance', 'analytics', 'views', 'engagement', 'stats', 'metrics', 'data'].includes(k.toLowerCase()));
      
      if (isActualDataContent && isPerformanceQuery) {
        score += 2.0; // Big boost for actual data when asking about performance
      } else if (isActualDataContent) {
        score += 1.0; // General boost for actual content over conversations
      } else if (isConversationAboutTopic && isPerformanceQuery) {
        score -= 0.5; // Slight penalty for conversations when asking about performance
      }
      
      // 🎯 PLATFORM-SPECIFIC BOOST: Match query platform with content platform
      if (keywords.includes('youtube') && file.platform === 'youtube') {
        score += 1.5;
      } else if (keywords.includes('instagram') && file.platform === 'instagram') {
        score += 1.5;
      } else if (keywords.includes('email') && file.platform === 'gmail') {
        score += 1.5;
      }
      
      // Boost score for exact keyword matches in title
      keywords.forEach(keyword => {
        if (file.fileName.toLowerCase().includes(keyword)) {
          score += 0.5;
        }
      });
      
      // Boost score for recent content
      const daysSinceUpdate = (Date.now() - file.updatedAt) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 0.3;
      else if (daysSinceUpdate < 30) score += 0.1;
      
      // Boost score for content with rich metadata
      if (file.metadata.snippet && file.metadata.snippet.length > 50) score += 0.2;
      if (file.metadata.stats) score += 0.1;
      
      return { ...file, finalScore: score };
    });

    const topResults = scoredFiles
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, limit);

    console.log(`🧠 Found ${topResults.length} relevant files for context`);

    // Fetch actual content for each relevant file
    const contextData = [];
    
    for (const file of topResults) {
      try {
        // Get actual data using File ID Manager
        let actualData = null;

        switch (file.sourceTable) {
          case "gmailMessages":
            actualData = await ctx.db
              .query("gmailMessages")
              .withIndex("by_messageId", (q) => q.eq("messageId", file.fileId))
              .filter((q) => q.eq(q.field("userId"), args.userId))
              .first();
            break;

          case "gmailThreads":
            actualData = await ctx.db
              .query("gmailThreads")
              .withIndex("by_threadId", (q) => q.eq("threadId", file.fileId))
              .filter((q) => q.eq(q.field("userId"), args.userId))
              .first();
            break;

          case "youtubeVideos":
            // First try by videoId
            actualData = await ctx.db
              .query("youtubeVideos")
              .withIndex("by_videoId", (q) => q.eq("videoId", file.fileId))
              .filter((q) => q.eq(q.field("userId"), args.userId))
              .first();
            
            // If not found, try by document _id (for insights)
            if (!actualData) {
              actualData = await ctx.db
                .query("youtubeVideos")
                .filter((q) => q.eq(q.field("_id"), file.fileId))
                .first();
              // Verify ownership
              if (actualData && actualData.userId !== args.userId) {
                actualData = null;
              }
            }
            break;

          case "instagramPosts":
            actualData = await ctx.db
              .query("instagramPosts")
              .withIndex("by_postId", (q) => q.eq("postId", file.fileId))
              .filter((q) => q.eq(q.field("userId"), args.userId))
              .first();
            break;

          case "notes":
            actualData = await ctx.db
              .query("notes")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "ambientInsights":
            actualData = await ctx.db
              .query("ambientInsights")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "personas":
            actualData = await ctx.db
              .query("personas")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "conversations":
            actualData = await ctx.db
              .query("conversations")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "instagramProfileInsights":
            actualData = await ctx.db
              .query("instagramProfileInsights")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "instagramTrackerAnalysis":
            actualData = await ctx.db
              .query("instagramTrackerAnalysis")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          case "instagramBatchAnalysis":
            actualData = await ctx.db
              .query("instagramBatchAnalysis")
              .filter((q) => q.eq(q.field("_id"), file.fileId))
              .first();
            // Verify ownership
            if (actualData && actualData.userId !== args.userId) {
              actualData = null;
            }
            break;

          default:
            console.warn(`Unknown source table: ${file.sourceTable}`);
            break;
        }

        if (actualData) {
          contextData.push({
            fileReference: {
              id: file.fileId,
              type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
              subtype: file.fileType,
              platform: file.platform,
              fileName: file.fileName,
              title: file.fileName,
              snippet: file.metadata.snippet,
              thumbnailUrl: file.metadata.thumbnailUrl,
              from: file.metadata.from,
              date: file.metadata.date,
              stats: file.metadata.stats,
              sourceTable: file.sourceTable,
              relevanceScore: file.finalScore,
            },
            content: actualData,
            relevanceScore: file.finalScore,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch content for file ${file.fileId}:`, error);
      }
    }

    console.log(`🧠 Successfully fetched content for ${contextData.length} files`);

    return contextData;
  },
}); 