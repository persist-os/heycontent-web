"use node";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Background Jobs
import { jobTypeValidator, jobStatusValidator, jobPriorityValidator } from "./types/backgroundJobs";

// Embeddings
import { contentTypeValidator } from "./types/embeddings";
import { embeddingQueueSchemaFields } from "./types/embeddingQueue";
import { contentEmbeddingSchemaFields } from "./types/contentEmbedding";
import { embeddingUpdateSchemaFields } from "./types/embeddingUpdate";
import { embeddingSyncSchemaFields } from "./types/embeddingSync";

// Crystal System
import { crystalSchemaFields } from "./types/crystal";
import { crystalShardSchemaFields, shardStatusValidator, shardRecencyWeightValidator } from "./types/shard";
import { stardustSchemaFields } from "./types/stardust";
import { crystalCacheSchemaFields } from "./types/crystalCache";
import { crystalFormationRunSchemaFields } from "./types/crystalFormationRun";

// Cognitive Field System
import { cognitiveFieldSchemaFields } from "./types/cognitiveField";

// Projects
import { projectSchemaFields } from "./types/project";
import { projectFingerprintSchemaFields } from "./types/projectFingerprint";
import { fingerprintEvolutionHistorySchemaFields } from "./types/fingerprintEvolutionHistory";
import { fingerprintEvolutionSignalSchemaFields } from "./types/fingerprintEvolutionSignal";

// Prompts (Universal Prompt System)
import { promptSchemaFields } from "./types/prompt";

// Widgets
import { widgetSchemaFields, projectWidgetsSchemaFields } from "./types/widgets";
import { widgetOutputSchemaFields } from "./types/widgetOutput";
import { widgetQuestionSchemaFields } from "./types/widgetQuestion";

// Artifacts
import { artifactSchemaFields } from "./types/artifact";

// Briefing System
import { briefingEventSchemaFields } from "./types/briefingEvent";
import { briefingPreferencesSchemaFields } from "./types/briefingPreferences";
import { briefingClusterSchemaFields } from "./types/briefingCluster";

// Convergence
import { 
  optimizationExperimentSchemaFields,
  optimizationRunSchemaFields 
} from "./types/convergenceStorage";

// User System
import { userSchemaFields } from "./types/user";
import { ambientInsightSchemaFields } from "./types/ambientInsight";
import { folderSchemaFields } from "./types/folder";
import { userPreferenceSchemaFields } from "./types/userPreference";
import { userActivityCounterSchemaFields } from "./types/userActivityCounter";

// Conversations & Notes
import { conversationSchemaFields } from "./types/conversation";
import { messageSchemaFields } from "./types/message";
import { noteSchemaFields } from "./types/note";
import { conversationSummarySchemaFields } from "./types/conversationSummary";
import { sharedNoteSchemaFields } from "./types/sharedNote";

// Intelligence System
import { crystalIntelligenceSchemaFields } from "./types/crystalIntelligence";
import { intelligenceJobSchemaFields } from "./types/intelligenceJob";

// Translations & Subscriptions
import { translationSchemaFields } from "./types/translation";
import { subscriptionPlanSchemaFields } from "./types/subscriptionPlan";

// Data Imports
import { dataImportSchemaFields } from "./types/dataImport";

// API & Infrastructure
import { apiKeySchemaFields } from "./types/apiKey";
import { rateLimitSchemaFields } from "./types/rateLimit";
import { usageEventSchemaFields } from "./types/usageEvent";
import { feedbackSchemaFields } from "./types/feedback";
import { referralSchemaFields } from "./types/referral";
import { agnoRunEventSchemaFields } from "./types/agnoRunEvent";

// Social Features
import { friendshipSchemaFields } from "./types/friendship";
import { sharedContentSchemaFields } from "./types/sharedContent";

// Convergence Advanced
import { convergencePresetConfigSchemaFields } from "./types/convergencePresetConfig";
import { convergenceCurrentConfigSchemaFields } from "./types/convergenceCurrentConfig";
import { convergenceBestConfigSchemaFields } from "./types/convergenceBestConfig";

// Webhooks
import { webhookEventSchemaFields } from "./types/webhookEvent";

