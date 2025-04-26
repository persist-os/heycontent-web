"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";
import crypto from 'crypto';

export const deleteByStringId = action({
  args: { keyIdStr: v.string() },
  handler: async (ctx, args) => {
    // First find the key in the database to get its ID
    const apiKeys = await ctx.runQuery(api.apiKeysQueries.listAll, {});
    
    // Find the key that matches the ID string representation
    // This is comparing a string version of the Convex _id with the provided string
    const apiKey = apiKeys.find((key: { _id: { toString: () => string } }) => key._id.toString() === args.keyIdStr);
    
    if (!apiKey) {
      // It's better to throw an error if the key isn't found
      throw new Error("API key not found"); 
    }
    
    // Now use the proper ID object to delete the key
    // Note: key_id parameter in the mutation refers to Convex's _id field
    const result = await ctx.runMutation(api.apiKeysMutations.delete_api_key, { key_id: apiKey._id });
    
    // Optional: Check result from mutation if needed
    if (!result.success) {
        console.error(`Failed to delete key ${args.keyIdStr}: ${result.message}`);
        // Decide how to handle mutation failure (e.g., throw error, return specific status)
        throw new Error(`Failed to delete API key: ${result.message}`);
    }

    return { success: true };
  }
});
