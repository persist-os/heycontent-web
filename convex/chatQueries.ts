import { query } from "./_generated/server";
import { v } from "convex/values";

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

    // Verify ownership
    if (conversation.userId !== args.userId) {
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

    // Filter to only conversations that have messages with file attachments
    const conversationsWithFiles = conversations.filter(conv =>
      conv.messages.some((msg: any) =>
        msg.fileAttachments && msg.fileAttachments.length > 0
      )
    );

    // Calculate total file count for each conversation
    return conversationsWithFiles.map(conv => {
      const fileCount = conv.messages.reduce((total: number, msg: any) => {
        return total + (msg.fileAttachments?.length || 0);
      }, 0);

      return {
        ...conv,
        fileCount
      };
    });
  },
});

/**
 * Get all conversations connected to a specific widget
 * @param widgetId - The widget ID to filter conversations by
 * @param userId - The user ID for authorization
 */
export const getConversationsByWidgetId = query({
  args: {
    widgetId: v.union(v.string(), v.id("widgets")),
    userId: v.string(),
  },
  handler: async (ctx, { widgetId, userId }) => {
    try {
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_widget", (q) =>
          q.eq("userId", userId).eq("widgetId", widgetId)
        )
        .order("desc")
        .collect();

      return conversations;
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
 */
export const getConversationsByProjectId = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    try {
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_project", (q) =>
          q.eq("userId", userId).eq("projectId", projectId)
        )
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
 */
export const getProjectScopedConversation = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    try {
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_user_project", (q) =>
          q.eq("userId", userId).eq("projectId", projectId)
        )
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
    
    // Format for ThreadCard component
    return conversations.map(conv => {
      const messages = conv.messages || [];
      const lastMessage = messages[messages.length - 1];
      
      return {
        _id: conv._id,
        title: conv.title || conv.projectName || 'Main Chat',
        threadType: conv.projectId ? 'project' as const : 'main' as const,
        lastMessagePreview: lastMessage?.content?.slice(0, 150),
        messageCount: messages.length,
        lastMessageAt: conv.updatedAt || conv._creationTime,
        hasUnread: false, // TODO: Implement unread tracking
        projectId: conv.projectId
      };
    });
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
    
    // Format for ThreadItem component
    return conversations.map(conv => {
      const messages = conv.messages || [];
      const lastMessage = messages[messages.length - 1];
      
      return {
        _id: conv._id,
        title: conv.title || conv.projectName || 'Main Chat',
        threadType: conv.projectId ? 'project' as const : 'main' as const,
        lastMessagePreview: lastMessage?.content?.slice(0, 100),
        messageCount: messages.length,
        lastMessageAt: conv.updatedAt || conv._creationTime,
        hasUnread: false, // TODO: Implement
      };
    });
  }
});

