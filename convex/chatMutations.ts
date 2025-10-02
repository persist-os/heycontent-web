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
      })),
    },
    handler: async (ctx, args) => {
      const conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        title: args.title,
        messages: args.messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        starred: false,
      });

      // Note: Embeddings will be created automatically on next heartbeat
      console.log('📝 [CONVERSATION] Embedding will be created on next heartbeat sync');

      return conversationId;
    },
  });
  
export const addMessageToConversation = mutation({
args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
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
    }),
},
handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    const updatedMessages = [...conversation.messages, args.message];
    
    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    // Note: Embeddings will be updated automatically on next heartbeat
    console.log('📝 [CONVERSATION] Embedding will be updated on next heartbeat sync');

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