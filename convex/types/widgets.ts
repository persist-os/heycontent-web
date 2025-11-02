/**
 * Widget Type Definitions
 * 
 * Defines individual widgets and their layout configurations for projects.
 * Each widget gets its own Convex ID for optimal queries and updates.
 */

import { v } from "convex/values";

// Widget status validator
export const widgetStatusValidator = v.union(
  v.literal("active"),
  v.literal("archived"),
  v.literal("deleted")
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
  v.literal("timeline")
);

// Schema fields for individual widgets (unwrapped for defineTable)
export const widgetSchemaFields = {
  // Foreign keys - establish relationships
  projectId: v.id("projects"),
  fingerprintId: v.id("project_fingerprints"),
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
  
  // Execution History (NEW - self-learning data)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  execution_history: v.optional(v.union(
    v.null(),
    v.object({
      avg_quality_score: v.optional(v.number()),
      avg_duration_minutes: v.optional(v.number()),
      total_executions: v.optional(v.number()),
      improvement_trend: v.optional(v.string()), // "increasing", "stable", "declining"
    })
  )),
  
  // Family Identity (NEW - Phase 2: Widget as Family of Agents)
  familyIdentity: v.optional(v.object({
    familyName: v.string(),
    mission: v.string(),
    collaborationStyle: v.string(),
    qualityStandard: v.string(),
  })),
  
  // Agent Roster (NEW - Phase 2: Dynamic agent spawning)
  agentRoster: v.optional(v.array(v.object({
    agentId: v.string(),
    roleName: v.string(),
    personality: v.string(),
    responsibilities: v.array(v.string()),
    spawnCondition: v.string(),
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
  nextScheduledRun: v.optional(v.number()),
  lastScheduledRun: v.optional(v.number()),
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
  
  // Metadata
  status: widgetStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Schema fields for project widget layouts (unwrapped for defineTable)
export const projectWidgetsSchemaFields = {
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
  // Execution History (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  execution_history: v.optional(v.union(
    v.null(),
    v.object({
      avg_quality_score: v.optional(v.number()),
      avg_duration_minutes: v.optional(v.number()),
      total_executions: v.optional(v.number()),
      improvement_trend: v.optional(v.string()),
    })
  )),
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
  // ✅ PHASE 2: Family Identity fields
  familyIdentity: v.optional(v.object({
    familyName: v.string(),
    mission: v.string(),
    collaborationStyle: v.string(),
    qualityStandard: v.string(),
  })),
  // ✅ PHASE 2: Agent Roster
  agentRoster: v.optional(v.array(v.object({
    agentId: v.string(),
    roleName: v.string(),
    personality: v.string(),
    responsibilities: v.array(v.string()),
    spawnCondition: v.string(),
  }))),
});

// Widget create validator (for single widget creation - extends batch validator)
export const widgetCreateValidator = v.object({
  projectId: v.id("projects"),
  fingerprintId: v.id("project_fingerprints"),
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
  // Execution History (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  execution_history: v.optional(v.union(
    v.null(),
    v.object({
      avg_quality_score: v.optional(v.number()),
      avg_duration_minutes: v.optional(v.number()),
      total_executions: v.optional(v.number()),
      improvement_trend: v.optional(v.string()),
    })
  )),
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
  // Execution History (NEW - Phase 1.3)
  // Note: v.union(v.null(), ...) allows explicit null values from backend
  execution_history: v.optional(v.union(
    v.null(),
    v.object({
      avg_quality_score: v.optional(v.number()),
      avg_duration_minutes: v.optional(v.number()),
      total_executions: v.optional(v.number()),
      improvement_trend: v.optional(v.string()),
    })
  )),
  lastRunAt: v.optional(v.number()),
  lastRunStatus: v.optional(widgetRunStatusValidator),
  status: v.optional(widgetStatusValidator),
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

// Type exports
export type WidgetStatus = "active" | "archived" | "deleted";
export type WidgetRunStatus = "idle" | "running" | "success" | "failed";
export type WidgetScheduleFrequency = "manual" | "hourly" | "daily" | "weekly" | "monthly";
export type WidgetWorkflowStage = "gathering" | "analysis" | "synthesis" | "tracking" | "reporting";
export type WidgetOutputArtifactType = "structured_list" | "report" | "analysis" | "summary" | "tracker" | "timeline";

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
  fingerprintId: string;
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
  status: WidgetStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectWidgets {
  projectId: string;
  fingerprintId: string;
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

