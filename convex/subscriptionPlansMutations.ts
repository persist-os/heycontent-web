import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Subscription Plans Mutations
 * 
 * Mutations for syncing subscription plan data from backend to Convex cache.
 * These are called by the backend only - frontend uses queries for read-only access.
 * 
 * Flow:
 * 1. Backend fetches plans from Stripe
 * 2. Backend calls syncPlans mutation via HTTP endpoint
 * 3. Convex upserts plans (creates or updates existing)
 * 4. Frontend queries reflect updated plans instantly
 */

/**
 * Sync subscription plans from backend
 * 
 * Upserts plan data from backend Stripe sync. Creates new plans or updates existing ones.
 * Called by backend on startup and when pricing changes.
 */
export const syncPlans = mutation({
  args: {
    plans: v.array(v.object({
      planKey: v.string(),
      planName: v.string(),
      interval: v.union(v.literal("month"), v.literal("year")),
      priceId: v.string(),
      productId: v.string(),
      meteredPriceId: v.union(v.string(), v.null()),  // Allow null for free tier
      amount: v.number(),
      currency: v.string(),
      includedRequests: v.number(),
      overage: v.number(),
      features: v.array(v.string()),
      isMetered: v.boolean(),
      active: v.boolean(),
      sortOrder: v.number(),
    }))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const syncedPlans = [];
    
    // ✅ ATOMIC: Query all existing plans upfront (single atomic read)
    const existingPlans = await ctx.db
      .query("subscription_plans")
      .collect();
    
    // ✅ Build map by (planKey, interval) key for O(1) lookup
    const existingMap = new Map<string, typeof existingPlans[0]>();
    for (const plan of existingPlans) {
      const key = `${plan.planKey}-${plan.interval}`;
      existingMap.set(key, plan);
    }
    
    // ✅ Process each plan atomically
    for (const planData of args.plans) {
      const key = `${planData.planKey}-${planData.interval}`;
      const existing = existingMap.get(key);
      
      if (existing) {
        // ✅ Use replace for idempotent updates (preserves _id, _creationTime, createdAt)
        await ctx.db.replace(existing._id, {
          _id: existing._id,
          _creationTime: existing._creationTime,
          planKey: planData.planKey,
          planName: planData.planName,
          interval: planData.interval,
          priceId: planData.priceId,
          productId: planData.productId,
          meteredPriceId: planData.meteredPriceId,
          amount: planData.amount,
          currency: planData.currency,
          includedRequests: planData.includedRequests,
          overage: planData.overage,
          features: planData.features,
          isMetered: planData.isMetered,
          active: planData.active,
          sortOrder: planData.sortOrder,
          createdAt: existing.createdAt, // Preserve original creation time
          updatedAt: now,
          lastSyncedAt: now,
        });
        syncedPlans.push({
          id: existing._id,
          action: "updated",
          planKey: planData.planKey,
          interval: planData.interval
        });
      } else {
        // ✅ Try insert, catch conflict and retry with replace
        try {
          const id = await ctx.db.insert("subscription_plans", {
            planKey: planData.planKey,
            planName: planData.planName,
            interval: planData.interval,
            priceId: planData.priceId,
            productId: planData.productId,
            meteredPriceId: planData.meteredPriceId,
            amount: planData.amount,
            currency: planData.currency,
            includedRequests: planData.includedRequests,
            overage: planData.overage,
            features: planData.features,
            isMetered: planData.isMetered,
            active: planData.active,
            sortOrder: planData.sortOrder,
            createdAt: now,
            updatedAt: now,
            lastSyncedAt: now,
          });
          syncedPlans.push({
            id,
            action: "created",
            planKey: planData.planKey,
            interval: planData.interval
          });
        } catch (error) {
          // ✅ Conflict: Another mutation created it - query again and use replace
          const created = await ctx.db
            .query("subscription_plans")
            .withIndex("by_plan_key_interval", (q) => 
              q.eq("planKey", planData.planKey).eq("interval", planData.interval)
            )
            .first();
          
          if (created) {
            await ctx.db.replace(created._id, {
              _id: created._id,
              _creationTime: created._creationTime,
              planKey: planData.planKey,
              planName: planData.planName,
              interval: planData.interval,
              priceId: planData.priceId,
              productId: planData.productId,
              meteredPriceId: planData.meteredPriceId,
              amount: planData.amount,
              currency: planData.currency,
              includedRequests: planData.includedRequests,
              overage: planData.overage,
              features: planData.features,
              isMetered: planData.isMetered,
              active: planData.active,
              sortOrder: planData.sortOrder,
              createdAt: created.createdAt, // Preserve original creation time
              updatedAt: now,
              lastSyncedAt: now,
            });
            syncedPlans.push({
              id: created._id,
              action: "updated", // Was created by concurrent mutation, now updated
              planKey: planData.planKey,
              interval: planData.interval
            });
          } else {
            // Re-throw if still not found after conflict
            throw error;
          }
        }
      }
    }
    
    return {
      success: true,
      syncedCount: syncedPlans.length,
      syncedPlans,
      timestamp: now
    };
  },
});

/**
 * Deactivate a plan
 * 
 * Mark a plan as inactive without deleting (for plan archival)
 */
export const deactivatePlan = mutation({
  args: {
    planKey: v.string(),
    interval: v.union(v.literal("month"), v.literal("year"))
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db
      .query("subscription_plans")
      .withIndex("by_plan_key_interval", (q) => 
        q.eq("planKey", args.planKey).eq("interval", args.interval)
      )
      .first();
    
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }
    
    await ctx.db.patch(plan._id, {
      active: false,
      updatedAt: Date.now()
    });
    
    return {
      success: true,
      planKey: args.planKey,
      interval: args.interval,
      message: "Plan deactivated successfully"
    };
  },
});

/**
 * Delete all plans (admin only - for testing)
 * 
 * Removes all plans from cache. Should only be used in dev/testing.
 */
export const clearAllPlans = mutation({
  args: {},
  handler: async (ctx) => {
    const allPlans = await ctx.db
      .query("subscription_plans")
      .collect();
    
    let deleteCount = 0;
    for (const plan of allPlans) {
      await ctx.db.delete(plan._id);
      deleteCount++;
    }
    
    return {
      success: true,
      deletedCount: deleteCount,
      message: "All plans cleared successfully"
    };
  },
});

