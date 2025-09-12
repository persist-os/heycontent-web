'use client'

import React from 'react'
import { FingerprintField, ALL_FINGERPRINT_FIELDS } from '@/types/fingerprint-schema'
import { WidgetConfig, WidgetType } from '@/types/projectWidgets'

// DEPRECATED: This file will be replaced by AI-driven widget generation
// TODO: Replace rule-based widget factory with AI-driven widget recommendation system
// TODO: Implement ML-based widget suggestions using fingerprint analysis
// TODO: Add widget performance tracking and A/B testing
// TODO: Implement collaborative widget suggestions across team members
// NOTE: This is a rule-based widget factory that should eventually be replaced
// with an AI layer that can more intelligently analyze fingerprints and
// recommend widgets. For now, it provides decent fallbacks based on common patterns.
// 
// IMPORTANT: The AI widget generation system is now active and this file
// is only used as a fallback. All new widgets should be generated via the
// backend AI agents and stored in Convex.

export interface ProjectFingerprint {
  [key: string]: any
  projectId: string
  userId: string
  name: string
  description?: string
  domain?: string
  complexity_level?: number
  collaboration_style?: string
  time_horizon?: string
  primary_pattern?: string
  working_style?: string[]
  tangible_deliverables?: string[]
  intangible_benefits?: string[]
  measurement_approach?: string
  sharing_intention?: string
  base_personality?: string
  project_voice?: string
  created_at: number
  last_evolution: number
  intelligence_version: string
  status: string
}

// Widget types are now imported from shared types

// TODO: Replace hardcoded fingerprint analysis with backend widget generation API
// TODO: Implement dynamic widget configuration based on real project data
// TODO: Add widget recommendation engine with user behavior learning
// TODO: Implement widget marketplace and custom widget support

