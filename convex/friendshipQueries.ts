import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get pending friend requests for a user
 */
export const getPendingFriendRequests = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("friendships"),
    _creationTime: v.number(),
    userId1: v.string(),
    userId2: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    requestedBy: v.string(),
    requestMessage: v.optional(v.string()),
    requestedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    requesterInfo: v.object({
      name: v.string(),
      email: v.string(),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    try {
      // Get pending friend requests where user is the recipient (userId2)
      const pendingRequests = await ctx.db
        .query("friendships")
        .withIndex("by_userId2", (q) => q.eq("userId2", userId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      // Enrich with requester information
      const enrichedRequests = await Promise.all(
        pendingRequests.map(async (request) => {
          const requester = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", request.requestedBy))
            .first();

          if (!requester) {
            console.error(`Requester not found for friendship ${request._id}`);
            return null;
          }

          return {
            ...request,
            requesterInfo: {
              name: requester.name,
              email: requester.email,
              username: requester.username,
              image: requester.image,
            },
          };
        })
      );

      // Filter out any null results
      return enrichedRequests.filter(Boolean) as any[];
    } catch (error) {
      console.error("Error getting pending friend requests:", error);
      throw new Error(`Failed to get pending friend requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get all friends for a user
 */
export const getMyFriends = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("friendships"),
    _creationTime: v.number(),
    userId1: v.string(),
    userId2: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    requestedBy: v.string(),
    requestMessage: v.optional(v.string()),
    requestedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    friendInfo: v.object({
      userId: v.string(),
      name: v.string(),
      email: v.string(),
      username: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  })),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    try {
      // Get accepted friendships where user is either userId1 or userId2
      const friendships1 = await ctx.db
        .query("friendships")
        .withIndex("by_user1_status", (q) => q.eq("userId1", userId).eq("status", "accepted"))
        .collect();

      const friendships2 = await ctx.db
        .query("friendships")
        .withIndex("by_user2_status", (q) => q.eq("userId2", userId).eq("status", "accepted"))
        .collect();

      const allFriendships = [...friendships1, ...friendships2];

      // Enrich with friend information
      const enrichedFriendships = await Promise.all(
        allFriendships.map(async (friendship) => {
          // Determine which user is the friend
          const friendUserId = friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
          
          const friend = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", friendUserId))
            .first();

          if (!friend) {
            console.error(`Friend not found for friendship ${friendship._id}`);
            return null;
          }

          return {
            ...friendship,
            friendInfo: {
              userId: friend.userId,
              name: friend.name,
              email: friend.email,
              username: friend.username,
              image: friend.image,
            },
          };
        })
      );

      // Filter out any null results and sort by friendship creation time
      return enrichedFriendships
        .filter(Boolean)
        .sort((a, b) => (b as any).acceptedAt - (a as any).acceptedAt) as any[];
    } catch (error) {
      console.error("Error getting friends:", error);
      throw new Error(`Failed to get friends: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Search users by username
 */
export const searchUsersByUsername = query({
  args: {
    searchTerm: v.string(),
    currentUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const { searchTerm, currentUserId, limit = 20 } = args;

    // Validation
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error("Search term is required");
    }

    if (searchTerm.length < 2) {
      throw new Error("Search term must be at least 2 characters long");
    }

    try {
      // Get all users and filter by username containing search term
      // Note: Convex doesn't have built-in text search, so we need to collect and filter
      const users = await ctx.db
        .query("users")
        .collect();

      const filteredUsers = users
        .filter((user) => {
          // Exclude current user from results
          if (currentUserId && user.userId === currentUserId) {
            return false;
          }
          
          // Check if username contains search term (case-insensitive)
          const username = user.username?.toLowerCase() || '';
          const name = user.name.toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          
          return username.includes(searchLower) || name.includes(searchLower);
        })
        .slice(0, Math.min(limit, 50)) // Cap at 50 results
        .map((user) => ({
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        }));

      return filteredUsers;
    } catch (error) {
      console.error("Error searching users by username:", error);
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Search users by email
 */
export const searchUsersByEmail = query({
  args: {
    searchTerm: v.string(),
    currentUserId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const { searchTerm, currentUserId, limit = 20 } = args;

    // Validation
    if (!searchTerm || searchTerm.trim() === '') {
      throw new Error("Search term is required");
    }

    if (searchTerm.length < 3) {
      throw new Error("Search term must be at least 3 characters long");
    }

    try {
      // For exact email match, use the index
      if (searchTerm.includes('@')) {
        const exactUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", searchTerm.toLowerCase()))
          .first();

        if (exactUser && (!currentUserId || exactUser.userId !== currentUserId)) {
          return [{
            _id: exactUser._id,
            userId: exactUser.userId,
            name: exactUser.name,
            email: exactUser.email,
            username: exactUser.username,
            image: exactUser.image,
            createdAt: exactUser.createdAt,
          }];
        }
        return [];
      }

      // For partial matches, collect and filter
      const users = await ctx.db
        .query("users")
        .collect();

      const filteredUsers = users
        .filter((user) => {
          // Exclude current user from results
          if (currentUserId && user.userId === currentUserId) {
            return false;
          }
          
          // Check if email contains search term (case-insensitive)
          const email = user.email.toLowerCase();
          const name = user.name.toLowerCase();
          const searchLower = searchTerm.toLowerCase();
          
          return email.includes(searchLower) || name.includes(searchLower);
        })
        .slice(0, Math.min(limit, 50)) // Cap at 50 results
        .map((user) => ({
          _id: user._id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image,
          createdAt: user.createdAt,
        }));

      return filteredUsers;
    } catch (error) {
      console.error("Error searching users by email:", error);
      throw new Error(`Failed to search users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get user preferences
 */
export const getUserPreferences = query({
  args: {
    userId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("user_preferences"),
      _creationTime: v.number(),
      userId: v.string(),
      showPersonaToFriends: v.boolean(),
      allowFriendRequests: v.boolean(),
      friendRequestNotifications: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    try {
      // Check if user exists
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (!user) {
        throw new Error("User not found");
      }

      // Get user preferences
      const preferences = await ctx.db
        .query("user_preferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      return preferences || null;
    } catch (error) {
      console.error("Error getting user preferences:", error);
      if (error instanceof Error && error.message === "User not found") {
        throw error;
      }
      throw new Error(`Failed to get user preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Check friendship status between two users
 */
export const checkFriendshipStatus = query({
  args: {
    userId: v.string(),
    targetUserId: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
      friendship: v.object({
        _id: v.id("friendships"),
        requestedBy: v.string(),
        requestedAt: v.number(),
        acceptedAt: v.optional(v.number()),
        requestMessage: v.optional(v.string()),
      }),
    }),
    v.object({
      status: v.literal("none"),
    })
  ),
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
      throw new Error("Cannot check friendship status with yourself");
    }

    try {
      // Check if friendship exists (in either direction)
      let friendship = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", userId))
        .filter((q) => q.eq(q.field("userId2"), targetUserId))
        .first();

      if (!friendship) {
        friendship = await ctx.db
          .query("friendships")
          .withIndex("by_userId1", (q) => q.eq("userId1", targetUserId))
          .filter((q) => q.eq(q.field("userId2"), userId))
          .first();
      }

      if (!friendship) {
        return { status: "none" };
      }

      return {
        status: friendship.status,
        friendship: {
          _id: friendship._id,
          requestedBy: friendship.requestedBy,
          requestedAt: friendship.requestedAt,
          acceptedAt: friendship.acceptedAt,
          requestMessage: friendship.requestMessage,
        },
      };
    } catch (error) {
      console.error("Error checking friendship status:", error);
      throw new Error(`Failed to check friendship status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
