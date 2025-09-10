'use client'

import React from 'react'
import { FingerprintField, ALL_FINGERPRINT_FIELDS } from '@/types/fingerprint-schema'

// NOTE: This is a rule-based widget factory that should eventually be replaced
// with an AI layer that can more intelligently analyze fingerprints and
// recommend widgets. For now, it provides decent fallbacks based on common patterns.

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

export interface WidgetConfig {
  id: string
  type: string
  title: string
  priority: number // 1-10, higher = more important
  theme: 'warm' | 'clean' | 'professional'
  size: 'small' | 'medium' | 'large'
  data?: any
}

// Widget types we support
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
  | 'writing_streak_tracker'

export function analyzeFingerprintForWidgets(fingerprint: ProjectFingerprint): WidgetConfig[] {
  const widgets: WidgetConfig[] = []

  // Always include chat widget for all projects
  widgets.push({
    id: 'chat',
    type: 'chat',
    title: 'Project Chat',
    priority: 10,
    theme: 'clean',
    size: 'large'
  })

  // Special handling for specific sample fingerprints based on their unique characteristics
  const projectId = fingerprint.projectId

  // The Shadowmere Chronicles - Epic Fantasy Trilogy
  if (projectId === 'fp_001') {
    widgets.push(
      {
        id: 'world_building_tracker',
        type: 'world_building_tracker',
        title: 'Shadowmere World',
        priority: 9,
        theme: 'warm',
        size: 'large'
      },
      {
        id: 'character_arc_tracker',
        type: 'character_arc_tracker',
        title: 'Necromancer\'s Journey',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        id: 'atmospheric_inspiration',
        type: 'atmospheric_inspiration',
        title: 'Dark Magic Muse',
        priority: 8,
        theme: 'warm',
        size: 'medium'
      },
      {
        id: 'writing_streak_tracker',
        type: 'writing_streak_tracker',
        title: 'Forbidden Magic Flow',
        priority: 7,
        theme: 'warm',
        size: 'small'
      },
      {
        id: 'creative_flow_meter',
        type: 'creative_flow_meter',
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
        id: 'data_visualizer',
        type: 'data_visualizer',
        title: 'Forest Network Data',
        priority: 9,
        theme: 'clean',
        size: 'large'
      },
      {
        id: 'hypothesis_tracker',
        type: 'hypothesis_tracker',
        title: 'Fungal Intelligence Theory',
        priority: 9,
        theme: 'clean',
        size: 'medium'
      },
      {
        id: 'publication_pipeline',
        type: 'publication_pipeline',
        title: 'Research Publication Flow',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        id: 'research_tracker',
        type: 'research_tracker',
        title: 'Mycorrhizal Discovery Log',
        priority: 8,
        theme: 'clean',
        size: 'medium'
      },
      {
        id: 'milestone_timeline',
        type: 'milestone_timeline',
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
        id: 'market_sentiment_tracker',
        type: 'market_sentiment_tracker',
        title: 'DeFi Market Pulse',
        priority: 9,
        theme: 'professional',
        size: 'medium'
      },
      {
        id: 'tvl_growth_chart',
        type: 'tvl_growth_chart',
        title: 'Protocol TVL Growth',
        priority: 9,
        theme: 'professional',
        size: 'large'
      },
      {
        id: 'security_audit_status',
        type: 'security_audit_status',
        title: 'Smart Contract Security',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        id: 'code_commits',
        type: 'code_commits',
        title: 'YieldFarm Development',
        priority: 8,
        theme: 'clean',
        size: 'medium'
      },
      {
        id: 'milestone_timeline',
        type: 'milestone_timeline',
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
        id: 'vendor_coordination_board',
        type: 'vendor_coordination_board',
        title: 'Forest Wedding Vendors',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        id: 'guest_rsvp_tracker',
        type: 'guest_rsvp_tracker',
        title: 'Guest List Magic',
        priority: 9,
        theme: 'warm',
        size: 'medium'
      },
      {
        id: 'budget_tracker',
        type: 'budget_tracker',
        title: 'Enchanted Budget',
        priority: 8,
        theme: 'professional',
        size: 'medium'
      },
      {
        id: 'milestone_timeline',
        type: 'milestone_timeline',
        title: 'Wedding Timeline',
        priority: 8,
        theme: 'warm',
        size: 'large'
      },
      {
        id: 'mood_tracker',
        type: 'mood_tracker',
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
        id: 'filming_schedule',
        type: 'filming_schedule',
        title: 'Urban Exploration Schedule',
        priority: 9,
        theme: 'clean',
        size: 'medium'
      },
      {
        id: 'interview_pipeline',
        type: 'interview_pipeline',
        title: 'Community Voices Pipeline',
        priority: 9,
        theme: 'professional',
        size: 'medium'
      },
      {
        id: 'editing_progress',
        type: 'editing_progress',
        title: 'Resilience Story Editing',
        priority: 8,
        theme: 'clean',
        size: 'large'
      },
      {
        id: 'research_tracker',
        type: 'research_tracker',
        title: 'Urban Decay Discovery',
        priority: 8,
        theme: 'warm',
        size: 'medium'
      },
      {
        id: 'publication_tracker',
        type: 'publication_tracker',
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
            id: 'writing_progress',
            type: 'writing_progress',
            title: 'Creative Progress',
            priority: 9,
            theme: 'warm',
            size: 'medium'
          },
          {
            id: 'inspiration_board',
            type: 'inspiration_board',
            title: 'Inspiration Board',
            priority: 7,
            theme: 'warm',
            size: 'medium'
          },
          {
            id: 'mood_tracker',
            type: 'mood_tracker',
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
            id: 'client_meetings',
            type: 'client_meetings',
            title: 'Client Meetings',
            priority: 9,
            theme: 'professional',
            size: 'medium'
          },
          {
            id: 'goal_tracker',
            type: 'goal_tracker',
            title: 'Business Goals',
            priority: 8,
            theme: 'professional',
            size: 'medium'
          },
          {
            id: 'milestone_timeline',
            type: 'milestone_timeline',
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
            id: 'research_tracker',
            type: 'research_tracker',
            title: 'Research Progress',
            priority: 9,
            theme: 'clean',
            size: 'large'
          },
          {
            id: 'resource_library',
            type: 'resource_library',
            title: 'Study Materials',
            priority: 8,
            theme: 'clean',
            size: 'medium'
          },
          {
            id: 'milestone_timeline',
            type: 'milestone_timeline',
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
            id: 'goal_tracker',
            type: 'goal_tracker',
            title: 'Personal Goals',
            priority: 8,
            theme: 'clean',
            size: 'medium'
          },
          {
            id: 'time_tracker',
            type: 'time_tracker',
            title: 'Time Investment',
            priority: 7,
            theme: 'clean',
            size: 'small'
          },
          {
            id: 'mood_tracker',
            type: 'mood_tracker',
            title: 'Progress Mood',
            priority: 6,
            theme: 'warm',
            size: 'small'
          }
        )
    }
  }

  // Sort by priority and limit to 4-6 widgets
  const sortedWidgets = widgets
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)

  // Ensure we have at least 4 widgets by adding fallbacks
  if (sortedWidgets.length < 4) {
    const fallbackWidgets: WidgetConfig[] = [
      {
        id: 'goal_tracker',
        type: 'goal_tracker',
        title: 'Goals & Objectives',
        priority: 5,
        theme: 'clean',
        size: 'medium'
      },
      {
        id: 'time_tracker',
        type: 'time_tracker',
        title: 'Time Tracking',
        priority: 4,
        theme: 'clean',
        size: 'small'
      },
      {
        id: 'resource_library',
        type: 'resource_library',
        title: 'Resources',
        priority: 3,
        theme: 'clean',
        size: 'small'
      }
    ]

    for (const fallback of fallbackWidgets) {
      if (sortedWidgets.length >= 4) break
      if (!sortedWidgets.find(w => w.id === fallback.id)) {
        sortedWidgets.push(fallback)
      }
    }
  }

  return sortedWidgets
}

// Helper function to get theme colors based on widget theme
export function getWidgetThemeColors(theme: 'warm' | 'clean' | 'professional') {
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
  }
}

// Helper function to get size classes
export function getWidgetSizeClasses(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-2 row-span-1'
    case 'large':
      return 'col-span-2 row-span-2'
  }
}