// Helper function to create a complete WidgetConfig with all required fields
function createWidgetConfig(partial: Partial<WidgetConfig>): WidgetConfig {
  return {
    widget_id: partial.widget_id || `widget_${Date.now()}`,
    widget_type: partial.widget_type || 'generic',
    title: partial.title || 'Untitled Widget',
    description: partial.description || 'No description available',
    category: partial.category || 'General',
    priority: partial.priority || 5,
    size: partial.size || 'medium',
    theme: partial.theme || 'clean',
    position: partial.position || 1,
    config: partial.config || {},
    data_sources: partial.data_sources || [],
    update_frequency: partial.update_frequency || 'daily',
    interactive: partial.interactive ?? true,
    editable: partial.editable ?? true,
    shareable: partial.shareable ?? false,
  }
}
export function analyzeFingerprintForWidgets(fingerprint: ProjectFingerprint): WidgetConfig[] {
  const widgets: WidgetConfig[] = []

  // TODO: Replace hardcoded chat widget with dynamic widget loading
  // TODO: Implement widget permission system and access control
  widgets.push(createWidgetConfig({
    widget_id: 'chat',
    widget_type: 'chat',
    title: 'Project Chat',
    description: 'AI-powered project conversation interface',
    category: 'Communication',
    priority: 10,
    theme: 'clean',
    size: 'large',
    position: 0,
    config: {},
    data_sources: ['conversation_history'],
    update_frequency: 'realtime',
    interactive: true,
    editable: true,
    shareable: false
  }))

  // TODO: Remove hardcoded project ID checks and replace with fingerprint-based analysis
  // TODO: Implement pattern recognition for automatic widget suggestions
  // Special handling for specific sample fingerprints based on their unique characteristics
  const projectId = fingerprint.projectId

  // The Shadowmere Chronicles - Epic Fantasy Trilogy
  if (projectId === 'fp_001') {
    widgets.push(
      {
        widget_id: 'world_building_tracker',
        widget_type: 'world_building_tracker',
        title: 'Shadowmere World',
        priority: 9,
        theme: 'warm',
        size: 'large'
      },
      {
        widget_id: 'character_arc_tracker',
        widget_type: 'character_arc_tracker',
        title: 'Necromancer\'s Journey',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        widget_id: 'atmospheric_inspiration',
        widget_type: 'atmospheric_inspiration',
        title: 'Dark Magic Muse',
        priority: 8,
        theme: 'warm',
        size: 'medium'
      },
      {
        widget_id: 'writing_streak_tracker',
        widget_type: 'writing_streak_tracker',
        title: 'Forbidden Magic Flow',
        priority: 7,
        theme: 'warm',
        size: 'small'
      },
      {
        widget_id: 'creative_flow_meter',
        widget_type: 'creative_flow_meter',
        title: 'Shadow Work State',
        priority: 6,
        theme: 'warm',
        size: 'small'
      }
    )
  }
  // Mycorrhizal Intelligence Networks - PhD Dissertation
  else if (projectId === 'fp_002') {
    widgets.push(
      {
        widget_id: 'data_visualizer',
        widget_type: 'data_visualizer',
        title: 'Forest Network Data',
        priority: 9,
        theme: 'clean',
        size: 'large'
      },
      {
        widget_id: 'hypothesis_tracker',
        widget_type: 'hypothesis_tracker',
        title: 'Fungal Intelligence Theory',
        priority: 9,
        theme: 'clean',
        size: 'medium'
      },
      {
        widget_id: 'publication_pipeline',
        widget_type: 'publication_pipeline',
        title: 'Research Publication Flow',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        widget_id: 'research_tracker',
        widget_type: 'research_tracker',
        title: 'Mycorrhizal Discovery Log',
        priority: 8,
        theme: 'clean',
        size: 'medium'
      },
      {
        widget_id: 'milestone_timeline',
        widget_type: 'milestone_timeline',
        title: 'PhD Journey Map',
        priority: 7,
        theme: 'clean',
        size: 'large'
      }
    )
  }
  // YieldFarm Protocol v3 - DeFi Platform
  else if (projectId === 'fp_003') {
    widgets.push(
      {
        widget_id: 'market_sentiment_tracker',
        widget_type: 'market_sentiment_tracker',
        title: 'DeFi Market Pulse',
        priority: 9,
        theme: 'professional',
        size: 'medium'
      },
      {
        widget_id: 'tvl_growth_chart',
        widget_type: 'tvl_growth_chart',
        title: 'Protocol TVL Growth',
        priority: 9,
        theme: 'professional',
        size: 'large'
      },
      {
        widget_id: 'security_audit_status',
        widget_type: 'security_audit_status',
        title: 'Smart Contract Security',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        widget_id: 'code_commits',
        widget_type: 'code_commits',
        title: 'YieldFarm Development',
        priority: 8,
        theme: 'clean',
        size: 'medium'
      },
      {
        widget_id: 'milestone_timeline',
        widget_type: 'milestone_timeline',
        title: 'Mainnet Launch Roadmap',
        priority: 7,
        theme: 'professional',
        size: 'large'
      }
    )
  }
  // Enchanted Forest Wedding - Wedding Planning
  else if (projectId === 'fp_004') {
    widgets.push(
      {
        widget_id: 'vendor_coordination_board',
        widget_type: 'vendor_coordination_board',
        title: 'Forest Wedding Vendors',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        widget_id: 'guest_rsvp_tracker',
        widget_type: 'guest_rsvp_tracker',
        title: 'Guest List Magic',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        widget_id: 'budget_tracker',
        widget_type: 'budget_tracker',
        title: 'Enchanted Budget',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        widget_id: 'milestone_timeline',
        widget_type: 'milestone_timeline',
        title: 'Wedding Timeline',
        priority: 8,
        theme: 'warm',
        size: 'large'
      },
      {
        widget_id: 'mood_tracker',
        widget_type: 'mood_tracker',
        title: 'Wedding Joy Meter',
        priority: 6,
        theme: 'warm',
        size: 'small'
      }
    )
  }
  // Ruins & Resilience Documentary - Urban Decay Documentary
  else if (projectId === 'fp_005') {
    widgets.push(
      {
        widget_id: 'filming_schedule',
        widget_type: 'filming_schedule',
        title: 'Urban Exploration Schedule',
        priority: 9,
        theme: 'clean',
        size: 'medium'
      },
      {
        widget_id: 'interview_pipeline',
        widget_type: 'interview_pipeline',
        title: 'Community Voices Pipeline',
        priority: 9,
        theme: 'professional',
        size: 'medium'
      },
      {
        widget_id: 'editing_progress',
        widget_type: 'editing_progress',
        title: 'Resilience Story Editing',
        priority: 8,
        theme: 'clean',
        size: 'large'
      },
      {
        widget_id: 'research_tracker',
        widget_type: 'research_tracker',
        title: 'Urban Decay Discovery',
        priority: 8,
        theme: 'warm',
        size: 'medium'
      },
      {
        widget_id: 'publication_tracker',
        widget_type: 'publication_tracker',
        title: 'Film Festival Pipeline',
        priority: 7,
        theme: 'professional',
        size: 'small'
      }
    )
  }
  // Generic domain-based fallbacks for other projects
  else {
    const domain = fingerprint.domain || 'personal'
    const primaryPattern = fingerprint.primary_pattern || 'iterative_creator'
    const complexityLevel = fingerprint.complexity_level || 1
    const collaborationStyle = fingerprint.collaboration_style || 'solo'
    const timeHorizon = fingerprint.time_horizon || 'project'

    // Domain-specific widget recommendations
    switch (domain) {
      case 'creative':
        widgets.push(
          {
            widget_id: 'writing_progress',
            widget_type: 'writing_progress',
            title: 'Creative Progress',
            priority: 9,
            theme: 'warm',
            size: 'medium'
          },
          {
            widget_id: 'inspiration_board',
            widget_type: 'inspiration_board',
            title: 'Inspiration Board',
            priority: 7,
            theme: 'warm',
            size: 'medium'
          },
          {
            widget_id: 'mood_tracker',
            widget_type: 'mood_tracker',
            title: 'Creative Flow',
            priority: 6,
            theme: 'warm',
            size: 'small'
          }
        )
        break

      case 'business':
      case 'professional':
        widgets.push(
          {
            widget_id: 'client_meetings',
            widget_type: 'client_meetings',
            title: 'Client Meetings',
            priority: 9,
            theme: 'professional',
            size: 'medium'
          },
          {
            widget_id: 'goal_tracker',
            widget_type: 'goal_tracker',
            title: 'Business Goals',
            priority: 8,
            theme: 'professional',
            size: 'medium'
          },
          {
            widget_id: 'milestone_timeline',
            widget_type: 'milestone_timeline',
            title: 'Project Timeline',
            priority: 7,
            theme: 'professional',
            size: 'large'
          }
        )
        break

      case 'academic':
      case 'skill_development':
        widgets.push(
          {
            widget_id: 'research_tracker',
            widget_type: 'research_tracker',
            title: 'Research Progress',
            priority: 9,
            theme: 'clean',
            size: 'large'
          },
          {
            widget_id: 'resource_library',
            widget_type: 'resource_library',
            title: 'Study Materials',
            priority: 8,
            theme: 'clean',
            size: 'medium'
          },
          {
            widget_id: 'milestone_timeline',
            widget_type: 'milestone_timeline',
            title: 'Learning Timeline',
            priority: 7,
            theme: 'clean',
            size: 'medium'
          }
        )
        break

      default: // personal, skill_development
        widgets.push(
          {
            widget_id: 'goal_tracker',
            widget_type: 'goal_tracker',
            title: 'Personal Goals',
            priority: 8,
            theme: 'clean',
            size: 'medium'
          },
          {
            widget_id: 'time_tracker',
            widget_type: 'time_tracker',
            title: 'Time Investment',
            priority: 7,
            theme: 'clean',
            size: 'small'
          },
          {
            widget_id: 'mood_tracker',
            widget_type: 'mood_tracker',
            title: 'Progress Mood',
            priority: 6,
            theme: 'warm',
            size: 'small'
          }
        )
    }
  }

  // TODO: Replace hardcoded sorting with backend ranking algorithm
  // TODO: Implement widget diversity and balance optimization
  // TODO: Add user preference-based widget filtering
  // Sort by priority and limit to 4-6 widgets
  const sortedWidgets = widgets
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)

  // TODO: Replace hardcoded fallback logic with intelligent widget suggestions
  // TODO: Implement widget onboarding and gradual introduction system
  // Ensure we have at least 4 widgets by adding fallbacks
  if (sortedWidgets.length < 4) {
    const fallbackWidgets: WidgetConfig[] = [
      {
        widget_id: 'goal_tracker',
        widget_type: 'goal_tracker',
        title: 'Goals & Objectives',
        priority: 5,
        theme: 'clean',
        size: 'medium'
      },
      {
        widget_id: 'time_tracker',
        widget_type: 'time_tracker',
        title: 'Time Tracking',
        priority: 4,
        theme: 'clean',
        size: 'small'
      },
      {
        widget_id: 'resource_library',
        widget_type: 'resource_library',
        title: 'Resources',
        priority: 3,
        theme: 'clean',
        size: 'small'
      }
    ]

    for (const fallback of fallbackWidgets) {
      if (sortedWidgets.length >= 4) break
      if (!sortedWidgets.find(w => w.widget_id === fallback.widget_id)) {
        sortedWidgets.push(fallback)
      }
    }
  }

  return sortedWidgets
}

