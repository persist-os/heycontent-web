import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .take(args.limit || 20);

    return conversations;
  },
});

export const getConversation = query({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId);

    if (!doc) {
      return null;
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
      return null;
    }

    const conversation = doc as any; // Type assertion after validation

    // ✅ FIX BLOCKER 3: Check ownership or project collaborator access
    const isOwner = conversation.userId === args.userId;
    if (!isOwner && conversation.projectId) {
      // Check if user is a collaborator on the project
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: conversation.projectId,
      });
      if (!permission) {
        return null;
      }
    } else if (!isOwner) {
      return null;
    }

    // Fetch messages from NEW messages table (not legacy array)
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();

    // Filter out soft-deleted messages
    const activeMessages = messages.filter(msg => !msg.deletedAt);

    // Return conversation with messages from new table
    return {
      ...conversation,
      messages: activeMessages
    };
  },
});

export const getConversationsWithFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("desc")
      .collect();

    // Query messages table for each conversation to check for file attachments
    const conversationsWithFiles = await Promise.all(
      conversations.map(async (conv) => {
        // Get messages from messages table (not legacy array)
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .collect();
        
        // Filter out soft-deleted messages
        const activeMessages = messages.filter(msg => !msg.deletedAt);
        
        // Check if conversation has messages with file attachments
        const hasFiles = activeMessages.some((msg: any) =>
          msg.fileAttachments && msg.fileAttachments.length > 0
        );
        
        if (!hasFiles) {
          return null;
        }
        
        // Calculate total file count
        const fileCount = activeMessages.reduce((total: number, msg: any) => {
          return total + (msg.fileAttachments?.length || 0);
        }, 0);

        return {
          ...conv,
          fileCount
        };
      })
    );

    // Filter out null values (conversations without files)
    return conversationsWithFiles.filter((conv): conv is NonNullable<typeof conv> => conv !== null);
  },
});

/**
 * Get all conversations connected to a specific widget
 * @param widgetId - The widget ID to filter conversations by
 * @param userId - The user ID for authorization
 * 
 * NOTE: Since widgetIds is an array, we query all user conversations and filter in memory
 * This is acceptable for typical use cases where users have limited conversations
 */
export const getConversationsByWidgetId = query({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { widgetId, userId }) => {
    try {
      // Query all conversations for user (can't index arrays directly)
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .collect();

      // Filter to conversations that include this widgetId in their widgetIds array
      const widgetIdAsArray = typeof widgetId === "string" ? widgetId as any : widgetId;
      const filteredConversations = conversations.filter(conv => {
        const convAny = conv as any;
        const widgetIds = convAny.widgetIds || [];
        return widgetIds.includes(widgetIdAsArray);
      });

      return filteredConversations;
    } catch (error) {
      console.error('Error fetching conversations by widgetId:', error);
      return [];
    }
  },
});

/**
 * Get all conversations connected to a specific project
 * @param projectId - The project ID to filter conversations by
 * @param userId - The user ID for authorization
 * ✅ FIX BLOCKER 3: Checks project collaborator access
 */
export const getConversationsByProjectId = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    try {
      // ✅ FIX BLOCKER 3: Check project permission
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId,
        contentType: "project",
        contentId: projectId,
      });
      
      if (!permission) {
        return [];
      }
      
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .order("desc")
        .collect();

      return conversations;
    } catch (error) {
      console.error('Error fetching conversations by projectId:', error);
      return [];
    }
  },
});

/**
 * Get the project-scoped conversation for a project (ONE conversation per project)
 * Used for widget communication and family questions
 * ✅ FIX BLOCKER 3: Checks project collaborator access
 */
export const getProjectScopedConversation = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    try {
      // ✅ FIX BLOCKER 3: Check project permission
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId,
        contentType: "project",
        contentId: projectId,
      });
      
      if (!permission) {
        return null;
      }
      
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_project", (q) => q.eq("projectId", projectId))
        .filter((q) => q.eq(q.field("conversationType"), "project_scoped"))
        .first();

      return conversations;
    } catch (error) {
      console.error('Error fetching project-scoped conversation:', error);
      return null;
    }
  },
});

/**
 * Get multiple conversations by their IDs (batch fetch for context enrichment)
 * @param conversationIds - Array of conversation IDs to fetch
 * @param userId - The user ID for authorization
 */
export const getMultiple = query({
  args: {
    conversationIds: v.array(v.id("conversations")),
    userId: v.string(),
  },
  handler: async (ctx, { conversationIds, userId }) => {
    try {
      // Fetch all conversations in parallel
      const conversationPromises = conversationIds.map(conversationId => 
        ctx.db.get(conversationId)
      );
      const conversations = await Promise.all(conversationPromises);
      
      // Filter out null values and check authorization
      const authorizedConversations = conversations.filter(conversation => {
        if (!conversation) return false;
        
        // Check if user owns the conversation
        if (conversation.userId === userId) {
          return true;
        }
        
        return false;
      });
      
      return authorizedConversations;
    } catch (error) {
      console.error('Error fetching multiple conversations:', error);
      return [];
    }
  },
});

/**
 * Get recent threads for homepage thread cards
 * Returns formatted thread data with message previews
 * @param userId - The user ID
 * @param limit - Number of threads to return (default: 4)
 */
export const getRecentThreads = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 4 }) => {
    // Get user's conversations (threads)
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .take(limit);
    
    // Format for ThreadCard component - query messages table for last message
    return await Promise.all(conversations.map(async (conv) => {
      // Get last message from messages table (not legacy array)
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .order("desc")
        .first();
      
      return {
        _id: conv._id,
        title: conv.title || 'Main Chat',
        threadType: conv.projectId ? 'project' as const : 'main' as const,
        lastMessagePreview: lastMessage?.content?.slice(0, 150),
        messageCount: conv.messageCount || 0, // Use messageCount field, not legacy array
        lastMessageAt: conv.updatedAt || conv._creationTime,
        hasUnread: false, // TODO: Implement unread tracking
        projectId: conv.projectId
      };
    }));
  }
});

/**
 * Get all user threads for thread sidebar
 * Similar to getRecentThreads but returns all threads
 * @param userId - The user ID
 */
export const getAllUserThreads = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Get ALL user conversations
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", q => q.eq("userId", userId))
      .order("desc")
      .collect();
    
    // Format for ThreadItem component - query messages table for last message
    return await Promise.all(conversations.map(async (conv) => {
      // Get last message from messages table (not legacy array)
      const lastMessage = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
        .order("desc")
        .first();
      
      return {
        _id: conv._id,
        title: conv.title || 'Main Chat',
        threadType: conv.projectId ? 'project' as const : 'main' as const,
        lastMessagePreview: lastMessage?.content?.slice(0, 100),
        messageCount: conv.messageCount || 0, // Use messageCount field, not legacy array
        lastMessageAt: conv.updatedAt || conv._creationTime,
        hasUnread: false, // TODO: Implement
      };
    }));
  }
});

/**
 * Get recent messages from conversation (for embedding PostAction)
 */
export const getRecentMessages = query({
  args: { 
    conversationId: v.id("conversations"),
    limit: v.number()
  },
  handler: async (ctx, { conversationId, limit }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("desc")  // Most recent first
      .take(limit);
    
    // Return in chronological order (oldest first)
    return messages.reverse();
        }
});

