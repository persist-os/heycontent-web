'use client'

import React from 'react'
import { analyzeFingerprintForWidgets, getWidgetThemeColors, getWidgetSizeClasses, type ProjectFingerprint } from './WidgetFactory'

interface WidgetGridProps {
  fingerprint: ProjectFingerprint
}

// Example widget component - in a real implementation, each widget type would have its own component
function Widget({ config }: { config: any }) {
  const themeColors = getWidgetThemeColors(config.theme)
  const sizeClasses = getWidgetSizeClasses(config.size)

  // Get appropriate icon based on widget type
  const getWidgetIcon = (type: string) => {
    const icons: Record<string, string> = {
      chat: '💬',
      writing_progress: '✍️',
      code_commits: '💻',
      client_meetings: '📅',
      content_calendar: '📊',
      research_tracker: '🔬',
      milestone_timeline: '🎯',
      collaboration_board: '🤝',
      resource_library: '📚',
      goal_tracker: '🎯',
      mood_tracker: '😊',
      time_tracker: '⏰',
      inspiration_board: '🎨',
      peer_review: '👥',
      publication_tracker: '📝',
      world_building_tracker: '🌍',
      character_arc_tracker: '👤',
      market_sentiment_tracker: '📈',
      tvl_growth_chart: '💰',
      security_audit_status: '🔒',
      vendor_coordination_board: '🎪',
      guest_rsvp_tracker: '📝',
      budget_tracker: '💵',
      filming_schedule: '🎬',
      interview_pipeline: '🎤',
      editing_progress: '🎞️',
      data_visualizer: '📊',
      hypothesis_tracker: '🧪',
      publication_pipeline: '📄',
      creative_flow_meter: '🌊',
      atmospheric_inspiration: '🌙',
      writing_streak_tracker: '🔥'
    }
    return icons[type] || '📱'
  }

  return (
    <div className={`
      ${sizeClasses}
      ${themeColors.bg}
      ${themeColors.border}
      ${themeColors.glow}
      border rounded-lg p-4 backdrop-blur-sm
      hover:scale-[1.02] transition-all duration-300
      shadow-lg hover:shadow-xl
    `}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getWidgetIcon(config.type)}</span>
          <h3 className={`font-medium text-sm ${themeColors.accent}`}>
            {config.title}
          </h3>
        </div>
        <div className="text-xs text-muted-foreground/70">
          {config.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
        <div className="text-xs text-muted-foreground/50">
          Priority: {config.priority}/10
        </div>
      </div>
    </div>
  )
}

export function WidgetGrid({ fingerprint }: WidgetGridProps) {
  const widgets = analyzeFingerprintForWidgets(fingerprint)

  if (!widgets.length) {
    return (
      <div className="text-center py-8 text-muted-foreground/60">
        No widgets available for this project type.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Widget Stats */}
      <div className="text-sm text-muted-foreground/70">
        {widgets.length} personalized ambient insight widgets for {fingerprint.name}
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-[120px]">
        {widgets.map((widgetConfig) => (
          <Widget key={widgetConfig.id} config={widgetConfig} />
        ))}
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 text-xs">
          <summary className="cursor-pointer text-muted-foreground/60 hover:text-foreground">
            Debug: Widget Analysis
          </summary>
          <pre className="mt-2 p-4 bg-muted/30 rounded text-xs overflow-auto">
            {JSON.stringify({
              projectName: fingerprint.name,
              domain: fingerprint.domain,
              primaryPattern: fingerprint.primary_pattern,
              complexityLevel: fingerprint.complexity_level,
              collaborationStyle: fingerprint.collaboration_style,
              timeHorizon: fingerprint.time_horizon,
              keyDeliverables: fingerprint.tangible_deliverables?.slice(0, 2),
              personalizedWidgets: widgets.map(w => ({
                title: w.title,
                type: w.type,
                priority: w.priority,
                theme: w.theme,
                size: w.size
              }))
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}
