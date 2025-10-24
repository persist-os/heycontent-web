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
  
  // Layout and appearance
  priority: v.number(),
  size: v.string(),
  theme: v.string(),
  position: v.number(),
  
  // Configuration
  config: v.any(),
  data_sources: v.array(v.string()),
  update_frequency: v.string(),
  
  // Permissions
  interactive: v.boolean(),
  editable: v.boolean(),
  shareable: v.boolean(),
  
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

// Wrapped validators for mutations/queries
export const widgetValidator = v.object(widgetSchemaFields);
export const projectWidgetsValidator = v.object(projectWidgetsSchemaFields);

// Type exports
export type WidgetStatus = "active" | "archived" | "deleted";
export type WidgetRunStatus = "idle" | "running" | "success" | "failed";
export type WidgetScheduleFrequency = "manual" | "hourly" | "daily" | "weekly" | "monthly";

export interface WidgetCategory {
  name: string;
  icon?: string;
  description?: string;
  display_order?: number;
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

