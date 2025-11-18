/**
 * Widget Type Definitions
 * 
 * Defines individual widgets and their layout configurations for projects.
 * Each widget gets its own Convex ID for optimal queries and updates.
 */

import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Widget status validator
// ✅ Updated to include execution statuses that decision engine checks for
export const widgetStatusValidator = v.union(
  v.literal("pending"),     // Widget created, waiting for execution
  v.literal("ready"),        // Widget ready to execute
  v.literal("needs_input"),  // Widget paused, waiting for user input
  v.literal("working"),      // Widget currently executing
  v.literal("completed"),    // Widget finished successfully
  v.literal("failed"),       // Widget execution failed
  v.literal("active"),       // Legacy status (kept for compatibility)
  v.literal("archived"),     // Widget archived by user
  v.literal("deleted")       // Widget soft-deleted
);

// Widget run status validator
export const widgetRunStatusValidator = v.union(
  v.literal("idle"),
  v.literal("running"),
  v.literal("success"),
  v.literal("failed")
);

// Widget schedule frequency validator
export const widgetScheduleFrequencyValidator = v.union(
  v.literal("manual"),
  v.literal("hourly"),
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);

// Workflow stage validator
export const widgetWorkflowStageValidator = v.union(
  v.literal("gathering"),
  v.literal("analysis"),
  v.literal("synthesis"),
  v.literal("tracking"),
  v.literal("reporting")
);

// Output artifact type validator
export const widgetOutputArtifactTypeValidator = v.union(
  v.literal("structured_list"),
  v.literal("report"),
  v.literal("analysis"),
  v.literal("summary"),
  v.literal("tracker"),
  v.literal("timeline"),
  v.literal("email")
);

// Schema fields for individual widgets (unwrapped for defineTable)
export const widgetSchemaFields = {
  // Foreign keys - establish relationships
  projectId: v.id("projects"),
  fingerprintId: v.any(),
  conversationId: v.optional(v.id("conversations")),
  userId: v.string(),
  
  // Widget identity
  widget_id: v.string(),
  widget_type: v.string(),
  title: v.string(),
  description: v.optional(v.string()),
  category: v.string(),
  
  // Layout and appearance (optional for backward compatibility - UI fields)
  priority: v.optional(v.number()),
  size: v.optional(v.string()),
  theme: v.optional(v.string()),
  position: v.optional(v.number()),
  
  // Configuration
  config: v.optional(v.any()),
  data_sources: v.array(v.string()),
  update_frequency: v.string(),
  
  // Permissions (optional - UI fields)
  interactive: v.optional(v.boolean()),
  editable: v.optional(v.boolean()),
  shareable: v.optional(v.boolean()),
  
  // Widget Capabilities (NEW - what widget agents can do)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  capabilities: v.optional(v.union(
    v.null(),
    v.object({
      can_extract: v.optional(v.array(v.string())),
      can_analyze: v.optional(v.array(v.string())),
      can_generate: v.optional(v.array(v.string())),
      can_track: v.optional(v.array(v.string())),
    })
  )),
  
  // NOTE: Execution history is now tracked in actions table (widget_execution_start, widget_execution_complete, widget_execution_failed)
  // Do NOT store execution_history here - query actions table instead
  
  // Family Identity (NEW - Phase 2: Widget as Family of Agents)
  familyIdentity: v.optional(v.object({
    familyName: v.string(),
    mission: v.string(),
    collaborationStyle: v.string(),
    qualityStandard: v.string(),
    executionType: v.optional(v.union(v.literal("standard"), v.literal("tool_based"))),  // Pattern 24: Tool-based execution routing
  })),
  
  // Agent Roster (NEW - Phase 2: Dynamic agent spawning)
  agentRoster: v.optional(v.array(v.object({
    agentId: v.string(),
    roleName: v.string(),
    personality: v.string(),
    responsibilities: v.array(v.string()),
    spawnCondition: v.string(),
    artifactType: v.optional(v.string()),  // ✅ Artifact type this agent generates
    tools: v.optional(v.array(v.string())),  // Pattern 24: Tools for tool-based agents (e.g., ["GmailTools"])
  }))),
  
  // ❌ NO artifact relationships here - widgets discover artifacts at runtime
  // ❌ NO sibling awareness here - widgets discover siblings at runtime
  // Background jobs handle all linkages dynamically
  
  // Execution tracking
  lastRunAt: v.optional(v.number()),
  lastRunStatus: v.optional(widgetRunStatusValidator),
  
  // Scheduling configuration
  scheduleEnabled: v.optional(v.boolean()),
  scheduleFrequency: v.optional(widgetScheduleFrequencyValidator),
  nextScheduledRun: v.optional(v.union(v.null(), v.number())),
  lastScheduledRun: v.optional(v.union(v.null(), v.number())),
  scheduledRunCount: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
  
  // Orchestration metadata - camelCase to match backend serialization
  inputRequirements: v.optional(v.array(v.string())),
  outputArtifacts: v.optional(v.array(v.object({
    type: widgetOutputArtifactTypeValidator,
    description: v.string(),
    feedsInto: v.array(v.string()),  // camelCase to match backend serialization
  }))),
  dependencyHints: v.optional(v.object({
    shouldRunAfter: v.optional(v.array(v.string())),
    shouldRunBefore: v.optional(v.array(v.string())),
    canRunParallelWith: v.optional(v.array(v.string())),
  })),
  executionProfile: v.optional(v.object({
    frequencySuggestion: v.string(),
    typicalDurationMinutes: v.number(),
    requiresRecentData: v.boolean(),
    skipIfNoActivity: v.boolean(),
  })),
  workflowStage: v.optional(widgetWorkflowStageValidator),
  
  // ✅ PHASE 2: Default artifact type for widget family
  defaultArtifactType: v.optional(widgetOutputArtifactTypeValidator),  // ✅ Default artifact type for agents without explicit type
  
  // ✅ PHASE 3: Dynamic prompt for tool executor (built from conversation)
  toolExecutorPrompt: v.optional(v.string()),  // Dynamic prompt stored in widget config
  
  // Widget status (legacy field - kept for backward compatibility)
  // NOTE: Status can also be computed from actions table, but stored here for compatibility
  status: v.optional(widgetStatusValidator),
  
  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Schema fields for project widget layouts (unwrapped for defineTable)
