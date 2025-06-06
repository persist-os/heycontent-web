import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createConversation = mutation({
    args: {
      userId: v.string(),
      title: v.optional(v.string()),
      messages: v.array(v.object({
        content: v.string(),
        role: v.string(),
        timestamp: v.number(),
      })),
    },
    handler: async (ctx, args) => {
      const conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        title: args.title || "Untitled Chat",
        messages: args.messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        starred: false,
      });

      return conversationId;
    },
  });
  
export const addMessageToConversation = mutation({
args: {
    userId: v.string(),
    conversationId: v.string(),
    message: v.object({
    content: v.string(),
    role: v.string(),
    timestamp: v.optional(v.number()),
    }),
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

    const message = {
    ...args.message,
    timestamp: args.message.timestamp || Date.now(),
    };

    // Add the new message to the existing messages array
    const updatedMessages = [...conversation.messages, message];

    // Update the conversation with the new message
    await ctx.db.patch(conversation._id, {
    messages: updatedMessages,
    updatedAt: Date.now(),
    });

    return { success: true, conversationId: args.conversationId };
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