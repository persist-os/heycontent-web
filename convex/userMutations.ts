// @ts-nocheck
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const updateUser = mutation(async ({ db }, { userId, updates }: { userId: Id<"users">, updates: any }) => {
  if (!userId || !updates) throw new Error("Missing userId or updates");
  // You may need to adjust the collection name and update logic
  await db.patch(userId, updates);
  return { success: true };
});

export const create_user = mutation(async ({ db }, { name, email, image, userId, username, referralCode, referredBy }: {
  name: string,
  email: string,
  image?: string,
  userId: string,
  username?: string,
  referralCode?: string,
  referredBy?: string,
}) => {
  const now = Date.now();

  // Try to find an existing user by userId (preferred) or email (fallback)
  let existingUser = await db.query("users").withIndex("by_userId", q => q.eq("userId", userId)).first();
  if (!existingUser && email) {
    existingUser = await db.query("users").withIndex("by_email", q => q.eq("email", email)).first();
  }

  if (existingUser) {
    // Only update fields that are safe to update (never overwrite referralCode or referredBy)
    const updates: Record<string, any> = {};
    if (name && name !== existingUser.name) updates.name = name;
    if (typeof image !== 'undefined' && image !== existingUser.image) updates.image = image;
    if (username && username !== existingUser.username) updates.username = username;
    updates.updatedAt = now;
    // Only patch if there are changes
    if (Object.keys(updates).length > 1 || (Object.keys(updates).length === 1 && !updates.hasOwnProperty('updatedAt'))) {
      await db.patch(existingUser._id, updates);
    } else {
      // Always update updatedAt
      await db.patch(existingUser._id, { updatedAt: now });
    }
    return { success: true, userId: existingUser._id, alreadyExisted: true };
  }

  // If no user exists, create a new one
  // Generate a unique referral code if not provided
  let finalReferralCode = referralCode || '';
  if (!finalReferralCode) {
    // Generate a referral code that includes the user's name
    // Extract first name or use first part of email if name is not available
    let namePrefix = '';
    if (name && name.trim()) {
      // Get first name and convert to uppercase
      namePrefix = name.trim().split(' ')[0].toUpperCase().substring(0, 4);
    } else if (email) {
      // Use part of email before @ symbol
      namePrefix = email.split('@')[0].toUpperCase().substring(0, 4);
    }
    
    // If we still don't have a prefix, use a default
    if (!namePrefix) {
      namePrefix = 'USER';
    }
    
    // Add random characters to ensure uniqueness
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    finalReferralCode = `${namePrefix}-${randomPart}`;
    
    // Ensure uniqueness by checking for duplicates
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existingWithCode = await db.query("users")
        .withIndex("by_referralCode", q => q.eq("referralCode", finalReferralCode))
        .first();
      if (!existingWithCode) {
        isUnique = true;
      } else {
        // Generate a new random part
        const newRandomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
        finalReferralCode = `${namePrefix}-${newRandomPart}`;
        attempts++;
      }
    }
  }

  // Final safety check to ensure referral code is never empty
  if (!finalReferralCode) {
    // In the extremely unlikely case we still don't have a referral code
    // Generate a fallback code using the user's name/email and timestamp
    let prefix = 'USER';
    if (name && name.trim()) {
      prefix = name.trim().split(' ')[0].toUpperCase().substring(0, 4);
    } else if (email) {
      prefix = email.split('@')[0].toUpperCase().substring(0, 4);
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().substring(8, 12);
    finalReferralCode = `${prefix}-${timestamp}`;
  }
  
  const id = await db.insert("users", {
    name,
    email,
    image,
    userId,
    username: username ?? '',
    referralCode: finalReferralCode,
    referredBy: referredBy ?? '',
    createdAt: now,
    updatedAt: now,
  });
  
  // Initialize intelligence config for new user
  try {
    await db.insert("intelligence_config", {
      userId,
      triggers: {
        chat_messages: 25,        // DEPRECATED: MAB system controls triggering
        smart_notes: 10,          // DEPRECATED: MAB system controls triggering
        crystal_formations: 5,    // DEPRECATED: MAB system controls triggering
        days_since_last: 7,
      },
      preferences: {
        analysis_depth: "standard" as "fast" | "standard" | "deep",
        auto_archival: false,
        review_notifications: true,
      },
      last_analysis: 0,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    // Non-critical - don't fail user creation
  }
  
  // Process referral if user was referred by someone
  if (referredBy && referredBy.trim()) {
    try {
      // Find the referrer by their userId (Firebase ID)
      const referrer = await db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", referredBy))
        .unique();
      
      if (referrer) {
        // Create referral record directly
        const existingReferral = await db
          .query("referrals")
          .withIndex("by_referrer", (q) => q.eq("referrerId", referrer._id))
          .unique();
        
        if (existingReferral) {
          // Update existing record
          const updatedReferredUsers = [
            ...existingReferral.referredUsers,
            {
              userId: id,
              referralCode: referrer.referralCode, // Use referrer's actual referral code
              referredAt: now
            }
          ];
          
          await db.patch(existingReferral._id, {
            referredUsers: updatedReferredUsers,
            totalReferred: updatedReferredUsers.length,
            lastReferralDate: now
          });
        } else {
          // Create new record
          await db.insert("referrals", {
            referrerId: referrer._id,
            referredUsers: [{
              userId: id,
              referralCode: referrer.referralCode, // Use referrer's actual referral code
              referredAt: now
            }],
            totalReferred: 1,
            firstReferralDate: now,
            lastReferralDate: now
          });
        }
        
        // Update referrer's stats in users table
        await db.patch(referrer._id, {
          referralStats: {
            totalReferred: (existingReferral?.totalReferred || 0) + 1,
            firstReferralDate: existingReferral?.firstReferralDate || now,
            lastReferralDate: now
          }
        });
      }
    } catch (error) {
      // Log error but don't fail user creation
      console.error("Failed to process referral:", error);
    }
  }
  
  return { success: true, userId: id, alreadyExisted: false };
});


export const updateUserStripeData = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      default_payment_method: v.optional(v.string()),
      // Add more Stripe/user fields here as needed
    })
  },
  handler: async ({ db }, args) => {
    const user = await db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await db.patch(user._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    return { success: true, userId: user._id };
  },
});

