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
        // ✅ PATTERN 13: Atomic Parent-Child Updates - Add widget ID to conversation.widgetIds array
        const widgetIdAsArray = typeof args.widgetId === "string" ? args.widgetId as any : args.widgetId;
        conversationData.widgetIds = [widgetIdAsArray];
      }
      // Note: widgetOutputId is not stored in conversation schema
      // It's only used for context during creation
      
      const conversationId = await ctx.db.insert("conversations", conversationData);
      
      // 4. Link project to conversation IMMEDIATELY (CRITICAL - must happen first)
      // Patch conversationId FIRST to ensure it's ALWAYS set, even if fingerprint fails
      await ctx.db.patch(projectId, {
        conversationId: conversationId,
        updatedAt: currentTime,
      });
      
      // Then patch fingerprintId separately (can fail without breaking conversation link)
      if (fingerprintId) {
        await ctx.db.patch(projectId, {
          fingerprintId: fingerprintId,
          updatedAt: currentTime,
        });
      } else {
        console.warn(`[initializeConversation] Fingerprint creation failed or returned undefined for project ${projectId}, but conversation ${conversationId} is linked`);
      }
      
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
      
      // Link project to conversation (bidirectional)
      await ctx.db.patch(args.projectId, {
        conversationId: conversationId,
        updatedAt: currentTime,
      });
      
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

/**
 * Create project for an existing conversation (legacy conversation migration).
 * 
 * ⚠️ NOTE: Conversations SHOULD be created with projects atomically via initializeConversation.
 * This mutation provides graceful migration for legacy conversations that don't have projects.
 * 
 * Creates:
 * - Project linked to existing conversation
 * - Assignment Fingerprint (required for orchestrator)
 * - ONE Cognitive Field (required for orchestrator)
 * - Links conversation to project (bidirectional)
 * 
 * Pattern: Reverse of createConversationForProject
 */
