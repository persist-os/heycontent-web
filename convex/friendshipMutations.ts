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
  returns: v.id("friendships"),
  handler: async (ctx, args) => {
    const { userId, targetUserId, message } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }
    if (!targetUserId || targetUserId.trim() === '') {
      throw new Error("Target user ID is required");
    }
    if (userId === targetUserId) {
      throw new Error("Cannot send friend request to yourself");
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

    // Check target user's preferences
    const targetPreferences = await ctx.db
      .query("user_preferences")
      .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
      .first();
    
    if (targetPreferences && !targetPreferences.allowFriendRequests) {
      throw new Error("This user is not accepting friend requests");
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
        throw new Error("You are already friends with this user");
      } else if (friendship?.status === "pending") {
        throw new Error("A friend request is already pending");
      } else if (friendship?.status === "blocked") {
        throw new Error("Cannot send friend request to this user");
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

    return friendshipId;
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
