/**
 * Test Helper Mutations
 * 
 * ONLY FOR DEVELOPMENT/TESTING
 * These functions help test features by creating sample data
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Create a test family question for testing pending questions UI
 * 
 * DEPRECATED: Widget questions system removed. Questions are now posted as normal chat messages.
 * This function is kept for backward compatibility but no longer creates widget_questions records.
 * 
 * Usage in Convex Dashboard:
 * 1. Go to convex.dev dashboard
 * 2. Select "testHelpers" -> "createTestFamilyQuestion"
 * 3. Fill in your userId and projectId
 * 4. Click "Run"
 */
export const createTestFamilyQuestion = mutation({
  args: {
    userId: v.string(),
    projectId: v.id("projects"),
    widgetId: v.optional(v.id("widgets")), // Optional - will use fake if not provided
  },
  handler: async (ctx, args) => {
    // Use provided widgetId or create a fake one for testing
    const widgetId = args.widgetId || "test_widget_123";
    
    // Sample questions to rotate through
    const sampleQuestions = [
      {
        question: "What's your target completion date for this project?",
        familyName: "Timeline Architect",
        context: "Need to prioritize milestones correctly"
      },
      {
        question: "Do you have a preferred budget range for this initiative?",
        familyName: "Budget Analyst",
        context: "Required for resource allocation planning"
      },
      {
        question: "What's the primary goal you want to achieve with this project?",
        familyName: "Strategy Consultant",
        context: "Need to align all work with your core objectives"
      },
      {
        question: "Are there any stakeholders who need to review outputs before finalization?",
        familyName: "Delivery Manager",
        context: "Want to set up the right approval workflows"
      }
    ];
    
    // Pick a random question
    const sample = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
    
    // NOTE: Widget questions system removed - questions are now just chat messages
    // No widget_questions record needed
    
    // Get or create project-scoped conversation
    let conversation = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("conversationType"), "project_scoped")
        )
      )
      .first();
    
    if (!conversation) {
      // Create project-scoped conversation
      const project = await ctx.db.get(args.projectId);
      const projectName = project?.name || "Project";
      
      conversation = await ctx.db.get(
        await ctx.db.insert("conversations", {
          userId: args.userId,
          title: `${projectName} - Families`,
          conversationType: "project_scoped",
          projectId: args.projectId,
          starred: false,
          messages: [],
          messageCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        })
      );
    }
    
    if (!conversation) {
      throw new Error("Failed to create conversation");
    }
    
    // Post question as assistant message in conversation
    // CRITICAL: DUAL-WRITE for backward compatibility
    // - New: messages table
    // - Legacy: conversation.messages array
    const now = Date.now();
    
    // Construct the message object (no questionId - just normal message)
    const familyMessage = {
      content: `💭 **${sample.familyName}** ${sample.question}`,
      role: "assistant" as const,
      timestamp: now,
      contentType: "family_question" as const,
      familyMetadata: {
        familyId: widgetId,
        familyName: sample.familyName,
        context: sample.context
      }
    };
    
    // Write 1: Insert into new messages table
    const messageId = await ctx.db.insert("messages", {
      conversationId: conversation._id,
      userId: args.userId,
      ...familyMessage,
      sequence: conversation.messageCount || 0,
      createdAt: now,
      updatedAt: now
    });
    
    // Write 2: Append to conversation.messages array (LEGACY - required for useConversationState)
    const currentMessages = conversation.messages || [];
    await ctx.db.patch(conversation._id, {
      messages: [...currentMessages, familyMessage],
      messageCount: (conversation.messageCount || 0) + 1,
      lastMessageAt: now,
      updatedAt: now
    });
    
    console.log(`✅ Posted test question message: ${messageId} to conversation: ${conversation._id}`);
    console.log(`Family: ${sample.familyName}`);
    console.log(`Question: ${sample.question}`);
    
    return {
      success: true,
      messageId,
      conversationId: conversation._id,
      familyName: sample.familyName,
      question: sample.question,
      message: "Test question posted to project conversation! Check your project conversation to see it."
    };
  }
});

/**
 * Clean up test questions (optional - for cleanup after testing)
 * 
 * DEPRECATED: Widget questions system removed. This function is kept for backward compatibility.
 */
export const deleteTestQuestions = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Widget questions system removed - no cleanup needed
    return {
      success: true,
      deleted: 0,
      message: "Widget questions system removed - no cleanup needed"
    };
  }
});

/**
 * List user's projects (to get projectId for testing)
 */
export const listUserProjects = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .take(10);
    
    return projects.map(p => ({
      id: p._id,
      name: p.name,
      createdAt: p.createdAt
    }));
  }
});