export const projectWidgetsSchemaFields = {
  // Foreign keys
  projectId: v.id("projects"),
  fingerprintId: v.any(),
  userId: v.string(),

  // Widget categories for organization
  categories: v.array(v.object({
    name: v.string(),
    icon: v.optional(v.string()),
    description: v.optional(v.string()),
    display_order: v.optional(v.number()),
  })),

  // Global layout settings
  layout_type: v.string(),
  columns: v.number(),
  rows: v.number(),

  // Global appearance
  global_theme: v.string(),
  color_scheme: v.string(),
  font_style: v.string(),

  // Customization settings
  allow_customization: v.boolean(),
  allow_reordering: v.boolean(),
  allow_resizing: v.boolean(),

  // Technical settings
  required_integrations: v.array(v.string()),
  data_refresh_strategy: v.string(),

  // Metadata
  version: v.string(),
  confidence: v.number(),
  status: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
  
  // Legacy AI field (for migration)
  generated_at: v.optional(v.union(v.string(), v.number())),
  
  // Legacy migration field - will be removed
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
    lastRunStatus: v.optional(widgetRunStatusValidator),
  }))),
};

// Category validator for batch operations
export const widgetCategoryValidator = v.object({
  name: v.string(),
  icon: v.optional(v.string()),
  description: v.optional(v.string()),
  display_order: v.optional(v.number()),
});

