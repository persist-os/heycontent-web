import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

export const createConversation = mutation({
    args: {
      userId: v.string(),
      title: v.string(),
      messages: v.array(v.object({
        content: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        timestamp: v.number(),
        context: v.optional(v.string()),
        fileAttachments: v.optional(v.array(v.object({
          file_url: v.string(),
          original_filename: v.string(),
          content_type: v.string(),
          file_size: v.number(),
          gcs_url: v.string(),
          uploaded_at: v.string(),
        }))),
        enrichment_metadata: v.optional(v.any()),
      })),
      // NEW: Optional project/widget context fields
      projectId: v.optional(v.id("projects")),
      widgetId: v.optional(v.union(v.string(), v.id("widgets"))),  // 🔄 Migration: supports both legacy string and Convex ID
      widgetOutputId: v.optional(v.string()),
      conversationType: v.optional(v.union(
        v.literal("general"),
        v.literal("widget_prompt"),
        v.literal("project_scoped"),
        v.literal("discovery")
      )),
    },
    handler: async (ctx, args) => {
      const conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        title: args.title,
        messages: args.messages,
        messageCount: args.messages.length,
        lastMessageAt: args.messages.length > 0 ? args.messages[args.messages.length - 1].timestamp : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        starred: false,
        // NEW: Include context fields if provided
        projectId: args.projectId,
        widgetId: args.widgetId,
        widgetOutputId: args.widgetOutputId,
        conversationType: args.conversationType,
      });

      // Note: Embeddings are generated automatically by the backend after conversation is stored

      return conversationId;
    },
  });
  
export const addMessageToConversation = mutation({
args: {
    userId: v.string(),
    conversationId: v.string(),
    message: v.object({
      content: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      timestamp: v.number(),
      context: v.optional(v.string()),
      fileAttachments: v.optional(v.array(v.object({
        file_url: v.string(),
        original_filename: v.string(),
        content_type: v.string(),
        file_size: v.number(),
        gcs_url: v.string(),
        uploaded_at: v.string(),
      }))),
      enrichment_metadata: v.optional(v.any()),
    }),
},
handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.conversationId as any);
    if (!doc) {
      throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
      throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
      throw new Error("Unauthorized access to conversation");
    }

    const now = Date.now();
    const sequence = conversation.messageCount || (conversation.messages || []).length;

    // 🔄 DUAL-WRITE: Write to BOTH new messages table AND legacy array
    
    // 1. Write to NEW messages table
    await ctx.db.insert("messages", {
      conversationId: args.conversationId as any,
      userId: args.userId,
      content: args.message.content,
      role: args.message.role,
      sequence,
      timestamp: args.message.timestamp,
      context: args.message.context,
      fileAttachments: args.message.fileAttachments,
      enrichment_metadata: args.message.enrichment_metadata,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Write to LEGACY messages array (for backward compatibility during migration)
    const updatedMessages = [...(conversation.messages || []), args.message];
    
    await ctx.db.patch(args.conversationId as any, {
      messages: updatedMessages,
      messageCount: sequence + 1,
      lastMessageAt: args.message.timestamp,
      updatedAt: now,
    });

    // ✅ TRACK INTELLIGENCE: Only track user messages for activity monitoring
    if (args.message.role === "user") {
      await ctx.runMutation(api.intelligenceMutations.incrementActivity, {
        userId: args.userId,
        activity_type: "chat",
      });
    }

    return args.conversationId;
},
});

export const deleteConversation = mutation({
args: {
    conversationId: v.string(),
    userId: v.string(),
},
handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId as any);

    if (!doc) {
        throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
        throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
        throw new Error("Unauthorized access to conversation");
    }

    // Delete the conversation
    await ctx.db.delete(conversation._id);
    return { success: true };
},
});

export const updateConversationTitle = mutation({
  args: {
    userId: v.string(),
    conversationId: v.string(),
    title: v.string()
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.conversationId as any);
    if (!doc) {
      throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
      throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any;

    // Verify ownership
    if (conversation.userId !== args.userId) {
      throw new Error("Unauthorized access to conversation");
    }

    // Update the title
    await ctx.db.patch(conversation._id, {
      title: args.title,
      updatedAt: Date.now()
    });

    return { success: true };
  }
});

export const updateConversationSuggestions = mutation({
  args: {
    conversationId: v.id("conversations"),
    suggestions: v.array(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      suggestions: args.suggestions,
      updatedAt: Date.now()
    });
    return { success: true };
  }
});

export const starConversation = mutation({
args: {
    conversationId: v.string(),
    userId: v.string(),
},
handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId as any);

    if (!doc) {
        throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
        throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
        throw new Error("Unauthorized access to conversation");
    }

    // Toggle the starred status
    await ctx.db.patch(conversation._id, {
    starred: !conversation.starred,
    updatedAt: Date.now(),
    });

    return { success: true, starred: !conversation.starred };
},
});

// Add suggestions to a message in the messages table
export const updateMessageSuggestions = mutation({
args: {
    messageId: v.id("messages"),
    suggestions: v.array(v.string())
},
handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
    suggestions: args.suggestions,
    updatedAt: Date.now(),
    });
    return { success: true };
},
});
