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
      const conversationData: any = {
        userId: args.userId,
        title: args.title,
        messages: args.messages || [],
        // Initialize messageIds array (Pattern 13: Atomic Parent-Child Updates)
        messageIds: [],
        messageCount: args.messages?.length || 0,
        lastMessageAt: args.messages && args.messages.length > 0 ? args.messages[args.messages.length - 1].timestamp : undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        starred: false,
        projectId: projectId,
        conversationType: "project_scoped",  // All conversations are assignments
      };
      
      // Add optional widget context if provided
      if (args.widgetId) {
        conversationData.widgetId = args.widgetId;
      }
      // Note: widgetOutputId is not stored in conversation schema
      // It's only used for context during creation
      
      const conversationId = await ctx.db.insert("conversations", conversationData);
      
      console.log(`[initializeConversation] ✅ Created conversation ${conversationId}`);
      
      // 4. Link project to conversation IMMEDIATELY (critical - must happen before cognitive field)
      // This ensures project always has conversationId even if cognitive field creation fails
      await ctx.db.patch(projectId, {
        fingerprintId: fingerprintId,
        conversationId: conversationId,
        updatedAt: currentTime,
      });
      
      console.log(`[initializeConversation] ✅ Linked project ${projectId} to conversation ${conversationId}`);
      
      // 5. Create ONE Cognitive Field (shared by BOTH project AND conversation)
      // This can fail without breaking the project-conversation link
      const fieldId = `cf_unified_${projectId}_${conversationId}_${currentTime}`;
      await ctx.runMutation(api.cognitiveMutations.createCognitiveField, {
        userId: args.userId,
        projectId: projectId,
        conversationId: conversationId,  // Links to BOTH
        fieldId: fieldId,
        sourceShardIds: [],
        sourceStardustIds: [],
        coreField: {},
        semanticMetadata: {},
        transparencyLayer: {},
      });
      
      console.log(`[initializeConversation] ✅ Created unified cognitive field ${fieldId}`);
      
      console.log(`[initializeConversation] 🎉 COMPLETE: All 4 entities created and linked`);
      console.log(`[initializeConversation] 📊 Project: ${projectId}, Conversation: ${conversationId}, Fingerprint: ${fingerprintId}, Field: ${fieldId}`);

      return {
        conversationId,
        projectId,
        fingerprintId,
        cognitiveFieldId: fieldId
      };
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
      const result = await ctx.runMutation(api.chatMutations.initializeConversation, {
        userId: args.userId,
        title: args.title,
        messages: args.messages,
        widgetId: args.widgetId,
        widgetOutputId: args.widgetOutputId,
      });
      // Return conversationId for backward compatibility
      return result.conversationId;
    },
  });

/**
 * Create conversation for an existing project (fallback for incomplete projects).
 * 
 * ⚠️ NOTE: Projects SHOULD be created with conversations atomically via initializeConversation.
 * This mutation provides graceful fallback for legacy/incomplete projects that don't have conversations.
 * 
 * Creates:
 * - Conversation linked to existing project
 * - Links project to conversation (bidirectional)
 */
export const createConversationForProject = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    title: v.string(),
    messages: v.optional(messageArrayValidator),
  },
  handler: async (ctx, args) => {
    try {
      const currentTime = Date.now();
      
      // Verify project exists
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error(`Project ${args.projectId} not found`);
      }
      
      // Check if project already has a conversation
      if (project.conversationId) {
        console.log(`[createConversationForProject] Project ${args.projectId} already has conversation ${project.conversationId}`);
        return {
          conversationId: project.conversationId,
          projectId: args.projectId,
        };
      }
      
      // Create conversation linked to existing project
      const conversationData: any = {
        userId: args.userId,
        title: args.title,
        messages: args.messages || [],
        // Initialize messageIds array (Pattern 13: Atomic Parent-Child Updates)
        messageIds: [],
        messageCount: args.messages?.length || 0,
        lastMessageAt: args.messages && args.messages.length > 0 ? args.messages[args.messages.length - 1].timestamp : undefined,
        createdAt: currentTime,
        updatedAt: currentTime,
        starred: false,
        projectId: args.projectId,
        conversationType: "project_scoped",
      };
      
      const conversationId = await ctx.db.insert("conversations", conversationData);
      
      console.log(`[createConversationForProject] ✅ Created conversation ${conversationId} for project ${args.projectId}`);
      
      // Link project to conversation (bidirectional)
      await ctx.db.patch(args.projectId, {
        conversationId: conversationId,
        updatedAt: currentTime,
      });
      
      console.log(`[createConversationForProject] ✅ Linked project ${args.projectId} to conversation ${conversationId}`);
      
      return {
        conversationId,
        projectId: args.projectId,
      };
    } catch (error) {
      console.error('[createConversationForProject] Failed:', error);
      throw new Error(`Failed to create conversation for project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

    // 🔄 DUAL-WRITE: Write to BOTH new messages table AND update conversation messageIds array
    
    // 1. Write to NEW messages table
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId as any,
      userId: args.userId,
      content: args.message.content,
      role: args.message.role,
      sequence,
      timestamp: args.message.timestamp,
      context: args.message.context,
      contentType: args.message.contentType,
      fileAttachments: args.message.fileAttachments,
      enrichment_metadata: args.message.enrichment_metadata,
      decisionId: args.message.decisionId,  // Model selection decision ID
      contextDecisionId: args.message.contextDecisionId,  // Context enrichment decision ID
      context_summary: args.message.context_summary,
      familyMetadata: args.message.familyMetadata,
      artifactMetadata: args.message.artifactMetadata,
      suggestions: args.message.suggestions,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Update conversation metadata atomically (Pattern 13: Atomic Parent-Child Updates)
    await ctx.db.patch(args.conversationId as any, {
      messageCount: sequence + 1,
      lastMessageAt: args.message.timestamp,
      updatedAt: now,
      messageIds: [...(conversation.messageIds || []), messageId],  // Append message ID
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

    const now = Date.now();

    // Update the conversation title
    await ctx.db.patch(conversation._id, {
      title: args.title,
      updatedAt: now
    });

    // Update the associated project name if projectId exists
    if (conversation.projectId) {
      const project = await ctx.db.get(conversation.projectId as any) as any;
      if (project && project['userId']) {
        // Verify project ownership matches conversation ownership
        if (project['userId'] === args.userId) {
          await ctx.db.patch(conversation.projectId as any, {
            name: args.title,
            updatedAt: now
          });
        }
      }
    }

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
