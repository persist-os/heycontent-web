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
    _creationTime: v.float64(),
    userId1: v.string(),
    userId2: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    requestedBy: v.string(),
    requestMessage: v.optional(v.string()),
    requestedAt: v.float64(),
    acceptedAt: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
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
      return enrichedRequests.filter((req): req is NonNullable<typeof req> => req !== null);
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
    _creationTime: v.float64(),
    userId1: v.string(),
    userId2: v.string(),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("blocked")),
    requestedBy: v.string(),
    requestMessage: v.optional(v.string()),
    requestedAt: v.float64(),
    acceptedAt: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
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

      // Filter out any null results and sort by acceptance time (most recent first)
      return enrichedFriendships
        .filter((friendship): friendship is NonNullable<typeof friendship> => friendship !== null)
        .sort((a, b) => {
          const aAcceptedAt = a.acceptedAt || 0;
          const bAcceptedAt = b.acceptedAt || 0;
          return bAcceptedAt - aAcceptedAt;
        });
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
    _creationTime: v.float64(),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.float64(),
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
          _creationTime: user._creationTime,
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
    _creationTime: v.float64(),
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    username: v.optional(v.string()),
    image: v.optional(v.string()),
    createdAt: v.float64(),
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
            _creationTime: exactUser._creationTime,
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
          _creationTime: user._creationTime,
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
      _creationTime: v.float64(),
      userId: v.string(),
      showPersonaToFriends: v.boolean(),
      allowFriendRequests: v.boolean(),
      friendRequestNotifications: v.boolean(),
      createdAt: v.float64(),
      updatedAt: v.float64(),
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
      const preferences = await ctx.db
        .query("user_preferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      return preferences || null;
    } catch (error) {
      console.error("Error getting user preferences:", error);
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
  returns: v.object({
    status: v.union(
      v.literal("none"),
      v.literal("pending_sent"),
      v.literal("pending_received"),
      v.literal("friends"),
      v.literal("blocked")
    )
  }),
  handler: async (ctx, args) => {
    const { userId, targetUserId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }
    if (!targetUserId || targetUserId.trim() === '') {
      throw new Error("Target User ID is required");
    }
    if (userId === targetUserId) {
      throw new Error("Cannot check friendship status with yourself");
    }

    try {
      // Check both directions for friendship
      const friendship1 = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", userId))
        .filter((q) => q.eq(q.field("userId2"), targetUserId))
        .first();

      const friendship2 = await ctx.db
        .query("friendships")
        .withIndex("by_userId1", (q) => q.eq("userId1", targetUserId))
        .filter((q) => q.eq(q.field("userId2"), userId))
        .first();

      const friendship = friendship1 || friendship2;

      if (!friendship) {
        return { status: "none" as const };
      }

      // Check the status
      if (friendship.status === "accepted") {
        return { status: "friends" as const };
      } else if (friendship.status === "blocked") {
        return { status: "blocked" as const };
      } else if (friendship.status === "pending") {
        // Determine if the current user sent or received the request
        if (friendship.requestedBy === userId) {
          return { status: "pending_sent" as const };
        } else {
          return { status: "pending_received" as const };
        }
      }

      return { status: "none" as const };
    } catch (error) {
      console.error("Error checking friendship status:", error);
      throw new Error(`Failed to check friendship status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get friendship statistics for a user
 */
export const getFriendshipStats = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    totalFriends: v.number(),
    pendingRequestsSent: v.number(),
    pendingRequestsReceived: v.number(),
  }),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Validation
    if (!userId || userId.trim() === '') {
      throw new Error("User ID is required");
    }

    try {
      // Count accepted friendships
      const friendships1 = await ctx.db
        .query("friendships")
        .withIndex("by_user1_status", (q) => q.eq("userId1", userId).eq("status", "accepted"))
        .collect();

      const friendships2 = await ctx.db
        .query("friendships")
        .withIndex("by_user2_status", (q) => q.eq("userId2", userId).eq("status", "accepted"))
        .collect();

      const totalFriends = friendships1.length + friendships2.length;

      // Count pending requests sent
      const pendingRequestsSent = await ctx.db
        .query("friendships")
        .withIndex("by_requestedBy", (q) => q.eq("requestedBy", userId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      // Count pending requests received
      const pendingRequestsReceived = await ctx.db
        .query("friendships")
        .withIndex("by_userId2", (q) => q.eq("userId2", userId))
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();

      return {
        totalFriends,
        pendingRequestsSent: pendingRequestsSent.length,
        pendingRequestsReceived: pendingRequestsReceived.length,
      };
    } catch (error) {
      console.error("Error getting friendship stats:", error);
      throw new Error(`Failed to get friendship stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});