// Helper function to get theme colors based on widget theme
export function getWidgetThemeColors(theme: 'warm' | 'clean' | 'professional' | 'creative') {
  switch (theme) {
    case 'warm':
      return {
        bg: 'bg-gradient-to-br from-orange-50/50 to-yellow-50/30 dark:from-orange-950/30 dark:to-yellow-950/20',
        border: 'border-orange-200/60 dark:border-orange-800/40',
        accent: 'text-orange-700 dark:text-orange-300',
        glow: 'shadow-orange-200/50 dark:shadow-orange-900/30'
      }
    case 'clean':
      return {
        bg: 'bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20',
        border: 'border-slate-200/60 dark:border-slate-800/40',
        accent: 'text-slate-700 dark:text-slate-300',
        glow: 'shadow-slate-200/50 dark:shadow-slate-900/30'
      }
    case 'professional':
      return {
        bg: 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/20',
        border: 'border-blue-200/60 dark:border-blue-800/40',
        accent: 'text-blue-700 dark:text-blue-300',
        glow: 'shadow-blue-200/50 dark:shadow-blue-900/30'
      }
    case 'creative':
      return {
        bg: 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/30 dark:to-pink-950/20',
        border: 'border-purple-200/60 dark:border-purple-800/40',
        accent: 'text-purple-700 dark:text-purple-300',
        glow: 'shadow-purple-200/50 dark:shadow-purple-900/30'
      }
  }
}