// Widget validator for batch create/update operations (excludes auto-generated fields)
// ✅ PHASE 2 TRANSITION: Old UI fields now optional for family-centric widgets
// ✅ CRITICAL: Uses camelCase to match Python's by_alias=True serialization
export const widgetBatchValidator = v.object({
  widgetId: v.string(),                       // ✅ camelCase (Python: widget_id → widgetId)
  widgetType: v.string(),                     // ✅ camelCase (Python: widget_type → widgetType)
  title: v.string(),
  description: v.optional(v.string()),
  category: v.optional(v.string()),           // ✅ Optional - family widgets may not have category
  priority: v.optional(v.number()),           // ✅ Optional - defaults can be set
  size: v.optional(v.string()),               // ✅ Optional - UI field
  theme: v.optional(v.string()),              // ✅ Optional - UI field
  position: v.optional(v.number()),           // ✅ Optional - UI field
  config: v.optional(v.any()),                // ✅ Optional - UI config
  dataSource: v.optional(v.array(v.string())), // ✅ Optional - camelCase
  updateFrequency: v.optional(v.string()),    // ✅ Optional - camelCase
  interactive: v.optional(v.boolean()),       // ✅ Optional - UI field
  editable: v.optional(v.boolean()),          // ✅ Optional - UI field
  shareable: v.optional(v.boolean()),         // ✅ Optional - UI field
  // Widget Capabilities (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  capabilities: v.optional(v.union(
    v.null(),
    v.object({
      can_extract: v.optional(v.array(v.string())),
      can_analyze: v.optional(v.array(v.string())),
      can_generate: v.optional(v.array(v.string())),
      can_track: v.optional(v.array(v.string())),
    })
  )),
  // NOTE: Execution history is now tracked in actions table - do NOT include execution_history here
  // Orchestration metadata (optional) - using camelCase to match backend
  inputRequirements: v.optional(v.array(v.string())),
  outputArtifacts: v.optional(v.array(v.object({
    type: widgetOutputArtifactTypeValidator,
    description: v.string(),
    feedsInto: v.array(v.string()),  // camelCase to match backend serialization
  }))),
  dependencyHints: v.optional(v.object({
    shouldRunAfter: v.optional(v.array(v.string())),
    shouldRunBefore: v.optional(v.array(v.string())),
    canRunParallelWith: v.optional(v.array(v.string())),
  })),
  executionProfile: v.optional(v.object({
    frequencySuggestion: v.string(),
    typicalDurationMinutes: v.number(),
    requiresRecentData: v.boolean(),
    skipIfNoActivity: v.boolean(),
  })),
  workflowStage: v.optional(widgetWorkflowStageValidator),
  // ✅ PHASE 2: Default artifact type for widget family
  defaultArtifactType: v.optional(widgetOutputArtifactTypeValidator),  // ✅ Default artifact type for agents without explicit type
  // ✅ PHASE 3: Dynamic prompt for tool executor (built from conversation)
  toolExecutorPrompt: v.optional(v.string()),  // Dynamic prompt stored in widget config
  // ✅ PHASE 2: Family Identity fields
  familyIdentity: v.optional(v.object({
    familyName: v.string(),
    mission: v.string(),
    collaborationStyle: v.string(),
    qualityStandard: v.string(),
    executionType: v.optional(v.union(v.literal("standard"), v.literal("tool_based"))),  // Pattern 24: Tool-based execution routing
  })),
  // ✅ PHASE 2: Agent Roster
  agentRoster: v.optional(v.array(v.object({
    agentId: v.string(),
    roleName: v.string(),
    personality: v.string(),
    responsibilities: v.array(v.string()),
    spawnCondition: v.string(),
    artifactType: v.optional(v.string()),  // ✅ Artifact type this agent generates
    tools: v.optional(v.array(v.string())),  // Pattern 24: Tools for tool-based agents (e.g., ["GmailTools"])
  }))),
  // Scheduling fields (for recurring widget execution)
  scheduleEnabled: v.optional(v.boolean()),
  scheduleFrequency: v.optional(widgetScheduleFrequencyValidator),
  nextScheduledRun: v.optional(v.union(v.null(), v.number())),
  lastScheduledRun: v.optional(v.union(v.null(), v.number())),
  scheduledRunCount: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
});

// Widget create validator (for single widget creation - extends batch validator)
export const widgetCreateValidator = v.object({
  projectId: v.id("projects"),
  fingerprintId: v.any(),
  userId: v.string(),
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
  // Widget Capabilities (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  capabilities: v.optional(v.union(
    v.null(),
    v.object({
      can_extract: v.optional(v.array(v.string())),
      can_analyze: v.optional(v.array(v.string())),
      can_generate: v.optional(v.array(v.string())),
      can_track: v.optional(v.array(v.string())),
    })
  )),
  // NOTE: Execution history is now tracked in actions table - do NOT include execution_history here
  // Scheduling fields (for recurring widget execution)
  scheduleEnabled: v.optional(v.boolean()),
  scheduleFrequency: v.optional(widgetScheduleFrequencyValidator),
  nextScheduledRun: v.optional(v.union(v.null(), v.number())),
  lastScheduledRun: v.optional(v.union(v.null(), v.number())),
  scheduledRunCount: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
});

