"use node";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { jobTypeValidator, jobStatusValidator, jobPriorityValidator } from "./types/backgroundJobs";

export default defineSchema({
  // User Info
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
    username: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    // Role-based access control
    role: v.optional(v.union(
      v.literal("user"),
      v.literal("developer"),
      v.literal("admin"),
      v.literal("super_admin"),
      v.literal("ambassador"),
      v.literal("affiliate"),
      v.literal("partner")
    )),
    permissions: v.optional(v.array(v.string())),
    // Stripe integration
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    // Subscription state
    subscription: v.optional(v.object({
      status: v.union(
        v.literal("active"),
        v.literal("past_due"),
        v.literal("canceled"),
        v.literal("unpaid"),
        v.literal("dev"),
        v.literal("tester"),
        v.literal("incomplete"),
        v.literal("incomplete_expired"),
        v.literal("trialing"),
        v.literal("paused"),
        v.literal("deleted"),
        v.literal("unknown"),
      ),
      // Plan type with interval
      plan: v.union(
        v.literal("monthly_basic"),
        v.literal("monthly_pro"),
        v.literal("yearly_basic"),
        v.literal("yearly_pro"),
        v.literal("monthly_free")
      ),
      priceId: v.string(),
      meteredPriceId: v.optional(v.string()),
      currentPeriodStart: v.number(),
      currentPeriodEnd: v.number(),
      cancelAtPeriodEnd: v.boolean(),
      includedRequests: v.number(),
      usedRequests: v.number(),
      subscriptionItemId: v.optional(v.string()),
      lastSyncedAt: v.optional(v.number()),
      canceledAt: v.optional(v.number()),
      interval: v.optional(v.union(v.literal("month"), v.literal("year"))),
      cancel_at: v.optional(v.number()),
      customer: v.optional(v.string()),
      items: v.optional(v.any()),
      quantity: v.optional(v.number()),
      start_date: v.optional(v.number()),
      monthlyLimit: v.optional(v.number()),
      ubpEnabled: v.optional(v.boolean()),
    })),
    paymentMethod: v.optional(v.object({
      brand: v.string(),
      last4: v.string(),
      expMonth: v.number(),
      expYear: v.number()
    })),
    // Email preferences
    emailUnsubscribed: v.optional(v.boolean()),
    // Referral statistics
    referralStats: v.optional(v.object({
      totalReferred: v.number(),
      firstReferralDate: v.optional(v.number()),
      lastReferralDate: v.optional(v.number())
    })),
    // ⚠️ DEPRECATED: Gmail integration removed - use crystal system for insights
  })
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_stripeCustomerId", ["stripeCustomerId"])
  .index("by_username", ["username"])
  .index("by_referralCode", ["referralCode"])
  .index("by_role", ["role"]),

  // Ambient Insights
  ambientInsights: defineTable({
    userId: v.string(),
    data: v.array(v.object({
      title: v.string(),
      content: v.string(),
      category: v.string(),
      recommendation: v.string(),
    })),
    greetings: v.optional(v.array(v.string())),
    customCommandPrompts: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      category: v.string(),
      noteType: v.optional(v.string()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"]),



  // Chat conversations - Simplified after messages migration
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    
    // 🔄 DUAL-WRITE MIGRATION: messages array kept during migration
    // Will be removed after migration complete
    messages: v.optional(v.array(v.object({
      content: v.string(),
      role: v.string(),
      timestamp: v.optional(v.number()),
      context: v.optional(v.string()),
      fileAttachments: v.optional(v.array(v.object({
        file_url: v.string(),
        original_filename: v.string(),
        content_type: v.string(),
        file_size: v.number(),
        gcs_url: v.string(),
        uploaded_at: v.string(),
      }))),
      enrichment_metadata: v.optional(v.any()),
    }))),
    
    // Message statistics (denormalized for performance)
    messageCount: v.optional(v.number()),  // Optional during migration, will be required after
    lastMessageAt: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
    starred: v.boolean(),
    
    // Project & Widget Context - Links conversations to their originating context
    projectId: v.optional(v.id("projects")),
    widgetId: v.optional(v.union(v.string(), v.id("widgets"))),
    widgetOutputId: v.optional(v.string()),
    
    // Conversation type/source for filtering and UI
    conversationType: v.optional(v.union(
      v.literal("general"),
      v.literal("widget_prompt"),
      v.literal("project_scoped"),
      v.literal("discovery")
    )),
    
    // 🔄 MIGRATION TRACKING: Temporary fields for migration
    migrated: v.optional(v.boolean()),  // Track migration status
    migrationVerified: v.optional(v.boolean()),  // Verify data integrity
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_user_project", ["userId", "projectId"])
  .index("by_user_widget", ["userId", "widgetId"])
  .index("by_widget_output", ["widgetOutputId"])
  .index("by_project", ["projectId"])
  .index("by_type", ["conversationType"]),

  // Chat messages - Individual message entries (NEW)
  messages: defineTable({
    // Foreign Keys & User Context
    conversationId: v.id("conversations"),
    userId: v.string(),
    
    // Core Message Data
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    
    // Ordering & Timing
    sequence: v.number(),  // Explicit ordering within conversation (0, 1, 2, ...)
    timestamp: v.number(),  // Message creation time (required)
    
    // Optional Hidden Context
    context: v.optional(v.string()),
    
    // File Attachments - Metadata only, actual files in GCS
    fileAttachments: v.optional(v.array(v.object({
      file_url: v.string(),
      original_filename: v.string(),
      content_type: v.string(),
      file_size: v.number(),
      gcs_url: v.string(),
      uploaded_at: v.string(),
    }))),
    
    // Context Enrichment MAB Metadata
    enrichment_metadata: v.optional(v.any()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Future Extensions (for gradual rollout)
    editedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),  // Soft delete
  })
  .index("by_conversation", ["conversationId", "sequence"])  // Primary access pattern
  .index("by_conversation_role", ["conversationId", "role"])
  .index("by_user", ["userId", "createdAt"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // Notes
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    important: v.optional(v.boolean()),
    platform: v.optional(v.string()),
    references: v.optional(v.array(v.string())),
    type: v.optional(v.union(
      v.literal("idea_bank"),
      v.literal("content_script"),
      v.literal("collaboration_note"),
      v.literal("analytics_insight"),
      v.literal("reflection_journal"),
      v.literal("task_checklist"),
      v.literal("email_draft"),
      v.literal("idea") // Legacy type for existing notes
    )),
    tags: v.array(v.string()),
    analysis: v.optional(v.string()),
    images: v.optional(v.array(v.object({
      url: v.string(),
      filename: v.string(),
      originalFilename: v.optional(v.string()),
      uploadedAt: v.number(),
      size: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      width: v.optional(v.number()),
      height: v.optional(v.number())
    }))),
    sourceConversationId: v.optional(v.string()),
    folderId: v.optional(v.id("folders")), // Reference to parent folder
    createdAt: v.number(),
    updatedAt: v.number(),
    titleGenerated: v.optional(v.boolean()),
    typeGenerated: v.optional(v.boolean()),
    
    // Widget linkage
    widgetId: v.optional(v.union(v.string(), v.id("widgets"))),  // 🔄 Migration: supports both legacy string and Convex ID
    isWidgetOutput: v.optional(v.boolean()),
    projectId: v.optional(v.id("projects")),
    widgetOutputId: v.optional(v.string()), // Links to specific widget output
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_type", ["type"])
  .index("by_folder", ["folderId"])
  .index("by_widget", ["widgetId"])
  .index("by_widget_output", ["widgetOutputId"]),

  // Folders
  folders: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    parentFolderId: v.optional(v.id("folders")), // For nested folders
    color: v.optional(v.string()), // Optional color for visual organization
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_parent", ["parentFolderId"])
  .index("by_user_parent", ["userId", "parentFolderId"])
  .index("by_creation", ["createdAt"]),

  // Shared Notes - for collaborative note access
  shared_notes: defineTable({
    noteId: v.id("notes"),
    ownerId: v.string(), // Original note owner
    sharedWithUserId: v.string(), // User who has access
    permission: v.union(
      v.literal("read"),
      v.literal("edit")
    ),
    sharedAt: v.number(),
    sharedBy: v.string(), // Who shared it (could be owner or another editor)
    isActive: v.boolean(), // for soft deletion
  })
  .index("by_note", ["noteId"])
  .index("by_shared_user", ["sharedWithUserId"])
  .index("by_owner", ["ownerId"])
  .index("by_note_user", ["noteId", "sharedWithUserId"]),

  // Projects
  // ============================================================================
  // PROJECT CONTENT MANAGEMENT SYSTEM
  // ============================================================================
  // Projects serve as containers for all user-generated content including notes,
  // conversations, crystals, and shards. The content ID arrays enable efficient
  // batch fetching and filtering for the Project Content Display feature.
  // 
  // Content Relationships:
  // - noteIds: Array of note document IDs attached to this project
  // - conversationIds: Array of conversation document IDs attached to this project  
  // - crystalIds: Array of crystal_id strings (not Convex IDs) attached to this project
  // - shardIds: Array of crystal_shards document IDs attached to this project
  // - analysisIds: Array of analysis document IDs (legacy, may be deprecated)
  //
  // Indexing Strategy:
  // - by_user: Primary access pattern for user's projects
  // - by_fingerprint: Links projects to their AI intelligence fingerprints
  // - by_creation: Chronological ordering for project lists
  // ============================================================================
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    
    // Content ID Arrays - Enable efficient batch content fetching
    noteIds: v.optional(v.array(v.string())),           // Note document IDs
    conversationIds: v.optional(v.array(v.string())),   // Conversation document IDs  
    analysisIds: v.optional(v.array(v.string())),       // Analysis document IDs (legacy)
    crystalIds: v.optional(v.array(v.string())),        // Crystal ID strings (not Convex IDs)
    shardIds: v.optional(v.array(v.string())),          // Crystal shard document IDs
    
        // AI Intelligence Integration
        fingerprintId: v.optional(v.id("project_fingerprints")), // Links to project fingerprint
        
        // Constellation Layout Cache (recalculated manually)
        constellationLayout: v.optional(v.object({
          version: v.number(), // Layout algorithm version
          calculatedAt: v.number(),
          items: v.array(v.object({
            itemId: v.string(),
            itemType: v.union(
              v.literal("widget"),
              v.literal("note"), 
              v.literal("conversation"),
              v.literal("crystal"),
              v.literal("shard")
            ),
            x: v.number(),
            y: v.number(),
            size: v.string(),
            importance: v.number(),
          })),
          canvasWidth: v.number(),
          canvasHeight: v.number(),
        })),
        
        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    
    // ⚠️ DEPRECATED: Social media integrations removed - use crystal system for content insights
  })
  .index("by_user", ["userId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_creation", ["createdAt"]),

  // API Keys
  api_keys: defineTable({
    user_id: v.string(),
    hashed_key: v.string(),
    created_at: v.number(),
    clientType: v.union(
      v.literal("web"),
      v.literal("extension")
    ),
    rate_tier: v.optional(v.string()),
    scopes: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  }),

  // Rate Limits
  rate_limits: defineTable({
    user_id: v.string(),
    resource: v.string(),
    timestamps: v.array(v.number()),
    lastUpdated: v.number(),
  })
  .index("by_user_resource", ["user_id", "resource"]),


  // Usage Events
  usageEvents: defineTable({
    userId: v.string(),
    timestamp: v.number(),
    model: v.string(),
    status: v.string(),
    qty: v.number(),
    endpoint: v.optional(v.string()),
    method: v.optional(v.string()),
    path: v.optional(v.string()),
    statusCode: v.optional(v.number()),
    userAgent: v.optional(v.string()),
    ip: v.optional(v.string()),
    requestId: v.optional(v.string()),
  })
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_endpoint", ["endpoint"])
  .index("by_status", ["status"]),



  // Vector embeddings for search
  contentEmbeddings: defineTable({
    userId: v.string(),
    contentId: v.string(), // ID of the original content (conversation, post, etc.)
    contentType: v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    ),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.optional(v.any()), // Optional metadata for additional context
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_contentType", ["contentType"])
  .index("by_user_type", ["userId", "contentType"])
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768, // text-embedding-004 dimension
    filterFields: ["userId", "contentType"],
  }),





  // Embedding update tracking
  embeddingUpdates: defineTable({
    userId: v.string(),
    updatedAt: v.number(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("platform_connection"),
      v.literal("content_update")
    ),
    platform: v.optional(v.union(
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  })
  .index("by_userId", ["userId"])
  .index("by_updatedAt", ["updatedAt"])
  .index("by_type", ["type"])
  .index("by_user_type", ["userId", "type"]),

  // Automatic embedding queue for reliable processing
  embeddingQueue: defineTable({
    userId: v.string(),
    contentId: v.string(), // Standardized format: platform:actualId
    platform: v.union(
      v.literal("notes"),
      v.literal("conversations")
    ),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted")
    ),
    priority: v.union(
      v.literal("high"),    // User-triggered actions
      v.literal("normal"),  // Regular content changes
      v.literal("low")      // Batch operations
    ),
    retryCount: v.optional(v.number()), // Made optional temporarily for migration
    maxRetries: v.optional(v.number()), // Made optional temporarily for migration
    createdAt: v.number(),
    lastAttemptAt: v.optional(v.number()),
    processedAt: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    // Legacy fields for migration compatibility
    attempts: v.optional(v.number()),
    lastError: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    updatedAt: v.optional(v.number())
  })
  .index("by_userId", ["userId"])
  .index("by_platform", ["platform"])
  .index("by_priority", ["priority"])
  .index("by_createdAt", ["createdAt"])
  .index("by_processedAt", ["processedAt"])
  .index("by_user_platform", ["userId", "platform"]),

  // Embedding sync tracking for self-healing
  embeddingSyncs: defineTable({
    userId: v.string(),
    syncType: v.optional(v.union(
      v.literal("login"),
      v.literal("manual"),
      v.literal("scheduled")
    )),
    status: v.optional(v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    )),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    platformsProcessed: v.optional(v.array(v.string())),
    itemsQueued: v.optional(v.number()), // Added back - needed by the sync logic
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    // Legacy fields for migration compatibility
    createdAt: v.optional(v.number()),
    syncedAt: v.optional(v.number()),
    results: v.optional(v.any())
  })
  .index("by_userId", ["userId"])
  .index("by_syncType", ["syncType"])
  .index("by_status", ["status"])
  .index("by_startedAt", ["startedAt"])
  .index("by_user_status", ["userId", "status"]),

  // Feedback System
  feedback: defineTable({
    type: v.string(), // "bug", "feature_request", "general", "praise"
    title: v.string(),
    description: v.string(),
    userEmail: v.string(),
    userName: v.string(),
    page: v.string(),
    userAgent: v.string(),
    timestamp: v.number(),
    userId: v.optional(v.string()), // Firebase user ID
    status: v.string(), // "new", "in_progress", "resolved", "closed"
    priority: v.string(), // "low", "medium", "high", "urgent"
    assignedTo: v.optional(v.string()),
    tags: v.array(v.string()),
    screenshots: v.array(v.object({
      name: v.string(),
      size: v.number(),
      type: v.string(),
      url: v.optional(v.string()) // If we store files in Convex storage
    })),
    discordMessageId: v.optional(v.string()), // To link back to Discord
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_user", ["userId"])
  .index("by_created", ["createdAt"])
  .index("by_priority", ["priority"])
  .index("by_assigned", ["assignedTo"])
  .index("by_user_status", ["userId", "status"])
  .index("by_type_status", ["type", "status"]),

  // Referrals tracking
  referrals: defineTable({
    referrerId: v.id("users"),
    referredUsers: v.array(v.object({
      userId: v.id("users"),
      referralCode: v.string(),
      referredAt: v.number(),
    })),
    totalReferred: v.number(),
    firstReferralDate: v.optional(v.number()),
    lastReferralDate: v.optional(v.number()),
  })
  .index("by_referrer", ["referrerId"])
  .index("by_total_referred", ["totalReferred"]),

  // Project Fingerprints - Universal AI project intelligence
  project_fingerprints: defineTable({
    // Core Identity
    projectId: v.id("projects"),
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    discoveryConversationId: v.optional(v.id("conversations")), // Link to discovery chat

    // AI-Discovered Project Nature (flattened for AI searchability)
    domain: v.optional(v.any()), // "academic", "creative", "business", "skill_development"
    complexity_level: v.optional(v.number()), // 1-10 scale
    collaboration_style: v.optional(v.any()), // "solo", "small_team", "large_group", "community"
    time_horizon: v.optional(v.any()), // "sprint", "project", "journey", "lifestyle"

    // AI-Generated Project Archetype (flattened)
    primary_pattern: v.optional(v.any()), // "iterative_creator", "systematic_builder", "exploratory_learner"
    working_style: v.optional(v.any()), // Array of working style preferences
    decision_making: v.optional(v.any()), // How user approaches choices
    energy_patterns: v.optional(v.any()), // When/how user works best

    // Intentions (User + AI refined)
    core_intention: v.optional(v.any()), // The deep "why"
    success_vision: v.optional(v.any()), // What success looks/feels like
    value_creation: v.optional(v.any()), // What this creates for user/world
    personal_growth: v.optional(v.any()), // How user wants to evolve through this

    // Dynamic Timeline (AI suggests, user refines)
    natural_rhythm: v.optional(v.any()), // "daily", "weekly", "monthly", "seasonal", "milestone_driven"
    key_phases: v.optional(v.any()),
    flexibility_preference: v.optional(v.any()), // "structured", "adaptive", "emergent"

    // Output Desires (AI helps articulate)
    tangible_deliverables: v.optional(v.any()),
    intangible_benefits: v.optional(v.any()),
    measurement_approach: v.optional(v.any()), // How user wants to track progress
    sharing_intention: v.optional(v.any()), // "private", "selective", "public", "community"

    // Interface Preferences (AI learns from behavior)
    cognitive_load_preference: v.optional(v.any()), // "minimal", "rich", "customizable"
    information_density: v.optional(v.any()), // "focused", "contextual", "comprehensive"
    motivation_style: v.optional(v.any()), // What keeps user engaged
    feedback_frequency: v.optional(v.any()), // How often user wants check-ins

    // Evolution Intelligence
    learning_sensitivity: v.optional(v.number()), // How quickly to adapt (1-10)
    change_triggers: v.optional(v.any()),
    stability_zones: v.optional(v.any()), // What should rarely change
    growth_edges: v.optional(v.any()), // What should evolve actively

    // AI Agent Coordination
    morning_persona: v.optional(v.any()),
    evening_persona: v.optional(v.any()),
    event_triggers: v.optional(v.any()),

    // AI Prompt Generation
    base_personality: v.optional(v.any()), // Derived from user persona
    project_voice: v.optional(v.any()), // How AI should talk about THIS project
    question_generation_style: v.optional(v.any()),
    suggestion_approach: v.optional(v.any()),
    clarification_method: v.optional(v.any()),

    // Dynamic Intelligence Fields (AI-generated based on project)
    dynamic_dimensions: v.optional(v.any()),

    // Contextual Awareness
    user_constraints: v.optional(v.any()), // Time, resources, skills
    external_dependencies: v.optional(v.any()),
    support_systems: v.optional(v.any()),
    potential_obstacles: v.optional(v.any()),

    // Metadata
    created_at: v.number(),
    last_evolution: v.optional(v.number()),
    intelligence_version: v.optional(v.string()),
    status: v.optional(v.string()), // "discovering", "active", "evolving", "completing", "archived"
  })
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_domain", ["domain"])
  .index("by_status", ["status"])
  .index("by_creation", ["created_at"])
  .index("by_evolution", ["last_evolution"]),

  // Fingerprint Evolution History - Separate table for AI access and querying
  fingerprint_evolution_history: defineTable({
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    projectId: v.id("projects"),

    // Evolution details
    timestamp: v.number(),
    evolution_trigger: v.string(), // "morning_update", "evening_update", "data_change", "user_edit", "milestone_reached"

    // What changed (flattened for AI searchability)
    changes_made: v.record(v.string(), v.any()), // Key-value pairs of what changed
    reasoning: v.string(), // AI reasoning for the evolution
    confidence_score: v.number(), // 0-1 confidence in the evolution

    // User response to evolution
    user_response: v.optional(v.string()), // "accepted", "modified", "rejected"
    user_feedback: v.optional(v.string()), // Any user comments on the evolution

    // Learning captured for future evolutions
    learning_captured: v.string(), // What AI learned from this evolution

    // Context of evolution
    trigger_context: v.optional(v.record(v.string(), v.any())), // Additional context about what triggered the evolution
    evolution_metrics: v.optional(v.record(v.string(), v.number())), // Metrics about the evolution process

    // Metadata
    processing_time_ms: v.optional(v.number()),
    ai_model_version: v.optional(v.string()),
  })
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_trigger", ["evolution_trigger"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // Project Widgets - Personalized widgets for each project (aligned with backend models)
  // ============================================================================
  // WIDGETS - Individual widget documents (REDESIGNED for Convex best practices)
  // Each widget gets its own Convex ID for optimal queries and updates
  // ============================================================================
  widgets: defineTable({
    // Foreign keys - establish relationships
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),
    
    // Widget identity
    widget_id: v.string(), // Legacy string ID for backward compatibility
    widget_type: v.string(), // Any widget type (flexible)
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    
    // Layout and appearance
    priority: v.number(),
    size: v.string(), // Any size (flexible)
    theme: v.string(), // Any theme (flexible)
    position: v.number(),
    
    // Configuration
    config: v.any(),
    data_sources: v.array(v.string()),
    update_frequency: v.string(), // Any frequency (flexible)
    
    // Permissions
    interactive: v.boolean(),
    editable: v.boolean(),
    shareable: v.boolean(),
    
    // Execution tracking
    lastRunAt: v.optional(v.number()),
    lastRunStatus: v.optional(v.union(
      v.literal("idle"),
      v.literal("running"),
      v.literal("success"),
      v.literal("failed")
    )),
    
    // Metadata
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_category", ["projectId", "category"])
  .index("by_status", ["projectId", "status"])
  .index("by_widget_id", ["projectId", "widget_id"]) // For legacy lookups
  .index("by_created", ["createdAt"]),

  // ============================================================================
  // PROJECT WIDGET LAYOUTS - Layout configuration and categories
  // Stores global layout settings, no individual widget data
  // ============================================================================
  project_widgets: defineTable({
    // Foreign keys
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),

    // Widget categories for organization
    categories: v.array(v.object({
      name: v.string(),
      icon: v.optional(v.string()),
      description: v.optional(v.string()),
      display_order: v.optional(v.number()),
    })),

    // Global layout settings
    layout_type: v.string(), // Any layout type (flexible)
    columns: v.number(),
    rows: v.number(),

    // Global appearance
    global_theme: v.string(), // Any theme (flexible)
    color_scheme: v.string(), // Any color scheme (flexible)
    font_style: v.string(), // Any font style (flexible)

    // Customization settings
    allow_customization: v.boolean(),
    allow_reordering: v.boolean(),
    allow_resizing: v.boolean(),

    // Technical settings
    required_integrations: v.array(v.string()),
    data_refresh_strategy: v.string(), // Any strategy (flexible)

    // Metadata
    version: v.string(),
    confidence: v.number(), // 0-1
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Legacy AI field (for migration)
    generated_at: v.optional(v.union(v.string(), v.number())),
    
    // ⚠️ LEGACY MIGRATION FIELD - Will be removed after migration
    // Old format stored widgets as array in this document
    // Migration script will move these to individual widget documents
    widgets: v.optional(v.array(v.object({
      widget_id: v.string(),
      widget_type: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      category: v.string(),
      priority: v.number(),
      size: v.string(),
      theme: v.string(),
      position: v.number(),
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(),
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
      lastRunAt: v.optional(v.number()),
      lastRunStatus: v.optional(v.union(
        v.literal("idle"),
        v.literal("running"),
        v.literal("success"),
        v.literal("failed")
      )),
    }))),
  })
  .index("by_project", ["projectId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]),

  // Widget Outputs - Generated deliverables from widget execution
  widget_outputs: defineTable({
    outputId: v.string(),
    widgetId: v.union(v.string(), v.id("widgets")),  // 🔄 Migration: supports both legacy string and Convex ID
    projectId: v.id("projects"),
    userId: v.string(),
    
    // Content
    noteId: v.string(),  // Reference to created note
    openingMessage: v.optional(v.string()),  // AI's first conversational message to start the dialogue
    prompts: v.array(v.object({
      text: v.string(),
      priority: v.number(),
    })),
    
    // Metadata
    createdAt: v.number(),
  })
    .index("by_widget", ["widgetId"])
    .index("by_project", ["projectId"])
    .index("by_output_id", ["outputId"]),

  // Conversation Summaries - Real-time conversation analysis
  conversation_summaries: defineTable({
    userId: v.string(),
    projectId: v.optional(v.id("projects")),
    segmentId: v.string(), // Unique identifier for conversation segment
    messageCount: v.number(),
    
    // Key insights extracted
    keyInsights: v.array(v.object({
      insight_type: v.string(),
      content: v.string(),
      confidence: v.number(), // 0-1
      context: v.string(),
      importance: v.string(), // low, medium, high, critical
    })),
    
    // Working style analysis
    workingStyleHints: v.array(v.string()),
    goalClarity: v.string(), // unclear, emerging, clear, very_clear
    collaborationPreferences: v.array(v.string()),
    timePreferences: v.array(v.string()),
    complexityIndicators: v.array(v.string()),
    emotionalTone: v.string(),
    
    // Follow-up suggestions
    nextQuestions: v.array(v.string()),
    summary: v.string(),
    
    // Metadata
    createdAt: v.number(),
    processedAt: v.number(),
    agentVersion: v.string(),
  })
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_segment", ["segmentId"])
  .index("by_created", ["createdAt"])
  .index("by_user_project", ["userId", "projectId"]),

  // Friendships - User friendship management
  friendships: defineTable({
    userId1: v.string(),
    userId2: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("blocked")
    ),
    requestedBy: v.string(),
    requestMessage: v.optional(v.string()),
    requestedAt: v.number(),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId1", ["userId1"])
  .index("by_userId2", ["userId2"])
  .index("by_status", ["status"])
  .index("by_requestedBy", ["requestedBy"])
  .index("by_user_pair", ["userId1", "userId2"])
  .index("by_user1_status", ["userId1", "status"])
  .index("by_user2_status", ["userId2", "status"]),

  // Shared Content - Universal content sharing between users
  shared_content: defineTable({
    contentType: v.union(
      v.literal("note"),
      v.literal("project"),
      v.literal("widget"),
      v.literal("conversation")
    ),
    contentId: v.string(),
    ownerId: v.string(),
    sharedWithUserId: v.string(),
    permission: v.union(
      v.literal("read"),
      v.literal("edit")
    ),
    sharedBy: v.string(),
    sharedAt: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_contentId", ["contentId"])
  .index("by_ownerId", ["ownerId"])
  .index("by_sharedWithUserId", ["sharedWithUserId"])
  .index("by_contentType", ["contentType"])
  .index("by_content_user", ["contentId", "sharedWithUserId"])
  .index("by_owner_type", ["ownerId", "contentType"])
  .index("by_shared_user_type", ["sharedWithUserId", "contentType"])
  .index("by_active", ["isActive"]),

  // User Preferences - User privacy and notification settings
  user_preferences: defineTable({
    userId: v.string(),
    showPersonaToFriends: v.boolean(), // TODO: Rename to showCrystalsToFriends or remove entirely
    allowFriendRequests: v.boolean(),
    friendRequestNotifications: v.boolean(),
    language: v.optional(v.string()), // ISO 639-1 language code (e.g., "ko", "ja", "es")
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"]),

  // Operational Transform - Text Operations for real-time collaboration
  text_operations: defineTable({
    noteId: v.id("notes"),
    userId: v.string(),
    operationId: v.string(), // Unique ID for this operation (UUID)
    sequenceNumber: v.number(), // Global sequence number for ordering
    vectorClock: v.record(v.string(), v.number()), // Vector clock for conflict resolution
    operation: v.object({
      type: v.union(
        v.literal("insert"),
        v.literal("delete"),
        v.literal("retain")
      ),
      position: v.number(), // Character position in document
      content: v.optional(v.string()), // Text content for insert operations
      length: v.optional(v.number()), // Length for delete/retain operations
      attributes: v.optional(v.record(v.string(), v.any())), // For formatting attributes
    }),
    transformedFrom: v.optional(v.array(v.string())), // IDs of operations this was transformed from
    isCommitted: v.boolean(), // Whether this operation is committed to the document
    timestamp: v.number(),
    createdAt: v.number(),
  })
  .index("by_note", ["noteId"])
  .index("by_note_sequence", ["noteId", "sequenceNumber"])
  .index("by_note_user", ["noteId", "userId"])
  .index("by_operation_id", ["operationId"])
  .index("by_committed", ["isCommitted"])
  .index("by_timestamp", ["timestamp"]),

  // Note Snapshots - Periodic full-text snapshots for faster loading
  note_snapshots: defineTable({
    noteId: v.id("notes"),
    content: v.string(), // Full document content at this point
    sequenceNumber: v.number(), // Last operation sequence number included
    operationCount: v.number(), // Number of operations applied to reach this state
    checksum: v.string(), // MD5 hash of content for integrity verification
    createdAt: v.number(),
    createdBy: v.string(), // User who triggered the snapshot
    snapshotReason: v.union(
      v.literal("periodic"), // Regular interval snapshot
      v.literal("operation_threshold"), // Too many operations since last snapshot
      v.literal("manual"), // User-triggered
      v.literal("conflict_resolution") // Created during conflict resolution
    ),
  })
  .index("by_note", ["noteId"])
  .index("by_note_sequence", ["noteId", "sequenceNumber"])
  .index("by_created", ["createdAt"]),

  // Operation Acknowledgments - Track which operations have been acknowledged by which users
  operation_acknowledgments: defineTable({
    operationId: v.string(),
    noteId: v.id("notes"),
    userId: v.string(),
    acknowledgedAt: v.number(),
    clientId: v.string(), // Client session ID for tracking multiple sessions
  })
  .index("by_operation", ["operationId"])
  .index("by_note_user", ["noteId", "userId"])
  .index("by_user_client", ["userId", "clientId"]),

  // Crystal Cache - Intelligent caching for frequently accessed crystal data
  crystalCache: defineTable({
    userId: v.string(),
    cacheKey: v.string(),
    cacheType: v.union(
      v.literal("crystal_context"),
      v.literal("vector_search"),
      v.literal("formation_context"),
      v.literal("similarity_results")
    ),
    data: v.any(),
    createdAt: v.number(),
    expiresAt: v.number(),
    accessCount: v.number(),
    lastAccessed: v.number(),
    dataSize: v.number(),
    metadata: v.optional(v.object({
      queryParams: v.optional(v.string()),
      resultCount: v.optional(v.number()),
      processingTime: v.optional(v.number()),
    })),
  })
  .index("by_user", ["userId"])
  .index("by_user_key", ["userId", "cacheKey"])
  .index("by_type", ["cacheType"])
  .index("by_expiration", ["expiresAt"])
  .index("by_access", ["lastAccessed"]),

  crystal_shards: defineTable({
    // === CORE IDENTIFICATION (REQUIRED) ===
    userId: v.string(),                      // REQUIRED: User who owns this shard
    // === SOURCE METADATA (FLEXIBLE) ===
    source: v.optional(v.string()),         // Optional: "conversation_2024_01_15", "note_daily_review"
    sourceIds: v.optional(v.array(v.string())),  // Optional: Multiple sources that contributed to this shard
    source_type: v.optional(v.union(v.literal("conversation"), v.literal("note"), v.literal("document"), v.literal("behavior_observation"))),
    extraction_timestamp: v.optional(v.number()),
    extraction_method: v.optional(v.union(v.literal("direct_quote"), v.literal("behavioral_inference"), v.literal("pattern_synthesis"))),
    
    // === PROJECT & WIDGET CONTEXT ===
    projectId: v.optional(v.id("projects")),     // Optional: Project this shard belongs to
    widgetId: v.optional(v.string()),            // Optional: Widget this shard originated from
    conversationId: v.optional(v.string()),      // Optional: Conversation this shard came from

    // === CORE REVELATION (MINIMAL REQUIREMENTS) ===
    dimension: v.optional(v.string()),      // Optional: Identity dimension this touches
    exact_quote: v.optional(v.string()),    // Optional: Their precise words (can be empty for behavioral observations)
    what_it_reveals: v.optional(v.string()), // Optional: Qualitative interpretation
    situation_context: v.optional(v.string()), // Optional: What was happening
    why_significant: v.optional(v.string()),   // Optional: Why this matters

    // === QUALITY INDICATORS (ALL OPTIONAL) ===
    confidence_level: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    linguistic_intensity: v.optional(v.union(v.literal("weak"), v.literal("moderate"), v.literal("strong"))), // "might" vs "always" vs "absolutely"
    emotional_weight: v.optional(v.union(v.literal("neutral"), v.literal("mild"), v.literal("strong"))),      // How much they seem to care
    specificity: v.optional(v.union(v.literal("vague"), v.literal("specific"), v.literal("very_specific"))),  // How detailed/concrete

    // === PATTERN CONNECTIONS (ALL OPTIONAL) ===
    connects_to: v.optional(v.array(v.string())),       // Optional: Tags for connecting to other shards
    contradicts: v.optional(v.array(v.string())),       // Optional: Shard IDs that conflict
    reinforces: v.optional(v.array(v.string())),        // Optional: Shard IDs that support this

    // === TEMPORAL DATA (OPTIONAL) ===
    temporal_context: v.optional(v.string()),           // Optional: "during stressful periods", "when working on creative projects"
    recency_weight: v.optional(v.union(v.literal("recent"), v.literal("moderate"), v.literal("old"))), // Optional: How recent/relevant

    // === METADATA (REQUIRED FOR TRACKING) ===
    createdAt: v.number(),                   // REQUIRED: Creation timestamp
    updatedAt: v.number(),                   // REQUIRED: Last update timestamp
    last_referenced: v.optional(v.number()), // Optional: When this shard was last used in crystal formation
    reference_count: v.optional(v.number()), // Optional: How many crystals reference this shard
    
    // === SHARD LIFECYCLE TRACKING ===
    shard_status: v.optional(v.union(
        v.literal("unprocessed"),           // Never used for crystal generation
        v.literal("reserved"),              // Reserved for processing (prevents race conditions)
        v.literal("used_for_crystal"),      // Consumed by a crystal
        v.literal("archived")               // Marked as irrelevant/outdated
    )),
    used_in_crystal_id: v.optional(v.string()), // Crystal ID that consumed this shard
    date_consumed: v.optional(v.number()),  // Timestamp when shard was consumed
    reserved_by_formation: v.optional(v.string()), // Formation run ID that reserved this shard
    reserved_at: v.optional(v.number()),    // Timestamp when shard was reserved
  })
      .index("by_user", ["userId"])
      .index("by_dimension", ["userId", "dimension"])
      .index("by_confidence", ["userId", "confidence_level"])
      .index("by_recency", ["userId", "recency_weight"])
      .index("by_status", ["userId", "shard_status"])
      .index("by_crystal_usage", ["userId", "used_in_crystal_id"])
      .index("by_unprocessed", ["userId", "shard_status", "createdAt"])
      .index("by_project", ["projectId"])
      .index("by_user_project", ["userId", "projectId"])
      .index("by_widget", ["widgetId"])
      .index("by_conversation", ["conversationId"]),


// === COMPREHENSIVE CRYSTALS TABLE ===

    crystals: defineTable({
    // === CORE IDENTIFICATION (REQUIRED) ===
    userId: v.string(),                     // REQUIRED: User who owns this crystal
    crystal_id: v.string(),                 // REQUIRED: Unique identifier

    // === CRYSTAL DEFINITION (CORE REQUIRED FIELDS) ===
    name: v.string(),                       // REQUIRED: "Morning Productivity Pattern", "Direct Communication Preference"
    crystal_type: v.union(
        v.literal("stable_trait"),            // Enduring personality characteristic
        v.literal("behavioral_pattern"),      // How they consistently act
        v.literal("preference_cluster"),      // Related preferences that group together
        v.literal("value_system"),           // Core beliefs and values
        v.literal("contextual_adaptation"),  // How they adapt to different situations
        v.literal("growth_trajectory"),      // How they're evolving over time
        v.literal("contradiction_resolution") // How they handle internal conflicts
    ),
    dimension: v.string(),                  // REQUIRED: Primary identity dimension
    
    // === PROJECT & WIDGET CONTEXT ===
    projectId: v.optional(v.id("projects")),     // Optional: Project this crystal belongs to
    widgetId: v.optional(v.string()),            // Optional: Widget this crystal originated from

    // === FLEXIBLE CRYSTAL CONTENT ===
    secondary_dimensions: v.optional(v.array(v.string())), // Optional: Other dimensions this crystal touches
    description: v.optional(v.string()),    // Optional: Comprehensive description of the pattern
    core_insight: v.optional(v.string()),   // Optional: The key understanding in one sentence
    detailed_analysis: v.optional(v.string()), // Optional: Deep dive into what this means

    // === SUPPORTING EVIDENCE (FLEXIBLE) ===
    shardIds: v.optional(v.array(v.string())), // Optional: All supporting shards (relaxed validation)
    supporting_quotes: v.optional(v.array(v.string())), // Optional: Supporting evidence

    // === CONFIDENCE & RELIABILITY (WITH DEFAULTS) ===
    confidence_score: v.optional(v.string()), // Flexible string field for confidence scores
    evidence_strength: v.optional(v.string()), // Flexible string field for evidence strength
    consistency_rating: v.optional(v.string()), // Flexible string field for consistency rating
    observation_count: v.optional(v.number()), // Optional: Number of times we've observed this pattern
    time_span_days: v.optional(v.number()),    // Optional: How long we've been observing this pattern

    // === PATTERN METADATA (ALL OPTIONAL) ===
    tags: v.optional(v.array(v.string())),  // Optional: Semantic tags for retrieval
    behavioral_implications: v.optional(v.array(v.string())), // Optional: What this suggests they might do
    interaction_guidance: v.optional(v.array(v.string())),    // Optional: How AI should adapt based on this

    // === CONTRADICTIONS & NUANCE (OPTIONAL) ===
    contradicting_shards: v.optional(v.array(v.string())), // Optional: Shards that contradict this pattern
    contradiction_analysis: v.optional(v.string()), // Optional: How contradictions are resolved/understood

    // === EVOLUTION TRACKING (FLEXIBLE) ===
    evolution_history: v.optional(v.array(v.object({
      timestamp: v.number(),
      change_type: v.union(v.literal("strengthened"), v.literal("weakened"), v.literal("refined"), v.literal("contradicted"), v.literal("created"), v.literal("merged_at_limit")),
      description: v.string(),
      triggering_shard_id: v.string() // Relaxed validation for temp IDs
    }))),
    stability_trend: v.optional(v.string()), // Flexible string field for stability trend
    last_evolution: v.optional(v.number()), // Optional: When this crystal last changed significantly

    // === CROSS-CRYSTAL RELATIONSHIPS (OPTIONAL) ===
    related_crystals: v.optional(v.array(v.string())), // Optional: Other crystals this connects to
    conflicting_crystals: v.optional(v.array(v.string())), // Optional: Crystals that contradict this one

    // === UTILIZATION METADATA (OPTIONAL) ===
    usage_count: v.optional(v.number()),    // Optional: How many times this crystal has been used
    usage_frequency: v.optional(v.number()), // Optional: How often this crystal is referenced
    last_used: v.optional(v.number()),      // Optional: When this was last used for AI decisions

    // === METADATA (REQUIRED FOR TRACKING) ===
    createdAt: v.number(),                  // REQUIRED: Creation timestamp
    updatedAt: v.number(),                  // REQUIRED: Last update timestamp
    next_review_due: v.optional(v.number()), // Optional: When this crystal should be reviewed/updated
      review_priority: v.optional(v.string()), // Flexible string field for review priority
    auto_promoted: v.optional(v.boolean()), // Optional: Whether this crystal was auto-promoted
    
      related_conversation_ids: v.optional(v.array(v.string())), // Optional: Related conversation IDs
    
    related_note_ids: v.optional(v.array(v.string())), // Optional: Related note IDs
    
    // === ARCHIVAL FIELDS (FOR CAPACITY MANAGEMENT) ===
    archived: v.optional(v.boolean()),      // Optional: Whether this crystal has been archived
    archived_at: v.optional(v.number()),    // Optional: When this crystal was archived
  })

      .index("by_user", ["userId"])
      .index("by_dimension", ["userId", "dimension"])
      .index("by_confidence", ["userId", "confidence_score"])
      .index("by_type", ["userId","crystal_type"])
      .index("by_usage", ["userId", "usage_frequency"])
    .index("by_review_due", ["userId", "next_review_due"])
    .index("by_project", ["projectId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_widget", ["widgetId"]),
    
    // === STARDUST TABLE (PARALLEL SPECIES: "WHAT YOU DO") ===
    // Stardust represents concrete project potentials that evolve into star organisms
    // Parallel species to Crystals: Crystals = "Who You Are", Stardust = "What You Do"
    // Code-based detection (zero LLM cost), flows through crystal dam alongside shards
    stardust: defineTable({
      // === CORE IDENTIFICATION ===
      userId: v.string(),
      stardustId: v.string(),  // Unique stardust identifier
      
      // === STARDUST DEFINITION ===
      name: v.string(),  // Generated from keywords
      description: v.string(),  // Core insight about this potential
      keywords: v.array(v.string()),  // Key terms defining this stardust
      dimension: v.string(),  // Primary dimension (inherited from shards)
      
      // === DETECTION METADATA ===
      detectedAt: v.number(),  // Unix timestamp when detected
      detectionMethod: v.string(),  // Detection algorithm used (default: "code_based")
      confidence: v.number(),  // Detection confidence (0-1)
      evidenceStrength: v.union(
        v.literal("weak"),
        v.literal("moderate"),
        v.literal("strong")
      ),
      
      // === SOURCE TRACKING ===
      sourceShardIds: v.array(v.string()),  // Shards that formed this stardust
      shardCount: v.number(),  // Number of shards
      relatedNoteIds: v.array(v.string()),  // Notes contributing to this stardust
      relatedConversationIds: v.array(v.string()),  // Conversations contributing
      
      // === LIFECYCLE STAGE ===
      lifecycleStage: v.union(
        v.literal("embryo"),      // Just detected from content patterns
        v.literal("juvenile"),    // Gaining evidence and definition
        v.literal("mature"),      // Ready for promotion to project
        v.literal("elder"),       // Long-standing potential
        v.literal("transcendent") // Achieved project status (promoted)
      ),
      health: v.number(),  // Organism health (0-1)
      energy: v.number(),  // Energy level for evolution
      
      // === PROJECT SUGGESTIONS (FOR PROMOTION) ===
      suggestedProjectName: v.string(),
      suggestedProjectDescription: v.string(),
      suggestedDomain: v.union(
        v.literal("academic"),
        v.literal("creative"),
        v.literal("business"),
        v.literal("skill_development"),
        v.literal("personal"),
        v.literal("technical"),
        v.literal("unknown")
      ),
      suggestedComplexity: v.number(),  // Complexity (0-10)
      suggestedTimeHorizon: v.string(),  // Time horizon estimate
      
      // === PROMOTION TRACKING ===
      promoted: v.boolean(),  // Has been promoted to star organism/project
      promotedAt: v.optional(v.number()),  // When promoted
      promotedToProjectId: v.optional(v.id("projects")),  // Project ID created from this
      confidenceAtPromotion: v.optional(v.number()),  // Confidence when promoted
      
      // === TEMPORAL METADATA ===
      createdAt: v.number(),
      updatedAt: v.number(),
      lastEvolution: v.optional(v.number()),  // Last lifecycle evolution
      
      // === SYMBIOTIC RELATIONSHIPS (FUTURE) ===
      relatedCrystalIds: v.array(v.string()),  // Crystals providing wisdom to this star
      symbioticPairs: v.array(v.string()),  // Star-crystal symbiotic relationships
    })
      .index("by_user", ["userId"])
      .index("by_confidence", ["userId", "confidence"])
      .index("by_promoted", ["userId", "promoted"])
      .index("by_detected", ["userId", "detectedAt"])
      .index("by_lifecycle", ["userId", "lifecycleStage"])
      .index("by_domain", ["userId", "suggestedDomain"]),
    
    crystal_formation_runs: defineTable({
      userId: v.string(),
      status: v.union(
        v.literal("running"),
        v.literal("completed"), 
        v.literal("failed")
      ),
      
      // Input data
      input_shard_count: v.number(),
      trigger_type: v.union(
        v.literal("threshold_reached"),    // 15+ shards
        v.literal("periodic_refresh"),     // Background job
        v.literal("manual_trigger")        // User initiated
      ),
      
        // Event tracking
        event_type: v.optional(v.string()),             // Event type for tracking
        timestamp: v.optional(v.number()),              // Event timestamp
        
        // Results
        clusters_formed: v.optional(v.number()),
        crystals_created: v.optional(v.number()),
        crystals_failed: v.optional(v.number()),
        
        // Additional tracking fields for management system
        crystal_count: v.optional(v.number()),           // Number of crystals being processed
        crystals_updated: v.optional(v.number()),        // Crystals that were updated
        crystals_merged: v.optional(v.number()),         // Crystals that were merged
        crystals_archived: v.optional(v.number()),       // Crystals that were archived
        evolution_events: v.optional(v.number()),        // Number of evolution events
        vector_matches_found: v.optional(v.number()),    // Vector search matches found
        agent_recommendations_used: v.optional(v.number()), // Agent recommendations used
        raw_crystals_generated: v.optional(v.number()),  // Raw crystals generated during formation
        
        // Timing
        started_at: v.number(),
        completed_at: v.optional(v.number()),
        duration_ms: v.optional(v.number()),
        
        // Error handling
        error_message: v.optional(v.string()),
        
        // Metadata
        formation_version: v.string(),      // Track algorithm versions
      })
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_user_status", ["userId", "status"]),

  // Migration Tracking - Clean separation for one-time migrations
  migration_tracking: defineTable({
    userId: v.string(),
    migrationType: v.string(), // "chatgpt_import", "crystal_initial_generation", etc.
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    attempts: v.optional(v.number()),
    lastAttemptAt: v.optional(v.number()),
    
    // Real-time status tracking (for reactive UI)
    status: v.optional(v.string()), // "queued", "running", "completed", "failed"
    progress: v.optional(v.string()), // Human-readable progress message
    jobId: v.optional(v.string()), // Background job ID
    error: v.optional(v.string()), // Error message if failed
    
    // Detailed progress tracking (for ChatGPT import and similar jobs)
    progressDetails: v.optional(v.object({
      totalConversations: v.optional(v.number()), // Total conversations discovered
      processedConversations: v.optional(v.number()), // Conversations processed so far
      totalBatches: v.optional(v.number()), // Total batches to process
      processedBatches: v.optional(v.number()), // Batches processed so far
      totalMessages: v.optional(v.number()), // Total messages discovered
      processedMessages: v.optional(v.number()), // Messages processed so far
      percentComplete: v.optional(v.number()), // 0-100 progress percentage
      currentBatch: v.optional(v.number()), // Current batch being processed
      processingPhase: v.optional(v.string()), // Current processing phase: parsing | importing | shard_extraction | formation | complete
      // DEPRECATED: These fields kept for backward compatibility but no longer used
      // Frontend now queries background_jobs table directly for related jobs
      shardExtractionJobIds: v.optional(v.array(v.string())),
      formationJobId: v.optional(v.string()),
      totalRelatedJobs: v.optional(v.number()),
      completedRelatedJobs: v.optional(v.number()),
    })),
    
    contentProcessed: v.optional(v.object({
      conversations: v.number(),
      notes: v.number(),
      totalItems: v.number()
    }))
  })
  .index("by_user_type", ["userId", "migrationType"])
  .index("by_type", ["migrationType"])
  .index("by_completion", ["completed"])
  .index("by_status", ["status"]),

  // ========================================
  // CRYSTAL INTELLIGENCE SYSTEM
  // ========================================

  // Intelligence Configuration - Per-user settings for analysis triggers and preferences
  intelligence_config: defineTable({
    userId: v.string(),
    
    // Trigger thresholds (configurable)
    triggers: v.object({
      chat_messages: v.number(),        // DEPRECATED: MAB system controls triggering
      smart_notes: v.number(),          // DEPRECATED: MAB system controls triggering
      crystal_formations: v.number(),   // DEPRECATED: MAB system controls triggering
      days_since_last: v.number(),      // Default: 7
    }),
    
    // Analysis preferences
    preferences: v.object({
      analysis_depth: v.union(v.literal("fast"), v.literal("standard"), v.literal("deep")),
      auto_archival: v.boolean(),
      review_notifications: v.boolean(),
    }),
    
    // Execution tracking
    last_analysis: v.number(),
    last_analysis_triggered_at: v.optional(v.number()),  // Last time MAB triggered analysis (for cooldown)
    last_analysis_snapshot: v.optional(v.any()),  // Snapshot for drift calculation
    next_scheduled_analysis: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_next_scheduled", ["next_scheduled_analysis"]),

  // Activity Counters - Track user activity for trigger detection
  user_activity_counters: defineTable({
    userId: v.string(),
    
    // Activity counts since last intelligence analysis
    since_last_analysis: v.object({
      chat_messages: v.number(),
      smart_notes: v.number(),
      crystal_formations: v.number(),
      crystal_retrievals: v.number(),
    }),
    
    // Lifetime activity (for analytics)
    lifetime: v.object({
      chat_messages: v.number(),
      smart_notes: v.number(),
      crystal_formations: v.number(),
      crystal_retrievals: v.number(),
    }),
    
    // Trigger state
    pending_analysis: v.boolean(),
    analysis_priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_pending", ["pending_analysis", "analysis_priority"]),

  // Crystal Intelligence State - Denormalized intelligence data for performance
  crystal_intelligence: defineTable({
    userId: v.string(),
    crystalId: v.string(),
    
    // Usage statistics (aggregated from usageEvents) - all optional for incremental updates
    usage: v.optional(v.object({
      total_retrievals: v.optional(v.number()),
      retrievals_last_7d: v.optional(v.number()),
      retrievals_last_30d: v.optional(v.number()),
      last_used: v.optional(v.number()),
      last_retrieved: v.optional(v.number()),
      usage_frequency: v.optional(v.number()),
      contexts: v.optional(v.array(v.string())),
      co_occurrence: v.optional(v.array(v.string())),
    })),
    
    // Relationship analysis (vector similarity based) - all optional for incremental updates
    relationships: v.optional(v.object({
      related: v.optional(v.array(v.object({
        crystalId: v.string(),
        similarity: v.number(),
        relationship_type: v.string(),
        confidence: v.number(),
      }))),
      related_crystal_ids: v.optional(v.array(v.string())),
      relationship_scores: v.optional(v.any()),
      conflicting: v.optional(v.array(v.object({
        crystalId: v.string(),
        conflict_score: v.number(),
        conflict_type: v.string(),
        resolution: v.optional(v.string()),
      }))),
    })),
    
    // Contradiction analysis (shard-level) - all optional for incremental updates
    contradictions: v.optional(v.object({
      shard_ids: v.optional(v.array(v.string())),
      severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
      patterns: v.optional(v.array(v.string())),
      analysis: v.optional(v.string()),
    })),
    
    // Health scoring (composite metric) - all optional for incremental updates
    health: v.optional(v.object({
      overall_score: v.optional(v.number()),
      last_computed: v.optional(v.number()),
      components: v.optional(v.object({
        evidence_strength: v.optional(v.number()),
        usage_recency: v.optional(v.number()),
        usage_frequency: v.optional(v.number()),
        contradiction_impact: v.optional(v.number()),
        age_factor: v.optional(v.number()),
      })),
      trend: v.optional(v.union(v.literal("improving"), v.literal("stable"), v.literal("declining"))),
    })),
    
    // Lifecycle management - all optional for incremental updates
    lifecycle: v.optional(v.object({
      review_priority: v.optional(v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )),
      next_review_due: v.optional(v.number()),
      archival_candidate: v.optional(v.boolean()),
      archival_reason: v.optional(v.string()),
      archival_confidence: v.optional(v.number()),
    })),
    
    // Metadata
    analysis_version: v.string(),
    last_analyzed: v.number(),
    analysis_depth: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_crystal", ["userId", "crystalId"])
  .index("by_last_analyzed", ["userId", "last_analyzed"])
  .index("by_analysis_depth", ["userId", "analysis_depth"]),

  // Intelligence Jobs - Background processing queue
  intelligence_jobs: defineTable({
    userId: v.string(),
    
    // Job configuration
    job_type: v.union(
      v.literal("quick_update"),
      v.literal("standard_analysis"),
      v.literal("deep_analysis"),
      v.literal("archival_review")
    ),
    
    // Execution details
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Scope (what to analyze)
    scope: v.object({
      crystal_ids: v.optional(v.array(v.string())),
      analyze_all: v.boolean(),
      analysis_depth: v.string(),
    }),
    
    // Execution tracking
    trigger_source: v.string(),
    scheduled_for: v.number(),
    started_at: v.optional(v.number()),
    completed_at: v.optional(v.number()),
    duration_ms: v.optional(v.number()),
    
    // Results
    results: v.optional(v.object({
      crystals_analyzed: v.number(),
      relationships_found: v.number(),
      contradictions_found: v.number(),
      health_scores_updated: v.number(),
      error: v.optional(v.string()),
      details: v.optional(v.any()),  // Additional analysis details from backend
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_status", ["status", "priority", "scheduled_for"])
  .index("by_user_status", ["userId", "status"]),

  // ========================================
  // ASYNC JOB QUEUE SYSTEM (Redis-backed)
  // ========================================
  
  // Background Jobs - Redis Stream job tracking
  background_jobs: defineTable({
    // Core identification
    jobId: v.string(),              // Redis message ID (e.g. "1234567890-0")
    userId: v.string(),
    
    // Job classification
    type: jobTypeValidator,         // Import from types/backgroundJobs.ts
    payload: v.any(),               // Job-specific payload data
    
    // Status tracking
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    priority: jobPriorityValidator,  // Import from types/backgroundJobs.ts
    
    // Timing
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    
    // Results and errors
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    
    // Retry tracking
    attempts: v.number(),
    maxAttempts: v.number(),
    
    // Worker metadata
    workerId: v.optional(v.string()),
  })
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_user_type_status", ["userId", "type", "status"])
  .index("by_job_id", ["jobId"]),

  // ========================================
  // MULTI-ARMED BANDIT (MAB) LEARNING SYSTEM
  // ========================================
  
  // Intelligence Bandit Arms - MAB trigger strategies per user
  intelligence_bandit_arms: defineTable({
    userId: v.string(),
    armId: v.string(),
    armName: v.string(),
    description: v.optional(v.string()),  // NEW - arm description
    
    // NEW - Strategy parameters (e.g., threshold values, min_shards)
    params: v.optional(v.any()),  // Flexible storage for arm-specific parameters
    
    // Thompson Sampling parameters (Beta distribution)
    alpha: v.number(),
    beta: v.number(),
    
    // Performance tracking
    total_pulls: v.number(),
    total_reward: v.number(),
    avg_reward: v.number(),
    
    // Confidence metrics
    mean_estimate: v.number(),
    confidence_interval: v.object({
      lower: v.number(),
      upper: v.number(),
    }),
    
    last_pulled: v.optional(v.number()),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_arm", ["userId", "armId"])
  .index("by_performance", ["userId", "avg_reward"]),

  // Intelligence Bandit Decisions - Track every MAB trigger decision
  intelligence_bandit_decisions: defineTable({
    userId: v.string(),
    jobId: v.optional(v.string()),  // Link to background_jobs if triggered
    
    // Decision context
    armPulled: v.string(),
    triggered: v.boolean(),
    
    // State snapshot at decision time
    state_snapshot: v.object({
      semantic_drift: v.number(),
      activity_velocity: v.number(),
      hours_since_last: v.number(),
      crystal_count: v.number(),
      active_crystals: v.number(),
      formations_since_last: v.number(),
    }),
    
    // All arms' state for analysis
    arms_state: v.array(v.object({
      armId: v.string(),
      armName: v.string(),
      alpha: v.number(),
      beta: v.number(),
      sampled_value: v.number(),
    })),
    
    // Outcome (populated after analysis)
    reward: v.optional(v.number()),
    
    decisionAt: v.number(),
    rewardObservedAt: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_triggered", ["triggered"])
  .index("by_decision_time", ["decisionAt"]),

  // ========================================
  // CONTEXT ENRICHMENT MAB - Learn optimal context strategies per user
  // ========================================
  
  // Context Enrichment Arms - MAB context strategies per user per agent type
  context_enrichment_arms: defineTable({
    userId: v.string(),
    agentType: v.string(),  // "chat", "widget", "discovery"
    armId: v.string(),
    armName: v.string(),
    
    // Strategy parameters (stored for reference)
    strategy_params: v.object({
      threshold: v.number(),
      limit: v.number(),
      content_types: v.array(v.string()),
      // Allow both nested and flat structures for backward compatibility
      shard_params: v.optional(v.object({
        limit: v.number(),
        dimensions: v.union(v.null(), v.array(v.string())),
        min_confidence: v.union(v.null(), v.string()),
        keywords: v.union(v.null(), v.array(v.string())),
        tags: v.union(v.null(), v.array(v.string())),
      })),
      // Flat structure (for Convergence-generated configs)
      shard_limit: v.optional(v.number()),
      shard_confidence: v.optional(v.number()),
    }),
    
    // Thompson Sampling parameters (Beta distribution)
    alpha: v.number(),
    beta: v.number(),
    
    // Performance tracking
    total_pulls: v.number(),
    total_reward: v.number(),
    avg_reward: v.number(),
    
    // Confidence metrics
    mean_estimate: v.number(),
    confidence_interval: v.object({
      lower: v.number(),
      upper: v.number(),
    }),
    
    last_pulled: v.optional(v.number()),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_user_agent", ["userId", "agentType"])
  .index("by_user_agent_arm", ["userId", "agentType", "armId"])
  .index("by_performance", ["userId", "agentType", "avg_reward"]),

  // Context Enrichment Decisions - Track every context enrichment decision
  context_enrichment_decisions: defineTable({
    userId: v.string(),
    agentType: v.string(),
    conversationId: v.string(),
    messageIndex: v.number(),  // Which assistant message this decision is for
    
    // Decision context
    armPulled: v.string(),
    strategyUsed: v.object({
      threshold: v.number(),
      limit: v.number(),
      content_types: v.array(v.string()),
      // Allow both nested and flat structures for backward compatibility
      shard_params: v.optional(v.object({
        limit: v.number(),
        dimensions: v.union(v.null(), v.array(v.string())),
        min_confidence: v.union(v.null(), v.string()),
        keywords: v.union(v.null(), v.array(v.string())),
        tags: v.union(v.null(), v.array(v.string())),
      })),
      // Flat structure (for Convergence-generated configs)
      shard_limit: v.optional(v.number()),
      shard_confidence: v.optional(v.number()),
    }),
    
    // All arms' state at decision time (for analysis)
    arms_state: v.array(v.object({
      armId: v.string(),
      armName: v.string(),
      alpha: v.number(),
      beta: v.number(),
      sampled_value: v.number(),
    })),
    
    // Outcome (populated after user responds)
    engagement_score: v.optional(v.number()),
    grading_score: v.optional(v.number()),  // If LLM grading was used (10% sample)
    final_reward: v.optional(v.number()),
    
    decisionAt: v.number(),
    rewardObservedAt: v.optional(v.number()),
  })
  .index("by_user", ["userId"])
  .index("by_user_agent", ["userId", "agentType"])
  .index("by_conversation", ["conversationId"])
  .index("by_decision_time", ["decisionAt"]),

  // Stripe Webhook Events Tracking
  webhook_events: defineTable({
    // Event Identification
    eventId: v.string(),              // Stripe event ID (e.g., evt_xxx)
    eventType: v.string(),            // Event type (e.g., customer.subscription.created)
    apiVersion: v.optional(v.string()), // Stripe API version
    
    // Event Data
    eventData: v.any(),               // Full event data from Stripe
    
    // Processing Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    processedAt: v.optional(v.number()), // Timestamp when processed
    processingDuration: v.optional(v.number()), // Processing time in ms
    
    // Error Tracking
    error: v.optional(v.string()),       // Error message if failed
    errorStack: v.optional(v.string()),  // Full error stack trace
    attemptCount: v.number(),            // Number of processing attempts
    
    // Related Entities
    userId: v.optional(v.string()),        // User ID if resolved
    subscriptionId: v.optional(v.string()), // Stripe subscription ID if applicable
    customerId: v.optional(v.string()),    // Stripe customer ID if applicable
    invoiceId: v.optional(v.string()),     // Stripe invoice ID if applicable
    
    // Metadata
    receivedAt: v.number(),           // When webhook was received
    ipAddress: v.optional(v.string()), // Source IP for security
    userAgent: v.optional(v.string()), // Stripe's user agent
  })
  .index("by_event_id", ["eventId"])
  .index("by_event_type", ["eventType"])
  .index("by_status", ["status"])
  .index("by_user", ["userId"])
  .index("by_subscription", ["subscriptionId"])
  .index("by_received_at", ["receivedAt"])
  .index("by_event_type_status", ["eventType", "status"]),

  // ============================================================================
  // FINGERPRINT EVOLUTION SIGNALS - Track project activity for MAB-driven evolution
  // ============================================================================
  fingerprint_evolution_signals: defineTable({
    // Foreign keys
    fingerprintId: v.id("project_fingerprints"),
    projectId: v.id("projects"),
    userId: v.string(),
    
    // Signal counters (reset after each evolution)
    notes_added: v.number(),
    notes_modified: v.number(),
    crystals_added: v.number(),
    shards_added: v.number(),
    widgets_updated: v.number(),
    widgets_executed: v.number(),
    manual_edits: v.number(),
    
    // Timestamps
    last_evolution_at: v.number(),
    last_signal_update_at: v.number(),
    
    // Computed scores (0-1, cached for performance)
    content_accumulation_score: v.number(),
    content_modification_score: v.number(),
    activity_intensity_score: v.number(),
    time_decay_factor: v.number(),
    evolution_signal_score: v.number(),  // Combined score
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_signal_score", ["evolution_signal_score"]),

  // ============================================================================
  // Briefing Room - Living Intelligence Briefing System
  // ============================================================================
  
  /**
   * Briefing Events - Autonomous briefing agents
   * 
   * Each event is a living entity with state, relationships, and behavior.
   * Not just notifications - these are agent ambassadors from the AI civilization.
   */
  briefing_events: defineTable({
    // Identity
    userId: v.string(),
    type: v.string(), // Event type (e.g., "crystal_formation", "widget_complete", "dream_report")
    category: v.union(
      v.literal("crystal"),
      v.literal("widget"),
      v.literal("collaboration"),
      v.literal("dream"),
      v.literal("system")
    ),
    
    // Priority & Urgency
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    urgencyLevel: v.number(), // 0-1, escalates over time
    
    // Temporal Awareness
    timestamp: v.number(),
    lastPresented: v.optional(v.number()),
    timeWaiting: v.number(), // Calculated field, updated regularly
    
    // Event Data (category-specific)
    data: v.any(), // Flexible structure for different event types
    
    // State Machine
    state: v.union(
      v.literal("forming"),
      v.literal("waiting"),
      v.literal("requesting"),
      v.literal("presenting"),
      v.literal("acknowledged"),
      v.literal("dormant"),
      v.literal("archived")
    ),
    stateHistory: v.array(v.object({
      from: v.string(),
      to: v.string(),
      timestamp: v.number(),
      trigger: v.string()
    })),
    
    // Spatial Position
    position: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    }),
    spatialPriority: v.number(),
    
    // Relationships
    relatedBriefings: v.array(v.string()), // IDs of related events
    clusterId: v.optional(v.string()),
    
    // User Interaction
    viewed: v.boolean(),
    viewedAt: v.optional(v.number()),
    archived: v.boolean(),
    starred: v.boolean(),
    userRating: v.optional(v.union(
      v.literal("helpful"),
      v.literal("not_helpful"),
      v.literal("irrelevant")
    )),
    actionsTaken: v.array(v.string()),
    
    // AI Context
    aiContext: v.optional(v.object({
      relatedCrystals: v.array(v.string()),
      relatedProjects: v.array(v.string()),
      relatedWidgets: v.array(v.string()),
      generatedSuggestions: v.array(v.string())
    })),
    
    // Metadata
    metadata: v.object({
      source: v.string(),
      version: v.string(),
      processingTime: v.optional(v.number())
    }),
    
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_user_viewed", ["userId", "viewed"])
    .index("by_user_category", ["userId", "category"])
    .index("by_user_priority", ["userId", "priority"])
    .index("by_user_state", ["userId", "state"])
    .index("by_timestamp", ["timestamp"])
    .index("by_state", ["state"])
    .index("by_cluster", ["clusterId"]),

  /**
   * Briefing Preferences - User preferences for briefing room
   */
  briefing_preferences: defineTable({
    userId: v.string(),
    
    // Category Filters
    enabledCategories: v.object({
      crystal: v.boolean(),
      widget: v.boolean(),
      collaboration: v.boolean(),
      dream: v.boolean(),
      system: v.boolean()
    }),
    
    // Priority Filter
    minimumPriority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    
    // Display Preferences
    maxBriefersVisible: v.number(),
    animationsEnabled: v.boolean(),
    soundEnabled: v.boolean(),
    
    // Notification Channels
    notificationChannels: v.object({
      inApp: v.boolean(),
      email: v.boolean(),
      push: v.boolean()
    }),
    
    // Digest Preferences
    dailyDigest: v.boolean(),
    digestTime: v.string(), // e.g., "08:00"
    weeklyReport: v.boolean(),
    
    // Dream Reports
    enableDreamReports: v.boolean(),
    dreamReportFrequency: v.union(
      v.literal("nightly"),
      v.literal("weekly"),
      v.literal("never")
    ),
    
    // AI Summarization
    aiSummarization: v.boolean(),
    summaryDepth: v.union(
      v.literal("brief"),
      v.literal("standard"),
      v.literal("detailed")
    ),
    
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_userId", ["userId"]),

  /**
   * Briefing Clusters - Groups of related briefings
   */
  briefing_clusters: defineTable({
    userId: v.string(),
    brieferIds: v.array(v.string()),
    centerPosition: v.object({
      x: v.number(),
      y: v.number(),
      z: v.number()
    }),
    reason: v.string(), // Why they clustered
    confidence: v.number(), // How confident clustering algorithm is
    formed: v.number(),
    dissolved: v.optional(v.number()),
    active: v.boolean(),
    
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "active"]),

  // ============================================================================
  // CONVERGENCE STORAGE SYSTEM
  // ============================================================================
  // Complete RL + Optimization pipeline for self-learning tool workflows
  // 
  // Flow: Experiments → Configs → Production → RL Feedback → Loop Closes
  //
  // 1. convergence_optimization_experiments: Test workflow candidates
  // 2. convergence_optimization_runs: Run metadata and summaries  
  // 3. convergence_configs: Winners promoted to production (INTERFACE to agents)
  // 4. convergence_rl_training_data: Production feedback for next iteration
  // ============================================================================

  // ============================================================================
  // RL TRAINING DATA - Agent Episodes & Evolution
  // ============================================================================
  /**
   * Stores RL training data: episodes, trajectories, agent legacies
   * 
   * Purpose:
   * - Capture agent interactions for RL policy training
   * - Track agent evolution across stations/tasks
   * - Feed production signals back into Convergence optimization
   * 
   * NOT for config optimization - that's in optimization_experiments
   * This is for AGENT learning and evolution tracking
   */
  convergence_rl_training_data: defineTable({
    // === IDENTIFICATION ===
    rl_key: v.string(),              // "episode:agent_123:station_web_001"
    rl_record_type: v.union(         // What kind of RL data
      v.literal("episode"),          // Single RL interaction (S, A, R, S')
      v.literal("trajectory"),       // Sequence of episodes
      v.literal("agent_legacy"),     // Agent's learned knowledge
      v.literal("training_run")      // RL policy training session
    ),
    
    // === AGENT CONTEXT (denormalized for fast queries) ===
    agent_id: v.string(),                    // Which agent
    civilization_id: v.optional(v.string()), // Multi-agent evolution group
    station: v.optional(v.string()),         // "web_playground", "research_library"
    
    // === PERFORMANCE METRICS (denormalized hot path) ===
    reward_score: v.optional(v.number()),    // RL reward (0-1)
    fitness_score: v.optional(v.number()),   // Overall fitness
    episode_timestamp: v.number(),           // When this occurred
    success: v.optional(v.boolean()),        // Episode success flag
    
    // === FULL PAYLOAD ===
    rl_episode_data: v.any(),               // Complete RLEpisode/Trajectory/Legacy
    
    // === METADATA ===
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_rl_key", ["rl_key"])
    .index("by_agent", ["agent_id", "rl_record_type"])
    .index("by_agent_reward", ["agent_id", "reward_score"])
    .index("by_agent_station", ["agent_id", "station"])
    .index("by_timestamp", ["episode_timestamp"]),

  // ============================================================================
  // OPTIMIZATION EXPERIMENTS - Config Testing & Evolution
  // ============================================================================
  /**
   * Experiment data from optimization runs
   * 
   * Purpose:
   * - Record every config test (test_case × config)
   * - Track evolution progress (generations, mutations)
   * - Full audit trail of what was tested and how it performed
   * - Feeds into convergence_configs (winners get promoted)
   * 
   * This is the RAW DATA that generates production configs
   */
  convergence_optimization_experiments: defineTable({
    // === IDENTIFICATION ===
    experiment_id: v.string(),              // Unique experiment ID
    optimization_run_id: v.string(),        // Links to parent run
    
    // === SYSTEM CONTEXT ===
    system_name: v.string(),                // "context_enrichment_mab", "azure_o4_mini"
    algorithm_name: v.string(),             // "mab_evolution", "grid_search", "bayesian"
    
    // === EXPERIMENT DETAILS ===
    test_case_id: v.string(),               // Which test case
    tested_config: v.any(),                 // The config being tested
    generation_number: v.optional(v.number()), // For evolutionary algorithms
    
    // === RESULTS (denormalized for queries) ===
    experiment_score: v.number(),           // Performance (0-1)
    test_passed: v.boolean(),               // Success flag
    
    // === DETAILED METRICS ===
    latency_ms: v.optional(v.number()),     // Timing
    cost_usd: v.optional(v.number()),       // API/compute cost
    full_metrics: v.optional(v.any()),      // Additional metrics
    
    // === AUDIT TRAIL ===
    session_id: v.optional(v.string()),     // Session that ran this
    experiment_timestamp: v.number(),       // When experiment ran
    
    createdAt: v.number(),
  })
    .index("by_run", ["optimization_run_id"])
    .index("by_system", ["system_name"])
    .index("by_system_score", ["system_name", "experiment_score"])
    .index("by_run_generation", ["optimization_run_id", "generation_number"])
    .index("by_timestamp", ["experiment_timestamp"]),

  // ============================================================================
  // OPTIMIZATION RUNS - High-level run metadata
  // ============================================================================
  /**
   * Summary of each optimization run
   * 
   * Purpose:
   * - Track optimization progress and completion
   * - Aggregate stats across all experiments in run
   * - Link to winning configs promoted to production
   * - Dashboard queries (recent runs, best performers)
   */
  convergence_optimization_runs: defineTable({
    // === IDENTIFICATION ===
    run_id: v.string(),
    system_name: v.string(),
    algorithm_name: v.string(),
    
    // === TIMING ===
    run_started_at: v.number(),
    run_completed_at: v.optional(v.number()),
    total_duration_ms: v.optional(v.number()),
    
    // === AGGREGATED RESULTS (denormalized for dashboards) ===
    total_experiments_run: v.number(),
    best_experiment_score: v.number(),
    avg_experiment_score: v.number(),
    experiments_by_generation: v.optional(v.any()), // Evolution tracking
    
    // === WINNER REFERENCES ===
    winning_config_id: v.optional(v.id("convergence_configs")), // Promoted config
    winning_config_snapshot: v.optional(v.any()),               // Best config found
    
    // === EVOLUTION METADATA ===
    total_generations: v.optional(v.number()),     // For evolutionary algorithms
    convergence_achieved: v.optional(v.boolean()), // Did it converge?
    
    createdAt: v.number(),
  })
    .index("by_run_id", ["run_id"])
    .index("by_system", ["system_name"])
    .index("by_best_score", ["system_name", "best_experiment_score"]),

  // ============================================================================
  // PRODUCTION CONFIGS - Winners for Agent Use (INTERFACE)
  // ============================================================================
  /**
   * Convergence Configs - Production-ready optimized configurations
   * 
   * THIS IS THE INTERFACE between Convergence and HeyContext agents
   * 
   * Purpose:
   * - Store winning configs promoted from optimization runs
   * - Enable vector search for contextual config retrieval
   * - Track production usage and success rates
   * - Feed RL signals back into next optimization cycle
   * 
   * Systems:
   * - MAB parameters (context enrichment, crystal thresholds)
   * - Tool workflow bundles (Reddit tools, search tools)
   * - AI model configs (Azure O1, temperature settings)
   * - Any parameter combinations requiring optimization
   * 
   * Agents fetch these via vector search based on context
   */
  convergence_configs: defineTable({
    // System identification
    system_name: v.string(),  // "context_enrichment", "crystal_thresholds_evolution", "reddit_tools"
    config_type: v.string(),  // Flexible string instead of union
    
    // Configuration data
    params: v.any(),  // The actual configuration (flexible structure)
    
    // Vector search (optional - for context-based retrieval)
    contextTag: v.optional(v.string()),        // Hybrid context tag (deterministic + semantic)
    embedding: v.optional(v.array(v.number())), // Vector embedding for similarity search
    
    // Performance metrics
    score: v.number(),              // Overall performance score (0-1)
    rank: v.number(),               // Rank among configs for this system (1 = best)
    test_cases_passed: v.number(),  // Number of test cases passed
    test_cases_total: v.number(),   // Total test cases evaluated
    
    // Convergence metadata
    optimization_run_id: v.string(),    // Links to Convergence run
    algorithm_used: v.string(),         // "mab_evolution", "grid_search", etc.
    generation: v.optional(v.number()), // Generation number if evolutionary
    
    // Evaluation breakdown
    metrics: v.optional(v.any()),  // Flexible metrics object
    
    // Deployment tracking
    status: v.string(),  // Flexible string instead of union
    deployed_at: v.optional(v.number()),
    archived_at: v.optional(v.number()),
    promotion_id: v.optional(v.string()),     // Idempotency key for config promotion
    
    // Usage tracking
    usage_count: v.optional(v.number()),      // Times this config was used
    success_rate: v.optional(v.number()),     // Success rate in production
    last_used: v.optional(v.number()),
    
    // Version control
    version: v.string(),                      // Config version (for rollback)
    replaces_config_id: v.optional(v.string()), // Previous config it replaces
    // RL tracking
    rl_episodes: v.optional(v.number()),      // Episodes recorded for RL
    rl_reward_sum: v.optional(v.number()),    // Accumulated reward scores
    rl_last_update: v.optional(v.number()),   // Timestamp of last RL update
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_system", ["system_name"])
    .index("by_system_rank", ["system_name", "rank"])
    .index("by_system_status", ["system_name", "status"])
    .index("by_type", ["config_type"])
    .index("by_score", ["system_name", "score"])
    .index("by_optimization_run", ["optimization_run_id"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["system_name", "status"],
    }),
  // Convergence Storage - Generic key-value storage for Convergence framework
  convergence_storage: defineTable({
    key: v.string(),
    value: v.string(),
    timestamp: v.string(),
    serializer: v.string(),
    created_at: v.number(),
  })
  .index("by_key", ["key"])
  .index("by_created_at", ["created_at"]),

  // Translations - Progressive translation cache for all languages
  translations: defineTable({
    // Cache key
    sourceText: v.string(),           // Original text (usually English)
    sourceTextHash: v.string(),       // SHA-256 hash for fast lookup
    sourceLang: v.string(),           // ISO 639-1 code (e.g., "en")
    targetLang: v.string(),           // ISO 639-1 code (e.g., "ko", "ja", "es")
    
    // Translation
    translatedText: v.string(),       // The translated text
    translationMethod: v.union(       // How it was translated
      v.literal("ai"),                // AI-generated (Gemini)
      v.literal("manual"),            // Manually entered
      v.literal("edited")             // AI-generated, then manually edited
    ),
    
    // Context (helps with context-aware translation)
    context: v.optional(v.string()),  // Where it's used (e.g., "button.save", "heading.welcome")
    componentPath: v.optional(v.string()), // Component path for tracking
    
    // Usage tracking
    usageCount: v.number(),           // How many times requested
    firstUsedAt: v.number(),          // When first user encountered this
    lastUsedAt: v.number(),           // Most recent request
    
    // Quality control
    verified: v.boolean(),            // Manually verified/approved
    needsReview: v.optional(v.boolean()), // Flagged for review
    version: v.number(),              // For translation updates/improvements
    
    // Metadata
    translatedBy: v.optional(v.string()), // userId who first triggered or manually edited
    reviewedBy: v.optional(v.string()),   // userId who verified
    notes: v.optional(v.string()),        // Admin notes about translation
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_hash_and_lang", ["sourceTextHash", "targetLang"])
    .index("by_source_and_lang", ["sourceText", "targetLang"])
    .index("by_usage", ["usageCount"])
    .index("by_target_lang", ["targetLang"])
    .index("by_verification", ["verified", "targetLang"])
    .index("by_needs_review", ["needsReview"])
    .index("by_version", ["sourceTextHash", "targetLang", "version"]),

  // Subscription Plans - Static plan data cached from Stripe
  subscription_plans: defineTable({
    // Plan identification
    planKey: v.string(),              // "free", "basic", "pro"
    planName: v.string(),             // "Free", "Basic", "Pro"
    
    // Interval-specific pricing
    interval: v.union(
      v.literal("month"),
      v.literal("year")
    ),
    
    // Stripe integration
    priceId: v.string(),              // Stripe price ID (flat fee)
    productId: v.string(),            // Stripe product ID
    meteredPriceId: v.optional(v.string()), // Stripe metered price ID (usage-based)
    
    // Pricing
    amount: v.number(),               // Price in cents
    currency: v.string(),             // "usd", "eur", etc.
    
    // Usage limits
    includedRequests: v.number(),     // Included API requests per period
    overage: v.number(),              // Overage price per request (0 for free tier)
    
    // Features
    features: v.array(v.string()),    // List of feature descriptions
    
    // Metering configuration
    isMetered: v.boolean(),           // Whether this plan has usage-based billing
    
    // Metadata
    active: v.boolean(),              // Whether this plan is available for signup
    sortOrder: v.number(),            // Display order (0 = first)
    
    createdAt: v.number(),
    updatedAt: v.number(),
    lastSyncedAt: v.number(),         // When plan was last synced from backend
  })
    .index("by_plan_key", ["planKey"])
    .index("by_plan_key_interval", ["planKey", "interval"])
    .index("by_active", ["active", "sortOrder"])
    .index("by_price_id", ["priceId"]),
});

