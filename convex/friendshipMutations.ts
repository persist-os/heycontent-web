import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = mutation({
  args: {
    userId: v.string(),
    targetUserId: v.string(),
    message: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    friendshipId: v.optional(v.id("friendships")),
    message: v.string(),
    status: v.optional(v.union(
      v.literal("created"),
      v.literal("already_friends"),
      v.literal("already_pending"),
      v.literal("blocked"),
      v.literal("user_not_found")
    ))
  }),
  handler: async (ctx, args) => {
    const { userId, targetUserId, message } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        message: "User ID is required"
      };
    }
    if (!targetUserId || targetUserId.trim() === '') {
      return {
        success: false,
        message: "Target user ID is required"
      };
    }
    if (userId === targetUserId) {
      return {
        success: false,
        message: "Cannot send friend request to yourself"
      };
    }

    // Check if users exist
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!user) {
      return {
        success: false,
        message: "User not found",
        status: "user_not_found" as const
      };
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();
    if (!targetUser) {
      return {
        success: false,
        message: "Target user not found",
        status: "user_not_found" as const
      };
    }

    // Check target user's preferences
    const targetPreferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();
    
    if (targetPreferences && !targetPreferences.allowFriendRequests) {
      return {
        success: false,
        message: "This user is not accepting friend requests",
        status: "blocked" as const
      };
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", userId))
      .filter((q) => q.eq(q.field("userId2"), targetUserId))
      .first();

    const existingReverseFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", targetUserId))
      .filter((q) => q.eq(q.field("userId2"), userId))
      .first();

    if (existingFriendship || existingReverseFriendship) {
      const friendship = existingFriendship || existingReverseFriendship;
      if (friendship?.status === "accepted") {
        return {
          success: false,
          message: "You are already friends with this user",
          status: "already_friends" as const
        };
      } else if (friendship?.status === "pending") {
        return {
          success: false,
          message: "A friend request is already pending",
          status: "already_pending" as const
        };
      } else if (friendship?.status === "blocked") {
        return {
          success: false,
          message: "Cannot send friend request to this user",
          status: "blocked" as const
        };
      }
    }

    const now = Date.now();

    // Create friendship record
    const friendshipId = await ctx.db.insert("friendships", {
      userId1: userId,
      userId2: targetUserId,
      status: "pending",
      requestedBy: userId,
      requestMessage: message,
      requestedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      friendshipId,
      message: "Friend request sent successfully",
      status: "created" as const
    };
  },
});

/**
 * Accept a friend request
 */
