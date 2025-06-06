import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from './_generated/dataModel';

// Mutation to add a person to the waitlist
export const add = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the email already exists in the waitlist
    const existingEntry = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existingEntry) {
      return {
        success: false,
        message: "Email already exists in the waitlist",
      };
    }
    
    // Add new entry to the waitlist
    const id = await ctx.db.insert("waitlist", {
      name: args.name,
      email: args.email,
      timestamp: Date.now(),
      status: "pending", // Default status
    });
    
    return {
      success: true,
      id,
      message: "Successfully added to the waitlist",
    };
  },
});

// Query to get all waitlist entries
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("waitlist").collect();
  },
});

// Query to get waitlist entries by status
export const getByStatus = query({
  args: {
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlist")
      .filter((q) => q.eq(q.field("status"), args.status))
      .collect();
  },
});

// Query to get a specific waitlist entry by email
export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Mutation to update waitlist entry status
export const updateStatus = mutation({
  args: {
    id: v.id("waitlist"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    
    // Check if the entry exists
    const existingEntry = await ctx.db.get(id);
    if (!existingEntry) {
      return {
        success: false,
        message: "Waitlist entry not found",
      };
    }
    
    // Update the status
    await ctx.db.patch(id, { status });
    
    return {
      success: true,
      message: "Status updated successfully",
    };
  },
});

// Query to get recent waitlist signups
export const getRecentSignups = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    const signups = await ctx.db
      .query("waitlist")
      .order("timestamp", "desc")
      .take(limit);
    
    return signups.map(signup => ({
      id: signup._id,
      name: signup.name,
      timestamp: signup.timestamp,
    }));
  },
});