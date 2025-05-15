/**
 * Rate Limiting Implementation for Convex
 * 
 * This module provides a fallback rate limiting mechanism when Redis is unavailable.
 * It handles storing and retrieving rate limiting data with proper user_id linkage.
 */

import { query, mutation, httpAction } from "./_generated/server";
import { v } from "convex/values";
import { httpRouter } from "convex/server";
import { api } from "./_generated/api";

// Query to get rate limit data
export const getRateLimitData = query({
  args: { 
    id: v.string(), 
    window_start: v.number() 
  },
  handler: async (ctx, args) => {
    const { id, window_start } = args;
    
    // Parse the id which is expected to be in the format "ratelimit:user_id:resource"
    // This format is used by the Python backend
    let user_id: string, resource: string;
    
    if (id.startsWith("ratelimit:")) {
      const parts = id.split(":");
      if (parts.length >= 3) {
        // Format is "ratelimit:user_id:resource"
        user_id = parts[1];
        resource = parts.slice(2).join(":"); // Join the rest in case resource contains colons
      } else {
        // Fallback for backward compatibility
        user_id = id;
        resource = "default";
      }
    } else {
      // If the ratelimit: prefix is missing, use the id as user_id
      user_id = id;
      resource = "default";
    }
    
    // Look up the rate limit data in the rate_limits table
    const rateLimitData = await ctx.db
      .query("rate_limits")
      .withIndex("by_user_resource", q => 
        q.eq("user_id", user_id).eq("resource", resource)
      )
      .first();
    
    if (!rateLimitData) {
      return { timestamps: [] };
    }
    
    // Filter out timestamps that are outside the current window
    const validTimestamps = (rateLimitData.timestamps || [])
      .filter(timestamp => timestamp > window_start);
    
    return { timestamps: validTimestamps };
  },
});

// Mutation to store a rate limit request
export const storeRateLimitRequest = mutation({
  args: { 
    id: v.string(), 
    timestamp: v.number() 
  },
  handler: async (ctx, args) => {
    const { id, timestamp } = args;
    
    // Parse the id which is expected to be in the format "ratelimit:user_id:resource"
    // This format is used by the Python backend
    let user_id: string, resource: string;
    
    if (id.startsWith("ratelimit:")) {
      const parts = id.split(":");
      if (parts.length >= 3) {
        // Format is "ratelimit:user_id:resource"
        user_id = parts[1];
        resource = parts.slice(2).join(":"); // Join the rest in case resource contains colons
      } else {
        // Fallback for backward compatibility
        user_id = id;
        resource = "default";
      }
    } else {
      // If the ratelimit: prefix is missing, use the id as user_id
      user_id = id;
      resource = "default";
    }
    
    // Look up the existing rate limit data
    const existing = await ctx.db
      .query("rate_limits")
      .withIndex("by_user_resource", q => 
        q.eq("user_id", user_id).eq("resource", resource)
      )
      .first();
    
    if (existing) {
      // If record exists, append the new timestamp
      const timestamps = [...(existing.timestamps || []), timestamp];
      
      // Update the existing record
      await ctx.db.patch(existing._id, {
        timestamps: timestamps,
        lastUpdated: Math.floor(Date.now() / 1000)
      });
      
      return { updated: true, count: timestamps.length };
    } else {
      // Create a new record with user_id and resource fields
      const docId = await ctx.db.insert("rate_limits", {
        user_id,
        resource,
        timestamps: [timestamp],
        lastUpdated: Math.floor(Date.now() / 1000)
      });
      
      return { created: true, count: 1 };
    }
  },
});

// HTTP actions for rate limiting
const http = httpRouter();

// HTTP endpoint to fetch rate limit data
http.route({
  method: "POST",
  path: "/getRateLimitData", // Matches Python backend's CONVEX_RATE_LIMIT_GET_ENDPOINT
  handler: httpAction(async ({ runQuery }, request) => {
    try {
      const body = await request.json() as { id: string; window_start?: number };
      const { id, window_start } = body;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing rate limit key" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`Rate limit check for: ${id}, window: ${window_start || 'default'}`);
      
      // Get rate limit data - use the query defined in this file
      const rateLimitData = await runQuery(api.rateLimiting.getRateLimitData, { 
        id, 
        window_start: window_start || (Date.now() / 1000 - 900) // Default 15 min window
      });
      
      return new Response(
        JSON.stringify(rateLimitData),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Failed to get rate limit data:", error);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve rate limit data", timestamps: [] }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

// HTTP endpoint to store rate limit request
http.route({
  method: "POST",
  path: "/addRateLimitRequest", // Matches Python backend's CONVEX_RATE_LIMIT_ADD_ENDPOINT
  handler: httpAction(async ({ runMutation }, request) => {
    try {
      const body = await request.json() as { id: string; timestamp?: number; lastUpdated?: number };
      const { id, timestamp } = body; // lastUpdated is handled internally
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing rate limit key" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      console.log(`Adding rate limit request for: ${id}`);
      
      // Store the rate limit request - use the mutation defined in this file
      const result = await runMutation(api.rateLimiting.storeRateLimitRequest, { 
        id, 
        timestamp: timestamp || Math.floor(Date.now() / 1000)
      });
      
      return new Response(
        JSON.stringify({ success: true, result }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Failed to store rate limit request:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to store rate limit request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }),
});

export default http;
