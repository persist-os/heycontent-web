# HeyContext Convex Integration Rules

This document defines how to use Convex effectively within HeyContext's private AI workspace, ensuring optimal performance, privacy, and user experience.

---

## Core Principles

### Privacy-First Database Design

HeyContext's Convex integration must prioritize user privacy and data security:

- **User Data Isolation**: Strict separation between users' private data
- **Minimal Data Storage**: Store only what's necessary for functionality
- **Secure Access Patterns**: Implement proper authentication and authorization
- **Privacy-Preserving Queries**: Design queries that don't expose user data

### Personal Workspace Focus

All Convex schemas and functions should support HeyContext's mission as a private thinking space:

- **Individual Use**: Design for single-user, private interactions
- **Memory and Context**: Support continuity across user sessions
- **Personal Organization**: Enable flexible, user-defined organization systems
- **Thought Processing**: Support various ways people think and organize ideas

---

## Database Schema Guidelines

### User Data Models

#### Personal Notes Schema
```typescript
// Example: Personal notes for private thinking
export default defineSchema({
  notes: defineTable({
    userId: v.string(),           // User identifier
    title: v.string(),            // Note title
    content: v.string(),          // Note content (markdown)
    type: v.union(                // Personal organization types
      v.literal("ideas"),
      v.literal("writing"), 
      v.literal("people"),
      v.literal("insights"),
      v.literal("reflection"),
      v.literal("tasks"),
      v.literal("messages")
    ),
    tags: v.array(v.string()),    // Personal tags
    important: v.boolean(),       // Personal priority
    private: v.boolean(),         // Privacy flag (always true)
  }).index("by_user", ["userId"])
   .index("by_user_and_type", ["userId", "type"])
   .index("by_user_important", ["userId", "important"]),
});
```

#### Conversation History Schema
```typescript
// Example: Private AI conversation history
conversations: defineTable({
  userId: v.string(),
  sessionId: v.string(),
  messages: v.array(v.object({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    timestamp: v.number(),
  })),
  context: v.optional(v.string()), // Personal context
  private: v.boolean(),            // Always true
}).index("by_user", ["userId"])
 .index("by_user_session", ["userId", "sessionId"]),
```

### Privacy-First Indexing

#### Required Indexes for Privacy

**Always include user isolation:**
```typescript
// Every table with user data must have user-based indexes
.index("by_user", ["userId"])
.index("by_user_and_date", ["userId", "_creationTime"])
```

**Personal organization indexes:**
```typescript
// Support personal categorization and filtering
.index("by_user_and_type", ["userId", "type"])
.index("by_user_and_tags", ["userId", "tags"])
.index("by_user_important", ["userId", "important"])
```

---

## Query Patterns

### User Data Isolation

#### Always Filter by User
```typescript
// Correct: Always include user filtering
export const getUserNotes = query({
  args: { userId: v.string() },
  returns: v.array(v.object({...})),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Incorrect: Never query without user filtering
export const getAllNotes = query({
  // This would expose all users' private data
  handler: async (ctx) => {
    return await ctx.db.query("notes").collect(); // NEVER DO THIS
  },
});
```

#### Personal Organization Queries
```typescript
// Support personal filtering and organization
export const getPersonalNotesByType = query({
  args: { 
    userId: v.string(), 
    noteType: v.string() 
  },
  returns: v.array(v.object({...})),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user_and_type", (q) => 
        q.eq("userId", args.userId).eq("type", args.noteType))
      .order("desc") // Most recent first
      .collect();
  },
});
```

### Memory and Context Queries

#### Conversation Continuity
```typescript
// Support continuing conversations with context
export const getConversationHistory = query({
  args: { 
    userId: v.string(), 
    sessionId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({...})),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("conversations")
      .withIndex("by_user_session", (q) => 
        q.eq("userId", args.userId).eq("sessionId", args.sessionId))
      .order("desc")
      .take(limit);
  },
});
```

#### Personal Context Search
```typescript
// Help users find their own thoughts and ideas
export const searchPersonalContent = query({
  args: { 
    userId: v.string(), 
    searchTerm: v.string() 
  },
  returns: v.array(v.object({...})),
  handler: async (ctx, args) => {
    // Use full-text search within user's private data
    return await ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.searchTerm)
         .eq("userId", args.userId))
      .take(20);
  },
});
```

---

## Mutation Patterns

### Personal Data Operations

#### Private Note Creation
```typescript
export const createPersonalNote = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    type: v.string(),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: args.title,
      content: args.content,
      type: args.type,
      tags: [],
      important: false,
      private: true, // Always private
    });
  },
});
```

#### Safe Personal Updates
```typescript
export const updatePersonalNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
    updates: v.object({
      title: v.optional(v.string()),
      content: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      important: v.optional(v.boolean()),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    
    // Verify user owns this note
    if (!note || note.userId !== args.userId) {
      throw new Error("Note not found or access denied");
    }
    
    await ctx.db.patch(args.noteId, args.updates);
    return null;
  },
});
```

### Privacy-Safe Deletions

#### User Data Cleanup
```typescript
export const deletePersonalNote = mutation({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    
    // Verify user owns this note
    if (!note || note.userId !== args.userId) {
      throw new Error("Note not found or access denied");
    }
    
    await ctx.db.delete(args.noteId);
    return null;
  },
});
```