// Widget update validator (all fields optional)
export const widgetUpdateValidator = v.object({
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  category: v.optional(v.string()),
  priority: v.optional(v.number()),
  size: v.optional(v.string()),
  theme: v.optional(v.string()),
  position: v.optional(v.number()),
  config: v.optional(v.any()),
  data_sources: v.optional(v.array(v.string())),
  update_frequency: v.optional(v.string()),
  interactive: v.optional(v.boolean()),
  editable: v.optional(v.boolean()),
  shareable: v.optional(v.boolean()),
  // Widget Capabilities (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  capabilities: v.optional(v.union(
    v.null(),
    v.object({
      can_extract: v.optional(v.array(v.string())),
      can_analyze: v.optional(v.array(v.string())),
      can_generate: v.optional(v.array(v.string())),
      can_track: v.optional(v.array(v.string())),
    })
  )),
    // NOTE: Execution history is now tracked in actions table - do NOT include execution_history here
    // NOTE: Status is now computed from actions table - do NOT include status here
    lastRunAt: v.optional(v.number()),
    lastRunStatus: v.optional(widgetRunStatusValidator),
    // ✅ PHASE 3: Dynamic prompt for tool executor (built from conversation)
    toolExecutorPrompt: v.optional(v.string()),  // Dynamic prompt stored in widget config
  // Scheduling fields (for recurring widget execution)
  scheduleEnabled: v.optional(v.boolean()),
  scheduleFrequency: v.optional(widgetScheduleFrequencyValidator),
  nextScheduledRun: v.optional(v.union(v.null(), v.number())),
  lastScheduledRun: v.optional(v.union(v.null(), v.number())),
  scheduledRunCount: v.optional(v.number()),
  requiresApproval: v.optional(v.boolean()),
  // Metadata fields
  updatedAt: v.optional(v.number()),
});

// Layout update validator (all fields optional)
export const projectWidgetsUpdateValidator = v.object({
  categories: v.optional(v.array(widgetCategoryValidator)),
  layout_type: v.optional(v.string()),
  columns: v.optional(v.number()),
  rows: v.optional(v.number()),
  global_theme: v.optional(v.string()),
  color_scheme: v.optional(v.string()),
  font_style: v.optional(v.string()),
  allow_customization: v.optional(v.boolean()),
  allow_reordering: v.optional(v.boolean()),
  allow_resizing: v.optional(v.boolean()),
  required_integrations: v.optional(v.array(v.string())),
  data_refresh_strategy: v.optional(v.string()),
  version: v.optional(v.string()),
  confidence: v.optional(v.number()),
});

// Wrapped validators for mutations/queries
export const widgetValidator = v.object(widgetSchemaFields);
export const projectWidgetsValidator = v.object(projectWidgetsSchemaFields);

// ============================================================================
// QUERY ARGUMENT VALIDATORS
// ============================================================================

// Get widget by Convex ID
export const getWidgetArgsValidator = v.object({
  widgetId: v.id("widgets"),
  userId: v.optional(v.string()),
});

// Get widget by string ID (legacy)
export const getWidgetByStringIdArgsValidator = v.object({
  projectId: v.id("projects"),
  widget_id: v.string(),
  userId: v.optional(v.string()),
});

// Get project widgets
export const getProjectWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
  includeArchived: v.optional(v.boolean()),
});

// Get widgets by category
export const getWidgetsByCategoryArgsValidator = v.object({
  projectId: v.id("projects"),
  category: v.string(),
  userId: v.optional(v.string()),
});

// Get user widgets
export const getUserWidgetsArgsValidator = v.object({
  userId: v.string(),
  limit: v.optional(v.number()),
});

// Get widgets by execution status
export const getWidgetsByExecutionStatusArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  status: widgetRunStatusValidator,
});

// Get widget count
export const getWidgetCountArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
  includeArchived: v.optional(v.boolean()),
});

// Search widgets
export const searchWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  searchTerm: v.string(),
  limit: v.optional(v.number()),
});

