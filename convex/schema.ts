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
    // TEMPORARY: Fields to be removed by migration
    lastGmailFetch: v.optional(v.number()),
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


  // Personas
  personas: defineTable({
    current_name: v.string(),
    current_description: v.string(),
    experience_level: v.string(),
    content_formats: v.array(v.string()),
    content_tone: v.string(),
    content_voice: v.string(),
    content_pillars: v.array(v.string()),
    unique_value: v.string(),
    future_name: v.string(),
    future_description: v.string(),
    goals: v.array(v.string()),
    desired_impact: v.string(),
    primary_topics: v.array(v.string()),
    secondary_topics: v.array(v.string()),
    tone_descriptors: v.array(v.string()),
    style_descriptors: v.array(v.string()),
    audience_type: v.string(),
    engagement_style: v.array(v.string()),
    userId: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_userId", ["userId"])
  .index("by_active", ["isActive"]),

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
    // TEMPORARY: Fields to be removed by migration
    gmailIds: v.optional(v.array(v.string())),
    instagramPostIds: v.optional(v.array(v.string())),
    youtubeVideoIds: v.optional(v.array(v.string())),
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
      v.literal("note")
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
      v.literal("note")
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

    // AI-Discovered Project Nature (flattened for AI searchability)
    domain: v.string(), // "academic", "creative", "business", "skill_development"
    complexity_level: v.number(), // 1-10 scale
    collaboration_style: v.string(), // "solo", "small_team", "large_group", "community"
    time_horizon: v.string(), // "sprint", "project", "journey", "lifestyle"

    // AI-Generated Project Archetype (flattened)
    primary_pattern: v.string(), // "iterative_creator", "systematic_builder", "exploratory_learner"
    working_style: v.array(v.string()), // Array of working style preferences
    decision_making: v.string(), // How user approaches choices
    energy_patterns: v.string(), // When/how user works best

    // Intentions (User + AI refined)
    core_intention: v.string(), // The deep "why"
    success_vision: v.string(), // What success looks/feels like
    value_creation: v.string(), // What this creates for user/world
    personal_growth: v.array(v.string()), // How user wants to evolve through this

    // Dynamic Timeline (AI suggests, user refines)
    natural_rhythm: v.string(), // "daily", "weekly", "monthly", "seasonal", "milestone_driven"
    key_phases: v.array(v.object({
      name: v.string(),
      essence: v.string(), // What this phase is really about
      estimated_duration: v.string(),
      readiness_indicators: v.array(v.string()), // When to move to next phase
    })),
    flexibility_preference: v.string(), // "structured", "adaptive", "emergent"

    // Output Desires (AI helps articulate)
    tangible_deliverables: v.array(v.string()),
    intangible_benefits: v.array(v.string()),
    measurement_approach: v.string(), // How user wants to track progress
    sharing_intention: v.string(), // "private", "selective", "public", "community"

    // Interface Preferences (AI learns from behavior)
    cognitive_load_preference: v.string(), // "minimal", "rich", "customizable"
    information_density: v.string(), // "focused", "contextual", "comprehensive"
    motivation_style: v.array(v.string()), // What keeps user engaged
    feedback_frequency: v.string(), // How often user wants check-ins

    // Evolution Intelligence
    learning_sensitivity: v.number(), // How quickly to adapt (1-10)
    change_triggers: v.array(v.object({
      condition_type: v.string(),
      threshold: v.number(),
      response_style: v.string(),
    })),
    stability_zones: v.array(v.string()), // What should rarely change
    growth_edges: v.array(v.string()), // What should evolve actively

    // AI Agent Coordination
    morning_persona: v.object({
      energy_match: v.string(), // Matches user's morning energy
      focus_style: v.string(), // How to help user start days
      preparation_depth: v.string(),
    }),
    evening_persona: v.object({
      reflection_approach: v.string(), // How user processes
      consolidation_style: v.string(),
      transition_support: v.string(), // Help with day-to-night shift
    }),
    event_triggers: v.array(v.object({
      trigger_pattern: v.string(),
      response_personality: v.string(),
      coordination_rules: v.array(v.string()),
    })),

    // AI Prompt Generation
    base_personality: v.string(), // Derived from user persona
    project_voice: v.string(), // How AI should talk about THIS project
    question_generation_style: v.string(),
    suggestion_approach: v.string(),
    clarification_method: v.string(),

    // Dynamic Intelligence Fields (AI-generated based on project)
    dynamic_dimensions: v.array(v.object({
      dimension_name: v.string(), // e.g., "Research Depth", "Creative Flow", "Market Validation"
      dimension_type: v.string(), // "progress_tracker", "quality_metric", "decision_point", "resource_monitor"
      measurement_approach: v.string(),
      evolution_sensitivity: v.number(),
      ui_representation: v.string(), // How to show this in UI
    })),

    // Contextual Awareness
    user_constraints: v.array(v.string()), // Time, resources, skills
    external_dependencies: v.array(v.string()),
    support_systems: v.array(v.string()),
    potential_obstacles: v.array(v.string()),

    // Metadata
    created_at: v.number(),
    last_evolution: v.number(),
    intelligence_version: v.string(),
    status: v.string(), // "discovering", "active", "evolving", "completing", "archived"
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

  // Project Widgets - Personalized widgets for each project
  project_widgets: defineTable({
    projectId: v.id("projects"),
    fingerprintId: v.id("project_fingerprints"),
    userId: v.string(),

    // Dynamic categories/tabs
    categories: v.array(v.object({
      name: v.string(),
      icon: v.string(),
      description: v.string(),
    })),

    // Widget configuration
    widgets: v.array(v.object({
      widget_id: v.string(),
      widget_type: v.string(), // tracker, chart, board, timeline, meter, etc.
      title: v.string(),
      description: v.string(),
      category: v.string(), // Category/tab this widget belongs to
      priority: v.number(), // 1-10
      size: v.string(), // small, medium, large, xlarge
      theme: v.string(), // warm, clean, professional, creative
      position: v.number(), // Position in dashboard (1-based)
      config: v.any(), // Widget-specific configuration
      data_sources: v.array(v.string()),
      update_frequency: v.string(), // realtime, hourly, daily, weekly
      interactive: v.boolean(),
      editable: v.boolean(),
      shareable: v.boolean(),
    })),

    // Layout configuration
    layout_type: v.string(), // grid, dashboard, kanban, timeline
    columns: v.number(),
    rows: v.number(),

    // Theme and styling
    global_theme: v.string(),
    color_scheme: v.string(), // monochrome, colorful, pastel, vibrant
    font_style: v.string(), // modern, classic, playful, professional

    // Interaction settings
    allow_customization: v.boolean(),
    allow_reordering: v.boolean(),
    allow_resizing: v.boolean(),

    // Data integration
    required_integrations: v.array(v.string()),
    data_refresh_strategy: v.string(),

    // Metadata
    generated_at: v.number(),
    version: v.string(),
    confidence: v.number(), // 0-1 confidence in widget recommendations
    status: v.string(), // "generating", "active", "archived"
  })
  .index("by_project", ["projectId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_generated", ["generated_at"]),

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
    showPersonaToFriends: v.boolean(),
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

  crystal_shards: defineTable({
    // === CORE IDENTIFICATION ===
    userId: v.string(),
    shard_id: v.string(),                    // Unique identifier for referencing

    // === SOURCE METADATA ===
    source: v.string(),                      // "conversation_2024_01_15", "note_daily_review"
    sourceIds: v.array(v.string()),         // Multiple sources that contributed to this shard
    source_type: v.union(v.literal("conversation"), v.literal("note"), v.literal("document"), v.literal("behavior_observation")),
    extraction_timestamp: v.number(),
    extraction_method: v.union(v.literal("direct_quote"), v.literal("behavioral_inference"), v.literal("pattern_synthesis")),

    // === CORE REVELATION ===
    dimension: v.string(),                   // Identity dimension this touches
    exact_quote: v.string(),                // Their precise words
    what_it_reveals: v.string(),            // Qualitative interpretation
    situation_context: v.string(),          // What was happening
    why_significant: v.string(),            // Why this matters

    // === QUALITY INDICATORS ===
    confidence_level: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    linguistic_intensity: v.union(v.literal("weak"), v.literal("moderate"), v.literal("strong")), // "might" vs "always" vs "absolutely"
    emotional_weight: v.union(v.literal("neutral"), v.literal("mild"), v.literal("strong")),      // How much they seem to care
    specificity: v.union(v.literal("vague"), v.literal("specific"), v.literal("very_specific")),  // How detailed/concrete

    // === PATTERN CONNECTIONS ===
    connects_to: v.array(v.string()),       // Tags for connecting to other shards
    contradicts: v.array(v.string()),       // Shard IDs that conflict
    reinforces: v.array(v.string()),        // Shard IDs that support this

    // === TEMPORAL DATA ===
    temporal_context: v.string(),           // "during stressful periods", "when working on creative projects"
    recency_weight: v.union(v.literal("recent"), v.literal("moderate"), v.literal("old")), // How recent/relevant

    // === METADATA ===
    createdAt: v.number(),
    updatedAt: v.number(),
    last_referenced: v.number(),            // When this shard was last used in crystal formation
    reference_count: v.number(),            // How many crystals reference this shard
  })
      .index("by_user", ["userId"])
      .index("by_dimension", ["dimension"])
      .index("by_user_dimension", ["userId", "dimension"])
      .index("by_confidence", ["confidence_level"])
      .index("by_recency", ["recency_weight"])
      .index("by_user_recency", ["userId", "recency_weight"]),


// === COMPREHENSIVE CRYSTALS TABLE ===

    crystals: defineTable({
    // === CORE IDENTIFICATION ===
    userId: v.string(),
    crystal_id: v.string(),                 // Unique identifier

    // === CRYSTAL DEFINITION ===
    name: v.string(),                       // "Morning Productivity Pattern", "Direct Communication Preference"
    crystal_type: v.union(
        v.literal("stable_trait"),            // Enduring personality characteristic
        v.literal("behavioral_pattern"),      // How they consistently act
        v.literal("preference_cluster"),      // Related preferences that group together
        v.literal("value_system"),           // Core beliefs and values
        v.literal("contextual_adaptation"),  // How they adapt to different situations
        v.literal("growth_trajectory"),      // How they're evolving over time
        v.literal("contradiction_resolution") // How they handle internal conflicts
    ),

    dimension: v.string(),                  // Primary identity dimension
    secondary_dimensions: v.array(v.string()), // Other dimensions this crystal touches

    // === CONSOLIDATED INSIGHT ===
    description: v.string(),                // Comprehensive description of the pattern
    core_insight: v.string(),              // The key understanding in one sentence
    detailed_analysis: v.string(),         // Deep dive into what this means

    // === SUPPORTING EVIDENCE ===
    shardIds: v.array(v.id("crystal_shards")), // All supporting shards
    supporting_quotes: v.array(v.string()), // Supporting evidence

    // === CONFIDENCE & RELIABILITY ===
    confidence_score: v.union(v.literal("developing"), v.literal("moderate"), v.literal("high"), v.literal("very_high")),
    evidence_strength: v.union(v.literal("weak"), v.literal("moderate"), v.literal("strong"), v.literal("overwhelming")),
    consistency_rating: v.union(v.literal("inconsistent"), v.literal("mostly_consistent"), v.literal("very_consistent")),
    observation_count: v.number(),          // Number of times we've observed this pattern
    time_span_days: v.number(),            // How long we've been observing this pattern

    // === PATTERN METADATA ===
    tags: v.array(v.string()),             // Semantic tags for retrieval
    behavioral_implications: v.array(v.string()), // What this suggests they might do
    interaction_guidance: v.array(v.string()),    // How AI should adapt based on this

    // === CONTRADICTIONS & NUANCE ===
    contradicting_shards: v.array(v.id("crystal_shards")), // Shards that contradict this pattern
    contradiction_analysis: v.string(),     // How contradictions are resolved/understood

    // === EVOLUTION TRACKING ===
    evolution_history: v.array(v.object({
      timestamp: v.number(),
      change_type: v.union(v.literal("strengthened"), v.literal("weakened"), v.literal("refined"), v.literal("contradicted")),
      description: v.string(),
      triggering_shard_id: v.id("crystal_shards")
    })),
    stability_trend: v.union(v.literal("strengthening"), v.literal("stable"), v.literal("weakening"), v.literal("evolving")),
    last_evolution: v.number(),             // When this crystal last changed significantly

    // === CROSS-CRYSTAL RELATIONSHIPS ===
    related_crystals: v.array(v.id("crystals")), // Other crystals this connects to
    conflicting_crystals: v.array(v.id("crystals")), // Crystals that contradict this one

    // === UTILIZATION METADATA ===
    usage_count: v.number(),                // How many times this crystal has been used
    usage_frequency: v.number(),            // How often this crystal is referenced
    last_used: v.number(),                  // When this was last used for AI decisions

    // === METADATA ===
    createdAt: v.number(),
    updatedAt: v.number(),
    next_review_due: v.number(),            // When this crystal should be reviewed/updated
    review_priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
  })
      .index("by_user", ["userId"])
      .index("by_dimension", ["dimension"])
      .index("by_user_dimension", ["userId", "dimension"])
      .index("by_confidence", ["confidence_score"])
      .index("by_type", ["crystal_type"])
      .index("by_user_type", ["userId", "crystal_type"])
      .index("by_usage", ["usage_frequency"])
      .index("by_review_due", ["next_review_due"]),

});
