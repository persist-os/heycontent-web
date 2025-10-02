"use node";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"]),



  // Chat conversations
  conversations: defineTable({
    userId: v.string(),
    title: v.string(),
    messages: v.array(v.object({
      content: v.string(),
      role: v.string(),
      timestamp: v.optional(v.number()),
      // Optional hidden context used during generation, never shown in UI
      context: v.optional(v.string()),
      // File attachments - metadata only, actual files in GCS
      fileAttachments: v.optional(v.array(v.object({
        file_url: v.string(),
        original_filename: v.string(),
        content_type: v.string(),
        file_size: v.number(),
        gcs_url: v.string(),
        uploaded_at: v.string(),
      }))),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
    starred: v.boolean(),
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"]),

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
  })
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_type", ["type"])
  .index("by_folder", ["folderId"]),

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
  projects: defineTable({
    userId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    noteIds: v.optional(v.array(v.string())),
    conversationIds: v.optional(v.array(v.string())),
    analysisIds: v.optional(v.array(v.string())),
    fingerprintId: v.optional(v.id("project_fingerprints")), // Links to project fingerprint
    createdAt: v.number(),
    updatedAt: v.number(),
    crystalIds: v.optional(v.array(v.string())),
    shardIds: v.optional(v.array(v.string())),
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
    complexity_level: v.optional(v.any()), // 1-10 scale
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
    learning_sensitivity: v.optional(v.any()), // How quickly to adapt (1-10)
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
  project_widgets: defineTable({
    // Required core fields
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),

    // Widget categories - flexible for AI generation
    categories: v.array(v.object({
      name: v.string(),
      icon: v.optional(v.string()),
      description: v.optional(v.string()),
      display_order: v.optional(v.number()),
    })),

    // Individual widgets - flexible for AI generation
    widgets: v.array(v.object({
      widget_id: v.string(),
      widget_type: v.string(), // Any widget type
      title: v.string(),
      description: v.optional(v.string()),
      category: v.string(),
      
      // Layout and appearance - flexible
      priority: v.number(),
      size: v.string(), // Any size
      theme: v.string(), // Any theme
      position: v.number(),
      
      // Configuration
      config: v.any(),
      data_sources: v.array(v.string()),
      update_frequency: v.string(), // Any frequency
      
      // Permissions
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
    })),

    // Global layout settings - flexible
    layout_type: v.string(), // Any layout type
    columns: v.number(),
    rows: v.number(),

    // Global appearance - flexible
    global_theme: v.string(), // Any theme
    color_scheme: v.string(), // Any color scheme
    font_style: v.string(), // Any font style

    // Customization settings
    allow_customization: v.boolean(),
    allow_reordering: v.boolean(),
    allow_resizing: v.boolean(),

    // Technical settings
    required_integrations: v.array(v.string()),
    data_refresh_strategy: v.string(), // Any strategy

    // Metadata - all required, set programmatically
    version: v.string(),
    confidence: v.number(), // 0-1, validated in mutation
    createdAt: v.optional(v.number()), // Unix timestamp, set programmatically (optional for migration)
    updatedAt: v.optional(v.number()), // Unix timestamp, set programmatically (optional for migration)
    status: v.string(), // Flexible status
    
    // Legacy AI fields (ignored but allowed for migration)
    generated_at: v.optional(v.union(v.string(), v.number())),
  })
  .index("by_project", ["projectId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]),

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

  // Shared Content - Content sharing between users
  shared_content: defineTable({
    contentType: v.union(
      v.literal("note"),
      v.literal("project")
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
      .index("by_unprocessed", ["userId", "shard_status", "createdAt"]),


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
      change_type: v.union(v.literal("strengthened"), v.literal("weakened"), v.literal("refined"), v.literal("contradicted"), v.literal("created")),
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
    
    // === ARCHIVAL FIELDS (FOR CAPACITY MANAGEMENT) ===
    archived: v.optional(v.boolean()),      // Optional: Whether this crystal has been archived
    archived_at: v.optional(v.number()),    // Optional: When this crystal was archived
  })

      .index("by_user", ["userId"])
      .index("by_dimension", ["userId", "dimension"])
      .index("by_confidence", ["userId", "confidence_score"])
      .index("by_type", ["userId","crystal_type"])
      .index("by_usage", ["userId", "usage_frequency"])
    .index("by_review_due", ["userId", "next_review_due"]),
    
    
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
    migrationType: v.string(), // "crystal_initial_generation", future migration types
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    attempts: v.optional(v.number()),
    lastAttemptAt: v.optional(v.number()),
    contentProcessed: v.optional(v.object({
      conversations: v.number(),
      notes: v.number(),
      totalItems: v.number()
    }))
  })
  .index("by_user_type", ["userId", "migrationType"])
  .index("by_type", ["migrationType"])
  .index("by_completion", ["completed"]),

  // ========================================
  // CRYSTAL INTELLIGENCE SYSTEM
  // ========================================

  // Intelligence Configuration - Per-user settings for analysis triggers and preferences
  intelligence_config: defineTable({
    userId: v.string(),
    
    // Trigger thresholds (configurable)
    triggers: v.object({
      chat_messages: v.number(),        // Default: 25
      smart_notes: v.number(),          // Default: 10
      crystal_formations: v.number(),   // Default: 5
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
    
    // Usage statistics (aggregated from usageEvents)
    usage: v.object({
      total_retrievals: v.number(),
      retrievals_last_7d: v.number(),
      retrievals_last_30d: v.number(),
      last_used: v.number(),
      usage_frequency: v.number(),
      contexts: v.array(v.string()),
      co_occurrence: v.optional(v.array(v.string())),
    }),
    
    // Relationship analysis (vector similarity based)
    relationships: v.object({
      related: v.array(v.object({
        crystalId: v.string(),
        similarity: v.number(),
        relationship_type: v.string(),
        confidence: v.number(),
      })),
      conflicting: v.array(v.object({
        crystalId: v.string(),
        conflict_score: v.number(),
        conflict_type: v.string(),
        resolution: v.optional(v.string()),
      })),
    }),
    
    // Contradiction analysis (shard-level)
    contradictions: v.object({
      shard_ids: v.array(v.string()),
      severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      patterns: v.array(v.string()),
      analysis: v.string(),
    }),
    
    // Health scoring (composite metric)
    health: v.object({
      overall_score: v.number(),
      components: v.object({
        evidence_strength: v.number(),
        usage_recency: v.number(),
        usage_frequency: v.number(),
        contradiction_impact: v.number(),
        age_factor: v.number(),
      }),
      trend: v.union(v.literal("improving"), v.literal("stable"), v.literal("declining")),
    }),
    
    // Lifecycle management
    lifecycle: v.object({
      review_priority: v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      ),
      next_review_due: v.number(),
      archival_candidate: v.boolean(),
      archival_reason: v.optional(v.string()),
      archival_confidence: v.optional(v.number()),
    }),
    
    // Metadata
    analysis_version: v.string(),
    last_analyzed: v.number(),
    analysis_depth: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_crystal", ["userId", "crystalId"])
  .index("by_health", ["userId", "health.overall_score"])
  .index("by_review_priority", ["userId", "lifecycle.review_priority"])
  .index("by_archival_candidate", ["userId", "lifecycle.archival_candidate"]),

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
    })),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_status", ["status", "priority", "scheduled_for"])
  .index("by_user_status", ["userId", "status"]),
});

