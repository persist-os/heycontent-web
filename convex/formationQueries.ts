import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const formationQueryValidator = v.object({
  operation: v.union(
    v.literal("status"), 
    v.literal("history"), 
    v.literal("stats"), 
    v.literal("eligibility"),
    v.literal("get_formation_candidates"),
    v.literal("get_recently_active_users"),
    v.literal("get_active_formation_candidates")
  ),
  userId: v.string(),
  includeHistory: v.optional(v.boolean()),
  limit: v.optional(v.number()),
  timeRangeHours: v.optional(v.number()),
  minShards: v.optional(v.number()),
  minDaysSinceLastRun: v.optional(v.number()),
  hoursLookback: v.optional(v.number())
});

export const queryFormation = query({
  args: formationQueryValidator,
  
  handler: async (ctx, args) => {
    if (args.operation === "status") {
      const [currentRun, lastCompleted] = await Promise.all([
        ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first(),
        ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).filter(q => q.neq(q.field("status"), "running")).order("desc").first()
      ]);

      return {
        canStart: !currentRun,
        isRunning: !!currentRun,
        currentRunId: currentRun?._id,
        lastRunStatus: lastCompleted?.status,
        timeSinceLastRun: lastCompleted?.completed_at ? Date.now() - lastCompleted.completed_at : null,
        history: args.includeHistory ? await ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").take(args.limit || 5) : []
      };
    }

    if (args.operation === "history") {
      return ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").take(args.limit || 10);
    }

    if (args.operation === "stats") {
      const runs = await ctx.db.query("crystal_formation_runs")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .filter(q => q.gte(q.field("started_at"), Date.now() - (args.timeRangeHours || 24) * 3600000))
        .collect();

      return {
        total: runs.length,
        completed: runs.filter(r => r.status === "completed").length,
        failed: runs.filter(r => r.status === "failed").length,
        running: runs.filter(r => r.status === "running").length,
        avgDuration: runs.filter(r => r.duration_ms).reduce((sum, r) => sum + r.duration_ms!, 0) / Math.max(1, runs.filter(r => r.duration_ms).length),
        totalCrystalsCreated: runs.reduce((sum, r) => sum + (r.crystals_created || 0), 0)
      };
    }

    // New operations for background formation service
    if (args.operation === "get_formation_candidates") {
      const minShards = args.minShards || 20;
      const minDays = args.minDaysSinceLastRun || 3;
      const limit = args.limit || 50;

      console.log(`🔍 [FORMATION CANDIDATES] Looking for users with ${minShards}+ shards, ${minDays}+ days since last run`);

      try {
        // Step 1: Get all users who have crystal shards
        const allShards = await ctx.db
          .query("crystal_shards")
          .collect();

        // Group shards by userId and count them
        const userShardCounts = new Map<string, number>();
        allShards.forEach(shard => {
          const currentCount = userShardCounts.get(shard.userId) || 0;
          userShardCounts.set(shard.userId, currentCount + 1);
        });

        // Step 2: Filter users who have enough shards
        const usersWithEnoughShards = Array.from(userShardCounts.entries())
          .filter(([userId, shardCount]) => shardCount >= minShards)
          .map(([userId, shardCount]) => ({ userId, shardCount }));

        if (usersWithEnoughShards.length === 0) {
          return [];
        }

        // Step 3: Check formation run history for each user
        const candidates = [];
        
        for (const { userId, shardCount } of usersWithEnoughShards.slice(0, limit * 2)) {
          // Get the user's most recent completed formation run
          const lastRun = await ctx.db
            .query("crystal_formation_runs")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.neq(q.field("status"), "running"))
            .order("desc")
            .first();

          // Check if user has a currently running formation
          const runningRun = await ctx.db
            .query("crystal_formation_runs")
            .withIndex("by_user_status", (q) => q.eq("userId", userId).eq("status", "running"))
            .first();

          // Calculate eligibility
          const daysSinceLastRun = lastRun?.completed_at 
            ? (Date.now() - lastRun.completed_at) / (24 * 60 * 60 * 1000)
            : Infinity;
          
          const hasWaitedEnough = daysSinceLastRun >= minDays;
          const noRunningFormation = !runningRun;
          const eligible = hasWaitedEnough && noRunningFormation;

          candidates.push({
            userId,
            shardCount,
            daysSinceLastRun: lastRun?.completed_at ? Math.floor(daysSinceLastRun) : undefined,
            lastRunStatus: lastRun?.status,
            eligible,
          });

          // Stop if we have enough eligible candidates
          if (candidates.filter(c => c.eligible).length >= limit) {
            break;
          }
        }

        // Sort by eligibility first, then by shard count (descending)
        const sortedCandidates = candidates
          .sort((a, b) => {
            if (a.eligible !== b.eligible) {
              return a.eligible ? -1 : 1; // Eligible users first
            }
            return b.shardCount - a.shardCount; // Higher shard count first
          })
          .slice(0, limit);

        const eligibleCount = sortedCandidates.filter(c => c.eligible).length;
        console.log(`✅ [FORMATION CANDIDATES] Found ${eligibleCount}/${sortedCandidates.length} eligible candidates`);

        return sortedCandidates;

      } catch (error) {
        console.error("❌ [FORMATION CANDIDATES] Error getting formation candidates:", error);
        throw new Error("Failed to get formation candidates");
      }
    }

    if (args.operation === "get_recently_active_users") {
      const hoursLookback = args.hoursLookback || 24;
      const limit = args.limit || 100;
      const cutoffTime = Date.now() - (hoursLookback * 60 * 60 * 1000);

      console.log(`🎯 [ACTIVE USERS] Looking for users active in last ${hoursLookback} hours`);

      try {
        // Get recent activity from multiple sources
        const [recentShards, recentNotes, recentConversations] = await Promise.all([
          // Recent crystal shards
          ctx.db
            .query("crystal_shards")
            .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
            .collect(),
          
          // Recent notes
          ctx.db
            .query("notes")
            .filter((q) => q.gte(q.field("updatedAt"), cutoffTime))
            .collect(),
          
          // Recent conversations
          ctx.db
            .query("conversations")
            .filter((q) => q.gte(q.field("createdAt"), cutoffTime))
            .collect(),
        ]);

        // Aggregate activity by user
        const userActivity = new Map<string, {
          lastActivity: number;
          activityTypes: Set<string>;
          recentShards: number;
          recentNotes: number;
          recentConversations: number;
        }>();

        // Process recent shards
        recentShards.forEach(shard => {
          const existing = userActivity.get(shard.userId) || {
            lastActivity: 0,
            activityTypes: new Set(),
            recentShards: 0,
            recentNotes: 0,
            recentConversations: 0,
          };
          
          existing.lastActivity = Math.max(existing.lastActivity, shard._creationTime);
          existing.activityTypes.add("shard_creation");
          existing.recentShards++;
          userActivity.set(shard.userId, existing);
        });

        // Process recent notes
        recentNotes.forEach(note => {
          const existing = userActivity.get(note.userId) || {
            lastActivity: 0,
            activityTypes: new Set(),
            recentShards: 0,
            recentNotes: 0,
            recentConversations: 0,
          };
          
          existing.lastActivity = Math.max(existing.lastActivity, note.updatedAt);
          existing.activityTypes.add("note_activity");
          existing.recentNotes++;
          userActivity.set(note.userId, existing);
        });

        // Process recent conversations
        recentConversations.forEach(conversation => {
          const existing = userActivity.get(conversation.userId) || {
            lastActivity: 0,
            activityTypes: new Set(),
            recentShards: 0,
            recentNotes: 0,
            recentConversations: 0,
          };
          
          existing.lastActivity = Math.max(existing.lastActivity, conversation.createdAt);
          existing.activityTypes.add("conversation");
          existing.recentConversations++;
          userActivity.set(conversation.userId, existing);
        });

        // Convert to array and sort by last activity
        const activeUsers = Array.from(userActivity.entries())
          .map(([userId, activity]) => ({
            userId,
            lastActivity: activity.lastActivity,
            activityTypes: Array.from(activity.activityTypes),
            recentShards: activity.recentShards,
            recentNotes: activity.recentNotes,
            recentConversations: activity.recentConversations,
          }))
          .sort((a, b) => b.lastActivity - a.lastActivity)
          .slice(0, limit);

        console.log(`✅ [ACTIVE USERS] Found ${activeUsers.length} recently active users`);

        return activeUsers;

      } catch (error) {
        console.error("❌ [ACTIVE USERS] Error getting recently active users:", error);
        throw new Error("Failed to get recently active users");
      }
    }

    if (args.operation === "get_active_formation_candidates") {
      const limit = args.limit || 25;

      console.log(`🎯 [ACTIVE CANDIDATES] Getting active formation candidates`);

      try {
        // Get formation candidates
        const candidatesResult = await ctx.runQuery(api.formationQueries.queryFormation, {
          operation: "get_formation_candidates",
          userId: args.userId,
          minShards: args.minShards,
          minDaysSinceLastRun: args.minDaysSinceLastRun,
          limit: limit * 2,
        }) as Array<{
          userId: string;
          shardCount: number;
          daysSinceLastRun?: number;
          lastRunStatus?: string;
          eligible: boolean;
        }>;

        // Get active users
        const activeUsersResult = await ctx.runQuery(api.formationQueries.queryFormation, {
          operation: "get_recently_active_users",
          userId: args.userId,
          hoursLookback: args.hoursLookback,
          limit: 200,
        }) as Array<{
          userId: string;
          lastActivity: number;
          activityTypes: string[];
          recentShards: number;
          recentNotes: number;
          recentConversations: number;
        }>;

        // Create activity lookup map
        const activityMap = new Map(
          activeUsersResult.map(user => [user.userId, user])
        );

        // Combine candidates with activity data
        const activeCandidates = candidatesResult
          .map(candidate => {
            const activity = activityMap.get(candidate.userId);
            return {
              ...candidate,
              lastActivity: activity?.lastActivity || 0,
              activityTypes: activity?.activityTypes || [],
            };
          })
          .filter(candidate => candidate.lastActivity > 0) // Only include users with recent activity
          .sort((a, b) => {
            // Sort by: eligible first, then by recent activity, then by shard count
            if (a.eligible !== b.eligible) {
              return a.eligible ? -1 : 1;
            }
            if (a.lastActivity !== b.lastActivity) {
              return b.lastActivity - a.lastActivity;
            }
            return b.shardCount - a.shardCount;
          })
          .slice(0, limit);

        const eligibleCount = activeCandidates.filter(c => c.eligible).length;
        console.log(`✅ [ACTIVE CANDIDATES] Found ${eligibleCount}/${activeCandidates.length} active eligible candidates`);

        return activeCandidates;

      } catch (error) {
        console.error("❌ [ACTIVE CANDIDATES] Error getting active formation candidates:", error);
        throw new Error("Failed to get active formation candidates");
      }
    }

    const [shardCount, lastRun, runningRun] = await Promise.all([
      ctx.db.query("crystal_shards").withIndex("by_user", q => q.eq("userId", args.userId)).collect().then(s => s.length),
      ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").first(),
      ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first()
    ]);

    const minShards = args.minShards || 25;
    const minDays = args.minDaysSinceLastRun || 3;
    const daysSinceLastRun = lastRun?.completed_at ? (Date.now() - lastRun.completed_at) / 86400000 : Infinity;
    
    const hasEnoughShards = shardCount >= minShards;
    const hasWaitedEnough = daysSinceLastRun >= minDays;
    const noRunningFormation = !runningRun;

    return {
      eligible: hasEnoughShards && hasWaitedEnough && noRunningFormation,
      shardCount,
      daysSinceLastRun: Math.floor(daysSinceLastRun),
      hasRunningFormation: !!runningRun,
      reasons: { insufficientShards: !hasEnoughShards, tooSoon: !hasWaitedEnough, alreadyRunning: !!runningRun }
    };
  }
});