export const createProjectForConversation = mutation({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    try {
      const currentTime = Date.now();
      
      // Verify conversation exists
      const conversation = await ctx.db.get(args.conversationId);
      if (!conversation) {
        throw new Error(`Conversation ${args.conversationId} not found`);
      }
      
      // Verify ownership
      if (conversation.userId !== args.userId) {
        throw new Error("Unauthorized access to conversation");
      }
      
      // Check if conversation already has a project
      if (conversation.projectId) {
        // Verify project exists
        const project = await ctx.db.get(conversation.projectId as any);
        if (project && (project as any).userId === args.userId) {
          // Query assignment fingerprint by projectId (pattern: same as cognitive field query)
          const fingerprint = await ctx.runQuery(api.assignmentFingerprintQueries.getByProject, {
            projectId: conversation.projectId,
            userId: args.userId
          });
          const fingerprintId = fingerprint?._id || null;
          
          // Query cognitive field by conversationId
          const cognitiveField = await ctx.runQuery(api.cognitiveQueries.getCognitiveFieldByConversation, {
            conversationId: args.conversationId
          });
          const cognitiveFieldId = cognitiveField?.fieldId || null;
          
          return {
            projectId: conversation.projectId,
            fingerprintId: fingerprintId,
            cognitiveFieldId: cognitiveFieldId,
          };
        }
      }
      
      // Get conversation title for project name
      const projectName = conversation.title || "Untitled Project";
      
      // 1. Create Project
      const projectId = await ctx.db.insert("projects", {
        userId: args.userId,
        name: projectName,
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
      
      // 3. Create ONE Cognitive Field (shared by project & conversation)
      // Pattern copied from initializeConversation (lines 108-121)
      const fieldId = `cf_unified_${projectId}_${args.conversationId}_${currentTime}`;
      await ctx.runMutation(api.cognitiveMutations.createCognitiveField, {
        userId: args.userId,
        projectId: projectId,
        conversationId: args.conversationId,  // Links to BOTH
        fieldId: fieldId,
        sourceShardIds: [],
        sourceStardustIds: [],
        coreField: {},
        semanticMetadata: {},
        transparencyLayer: {},
      });
      const cognitiveFieldId = fieldId;
      
      // 4. Link project to conversation (bidirectional)
      await ctx.db.patch(args.conversationId, {
        projectId: projectId,
        updatedAt: currentTime,
      });
      
      // 5. Update project with conversationId and fingerprintId
      await ctx.db.patch(projectId, {
        conversationId: args.conversationId,
        fingerprintId: fingerprintId,
        updatedAt: currentTime,
      });
      
      return {
        projectId,
        fingerprintId,
        cognitiveFieldId,
      };
    } catch (error) {
      console.error('[createProjectForConversation] Failed:', error);
      throw new Error(`Failed to create project for conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Verify ownership or collaborator access
    const isOwner = conversation.userId === args.userId;
    if (!isOwner && conversation.projectId) {
      // Check if user is a collaborator on the project
      const permission = await ctx.runQuery(api.contentAccessHelpers.getUserContentPermission, {
        userId: args.userId,
        contentType: "project",
        contentId: conversation.projectId,
      });
      if (!permission) {
        throw new Error("Unauthorized access to conversation");
      }
    } else if (!isOwner) {
      throw new Error("Unauthorized access to conversation");
    }

    const now = Date.now();
    // ✅ FIX RACE CONDITION: Use messageIds.length as source of truth (single source of truth)
    // This prevents duplicate sequence numbers when multiple users send messages simultaneously
    const currentMessageIds = conversation.messageIds || [];
    const sequence = currentMessageIds.length;

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
      a2aMetadata: args.message.a2aMetadata,  // A2A announcement metadata
      createdAt: now,
      updatedAt: now,
    });

    // 2. Update conversation metadata atomically (Pattern 13: Atomic Parent-Child Updates)
    // ✅ ATOMIC: Derive messageCount from messageIds array length (single source of truth)
    const updatedMessageIds = [...currentMessageIds, messageId];
    await ctx.db.patch(args.conversationId as any, {
      messageCount: updatedMessageIds.length,  // Derive from array length
      lastMessageAt: args.message.timestamp,
      updatedAt: now,
      messageIds: updatedMessageIds,  // Append message ID
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

    const summary: Record<string, any> = { errors: [] };
    const BATCH_SIZE = 50;

    // Helper for batch deletion with resilient error handling (Gold Standard pattern)
    async function batchDelete(table: string, getQuery: () => Promise<any[]>) {
        let deleted = 0;
        const errors: any[] = [];
        try {
            let hasMore = true;
            while (hasMore) {
                const items = await getQuery();
                if (!items || items.length === 0) break;
                for (const item of items) {
                    try {
                        await ctx.db.delete(item._id);
                        deleted++;
                    } catch (err) {
                        errors.push({ id: item._id, error: String(err) });
                    }
                }
                hasMore = items.length === BATCH_SIZE;
            }
            summary[table] = { deleted, errors };
            if (errors.length > 0) summary.errors.push({ table, errors });
        } catch (err) {
            // Table or index might not exist - log but continue
            summary[table] = { deleted, errors: [{ table, error: String(err) }] };
            summary.errors.push({ table, error: String(err) });
        }
    }

    // 1. Delete all messages with conversationId (children of conversation)
    await batchDelete("messages", () =>
        ctx.db.query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId as any))
            .take(BATCH_SIZE)
    );

    // 2. Delete cognitive field with conversationId (if exists)
    const cognitiveField = await ctx.db
        .query("cognitive_fields")
        .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId as any))
        .first();
    if (cognitiveField) {
        try {
            await ctx.db.delete(cognitiveField._id);
            summary["cognitive_fields"] = { deleted: 1, errors: [] };
        } catch (err) {
            summary["cognitive_fields"] = { deleted: 0, errors: [{ id: cognitiveField._id, error: String(err) }] };
            summary.errors.push({ table: "cognitive_fields", errors: [{ id: cognitiveField._id, error: String(err) }] });
        }
    }

    // 3. Delete assignment fingerprint with conversationId (if exists)
    // Query by projectId and filter by conversationId since conversationId is optional
    if (conversation.projectId) {
        const fingerprint = await ctx.db
            .query("assignment_fingerprints")
            .withIndex("by_project_user", (q) => 
                q.eq("projectId", conversation.projectId).eq("userId", args.userId)
            )
            .first();
        if (fingerprint && fingerprint.conversationId === args.conversationId) {
            try {
                await ctx.db.delete(fingerprint._id);
                summary["assignment_fingerprints"] = { deleted: 1, errors: [] };
            } catch (err) {
                summary["assignment_fingerprints"] = { deleted: 0, errors: [{ id: fingerprint._id, error: String(err) }] };
                summary.errors.push({ table: "assignment_fingerprints", errors: [{ id: fingerprint._id, error: String(err) }] });
            }
        }
    }

    // 4. Delete artifacts with conversationId (query by projectId and filter by conversationId)
    if (conversation.projectId) {
        await batchDelete("artifacts", async () => {
            const allArtifacts = await ctx.db
                .query("artifacts")
                .withIndex("by_project", (q) => q.eq("projectId", conversation.projectId))
                .take(BATCH_SIZE);
            return allArtifacts.filter((artifact: any) => artifact.conversationId === args.conversationId);
        });
    }

    // 5. Project cleanup: Check if 1:1 relationship exists
    if (conversation.projectId) {
        const projectDoc = await ctx.db.get(conversation.projectId as any);
        if (projectDoc && 'userId' in projectDoc && 'name' in projectDoc) {
            // Type guard: ensure it's a project document
            const project = projectDoc as any;
            
            // Check if project has only one conversation (1:1 relationship)
            const projectConversations = await ctx.db
                .query("conversations")
                .withIndex("by_project", (q) => q.eq("projectId", conversation.projectId))
                .collect();
            
            if (projectConversations.length === 1) {
                // Only one conversation - delete project (will cascade via Phase 2)
                try {
                    await ctx.db.delete(conversation.projectId as any);
                    summary["projects"] = { deleted: 1, errors: [] };
                } catch (err) {
                    summary["projects"] = { deleted: 0, errors: [{ id: conversation.projectId, error: String(err) }] };
                    summary.errors.push({ table: "projects", errors: [{ id: conversation.projectId, error: String(err) }] });
                }
            } else {
                // Multiple conversations - update project metadata (remove conversationId from arrays)
                try {
                    const conversationIds = (project as any).conversationIds as string[] | undefined;
                    const updatedConversationIds = (conversationIds || []).filter((id: string) => id !== args.conversationId);
                    await ctx.db.patch(conversation.projectId as any, {
                        conversationIds: updatedConversationIds,
                        updatedAt: Date.now(),
                    });
                    summary["projects"] = { updated: true, errors: [] };
                } catch (err) {
                    summary["projects"] = { updated: false, errors: [{ id: conversation.projectId, error: String(err) }] };
                    summary.errors.push({ table: "projects", errors: [{ id: conversation.projectId, error: String(err) }] });
                }
            }
        }
    }

    // 6. Delete the conversation record LAST
    try {
        await ctx.db.delete(conversation._id);
        summary["conversations"] = { deleted: 1, errors: [] };
    } catch (err) {
        summary["conversations"] = { deleted: 0, errors: [{ id: conversation._id, error: String(err) }] };
        summary.errors.push({ table: "conversations", errors: [{ id: conversation._id, error: String(err) }] });
    }

    return { success: summary.errors.length === 0, summary };
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
