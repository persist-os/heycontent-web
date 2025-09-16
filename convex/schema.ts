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


  // Redefine these to be simpler
  // // Super simple schema
  // export default defineSchema({
  //   persona_traces: defineTable({
  //     userId: v.string(),
  //     content: v.any(),      // Backend-generated trace
  //     timestamp: v.number(),
  //     confidence: v.number()
  //   }),
  //
  //   persona_insights: defineTable({
  //     userId: v.string(),
  //     content: v.string(),   // Backend-generated insight
  //     category: v.string(),
  //     timestamp: v.number(),
  //     sources: v.array(v.id("persona_traces"))
  //   })
  // })

// No token dam table needed - backend manages in memory!
// No trigger tables needed - backend handles timing!
// No status tables needed - backend calculates on demand!

  // Persona Traces - Enhanced psychological traces for crystallization system
  persona_traces: defineTable({
    // Convex-specific fields
    user_id: v.string(),
    conversation_id: v.id("conversations"),
    // Backend PersonaTrace fields (exact structure)
    trace_id: v.string(),
    trace_type: v.string(), // Flexible string to support any trace type backend wants to send
    verbatim_quote: v.string(),
    extracted_insight: v.string(),
    confidence: v.number(),
    context: v.string(),
    temporal_weight: v.number(),
    preference_strength: v.number(),
    metadata: v.any(), // Flexible metadata for any trace type - backend can add any fields
    // Enhanced fields for crystallization system
    processing_version: v.optional(v.string()), // Track which version of processing extracted this
    quality_score: v.optional(v.number()), // Overall quality assessment of the trace
    semantic_tags: v.optional(v.array(v.string())), // Semantic categorization tags
    emotional_valence: v.optional(v.number()), // Emotional tone (-1 to 1)
    behavioral_consistency: v.optional(v.number()), // How consistent this trace is with other user behavior
    contradiction_flags: v.optional(v.union(v.array(v.string()), v.null())), // IDs of contradicting traces
    source_message_index: v.optional(v.number()), // Index of the message that generated this trace
    contextual_relevance: v.optional(v.number()), // Relevance within conversation context
    crystallization_priority: v.optional(v.number()), // Priority for crystallization processing
    last_accessed: v.optional(v.number()), // Timestamp of last access for optimization
  })
  .index("by_user", ["user_id"])
  .index("by_conversation", ["conversation_id"])
  .index("by_trace_type", ["trace_type"])
  .index("by_user_and_type", ["user_id", "trace_type"])
  .index("by_confidence", ["confidence"])
  // Enhanced indexes for backend query optimization and crystallization
  .index("by_user_confidence", ["user_id", "confidence"])
  .index("by_conversation_user", ["conversation_id", "user_id"])
  .index("by_trace_type_confidence", ["trace_type", "confidence"])
  .index("by_user_type_confidence", ["user_id", "trace_type", "confidence"])
  .index("by_quality_score", ["quality_score"])
  .index("by_user_quality", ["user_id", "quality_score"])
  .index("by_crystallization_priority", ["crystallization_priority"])
  .index("by_user_priority", ["user_id", "crystallization_priority"])
  .index("by_temporal_weight", ["temporal_weight"])
  .index("by_user_temporal", ["user_id", "temporal_weight"])
  .index("by_processing_version", ["processing_version"])
  .index("by_last_accessed", ["last_accessed"]),

  // Crystallized Insights - Stable psychological patterns derived from traces
  crystallized_insights: defineTable({
    user_id: v.string(),
    insight_type: v.string(),
    crystallized_insight: v.string(),
    crystallized_insight_embedding: v.optional(v.array(v.float64())), // Vector embedding for similarity search
    confidence: v.number(),
    supporting_traces: v.array(v.id("persona_traces")),
    contradiction_flags: v.union(v.array(v.string()), v.null()),
    evolution_history: v.array(v.object({
      timestamp: v.number(),
      event_type: v.union(
        v.literal("strengthened"),
        v.literal("weakened"), 
        v.literal("contradicted"),
        v.literal("refined")
      ),
      old_value: v.union(v.string(), v.null()),
      new_value: v.string(),
      trigger_trace_id: v.string(),
      confidence_change: v.number(),
      reason: v.string()
    })),
    temporal_stability: v.number(),
    cross_pattern_correlations: v.array(v.string()),
    metadata: v.any(), // Flexible metadata for any insight type - backend can add any fields
    created_at: v.number(),
    updated_at: v.number()
  })
  .index("by_user", ["user_id"])
  .index("by_type", ["insight_type"])
  .index("by_confidence", ["confidence"])
  .index("by_stability", ["temporal_stability"])
  // New indexes for backend query optimization
  .index("by_user_confidence", ["user_id", "confidence"])
  .index("by_user_type", ["user_id", "insight_type"])
  .index("by_user_stability", ["user_id", "temporal_stability"])
  .index("by_user_updated", ["user_id", "updated_at"])
  .index("by_type_confidence", ["insight_type", "confidence"])
  .index("by_user_type_confidence", ["user_id", "insight_type", "confidence"])
  .vectorIndex("by_insight", {
    vectorField: "crystallized_insight_embedding",
    dimensions: 768,
    filterFields: ["user_id", "insight_type"]
  }),

  // Persona Crystallization Triggers - Events to trigger frontend persona processing
  persona_crystallization_triggers: defineTable({
    user_id: v.string(),
    conversation_id: v.id("conversations"),
    trigger_type: v.string(), // "conversation_update", "message_added", "manual"
    metadata: v.any(), // Additional context about the trigger
    processed: v.boolean(), // Whether the frontend has processed this trigger
    created_at: v.number(),
    processed_at: v.optional(v.number())
  })
  .index("by_user", ["user_id"])
  .index("by_conversation", ["conversation_id"])
  .index("by_processed", ["processed"])
  .index("by_user_unprocessed", ["user_id", "processed"]),

  // Token Dam State - Single dam per user that accumulates tokens across all conversations
  token_dam_state: defineTable({
    userId: v.string(), // One dam per user
    // Current state
    currentTokens: v.number(), // Total tokens used across all user conversations
    tokenLimit: v.number(), // User's token limit based on subscription
    damStatus: v.union(
      v.literal("open"), // Normal flow
      v.literal("approaching"), // Near limit (80-95%)
      v.literal("full"), // At limit (95-100%)
      v.literal("blocked") // Over limit
    ),
    // Progress tracking
    percentageFull: v.number(), // 0-100 percentage of token limit used
    tokensRemaining: v.number(), // Calculated tokens left
    // Metadata
    lastMessageTokens: v.optional(v.number()), // Tokens from last message
    totalMessageCount: v.number(), // Total number of messages accumulated in dam
    lastUpdated: v.number(),
    createdAt: v.number(),
    // Processing state
    processingPaused: v.boolean(), // Whether processing is paused due to limits
    nextProcessingAllowed: v.optional(v.number()), // When next processing is allowed
    // Accumulated conversation data for processing
    accumulatedConversations: v.array(v.object({
      conversationId: v.id("conversations"),
      conversationTitle: v.string(), // Store title for easier reference
      tokensContributed: v.number(),
      messageCount: v.number(), // Track actual number of messages
      lastUpdate: v.number(),
      firstContribution: v.number() // When this conversation first contributed
    })),
  })
  .index("by_user", ["userId"])
  .index("by_status", ["damStatus"])
  .index("by_processing_paused", ["processingPaused"])
  .index("by_next_processing", ["nextProcessingAllowed"]),

  // Token Dam Processing History - Track processing events and decisions
  token_dam_processing_history: defineTable({
    userId: v.string(),
    conversationId: v.optional(v.id("conversations")), // Optional - some events affect entire dam
    damStateId: v.id("token_dam_state"),
    // Event details
    eventType: v.union(
      v.literal("message_processed"), // New message processed
      v.literal("dam_updated"), // Dam state changed
      v.literal("dam_processed"), // Dam processed and drained
      v.literal("processing_paused"), // Processing paused due to limits
      v.literal("processing_resumed"), // Processing resumed
      v.literal("limit_exceeded"), // Token limit exceeded
      v.literal("manual_trigger") // Manual processing triggered
    ),
    // Token tracking
    tokensBefore: v.number(),
    tokensAfter: v.number(),
    tokensDelta: v.number(),
    // Processing details
    processingAllowed: v.boolean(),
    reasonBlocked: v.optional(v.string()), // Why processing was blocked
    messageContent: v.optional(v.string()), // Preview of message content
    // Metadata
    timestamp: v.number(),
    requestId: v.optional(v.string()),
    metadata: v.optional(v.any()), // Additional context
  })
  .index("by_user", ["userId"])
  .index("by_conversation", ["conversationId"])
  .index("by_dam_state", ["damStateId"])
  .index("by_event_type", ["eventType"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"])
  .index("by_conversation_timestamp", ["conversationId", "timestamp"]),

  // Token Usage Statistics - Aggregate usage stats for monitoring
  token_usage_stats: defineTable({
    userId: v.string(),
    // Time period
    periodType: v.union(
      v.literal("daily"),
      v.literal("weekly"), 
      v.literal("monthly")
    ),
    periodStart: v.number(),
    periodEnd: v.number(),
    // Usage statistics
    totalTokensUsed: v.number(),
    totalMessages: v.number(),
    conversationsActive: v.number(),
    averageTokensPerMessage: v.number(),
    peakTokensPerConversation: v.number(),
    // Limit tracking
    tokenLimit: v.number(),
    percentageUsed: v.number(),
    timesLimitExceeded: v.number(),
    timesPaused: v.number(),
    // Performance metrics
    averageResponseTime: v.optional(v.number()),
    totalProcessingTime: v.optional(v.number()),
    // Metadata
    lastUpdated: v.number(),
    createdAt: v.number(),
  })
  .index("by_user", ["userId"])
  .index("by_period_type", ["periodType"])
  .index("by_period_start", ["periodStart"])
  .index("by_user_period", ["userId", "periodType"])
  .index("by_user_period_start", ["userId", "periodType", "periodStart"]),
});