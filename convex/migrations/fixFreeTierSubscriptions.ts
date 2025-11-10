/**
 * Migration: Fix Free Tier Subscriptions
 * 
 * Problem: Some users have incomplete subscription objects, missing includedRequests.
 * This causes getUsageSummary() to return "0/0" instead of "X/50".
 * 
 * Solution: Find all free tier users and ensure they have includedRequests: 50.
 * 
 * Safe to run multiple times (idempotent).
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const fixFreeTierSubscriptions = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting free tier subscription fix...");
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Get ALL users
    const allUsers = await ctx.db.query("users").collect();
    
    console.log(`[Migration] Found ${allUsers.length} total users`);
    
    for (const user of allUsers) {
      try {
        // Skip if no subscription at all
        if (!user.subscription) {
          skippedCount++;
          continue;
        }
        
        const sub = user.subscription;
        
        // Identify free tier users:
        // 1. No Stripe subscription ID (Convex-only) - check user level, not subscription
        // 2. Plan is "monthly_free" OR status is "active" with includedRequests missing/0
        const isFreeTier = 
          !user.stripeSubscriptionId && (
            sub.plan === "monthly_free" ||
            (sub.status === "active" && (!sub.includedRequests || sub.includedRequests === 0))
          );
        
        if (!isFreeTier) {
          // Not a free tier user, skip
          skippedCount++;
          continue;
        }
        
        // Check if already has correct includedRequests
        if (sub.includedRequests === 50) {
          console.log(`[Migration] User ${user.userId} already has includedRequests=50, skipping`);
          skippedCount++;
          continue;
        }
        
        // FIX THE USER
        const now = Date.now();
        await ctx.db.patch(user._id, {
          subscription: {
            ...sub,
            status: "active",
            plan: "monthly_free",  // Normalize plan name
            includedRequests: 50,  // FIX: Set to 50
            usedRequests: sub.usedRequests || 0,
            ubpEnabled: false,
            monthlyLimit: 0,
            currentPeriodStart: sub.currentPeriodStart || now,
            currentPeriodEnd: sub.currentPeriodEnd || (now + (30 * 24 * 60 * 60 * 1000)),
            lastSyncedAt: now,
          },
          updatedAt: now
        });
        
        console.log(`[Migration] FIXED user ${user.userId}: set includedRequests=50 (was ${sub.includedRequests || 0})`);
        fixedCount++;
        
      } catch (error) {
        console.error(`[Migration] Error fixing user ${user.userId}:`, error);
        errorCount++;
      }
    }
    
    const summary = {
      totalUsers: allUsers.length,
      fixed: fixedCount,
      skipped: skippedCount,
      errors: errorCount,
      timestamp: Date.now()
    };
    
    console.log(`[Migration] Complete:`, summary);
    
    return {
      success: true,
      message: `Migration complete: Fixed ${fixedCount} users, skipped ${skippedCount}, errors ${errorCount}`,
      ...summary
    };
  }
});