export const acceptFriendRequest = mutation({
  args: {
    userId: v.string(),
    friendshipId: v.id("friendships"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, friendshipId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    // Get the friendship record
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    // Verify user is the recipient of the request
    if (friendship.userId2 !== userId) {
      throw new Error("You can only accept friend requests sent to you");
    }

    // Check if request is still pending
    if (friendship.status !== "pending") {
      throw new Error("This friend request is no longer pending");
    }

    const now = Date.now();

    // Update friendship status
    await ctx.db.patch(friendshipId, {
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
    });

    return null;
  },
});

/**
 * Decline a friend request
 */
export const declineFriendRequest = mutation({
  args: {
    userId: v.string(),
    friendshipId: v.id("friendships"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, friendshipId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    // Get the friendship record
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    // Verify user is the recipient of the request
    if (friendship.userId2 !== userId) {
      throw new Error("You can only decline friend requests sent to you");
    }

    // Check if request is still pending
    if (friendship.status !== "pending") {
      throw new Error("This friend request is no longer pending");
    }

    // Delete the friendship record (declined requests are removed)
    await ctx.db.delete(friendshipId);

    return null;
  },
});

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = mutation({
  args: {
    userId: v.string(),
    friendUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, friendUserId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }
    if (!friendUserId || friendUserId.trim() === '') {
      throw new Error("Friend user ID is required");
    }
    if (userId === friendUserId) {
      throw new Error("Cannot remove yourself as a friend");
    }

    // Find the friendship record (could be in either direction)
    let friendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", userId))
      .filter((q) => q.eq(q.field("userId2"), friendUserId))
      .first();

    if (!friendship) {
      friendship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", friendUserId))
        .filter((q) => q.eq(q.field("userId2"), userId))
        .first();
    }

    if (!friendship) {
      throw new Error("Friendship not found");
    }

    // Check if they are actually friends
    if (friendship.status !== "accepted") {
      throw new Error("You are not friends with this user");
    }

    // Delete the friendship record
    await ctx.db.delete(friendship._id);

    return null;
  },
});

/**
 * Block a user
 */
export const blockUser = mutation({
  args: {
    userId: v.string(),
    targetUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, targetUserId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }
    if (!targetUserId || targetUserId.trim() === '') {
      throw new Error("Target user ID is required");
    }
    if (userId === targetUserId) {
      throw new Error("Cannot block yourself");
    }

    // Check if users exist
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Check if any existing friendship exists
    let existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", userId))
      .filter((q) => q.eq(q.field("userId2"), targetUserId))
      .first();

    if (!existingFriendship) {
      existingFriendship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", targetUserId))
        .filter((q) => q.eq(q.field("userId2"), userId))
        .first();
    }

    const now = Date.now();

    if (existingFriendship) {
      // Update existing friendship to blocked
      await ctx.db.patch(existingFriendship._id, {
        status: "blocked",
        updatedAt: now,
      });
    } else {
      // Create new blocked relationship
      await ctx.db.insert("friendships", {
        userId1: userId,
        userId2: targetUserId,
        status: "blocked",
        requestedBy: userId,
        requestedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});

/**
 * Unblock a user
 */
export const unblockUser = mutation({
  args: {
    userId: v.string(),
    targetUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, targetUserId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }
    if (!targetUserId || targetUserId.trim() === '') {
      throw new Error("Target user ID is required");
    }
    if (userId === targetUserId) {
      throw new Error("Cannot unblock yourself");
    }

    // Find the blocked relationship
    let blockedRelationship = await ctx.db
      .query("friendships")
      .withIndex("by_userId1", (q) => q.eq("userId1", userId))
      .filter((q) => q.eq(q.field("userId2"), targetUserId))
      .filter((q) => q.eq(q.field("status"), "blocked"))
      .first();

    if (!blockedRelationship) {
      blockedRelationship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", targetUserId))
        .filter((q) => q.eq(q.field("userId2"), userId))
        .filter((q) => q.eq(q.field("status"), "blocked"))
        .first();
    }

    if (!blockedRelationship) {
      throw new Error("No blocked relationship found");
    }

    // Remove the blocked relationship
    await ctx.db.delete(blockedRelationship._id);

    return null;
  },
});

/**
 * Update user preferences
 */
export const updateUserPreferences = mutation({
  args: {
    userId: v.string(),
    preferences: v.object({
      showPersonaToFriends: v.optional(v.boolean()),
      allowFriendRequests: v.optional(v.boolean()),
      friendRequestNotifications: v.optional(v.boolean()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId, preferences } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Check if preferences record exists
    const existingPreferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existingPreferences) {
      // Update existing preferences
      const updates: any = { updatedAt: now };
      
      if (preferences.showPersonaToFriends !== undefined) {
        updates.showPersonaToFriends = preferences.showPersonaToFriends;
      }
      if (preferences.allowFriendRequests !== undefined) {
        updates.allowFriendRequests = preferences.allowFriendRequests;
      }
      if (preferences.friendRequestNotifications !== undefined) {
        updates.friendRequestNotifications = preferences.friendRequestNotifications;
      }

      await ctx.db.patch(existingPreferences._id, updates);
    } else {
      // Create new preferences record with defaults
      await ctx.db.insert("user_preferences", {
        userId,
        showPersonaToFriends: preferences.showPersonaToFriends ?? true,
        allowFriendRequests: preferences.allowFriendRequests ?? true,
        friendRequestNotifications: preferences.friendRequestNotifications ?? true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return null;
  },
});
