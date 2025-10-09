/**
 * Briefing Room - Test Data Generator
 * 
 * Creates realistic sample briefings for testing.
 * Uses the helper functions to ensure data matches real event structure.
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import {
  publishCrystalFormationBriefing,
  publishWidgetCompletionBriefing,
  publishContentSharedBriefing,
  publishSystemIntelligenceBriefing,
  publishDreamReportBriefing,
} from "./briefingRoomHelpers";

/**
 * Generate sample briefing events for testing
 * This creates realistic events that look like they came from actual systems
 */
export const generateSampleBriefings = mutation({
  args: {
    userId: v.string(),
    count: v.optional(v.number()), // Number of each type to create
  },
  handler: async (ctx, args) => {
    const count = args.count || 2;
    const created: string[] = [];
    
    // 1. Crystal Formation Events
    for (let i = 0; i < count; i++) {
      await publishCrystalFormationBriefing(ctx, {
        userId: args.userId,
        crystalId: "test_crystal_" + i as any, // Mock ID
        crystalName: [
          "Morning Productivity Pattern",
          "Creative Flow State",
          "Decision Making Style",
          "Focus Optimization Pattern"
        ][i % 4],
        crystalType: ["behavioral_pattern", "cognitive_style", "preference_cluster"][i % 3],
        confidenceScore: i % 2 === 0 ? "very_high" : "high",
        coreInsight: [
          "You're 3x more productive between 8-10am when working on creative tasks",
          "Your best work happens after brief physical movement breaks every 90 minutes",
          "You make better decisions after visual brainstorming sessions",
          "Deep focus periods are most effective in quiet morning hours"
        ][i % 4],
        shardCount: 20 + i * 10,
      });
      created.push("crystal_formation");
    }
    
    // 2. Widget Completion Events
    for (let i = 0; i < count; i++) {
      await publishWidgetCompletionBriefing(ctx, {
        userId: args.userId,
        widgetId: "test_widget_" + i as any,
        widgetTitle: [
          "Content Calendar Organizer",
          "Email Response Prioritizer",
          "Meeting Notes Synthesizer",
          "Task Dependencies Analyzer"
        ][i % 4],
        widgetType: ["automation", "analysis", "synthesis", "optimization"][i % 4],
        completedAt: Date.now() - (i * 60 * 60 * 1000), // Stagger completion times
        summary: [
          "Organized 47 content ideas into quarterly themes. Identified 3 high-impact topics.",
          "Analyzed 128 emails and prioritized 12 requiring immediate response.",
          "Synthesized notes from 5 meetings into 3 actionable decisions and 8 follow-up items.",
          "Mapped task dependencies across 4 projects, identified 2 critical path items."
        ][i % 4],
      });
      created.push("widget_completion");
    }
    
    // 3. Collaboration Events
    for (let i = 0; i < Math.floor(count / 2); i++) {
      await publishContentSharedBriefing(ctx, {
        recipientUserId: args.userId,
        sharedByUserId: "test_friend_" + i,
        sharedByName: ["Sarah Chen", "Michael Rodriguez", "Elena Patel"][i % 3],
        contentType: ["note", "project", "widget"][i % 3],
        contentId: "test_content_" + i,
        contentTitle: [
          "Wedding Planning Timeline",
          "Q4 Marketing Strategy",
          "Home Renovation Ideas"
        ][i % 3],
        message: [
          "Added vendor quotes and timeline updates!",
          "Thoughts on the content calendar approach?",
          "Found some great inspiration for the kitchen"
        ][i % 3],
      });
      created.push("content_shared");
    }
    
    // 4. System Intelligence Events
    for (let i = 0; i < Math.floor(count / 2); i++) {
      await publishSystemIntelligenceBriefing(ctx, {
        userId: args.userId,
        alertType: ["pattern_detected", "drift_alert", "optimization_suggestion"][i % 3],
        title: [
          "Interest Shift Detected",
          "Productivity Pattern Change",
          "Optimization Opportunity"
        ][i % 3],
        description: [
          "Your focus has shifted toward AI automation topics over the past week. 23 new shards collected.",
          "Your productive hours have shifted 2 hours earlier over the past month.",
          "Grouping similar tasks could save an estimated 4 hours per week."
        ][i % 3],
        priority: i % 3 === 0 ? "high" : "medium",
        metadata: {
          confidence: 0.85,
          evidence_count: 15 + i * 5,
        },
      });
      created.push("system_intelligence");
    }
    
    // 5. Dream Reports (Mock - system doesn't exist yet)
    for (let i = 0; i < Math.floor(count / 2); i++) {
      await publishDreamReportBriefing(ctx, {
        userId: args.userId,
        dreamTitle: [
          "Energy Alignment vs. Procrastination",
          "Creativity Fuels Decision Making",
          "The Pattern Behind Your Resistance"
        ][i % 3],
        dreamNarrative: [
          "While you slept, your system explored connections between your procrastination patterns and energy cycles. What if procrastination isn't laziness—it's your body's wisdom telling you the timing is wrong?",
          "Your Creative Process and Decision Making crystals have been talking to each other. They discovered you make significantly better decisions (67% success rate) after engaging in creative activities.",
          "Your system noticed a pattern: tasks you resist most strongly often align with your values most deeply. The resistance might be fear of success, not fear of failure."
        ][i % 3],
        insights: [
          "Procrastination correlates with your low-energy periods (82% confidence)",
          "Morning tasks complete 3x faster than afternoon tasks",
          "You avoid scheduling creative work during your peak productivity windows"
        ],
        confidence: 0.75 + (i * 0.05),
      });
      created.push("dream_report");
    }
    
    return {
      success: true,
      created: created.length,
      breakdown: {
        crystal_formations: count,
        widget_completions: count,
        collaborations: Math.floor(count / 2),
        system_intelligence: Math.floor(count / 2),
        dream_reports: Math.floor(count / 2),
      },
      message: `Created ${created.length} sample briefings for user ${args.userId}`,
    };
  },
});