// Background Jobs
import { backgroundJobSchemaFields } from "./types/backgroundJob";

// Intelligence System - MAB
import { intelligenceConfigSchemaFields } from "./types/intelligenceConfig";
import { intelligenceBanditArmSchemaFields } from "./types/intelligenceBanditArm";
import { intelligenceBanditDecisionSchemaFields } from "./types/intelligenceBanditDecision";

// Context Enrichment MAB
import { contextEnrichmentArmSchemaFields } from "./types/contextEnrichmentArm";
import { contextEnrichmentDecisionSchemaFields } from "./types/contextEnrichmentDecision";

// Context Usage Tracking
import { contextUsageSchemaFields } from "./types/contextUsage";

export default defineSchema({
  // User Info
  users: defineTable(userSchemaFields)
  .index("by_userId", ["userId"])
  .index("by_email", ["email"])
  .index("by_stripeCustomerId", ["stripeCustomerId"])
  .index("by_username", ["username"])
  .index("by_referralCode", ["referralCode"])
  .index("by_role", ["role"]),

  // Ambient Insights
  ambientInsights: defineTable(ambientInsightSchemaFields)
  .index("by_userId", ["userId"]),



  // Chat conversations - Simplified after messages migration
  conversations: defineTable(conversationSchemaFields)
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_user_project", ["userId", "projectId"])
  .index("by_user_widget", ["userId", "widgetId"])
  .index("by_widget_output", ["widgetOutputId"])
  .index("by_project", ["projectId"])
  .index("by_type", ["conversationType"]),

  // Chat messages - Individual message entries (NEW)
  messages: defineTable(messageSchemaFields)
  .index("by_conversation", ["conversationId", "sequence"])  // Primary access pattern
  .index("by_conversation_role", ["conversationId", "role"])
  .index("by_user", ["userId", "createdAt"])
  .index("by_timestamp", ["timestamp"])
  .index("by_user_timestamp", ["userId", "timestamp"]),

  // Notes
  notes: defineTable(noteSchemaFields)
  .index("by_user", ["userId"])
  .index("by_creation", ["createdAt"])
  .index("by_type", ["type"])
  .index("by_folder", ["folderId"])
  .index("by_widget", ["widgetId"])
  .index("by_widget_output", ["widgetOutputId"]),

  // Folders
  folders: defineTable(folderSchemaFields)
  .index("by_user", ["userId"])
  .index("by_parent", ["parentFolderId"])
  .index("by_user_parent", ["userId", "parentFolderId"])
  .index("by_creation", ["createdAt"]),

  // Shared Notes - for collaborative note access
  shared_notes: defineTable(sharedNoteSchemaFields)
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
  // ============================================================================
  projects: defineTable(projectSchemaFields)
  .index("by_user", ["userId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_creation", ["createdAt"]),

  // API Keys
  api_keys: defineTable(apiKeySchemaFields)
    .index("by_user_id", ["user_id"])
    .index("by_user_and_client", ["user_id", "clientType"]),

  // Rate Limits
  rate_limits: defineTable(rateLimitSchemaFields)
  .index("by_user_resource", ["user_id", "resource"]),


  // Usage Events
  usageEvents: defineTable(usageEventSchemaFields)
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_endpoint", ["endpoint"])
  .index("by_status", ["status"]),

  // Agno Telemetry
  agnoRunEvents: defineTable(agnoRunEventSchemaFields)
  .index("by_run", ["runId"])
  .index("by_agent_time", ["agentId", "createdAt"])
  .index("by_user_time", ["userId", "createdAt"])
  .index("by_agentType_time", ["agentType", "createdAt"]),



  // Vector embeddings for search
  contentEmbeddings: defineTable(contentEmbeddingSchemaFields)
  .index("by_userId", ["userId"])
  .index("by_contentType", ["contentType"])
  .index("by_user_type", ["userId", "contentType"])
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 768,
    filterFields: ["userId", "contentType"],
  }),





  // Embedding update tracking
  embeddingUpdates: defineTable(embeddingUpdateSchemaFields)
  .index("by_userId", ["userId"])
  .index("by_updatedAt", ["updatedAt"])
  .index("by_type", ["type"])
  .index("by_user_type", ["userId", "type"]),

  // Automatic embedding queue for reliable processing
  embeddingQueue: defineTable(embeddingQueueSchemaFields)
  .index("by_userId", ["userId"])
  .index("by_platform", ["platform"])
  .index("by_priority", ["priority"])
  .index("by_createdAt", ["createdAt"])
  .index("by_processedAt", ["processedAt"])
  .index("by_user_platform", ["userId", "platform"]),

  // Embedding sync tracking for self-healing
  embeddingSyncs: defineTable(embeddingSyncSchemaFields)
  .index("by_userId", ["userId"])
  .index("by_syncType", ["syncType"])
  .index("by_status", ["status"])
  .index("by_startedAt", ["startedAt"])
  .index("by_user_status", ["userId", "status"]),

  // Feedback System
  feedback: defineTable(feedbackSchemaFields)
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_user", ["userId"])
  .index("by_created", ["createdAt"])
  .index("by_priority", ["priority"])
  .index("by_assigned", ["assignedTo"])
  .index("by_user_status", ["userId", "status"])
  .index("by_type_status", ["type", "status"])
  // === NEW INDEXES FOR CONTENT FEEDBACK ===
  .index("by_entity", ["entityType", "entityId"])
  .index("by_rating", ["rating"])
  .index("by_user_entity", ["userId", "entityType"])
  .index("by_entity_created", ["entityType", "createdAt"])
  .index("by_user_rating", ["userId", "rating"])
  .index("by_entity_rating", ["entityType", "rating"]),

  // Referrals tracking
  referrals: defineTable(referralSchemaFields)
  .index("by_referrer", ["referrerId"])
  .index("by_total_referred", ["totalReferred"]),

  // Project Fingerprints - Universal AI project intelligence
  project_fingerprints: defineTable(projectFingerprintSchemaFields)
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_domain", ["domain"])
  .index("by_status", ["status"])
  .index("by_creation", ["created_at"])
  .index("by_evolution", ["last_evolution"]),

  // Fingerprint Evolution History - Separate table for AI access and querying
  fingerprint_evolution_history: defineTable(fingerprintEvolutionHistorySchemaFields)
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
  widgets: defineTable(widgetSchemaFields)
  .index("by_project", ["projectId"])
  .index("by_user", ["userId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_category", ["projectId", "category"])
  .index("by_status", ["projectId", "status"])
  .index("by_widget_id", ["projectId", "widget_id"]) // For legacy lookups
  .index("by_created", ["createdAt"])
  .index("by_schedule", ["nextScheduledRun", "scheduleEnabled"])
  .index("by_workflow_stage", ["projectId", "workflowStage"]), // For orchestration queries - camelCase

  // ============================================================================
  // PROJECT WIDGET LAYOUTS - Layout configuration and categories
  // Stores global layout settings, no individual widget data
  // ============================================================================
  project_widgets: defineTable(projectWidgetsSchemaFields)
  .index("by_project", ["projectId"])
  .index("by_fingerprint", ["fingerprintId"])
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_created", ["createdAt"]),

  // Widget Outputs - Generated deliverables from widget execution
  widget_outputs: defineTable(widgetOutputSchemaFields)
    .index("by_widget", ["widgetId"])
    .index("by_project", ["projectId"])
    .index("by_output_id", ["outputId"])
    .index("by_rating", ["widgetId", "userRating"])  // For analyzing widget quality
    .index("by_user", ["userId"]),

  // Widget Questions (for proactive widget input requests)
  widget_questions: defineTable(widgetQuestionSchemaFields)
    .index("by_widget", ["widgetId"])
    .index("by_project", ["projectId"])
    .index("by_status", ["status"])
    .index("by_project_status", ["projectId", "status"]),

  // Artifacts - Generated content from families (clean separation from execution tracking)
  artifacts: defineTable(artifactSchemaFields)
    .index("by_project", ["projectId"])
    .index("by_widget", ["widgetId"])
    .index("by_user", ["userId"]),

  // Conversation Summaries - Real-time conversation analysis
  conversation_summaries: defineTable(conversationSummarySchemaFields)
  .index("by_user", ["userId"])
  .index("by_project", ["projectId"])
  .index("by_segment", ["segmentId"])
  .index("by_created", ["createdAt"])
  .index("by_user_project", ["userId", "projectId"]),

  // Friendships - User friendship management
  friendships: defineTable(friendshipSchemaFields)
  .index("by_userId1", ["userId1"])
  .index("by_userId2", ["userId2"])
  .index("by_status", ["status"])
  .index("by_requestedBy", ["requestedBy"])
  .index("by_user_pair", ["userId1", "userId2"])
  .index("by_user1_status", ["userId1", "status"])
  .index("by_user2_status", ["userId2", "status"]),

  // Shared Content - Universal content sharing between users
  shared_content: defineTable(sharedContentSchemaFields)
  .index("by_contentId", ["contentId"])
  .index("by_ownerId", ["ownerId"])
  .index("by_sharedWithUserId", ["sharedWithUserId"])
  .index("by_contentType", ["contentType"])
  .index("by_content_user", ["contentId", "sharedWithUserId"])
  .index("by_owner_type", ["ownerId", "contentType"])
  .index("by_shared_user_type", ["sharedWithUserId", "contentType"])
  .index("by_active", ["isActive"]),

  // User Preferences - User privacy and notification settings
  user_preferences: defineTable(userPreferenceSchemaFields)
  .index("by_userId", ["userId"]),

  // Crystal Cache - Intelligent caching for frequently accessed crystal data
  crystalCache: defineTable(crystalCacheSchemaFields)
  .index("by_user", ["userId"])
  .index("by_user_key", ["userId", "cacheKey"])
  .index("by_type", ["cacheType"])
  .index("by_expiration", ["expiresAt"])
  .index("by_access", ["lastAccessed"]),

  crystal_shards: defineTable(crystalShardSchemaFields)
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
    crystals: defineTable(crystalSchemaFields)

      .index("by_user", ["userId"])
      .index("by_dimension", ["userId", "dimension"])
      .index("by_confidence", ["userId", "confidence_score"])
      .index("by_type", ["userId","crystal_type"])
      .index("by_usage", ["userId", "usage_frequency"])
    .index("by_review_due", ["userId", "next_review_due"])
    .index("by_lifecycle", ["userId", "lifecycleStage"])
    .index("by_project", ["projectId"])
    .index("by_user_project", ["userId", "projectId"])
    .index("by_widget", ["widgetId"]),
    
    // === STARDUST TABLE (PARALLEL SPECIES: "WHAT YOU DO") ===
    // Stardust represents concrete project potentials that evolve into star organisms
    // Parallel species to Crystals: Crystals = "Who You Are", Stardust = "What You Do"
    // Code-based detection (zero LLM cost), flows through crystal dam alongside shards
    stardust: defineTable(stardustSchemaFields)
      .index("by_user", ["userId"])
      .index("by_confidence", ["userId", "confidence"])
      .index("by_promoted", ["userId", "promoted"])
      .index("by_detected", ["userId", "detectedAt"])
      .index("by_lifecycle", ["userId", "lifecycleStage"])
      .index("by_domain", ["userId", "suggestedDomain"]),
    
    crystal_formation_runs: defineTable(crystalFormationRunSchemaFields)
      .index("by_user", ["userId"])
      .index("by_status", ["status"])
      .index("by_user_status", ["userId", "status"]),

    // === COGNITIVE FIELDS TABLE (REVOLUTIONARY REPLACEMENT FOR CRYSTALS) ===
    // Cognitive Fields are dynamic cognitive state containers that serve as shared
    // intelligence substrates between AIs and humans. Four-layer architecture:
    // Layer 1: Core Field (Machine Substrate) - Pure vectors, metrics, node links
    // Layer 2: Semantic Metadata (A2A Language) - Structured causal and relational meaning
    // Layer 3: Human Transparency (Read-Only) - Natural language explanations with data pointers
    // Layer 4: User Preferences (A2A Coordination) - How user wants things done and responses
    cognitive_fields: defineTable(cognitiveFieldSchemaFields)
      .index("by_user", ["userId"])
      .index("by_status", ["userId", "status"])
      .index("by_created", ["userId", "createdAt"])
      .index("by_updated", ["userId", "updatedAt"])
      .index("by_usage", ["userId", "usageCount"])
      .index("by_optimization", ["userId", "optimizationStrategy"])
      .index("by_archived", ["userId", "archived"]),

  // ========================================
  // CRYSTAL INTELLIGENCE SYSTEM
  // ========================================

  // Intelligence Configuration - Per-user settings for analysis triggers and preferences
  intelligence_config: defineTable(intelligenceConfigSchemaFields)
  .index("by_user", ["userId"])
  .index("by_next_scheduled", ["next_scheduled_analysis"]),

  // Activity Counters - Track user activity for trigger detection
  user_activity_counters: defineTable(userActivityCounterSchemaFields)
  .index("by_user", ["userId"])
  .index("by_pending", ["pending_analysis", "analysis_priority"]),

  // Crystal Intelligence State - Denormalized intelligence data for performance
  crystal_intelligence: defineTable(crystalIntelligenceSchemaFields)
  .index("by_user", ["userId"])
  .index("by_crystal", ["userId", "crystalId"])
  .index("by_last_analyzed", ["userId", "last_analyzed"])
  .index("by_analysis_depth", ["userId", "analysis_depth"]),

  // Intelligence Jobs - Background processing queue
  intelligence_jobs: defineTable(intelligenceJobSchemaFields)
  .index("by_user", ["userId"])
  .index("by_status", ["status", "priority", "scheduled_for"])
  .index("by_user_status", ["userId", "status"]),

  // ========================================
  // ASYNC JOB QUEUE SYSTEM (Redis-backed)
  // ========================================
  
  // Background Jobs - Redis Stream job tracking
  background_jobs: defineTable(backgroundJobSchemaFields)
  .index("by_user", ["userId"])
  .index("by_status", ["status"])
  .index("by_type", ["type"])
  .index("by_user_type_status", ["userId", "type", "status"])
  .index("by_job_id", ["jobId"]),

  // ========================================
  // MULTI-ARMED BANDIT (MAB) LEARNING SYSTEM
  // ========================================
  
  // Intelligence Bandit Arms - MAB trigger strategies per user
  intelligence_bandit_arms: defineTable(intelligenceBanditArmSchemaFields)
  .index("by_user", ["userId"])
  .index("by_user_arm", ["userId", "armId"])
  .index("by_performance", ["userId", "avg_reward"]),

  // Intelligence Bandit Decisions - Track every MAB trigger decision
  intelligence_bandit_decisions: defineTable(intelligenceBanditDecisionSchemaFields)
  .index("by_user", ["userId"])
  .index("by_triggered", ["triggered"])
  .index("by_decision_time", ["decisionAt"]),

  // ========================================
  // CONTEXT ENRICHMENT MAB - Learn optimal context strategies per user
  // ========================================
  
  // Context Enrichment Arms - MAB context strategies per user per agent type
  context_enrichment_arms: defineTable(contextEnrichmentArmSchemaFields)
  .index("by_user", ["userId"])
  .index("by_user_agent", ["userId", "agentType"])
  .index("by_user_agent_arm", ["userId", "agentType", "armId"])
  .index("by_performance", ["userId", "agentType", "avg_reward"]),

  // Context Enrichment Decisions - Track every context enrichment decision
  context_enrichment_decisions: defineTable(contextEnrichmentDecisionSchemaFields)
  .index("by_user", ["userId"])
  .index("by_user_agent", ["userId", "agentType"])
  .index("by_conversation", ["conversationId"])
  .index("by_decision_time", ["decisionAt"]),

  // Context Usage Logs - Track which context items powered which outputs
  context_usage_logs: defineTable(contextUsageSchemaFields)
  .index("by_user_and_time", ["userId", "timestamp"])
  .index("by_output", ["outputType", "outputId"])
  .index("by_user", ["userId"])
  .index("by_timestamp", ["timestamp"])
  .index("by_output_type", ["outputType"]),

  // Stripe Webhook Events Tracking
  webhook_events: defineTable(webhookEventSchemaFields)
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
  fingerprint_evolution_signals: defineTable(fingerprintEvolutionSignalSchemaFields)
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
  briefing_events: defineTable(briefingEventSchemaFields)
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
  briefing_preferences: defineTable(briefingPreferencesSchemaFields)
    .index("by_userId", ["userId"]),

  /**
   * Briefing Clusters - Groups of related briefings
   */
  briefing_clusters: defineTable(briefingClusterSchemaFields)
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "active"]),

  // ============================================================================
  // CONVERGENCE STORAGE SYSTEM
  // ============================================================================
  // Complete RL + Optimization pipeline for self-learning tool workflows
  // 
  // Flow: Experiments → Runs → Best Configs
  //
  // 1. convergence_optimization_experiments: Test workflow candidates
  // 2. convergence_optimization_runs: Run metadata and summaries  
  // 3. convergence_best_configs: One best config per system (promoted winners)
  // ============================================================================

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
   * - Feeds into convergence_best_configs (winners get promoted)
   * 
   * This is the RAW DATA that generates production configs
   */
  convergence_optimization_experiments: defineTable(optimizationExperimentSchemaFields)
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
  convergence_optimization_runs: defineTable(optimizationRunSchemaFields)
    .index("by_run_id", ["run_id"])
    .index("by_system", ["system_name"])
    .index("by_best_score", ["system_name", "best_experiment_score"]),

  // Translations - Progressive translation cache for all languages
  translations: defineTable(translationSchemaFields)
    .index("by_hash_and_lang", ["sourceTextHash", "targetLang"])
    .index("by_source_and_lang", ["sourceText", "targetLang"])
    .index("by_usage", ["usageCount"])
    .index("by_target_lang", ["targetLang"])
    .index("by_verification", ["verified", "targetLang"])
    .index("by_needs_review", ["needsReview"])
    .index("by_version", ["sourceTextHash", "targetLang", "version"]),

  // Subscription Plans - Static plan data cached from Stripe
  subscription_plans: defineTable(subscriptionPlanSchemaFields)
    .index("by_plan_key", ["planKey"])
    .index("by_plan_key_interval", ["planKey", "interval"])
    .index("by_active", ["active", "sortOrder"])
    .index("by_price_id", ["priceId"]),

  // Data Imports - Track one-time imports from external sources (ChatGPT, Claude)
  data_imports: defineTable(dataImportSchemaFields)
    .index("by_user_source", ["userId", "importSource"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_job_id", ["jobId"]),

  // Convergence Preset Configs - Pre-built optimization configurations
  convergence_preset_configs: defineTable(convergencePresetConfigSchemaFields)
    .index("by_preset_id", ["preset_id"])
    .index("by_name", ["name"]),

  // Current Convergence Config - Active configuration for optimization
  convergence_current_config: defineTable(convergenceCurrentConfigSchemaFields)
    .index("by_user_id", ["user_id"])
    .index("by_config_id", ["config_id"])
    .index("by_status", ["status"]),

  // Convergence Best Configs - One best config per system type
  convergence_best_configs: defineTable(convergenceBestConfigSchemaFields)
    .index("by_system_name", ["system_name"])
    .index("by_score", ["system_name", "score"])
    .index("by_run_id", ["optimization_run_id"]),

  /**
   * Universal Prompt System - Living, learning prompt blocks
   * 
   * Replaces static .txt files with queryable, versionable, learnable prompts.
   * 
   * Prompts are discovered via tags, not prescribed via hierarchy.
   * Effectiveness scores enable continuous learning and improvement.
   * 
   * Use cases:
   * - Platform identity prompts (all widgets inherit)
   * - Project-specific customizations
   * - Widget-owned prompts (portable)
   * - Operation-specific instructions
   * - Learned patterns (auto-discovered)
   */
  prompts: defineTable(promptSchemaFields)
    .index("by_tags", ["tags"])
    .index("by_scope", ["scope", "scopeId"])
    .index("by_effectiveness", ["effectiveness"])
    .index("by_type", ["type"])
    .index("by_scope_and_tags", ["scope", "tags"])
    .index("by_parent", ["parentId"]),
});