// Get recently updated widgets
export const getRecentlyUpdatedWidgetsArgsValidator = v.object({
  userId: v.string(),
  limit: v.optional(v.number()),
});

// Project widgets layout queries
export const getProjectWidgetLayoutArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

export const getProjectWidgetsByIdArgsValidator = v.object({
  widgetsId: v.id("project_widgets"),
  userId: v.optional(v.string()),
});

export const getProjectWidgetsByProjectArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

export const getWidgetByIdArgsValidator = v.object({
  projectId: v.id("projects"),
  widgetId: v.string(),
  userId: v.optional(v.string()),
});

export const getProjectWidgetsSummaryArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

export const hasWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.optional(v.string()),
});

// ============================================================================
// MUTATION ARGUMENT VALIDATORS
// ============================================================================

// Batch create widgets
export const batchCreateWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  fingerprintId: v.any(),
  userId: v.string(),
  widgets: v.array(widgetBatchValidator),
});

// Update widget
export const updateWidgetArgsValidator = v.object({
  widgetId: v.id("widgets"),
  userId: v.string(),
  updates: widgetUpdateValidator,
});

// Delete widget
export const deleteWidgetArgsValidator = v.object({
  widgetId: v.id("widgets"),
  userId: v.string(),
  hardDelete: v.optional(v.boolean()),
});

// Delete project widgets
export const deleteProjectWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  hardDelete: v.optional(v.boolean()),
});

// Archive/unarchive project widgets
export const archiveProjectWidgetsArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  archived: v.boolean(),
});

// Update widget execution
export const updateWidgetExecutionArgsValidator = v.object({
  widgetId: v.id("widgets"),
  userId: v.string(),
  status: widgetRunStatusValidator,
});

// Update widget layout
export const updateWidgetLayoutArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  updates: projectWidgetsUpdateValidator,
});

// Project widget mutations (for backward compatibility)
export const updateProjectWidgetArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  widgetId: v.id("widgets"),
  updates: widgetUpdateValidator,
});

export const deleteProjectWidgetArgsValidator = v.object({
  projectId: v.id("projects"),
  userId: v.string(),
  widgetId: v.id("widgets"),
});

// Type exports
// ✅ Updated to match widgetStatusValidator with all execution statuses
export type WidgetStatus = 
  | "pending"      // Widget created, waiting for execution
  | "ready"        // Widget ready to execute
  | "needs_input"  // Widget paused, waiting for user input
  | "working"      // Widget currently executing
  | "completed"    // Widget finished successfully
  | "failed"       // Widget execution failed
  | "active"       // Legacy status (kept for compatibility)
  | "archived"     // Widget archived by user
  | "deleted";     // Widget soft-deleted
export type WidgetRunStatus = "idle" | "running" | "success" | "failed";
export type WidgetScheduleFrequency = "manual" | "hourly" | "daily" | "weekly" | "monthly";
export type WidgetWorkflowStage = "gathering" | "analysis" | "synthesis" | "tracking" | "reporting";
export type WidgetOutputArtifactType = "structured_list" | "report" | "analysis" | "summary" | "tracker" | "timeline" | "email";

export interface WidgetCategory {
  name: string;
  icon?: string;
  description?: string;
  display_order?: number;
}

export interface WidgetOutputArtifact {
  type: WidgetOutputArtifactType;
  description: string;
  feeds_into: string[];
}

export interface WidgetDependencyHints {
  should_run_after?: string[];
  should_run_before?: string[];
  can_run_parallel_with?: string[];
}

export interface WidgetExecutionProfile {
  frequency_suggestion: string;
  typical_duration_minutes: number;
  requires_recent_data: boolean;
  skip_if_no_activity: boolean;
}