// ⚠️ DEPRECATED: Gmail integration removed - use crystal system for email insights
// TODO: Remove this mutation after confirming no active usage

// Delete all user data
export const deleteUserAndData = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    const summary: Record<string, any> = { errors: [] };
    // 1. Check if user exists (but don't fail if they don't - idempotent deletion)
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    
    if (!user) {
      // User doesn't exist in Convex - this is OK, they may have been deleted already
      // or never created. Return success summary indicating no data to delete.
      summary.warning = "User not found in Convex database - may have been already deleted or never created";
      summary.user_found = false;
      return summary; // Return early with success - nothing to delete
    }
    
    summary.user_found = true;
    const BATCH_SIZE = 50;
    // Helper for batch deletion with resilient error handling
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
    // Phase 1: Child Records (Must Delete Before Parents)
    // Messages (before conversations)
    await batchDelete("messages", () =>
      ctx.db.query("messages").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Conversation Summaries (before conversations)
    await batchDelete("conversation_summaries", () =>
      ctx.db.query("conversation_summaries").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Shared Notes (bidirectional - before notes)
    await batchDelete("shared_notes", async () => {
      const asOwner = await ctx.db.query("shared_notes").withIndex("by_owner", (q) => q.eq("ownerId", userId)).take(BATCH_SIZE);
      const asShared = await ctx.db.query("shared_notes").withIndex("by_shared_user", (q) => q.eq("sharedWithUserId", userId)).take(BATCH_SIZE);
      return [...asOwner, ...asShared].slice(0, BATCH_SIZE);
    });
    
    // Shared Content (bidirectional - before content)
    await batchDelete("shared_content", async () => {
      const asOwner = await ctx.db.query("shared_content").withIndex("by_ownerId", (q) => q.eq("ownerId", userId)).take(BATCH_SIZE);
      const asShared = await ctx.db.query("shared_content").withIndex("by_sharedWithUserId", (q) => q.eq("sharedWithUserId", userId)).take(BATCH_SIZE);
      return [...asOwner, ...asShared].slice(0, BATCH_SIZE);
    });
    
    // Phase 2: Content & Artifacts
    // Artifacts (before widgets/projects)
    await batchDelete("artifacts", () =>
      ctx.db.query("artifacts").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Notes
    await batchDelete("notes", () =>
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Conversations
    await batchDelete("conversations", () =>
      ctx.db.query("conversations").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 3: Project Hierarchy
    // Widgets
    await batchDelete("widgets", () =>
      ctx.db.query("widgets").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Project Widgets
    await batchDelete("project_widgets", () =>
      ctx.db.query("project_widgets").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Assignment Fingerprints (fixed name from project_fingerprints)
    await batchDelete("assignment_fingerprints", () =>
      ctx.db.query("assignment_fingerprints").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Projects (must be deleted after related items)
    await batchDelete("projects", () =>
      ctx.db.query("projects").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 4: Crystal System (Dependencies)
    // Crystal Shards
    await batchDelete("crystal_shards", () =>
      ctx.db.query("crystal_shards").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Crystal Intelligence (before crystals)
    await batchDelete("crystal_intelligence", () =>
      ctx.db.query("crystal_intelligence").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Crystals
    await batchDelete("crystals", () =>
      ctx.db.query("crystals").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Stardust
    await batchDelete("stardust", () =>
      ctx.db.query("stardust").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Cognitive Fields
    await batchDelete("cognitive_fields", () =>
      ctx.db.query("cognitive_fields").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Crystal Cache
    await batchDelete("crystalCache", () =>
      ctx.db.query("crystalCache").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Crystal Formation Runs
    await batchDelete("crystal_formation_runs", () =>
      ctx.db.query("crystal_formation_runs").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 5: Intelligence System
    // Intelligence Bandit Decisions (before arms)
    await batchDelete("intelligence_bandit_decisions", () =>
      ctx.db.query("intelligence_bandit_decisions").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Intelligence Bandit Arms
    await batchDelete("intelligence_bandit_arms", () =>
      ctx.db.query("intelligence_bandit_arms").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Intelligence Jobs
    await batchDelete("intelligence_jobs", () =>
      ctx.db.query("intelligence_jobs").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // User Activity Counters
    await batchDelete("user_activity_counters", () =>
      ctx.db.query("user_activity_counters").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Intelligence Config
    await batchDelete("intelligence_config", () =>
      ctx.db.query("intelligence_config").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 6: Context Enrichment MAB
    // Context Enrichment Decisions (before arms)
    await batchDelete("context_enrichment_decisions", () =>
      ctx.db.query("context_enrichment_decisions").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Context Enrichment Arms (fixed name from mab_arms)
    await batchDelete("context_enrichment_arms", () =>
      ctx.db.query("context_enrichment_arms").withIndex("by_user_agent", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 7: Chat Model Selection MAB
    // Chat Model Selection Decisions (before arms)
    await batchDelete("chat_model_selection_decisions", () =>
      ctx.db.query("chat_model_selection_decisions").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Chat Model Selection Arms
    await batchDelete("chat_model_selection_arms", () =>
      ctx.db.query("chat_model_selection_arms").withIndex("by_user_agent", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 8: Embedding System
    // Content Embeddings
    await batchDelete("contentEmbeddings", () =>
      ctx.db.query("contentEmbeddings").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Embedding Updates
    await batchDelete("embeddingUpdates", () =>
      ctx.db.query("embeddingUpdates").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Embedding Queue
    await batchDelete("embeddingQueue", () =>
      ctx.db.query("embeddingQueue").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Embedding Syncs
    await batchDelete("embeddingSyncs", () =>
      ctx.db.query("embeddingSyncs").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 9: Social Features (Bidirectional)
    // Friendships (bidirectional - check both userId1 and userId2)
    await batchDelete("friendships", async () => {
      const asUser1 = await ctx.db.query("friendships").withIndex("by_userId1", (q) => q.eq("userId1", userId)).take(BATCH_SIZE);
      const asUser2 = await ctx.db.query("friendships").withIndex("by_userId2", (q) => q.eq("userId2", userId)).take(BATCH_SIZE);
      return [...asUser1, ...asUser2].slice(0, BATCH_SIZE);
    });
    
    // Referrals (where user is referrer)
    await batchDelete("referrals", async () => {
      const userDoc = await ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", userId)).first();
      if (!userDoc) return [];
      return await ctx.db.query("referrals").withIndex("by_referrer", (q) => q.eq("referrerId", userDoc._id)).take(BATCH_SIZE);
    });
    
    // Phase 10: Briefing System
    // Briefing Events
    await batchDelete("briefing_events", () =>
      ctx.db.query("briefing_events").withIndex("by_user_timestamp", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Briefing Clusters
    await batchDelete("briefing_clusters", () =>
      ctx.db.query("briefing_clusters").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Briefing Preferences
    await batchDelete("briefing_preferences", () =>
      ctx.db.query("briefing_preferences").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 11: Tracking & Logging
    // Context Usage Logs
    await batchDelete("context_usage_logs", () =>
      ctx.db.query("context_usage_logs").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Tool Call Logs
    await batchDelete("tool_call_logs", () =>
      ctx.db.query("tool_call_logs").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Webhook Events
    await batchDelete("webhook_events", () =>
      ctx.db.query("webhook_events").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Agno Run Events
    await batchDelete("agnoRunEvents", () =>
      ctx.db.query("agnoRunEvents").withIndex("by_user_time", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Background Jobs
    await batchDelete("background_jobs", () =>
      ctx.db.query("background_jobs").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Usage Events
    await batchDelete("usageEvents", () =>
      ctx.db.query("usageEvents").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 12: User Preferences & Config
    // User Preferences
    await batchDelete("user_preferences", () =>
      ctx.db.query("user_preferences").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Convergence Current Config
    await batchDelete("convergence_current_config", () =>
      ctx.db.query("convergence_current_config").withIndex("by_user_id", (q) => q.eq("user_id", userId)).take(BATCH_SIZE)
    );
    
    // Ambient Insights
    await batchDelete("ambientInsights", () =>
      ctx.db.query("ambientInsights").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 13: Infrastructure
    // Rate Limits
    await batchDelete("rate_limits", () =>
      ctx.db.query("rate_limits").withIndex("by_user_resource", (q) => q.eq("user_id", userId)).take(BATCH_SIZE)
    );
    
    // API Keys (no index)
    await batchDelete("api_keys", async () => {
      const all = await ctx.db.query("api_keys").take(BATCH_SIZE * 2);
      return all.filter((item) => item.user_id === userId).slice(0, BATCH_SIZE);
    });
    
    // Folders
    await batchDelete("folders", () =>
      ctx.db.query("folders").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Data Imports
    await batchDelete("data_imports", () =>
      ctx.db.query("data_imports").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Feedback
    await batchDelete("feedback", () =>
      ctx.db.query("feedback").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    // Phase 14: Final Cleanup
    // Users (must be last)
    await batchDelete("users", () =>
      ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    
    return summary;
  },
});

// Update username for a user
export const updateUsername = mutation({
  args: { 
    userId: v.string(),
    username: v.string()
  },
  handler: async (ctx, args) => {
    if (!args.username || args.username.trim().length === 0) {
      throw new Error("Username cannot be empty");
    }

    // Validate username format (alphanumeric + underscore, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(args.username)) {
      throw new Error("Username must be 3-20 characters long and contain only letters, numbers, and underscores");
    }

    // Check if username is already taken by another user
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser && existingUser.userId !== args.userId) {
      throw new Error("Username is already taken");
    }

    // Find the user to update
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Update the username
    await ctx.db.patch(user._id, {
      username: args.username,
      updatedAt: Date.now(),
    });

    return { success: true, username: args.username };
  },
});

// Email preferences - update email unsubscribe status
export const updateEmailPreferences = mutation({
  args: { 
    email: v.string(),
    emailUnsubscribed: v.boolean()
  },
  returns: v.object({
    success: v.boolean(),
    userId: v.optional(v.id("users")),
    message: v.string()
  }),
  handler: async (ctx, args) => {
    // First check if email exists in users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // Update email preferences for existing user
      await ctx.db.patch(user._id, {
        emailUnsubscribed: args.emailUnsubscribed,
        updatedAt: Date.now(),
      });
      return { 
        success: true, 
        userId: user._id,
        message: args.emailUnsubscribed 
          ? "You have been successfully unsubscribed from all emails."
          : "Your email preferences have been updated."
      };
    }

    // Email not found in either table
    return {
      success: false,
      userId: undefined,
      message: "We couldn't find this email address in our database. You may already be unsubscribed, or this email was never subscribed to our mailing list."
    };
  },
});

// User preferences - update user preferences including language
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      showPersonaToFriends: v.optional(v.boolean()),
      allowFriendRequests: v.optional(v.boolean()),
      friendRequestNotifications: v.optional(v.boolean()),
      language: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { userId, preferences } = args;
    const now = Date.now();

    // Find existing preferences
    const existingPreferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        ...preferences,
        updatedAt: now,
      });
    } else {
      // Create new preferences record
      await ctx.db.insert("user_preferences", {
        userId,
        showPersonaToFriends: preferences.showPersonaToFriends ?? false,
        allowFriendRequests: preferences.allowFriendRequests ?? true,
        friendRequestNotifications: preferences.friendRequestNotifications ?? true,
        language: preferences.language ?? "en",
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      success: true,
      message: "Preferences updated successfully",
    };
  },
});