// Helper function to get size classes
export function getWidgetSizeClasses(size: 'small' | 'medium' | 'large' | 'xlarge') {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-2 row-span-1'
    case 'large':
      return 'col-span-2 row-span-2'
    case 'xlarge':
      return 'col-span-3 row-span-2'
  }
}

// Main WidgetFactory React component
interface WidgetFactoryProps {
  config: WidgetConfig
  projectId: string
}

export function WidgetFactory({ config, projectId }: WidgetFactoryProps) {
  const themeColors = getWidgetThemeColors(config.theme)
  const sizeClasses = getWidgetSizeClasses(config.size)

  return (
    <div className={`
      relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-300
      ${themeColors.bg} ${themeColors.border} ${themeColors.glow}
      hover:scale-[1.02] hover:shadow-lg
      ${sizeClasses}
    `}>
      {/* Widget Header */}
      <div className="mb-4">
        <h3 className={`text-lg font-semibold ${themeColors.accent}`}>
          {config.title}
        </h3>
        {config.description && (
          <p className="text-sm text-muted-foreground/70 mt-1">
            {config.description}
          </p>
        )}
      </div>

      {/* Widget Content */}
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground/60">
          Type: {config.widget_type}
        </div>
        <div className="text-sm text-muted-foreground/60">
          Priority: {config.priority}/10
        </div>
        <div className="text-sm text-muted-foreground/60">
          Size: {config.size}
        </div>
        <div className="text-sm text-muted-foreground/60">
          Theme: {config.theme}
        </div>
      </div>

      {/* Widget Footer */}
      <div className="mt-4 pt-4 border-t border-current/20">
        <div className="text-xs text-muted-foreground/50">
          Widget ID: {config.widget_id}
        </div>
      </div>
    </div>
  )
}