/**
 * Clear all briefing events for a user (for testing)
 */
export const clearAllBriefings = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("briefing_events")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", args.userId))
      .collect();
    
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    
    return {
      success: true,
      deleted: events.length,
      message: `Cleared ${events.length} briefings for user ${args.userId}`,
    };
  },
});

/**
 * Generate a single test briefing of a specific type
 */
export const generateTestBriefing = mutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("crystal"),
      v.literal("widget"),
      v.literal("collaboration"),
      v.literal("system"),
      v.literal("dream")
    ),
  },
  handler: async (ctx, args) => {
    switch (args.type) {
      case "crystal":
        await publishCrystalFormationBriefing(ctx, {
          userId: args.userId,
          crystalId: "test_crystal_single" as any,
          crystalName: "Test Crystal Pattern",
          crystalType: "behavioral_pattern",
          confidenceScore: "high",
          coreInsight: "This is a test crystal formation for development",
          shardCount: 42,
        });
        break;
        
      case "widget":
        await publishWidgetCompletionBriefing(ctx, {
          userId: args.userId,
          widgetId: "test_widget_single" as any,
          widgetTitle: "Test Widget",
          widgetType: "test",
          completedAt: Date.now(),
          summary: "This is a test widget completion for development",
        });
        break;
        
      case "collaboration":
        await publishContentSharedBriefing(ctx, {
          recipientUserId: args.userId,
          sharedByUserId: "test_friend",
          sharedByName: "Test User",
          contentType: "note",
          contentId: "test_note",
          contentTitle: "Test Shared Content",
          message: "This is a test share for development",
        });
        break;
        
      case "system":
        await publishSystemIntelligenceBriefing(ctx, {
          userId: args.userId,
          alertType: "test_alert",
          title: "Test System Alert",
          description: "This is a test system alert for development",
          priority: "medium",
        });
        break;
        
      case "dream":
        await publishDreamReportBriefing(ctx, {
          userId: args.userId,
          dreamTitle: "Test Dream Report",
          dreamNarrative: "This is a test dream report for development",
          insights: ["Test insight 1", "Test insight 2"],
          confidence: 0.8,
        });
        break;
    }
    
    return {
      success: true,
      type: args.type,
      message: `Created test ${args.type} briefing`,
    };
  },
});