export interface Widget {
  projectId: string;
  fingerprintId: any;
  userId: string;
  widget_id: string;
  widget_type: string;
  title: string;
  description?: string;
  category: string;
  priority: number;
  size: string;
  theme: string;
  position: number;
  config: any;
  data_sources: string[];
  update_frequency: string;
  interactive: boolean;
  editable: boolean;
  shareable: boolean;
  lastRunAt?: number;
  lastRunStatus?: WidgetRunStatus;
  scheduleEnabled?: boolean;
  scheduleFrequency?: WidgetScheduleFrequency;
  nextScheduledRun?: number;
  lastScheduledRun?: number;
  scheduledRunCount?: number;
  requiresApproval?: boolean;
  input_requirements?: string[];
  output_artifacts?: WidgetOutputArtifact[];
  dependency_hints?: WidgetDependencyHints;
  execution_profile?: WidgetExecutionProfile;
  workflow_stage?: WidgetWorkflowStage;
  // NOTE: status is now computed from actions table - do NOT include here
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWidgets {
  projectId: string;
  fingerprintId: any;
  userId: string;
  categories: WidgetCategory[];
  layout_type: string;
  columns: number;
  rows: number;
  global_theme: string;
  color_scheme: string;
  font_style: string;
  allow_customization: boolean;
  allow_reordering: boolean;
  allow_resizing: boolean;
  required_integrations: string[];
  data_refresh_strategy: string;
  version: string;
  confidence: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  generated_at?: string | number;
  widgets?: any[];
}

// ============================================================================
// HELPER FUNCTIONS: Transform Validator Data to DB Schema Format
// ============================================================================

/**
 * Transform widgetBatchValidator data to widgetSchemaFields format
 * 
 * Validator uses camelCase (widgetId, dataSource, updateFrequency)
 * DB schema uses snake_case for old fields (widget_id, data_sources, update_frequency)
 * and camelCase for new fields (familyIdentity, agentRoster, etc.)
 * 
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md Pattern 16: Validator Centralization
 */
export function widgetValidatorToDbSchema(
  widget: {
    widgetId: string;
    widgetType: string;
    title: string;
    description?: string;
    category?: string;
    priority?: number;
    size?: string;
    theme?: string;
    position?: number;
    config?: any;
    dataSource?: string[];
    updateFrequency?: string;
    interactive?: boolean;
    editable?: boolean;
    shareable?: boolean;
    familyIdentity?: any;
    agentRoster?: any;
    defaultArtifactType?: string;
    toolExecutorPrompt?: string;
    capabilities?: any;
    // NOTE: execution_history is now tracked in actions table - do NOT include here
    inputRequirements?: string[];
    outputArtifacts?: any;
    dependencyHints?: any;
    executionProfile?: any;
    workflowStage?: string;
  },
  systemFields: {
    projectId: Id<"projects">;
    fingerprintId: any;
    userId: string;
    status: "active" | "pending" | "ready" | "needs_input" | "working" | "completed" | "failed" | "archived" | "deleted";
    createdAt: number;
    updatedAt: number;
  },
  options?: {
    defaultPosition?: number;  // For append operations
  }
): any {
  return {
    // === OLD FIELDS (snake_case in DB) ===
    widget_id: widget.widgetId,
    widget_type: widget.widgetType,
    title: widget.title,
    description: widget.description,
    category: widget.category ?? "general",
    priority: widget.priority ?? 5,
    size: widget.size ?? "medium",
    theme: widget.theme ?? "default",
    position: widget.position ?? options?.defaultPosition ?? 0,
    config: widget.config ?? {},
    data_sources: widget.dataSource ?? [],
    update_frequency: widget.updateFrequency ?? "on_demand",
    interactive: widget.interactive ?? true,
    editable: widget.editable ?? true,
    shareable: widget.shareable ?? false,
    
    // === NEW FIELDS (camelCase in DB) ===
    familyIdentity: widget.familyIdentity,
    agentRoster: widget.agentRoster,
    defaultArtifactType: widget.defaultArtifactType,
    toolExecutorPrompt: widget.toolExecutorPrompt,
    capabilities: widget.capabilities,
    // NOTE: execution_history is now tracked in actions table - do NOT include here
    inputRequirements: widget.inputRequirements,
    outputArtifacts: widget.outputArtifacts,
    dependencyHints: widget.dependencyHints,
    executionProfile: widget.executionProfile,
    workflowStage: widget.workflowStage,
    
    // === SYSTEM FIELDS ===
    projectId: systemFields.projectId,
    fingerprintId: systemFields.fingerprintId,
    userId: systemFields.userId,
    status: systemFields.status,
    createdAt: systemFields.createdAt,
    updatedAt: systemFields.updatedAt,
  };
}

