import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async ({ db }, { email }) => {
    return await db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", email))
      .first();
  },
});

export const createUserInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
    username: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const now = Date.now();
    return await db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      userId: args.userId,
      username: args.username ?? '',
      referralCode: args.referralCode ?? '',
      referredBy: args.referredBy ?? '',
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateUserInternal = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async ({ db }, args) => {
    const existingUser = await db
      .query("users")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    return await db.patch(existingUser._id, {
      name: args.name,
      image: args.image,
      userId: args.userId,
    });
  },
});

// Migration function to clean up legacy project widgets
export const cleanLegacyProjectWidgets = internalMutation({
  args: {},
  handler: async ({ db }) => {
    const widgets = await db.query("project_widgets").collect();
    let cleaned = 0;
    
    for (const widget of widgets) {
      const now = Date.now();
      const needsUpdate = 
        widget.generated_at !== undefined ||
        widget.createdAt === undefined ||
        widget.updatedAt === undefined;
      
      if (needsUpdate) {
        // Remove legacy fields and ensure proper timestamps
        const cleanData: any = { ...widget };
        delete cleanData.generated_at;
        delete cleanData._id;
        delete cleanData._creationTime;
        
        // Ensure proper timestamps
        cleanData.createdAt = widget.createdAt ?? now;
        cleanData.updatedAt = now;
        
        await db.patch(widget._id, cleanData);
        cleaned++;
      }
    }
    
    return { cleaned, total: widgets.length };
  },
});