---

## Action Patterns for AI Integration

### Private AI Processing

#### Personal AI Assistance
```typescript
export const generatePersonalInsights = action({
  args: {
    userId: v.string(),
    content: v.string(),
    context: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Verify user authentication
    const user = await ctx.runQuery(api.users.getUser, { 
      userId: args.userId 
    });
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Process with AI while maintaining privacy
    // (Implementation would call AI service with privacy protections)
    const insights = await generatePrivateInsights(args.content, args.context);
    
    return insights;
  },
});
```

### Secure External Integrations

#### Privacy-Preserving External Calls
```typescript
export const processWithExternalAI = action({
  args: {
    userId: v.string(),
    content: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    // Strip identifying information
    const anonymizedContent = stripPersonalInfo(args.content);
    
    // Make external call with minimal data
    const result = await callExternalAI(anonymizedContent);
    
    // Don't store external processing results
    return result;
  },
});
```

---

## Performance Optimization

### Efficient Personal Queries

#### Pagination for Personal Content
```typescript
export const getPersonalNotesPaginated = query({
  args: { 
    userId: v.string(),
    paginationOpts: paginationOptsValidator 
  },
  returns: v.object({
    page: v.array(v.object({...})),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});
```

#### Optimized Personal Search
```typescript
export const searchPersonalNotesOptimized = query({
  args: {
    userId: v.string(),
    query: v.string(),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({...})),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    let searchQuery = ctx.db
      .query("notes")
      .withSearchIndex("search_content", (q) =>
        q.search("content", args.query)
         .eq("userId", args.userId));
    
    // Add type filter if specified
    if (args.type) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("type"), args.type));
    }
    
    return await searchQuery.take(limit);
  },
});
```

---

## Security Best Practices

### Authentication Integration

#### Secure User Identification
```typescript
// Example helper for secure user identification
export const getCurrentUser = internalQuery({
  args: { authToken: v.string() },
  returns: v.union(v.object({ userId: v.string() }), v.null()),
  handler: async (ctx, args) => {
    // Verify auth token and return user info
    // Implementation depends on auth system
    return await verifyAuthToken(args.authToken);
  },
});
```

#### Protected Function Wrapper
```typescript
// Wrapper to ensure user authentication
async function withAuth<T>(
  ctx: any,
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  const user = await ctx.runQuery(internal.auth.getCurrentUser, { 
    authToken: userId // In practice, this would be a proper auth token
  });
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  return await operation();
}
```

### Data Validation

#### Input Sanitization
```typescript
export const createSafePersonalNote = mutation({
  args: {
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("ideas"),
      v.literal("writing"),
      v.literal("people"),
      v.literal("insights"),
      v.literal("reflection"),
      v.literal("tasks"),
      v.literal("messages")
    ),
  },
  returns: v.id("notes"),
  handler: async (ctx, args) => {
    // Validate and sanitize inputs
    const sanitizedTitle = sanitizeText(args.title);
    const sanitizedContent = sanitizeText(args.content);
    
    return await ctx.db.insert("notes", {
      userId: args.userId,
      title: sanitizedTitle,
      content: sanitizedContent,
      type: args.type,
      tags: [],
      important: false,
      private: true,
    });
  },
});
```

---

## Development Guidelines

### Code Organization

#### Function Naming Conventions
```typescript
// Use descriptive names that reflect privacy and personal use
getUserPersonalNotes()     // Good: Clear about privacy scope
getAllNotes()             // Bad: Implies cross-user access
createPrivateNote()       // Good: Explicit about privacy
createNote()              // Bad: Ambiguous about privacy
```

#### File Organization
```
convex/
├── notes.ts              // Personal notes functionality
├── conversations.ts      // Private AI conversations
├── auth.ts              // User authentication helpers
├── personal/            // Personal workspace features
│   ├── insights.ts      // Personal AI insights
│   ├── organization.ts  // Personal organization tools
│   └── memory.ts        // Context and memory features
└── internal/            // Internal-only functions
    ├── ai.ts            // AI processing helpers
    └── privacy.ts       // Privacy utility functions
```

### Testing Patterns

#### Privacy Testing
```typescript
// Test that user data isolation works
test("user data isolation", async () => {
  const user1Notes = await getUserNotes({ userId: "user1" });
  const user2Notes = await getUserNotes({ userId: "user2" });
  
  // Verify no cross-contamination
  expect(user1Notes.every(note => note.userId === "user1")).toBe(true);
  expect(user2Notes.every(note => note.userId === "user2")).toBe(true);
});
```

---

## Remember

Every Convex function should reinforce HeyContext's core values:
- **Privacy**: User data never leaks between users
- **Personal**: Features support individual thinking and organization
- **Memory**: Context and continuity are preserved
- **Human-Friendly**: Database design supports natural user workflows

When designing new Convex functions, always ask:
1. Does this protect user privacy completely?
2. Does this support personal, private thinking?
3. Does this help maintain context and memory?
4. Is this accessible to non-technical users?

If any answer is no, redesign the function to align with HeyContext's mission.
