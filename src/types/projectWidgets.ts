/**
 * Shared type definitions for project widgets
 * Ensures consistency across frontend and backend
 */

import type { Id } from '@/convex/_generated/dataModel'

export interface CategoryConfig {
  name: string;
  icon: string;
  description: string;
}

export interface WidgetConfig {
  _id: Id<"widgets">; // Convex ID - primary identifier
  widget_id: string; // Legacy string ID for backward compatibility
  widget_type: string;
  title: string;
  description: string;
  category: string;
  priority: number; // 1-10
  size: 'small' | 'medium' | 'large' | 'xlarge';
  theme: 'warm' | 'clean' | 'professional' | 'creative';
  position: number;
  config: any;
  data_sources: string[];
  update_frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  interactive: boolean;
  editable: boolean;
  shareable: boolean;
}

export interface ProjectWidgetsData {
  _id?: string;
  projectId: string;
  fingerprintId: string;
  userId: string;
  categories: CategoryConfig[];
  widgets: WidgetConfig[];
  layout_type: 'grid' | 'dashboard' | 'kanban' | 'timeline';
  columns: number;
  rows: number;
  global_theme: 'warm' | 'clean' | 'professional' | 'creative';
  color_scheme: 'monochrome' | 'colorful' | 'pastel' | 'vibrant';
  font_style: 'modern' | 'classic' | 'playful' | 'professional';
  allow_customization: boolean;
  allow_reordering: boolean;
  allow_resizing: boolean;
  required_integrations: string[];
  data_refresh_strategy: string;
  generated_at: number;
  version: string;
  confidence: number; // 0-1
  status: 'generating' | 'active' | 'archived';
}

// Widget type definitions for the factory
export type WidgetType =
  | 'chat'
  | 'writing_progress'
  | 'code_commits'
  | 'client_meetings'
  | 'content_calendar'
  | 'research_tracker'
  | 'milestone_timeline'
  | 'collaboration_board'
  | 'resource_library'
  | 'goal_tracker'
  | 'mood_tracker'
  | 'time_tracker'
  | 'inspiration_board'
  | 'peer_review'
  | 'publication_tracker'
  | 'world_building_tracker'
  | 'character_arc_tracker'
  | 'market_sentiment_tracker'
  | 'tvl_growth_chart'
  | 'security_audit_status'
  | 'vendor_coordination_board'
  | 'guest_rsvp_tracker'
  | 'budget_tracker'
  | 'filming_schedule'
  | 'interview_pipeline'
  | 'editing_progress'
  | 'data_visualizer'
  | 'hypothesis_tracker'
  | 'publication_pipeline'
  | 'creative_flow_meter'
  | 'atmospheric_inspiration'
  | 'writing_streak_tracker';

// API response types
export interface CreateProjectWidgetsResponse {
  success: boolean;
  data?: string; // widgets ID
  error?: string;
}

export interface GetProjectWidgetsResponse {
  success: boolean;
  data?: ProjectWidgetsData;
  error?: string;
}
