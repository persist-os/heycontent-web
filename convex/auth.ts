import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Get user role and permissions
export const getUserRole = query({
  args: {
    userId: v.string(),
  },
  returns: v.object({
    role: v.union(
      v.literal("user"),
      v.literal("developer"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("ambassador"),
      v.literal("affiliate"),
      v.literal("partner")
    ),
    permissions: v.array(v.string()),
    email: v.string(),
    name: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (!user) {
      // Default to user role if not found
      return {
        role: "user" as const,
        permissions: [],
        email: "",
        name: "",
      };
    }

    return {
      role: user.role || "user",
      permissions: user.permissions || [],
      email: user.email,
      name: user.name,
    };
  },
});

// Check if user has specific permission
export const hasPermission = query({
  args: {
    userId: v.string(),
    permission: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userRole = await ctx.runQuery(api.auth.getUserRole, {
      userId: args.userId,
    });

    // Super admin has all permissions
    if (userRole.role === "super_admin") return true;

    // Admin has most permissions (except user role management)
    if (userRole.role === "admin") {
      const adminPermissions = [
        "feedback:read",
        "feedback:write", 
        "feedback:delete",
        "feedback:update",
        "analytics:read",
        "users:read", // Can view users but not modify roles
      ];
      return adminPermissions.includes(args.permission);
    }

    // Regular users have limited permissions
    if (userRole.role === "user") {
      const userPermissions = [
        "feedback:create",
        "profile:read",
        "profile:update",
      ];
      return userPermissions.includes(args.permission);
    }

    return false;
  },
});

// Check if user can access admin features
export const canAccessAdmin = query({
  args: {
    userId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const userRole = await ctx.runQuery(api.auth.getUserRole, {
      userId: args.userId,
    });

    return ["admin", "super_admin"].includes(userRole.role);
  },
});

// Update user role (admin only)
export const updateUserRole = mutation({
  args: {
    targetUserId: v.string(), // This can be either Firebase UID or Convex ID
    newRole: v.union(
      v.literal("user"),
      v.literal("developer"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("ambassador"),
      v.literal("affiliate"),
      v.literal("partner")
    ),
    adminUserId: v.string(), // The admin making the change
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    // Check if the admin user has permission to change roles
    const adminRole = await ctx.runQuery(api.auth.getUserRole, {
      userId: args.adminUserId,
    });

    if (adminRole.role !== "super_admin") {
      throw new Error("Only super admins can change user roles");
    }

    // Try to find user by Firebase UID first
    let user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    // If not found by UID, try to find by Convex ID
    if (!user) {
      try {
        user = await ctx.db.get(args.targetUserId as any);
      } catch (error) {
        // Ignore error, user will be null
      }
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Update the user's role
    await ctx.db.patch(user._id, {
      role: args.newRole,
      updatedAt: Date.now(),
    });

    return true;
  },
});

// Get all users with their roles (admin only)
export const getUsersWithRoles = query({
  args: {
    adminUserId: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("developer"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("ambassador"),
      v.literal("affiliate"),
      v.literal("partner")
    ),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    // Check if the requesting user is an admin
    const adminRole = await ctx.runQuery(api.auth.getUserRole, {
      userId: args.adminUserId,
    });

    if (!["admin", "super_admin"].includes(adminRole.role)) {
      throw new Error("Only admins can view user roles");
    }

    const users = await ctx.db.query("users").collect();
    
    return users.filter(user => user.name && user.email).map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || "user",
      createdAt: user.createdAt,
    }));
  },
}); 