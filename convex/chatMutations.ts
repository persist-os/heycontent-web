import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";
import { messageArrayValidator, messageInputValidator } from "./types/message";

/**
 * 🎯 ATOMIC INITIALIZATION: Create Project + Conversation + Assignment Fingerprint + ONE Cognitive Field
 * 
 * This is the ONLY entry point for creating conversations.
 * ALWAYS creates all four entities together atomically.
 * 
 * Every conversation IS an assignment with:
 * - Project (context container)
 * - Assignment Fingerprint (project intelligence)
 * - Conversation (dialogue history)
 * - ONE unified Cognitive Field (shared intelligence substrate)
 */
export const initializeConversation = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    messages: v.optional(messageArrayValidator),
    // Optional widget context
    widgetId: v.optional(v.union(v.string(), v.id("widgets"))),
    widgetOutputId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const currentTime = Date.now();
      
      // 1. Create Project
      const projectId = await ctx.db.insert("projects", {
        userId: args.userId,
        name: args.title,
        description: "",
        noteIds: [],
        conversationIds: [],
        crystalIds: [],
        shardIds: [],
        stardustIds: [],
        fingerprintId: undefined, // Will be set below
        dailyLlmBudget: 50,
        llmCallsToday: 0,
        budgetLastReset: currentTime,
        isActive: true,
        createdAt: currentTime,
        updatedAt: currentTime,
      });
      
      console.log(`[initializeConversation] ✅ Created project ${projectId}`);
      
      // 2. Create Assignment Fingerprint
      const fingerprintId = await ctx.runMutation(api.assignmentFingerprintMutations.mutateAssignmentFingerprint, {
        operation: "create",
        projectId: projectId,
        userId: args.userId,
        createData: {
          currentGoals: [],
          currentConstraints: [],
          widgetPreferences: undefined,
          version: 1,
          totalInsights: 0,
        },
      });
      
      console.log(`[initializeConversation] ✅ Created assignment fingerprint ${fingerprintId}`);
      
      // 3. Create Conversation (assignment dialogue)
      const conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        title: args.title,
        messages: args.messages || [],
        messageCount: args.messages?.length || 0,
        lastMessageAt: args.messages && args.messages.length > 0 ? args.messages[args.messages.length - 1].timestamp : undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        starred: false,
        projectId: projectId,
        widgetId: args.widgetId,
        widgetOutputId: args.widgetOutputId,
        conversationType: "project_scoped",  // All conversations are assignments
      });
      
      console.log(`[initializeConversation] ✅ Created conversation ${conversationId}`);
      
      // 4. Create ONE Cognitive Field (shared by BOTH project AND conversation)
      await ctx.runMutation(api.cognitiveMutations.createCognitiveField, {
        userId: args.userId,
        projectId: projectId,
        conversationId: conversationId,  // Links to BOTH
        fieldId: `cf_unified_${projectId}_${conversationId}_${currentTime}`,
        sourceShardIds: [],
        sourceStardustIds: [],
        coreField: {},
        semanticMetadata: {},
        transparencyLayer: {},
      });
      
      console.log(`[initializeConversation] ✅ Created unified cognitive field`);
      
      // 5. Link everything together
      await ctx.db.patch(projectId, {
        fingerprintId: fingerprintId,
        conversationId: conversationId,
        updatedAt: currentTime,
      });
      
      console.log(`[initializeConversation] 🎉 COMPLETE: All 4 entities created and linked`);
      console.log(`[initializeConversation] 📊 Project: ${projectId}, Conversation: ${conversationId}, Fingerprint: ${fingerprintId}`);

      return conversationId;
    } catch (error) {
      console.error('[initializeConversation] Failed:', error);
      throw new Error(`Failed to initialize conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * @deprecated Use initializeConversation instead
 * This is kept for backward compatibility only - just delegates to initializeConversation
 */
export const createConversation = mutation({
    args: {
      userId: v.string(),
      title: v.string(),
      messages: v.optional(messageArrayValidator),
      projectId: v.optional(v.id("projects")),  // Ignored - always creates new project
      widgetId: v.optional(v.union(v.string(), v.id("widgets"))),
      widgetOutputId: v.optional(v.string()),
      conversationType: v.optional(v.union(  // Ignored - all conversations are assignments
        v.literal("general"),
        v.literal("widget_prompt"),
        v.literal("project_scoped"),
        v.literal("discovery")
      )),
    },
    handler: async (ctx, args) => {
      // Delegate to the atomic initialization
      return await ctx.runMutation(api.chatMutations.initializeConversation, {
        userId: args.userId,
        title: args.title,
        messages: args.messages,
        widgetId: args.widgetId,
        widgetOutputId: args.widgetOutputId,
      });
    },
  });
  
export const addMessageToConversation = mutation({
args: {
    userId: v.string(),
    conversationId: v.string(),
    message: messageInputValidator,
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
      decisionId: args.message.decisionId,  // Model selection decision ID
      contextDecisionId: args.message.contextDecisionId,  // Context enrichment decision ID
      createdAt: now,
      updatedAt: now,
    });

    // 2. Update conversation metadata (messageCount, lastMessageAt, updatedAt)
    await ctx.db.patch(args.conversationId as any, {
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
