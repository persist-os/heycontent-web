/**
 * PROJECT DNA FINGERPRINT
 * 
 * Living, breathing display of a project's essence.
 * Tied to the artificial civilization vision - this is the project's consciousness.
 */

'use client'

import React, { useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

interface ProjectFingerprintProps {
  projectId: string
  className?: string
}

type TabType = 'vision' | 'dna' | 'timeline' | 'preferences'

export function ProjectFingerprint({ projectId, className = '' }: ProjectFingerprintProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('vision')
  
  const fingerprint = useQuery(api.projectFingerprintQueries.getByProject, {
    projectId: projectId as Id<"projects">
  })
  
  const completionStatus = useQuery(api.projectFingerprintQueries.getCompletionStatus, {
    projectId: projectId as Id<"projects">
  })

  if (!fingerprint) return null

  const completion = completionStatus?.completion_percentage || 0
  const status = fingerprint.status || 'discovering'

  // Status indicator with pulse for "alive" feeling
  const statusConfig = {
    discovering: { color: 'bg-amber-500', label: 'Discovering', pulse: true },
    active: { color: 'bg-blue-500', label: 'Active', pulse: true },
    evolving: { color: 'bg-purple-500', label: 'Evolving', pulse: true },
    completing: { color: 'bg-green-500', label: 'Completing', pulse: false },
    archived: { color: 'bg-muted-foreground', label: 'Archived', pulse: false }
  }[status] || { color: 'bg-muted-foreground', label: status, pulse: false }

  const tabs = [
    { id: 'vision' as TabType, label: 'Vision', subtitle: 'What & Why' },
    { id: 'dna' as TabType, label: 'DNA', subtitle: 'How You Work' },
    { id: 'timeline' as TabType, label: 'Timeline', subtitle: 'When & Flow' },
    { id: 'preferences' as TabType, label: 'Preferences', subtitle: 'Interface' }
  ]

  return (
    <div className={className}>
      {/* Collapsed - Minimal, living indicator */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative bg-background/75 backdrop-blur-sm rounded-lg px-4 py-2.5 hover:bg-background/90 transition-all duration-500"
        >
          <div className="flex items-center gap-3">
            {/* Living pulse indicator */}
            <div className="relative">
              <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
              {statusConfig.pulse && (
                <div className={`absolute inset-0 w-2 h-2 rounded-full ${statusConfig.color} animate-ping opacity-40`} />
              )}
            </div>
            
            <div className="text-left">
              <div className="text-sm font-medium">{fingerprint.name}</div>
              <div className="text-xs text-muted-foreground/60">{completion}% formed</div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded - Living DNA Display */}
      {isExpanded && (
        <div className="bg-background/90 backdrop-blur-lg rounded-xl shadow-2xl border border-border/30 overflow-hidden max-w-3xl">
          {/* Header - Project Identity */}
          <div className="relative px-6 py-4 border-b border-border/20 bg-gradient-to-r from-background via-muted/10 to-background">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  {/* Living status indicator */}
                  <div className="relative flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                    {statusConfig.pulse && (
                      <div className={`absolute left-0 w-2 h-2 rounded-full ${statusConfig.color} animate-ping opacity-40`} />
                    )}
                    <span className="text-xs font-medium text-muted-foreground/70">
                      {statusConfig.label}
                    </span>
                  </div>
                  
                  {fingerprint.domain && (
                    <>
                      <span className="text-xs text-muted-foreground/40">•</span>
                      <span className="text-xs text-muted-foreground/70 capitalize">
                        {fingerprint.domain}
                      </span>
                    </>
                  )}
                </div>
                
                <h2 className="text-2xl font-light tracking-tight mb-1">{fingerprint.name}</h2>
                
                {fingerprint.description && (
                  <p className="text-sm text-muted-foreground/70 leading-relaxed line-clamp-2">
                    {fingerprint.description}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="text-muted-foreground/50 hover:text-foreground px-2 py-1 rounded hover:bg-muted/30 transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            {/* Formation progress */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 transition-all duration-1000"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground/60 tabular-nums">{completion}%</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-border/20 px-6 bg-muted/5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-foreground'
                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                }`}
              >
                <div className="font-medium">{tab.label}</div>
                <div className="text-xs text-muted-foreground/50">{tab.subtitle}</div>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 min-h-[280px]">
            
            {/* VISION TAB - Primary Focus */}
            {activeTab === 'vision' && (
              <div className="space-y-5">
                {/* Core Intention - The Why */}
                {fingerprint.core_intention && (
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      Why This Matters
                    </div>
                    <p className="text-base leading-relaxed text-foreground/90">
                      {fingerprint.core_intention}
                    </p>
                  </div>
                )}

                {/* Success Vision */}
                {fingerprint.success_vision && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      Success Looks Like
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground/80">
                      {fingerprint.success_vision}
                    </p>
                  </div>
                )}

                {/* Deliverables - What We're Building */}
                {Array.isArray(fingerprint.tangible_deliverables) && fingerprint.tangible_deliverables.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
                      What We're Creating
                    </div>
                    <div className="space-y-2">
                      {fingerprint.tangible_deliverables.map((deliverable, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60 mt-1.5 flex-shrink-0" />
                          <span className="text-sm text-foreground/80">{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Value Creation */}
                {fingerprint.value_creation && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      The Impact
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {fingerprint.value_creation}
                    </p>
                  </div>
                )}

                {/* Personal Growth */}
                {Array.isArray(fingerprint.personal_growth) && fingerprint.personal_growth.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      Growing Through This
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fingerprint.personal_growth.map((growth, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
                        >
                          {growth}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DNA TAB - How You Work */}
            {activeTab === 'dna' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary Pattern */}
                  {fingerprint.primary_pattern && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Working Pattern</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.primary_pattern.replace(/_/g, ' ')}
                      </div>
                    </div>
                  )}

                  {/* Collaboration */}
                  {fingerprint.collaboration_style && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Team Style</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.collaboration_style}
                      </div>
                    </div>
                  )}

                  {/* Complexity */}
                  {fingerprint.complexity_level && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Complexity</div>
                      <div className="text-sm font-medium">
                        Level {fingerprint.complexity_level}/10
                      </div>
                    </div>
                  )}

                  {/* Sharing */}
                  {fingerprint.sharing_intention && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Sharing</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.sharing_intention}
                      </div>
                    </div>
                  )}
                </div>

                {/* Decision Making */}
                {fingerprint.decision_making && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      How You Decide
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {fingerprint.decision_making}
                    </p>
                  </div>
                )}

                {/* Energy Patterns */}
                {fingerprint.energy_patterns && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      When You Work Best
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {fingerprint.energy_patterns}
                    </p>
                  </div>
                )}

                {/* Working Styles */}
                {Array.isArray(fingerprint.working_style) && fingerprint.working_style.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      Your Styles
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fingerprint.working_style.map((style, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Time Horizon */}
                  {fingerprint.time_horizon && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Timeframe</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.time_horizon}
                      </div>
                    </div>
                  )}

                  {/* Natural Rhythm */}
                  {fingerprint.natural_rhythm && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Rhythm</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.natural_rhythm}
                      </div>
                    </div>
                  )}

                  {/* Flexibility */}
                  {fingerprint.flexibility_preference && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Flexibility</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.flexibility_preference}
                      </div>
                    </div>
                  )}

                  {/* Check-ins */}
                  {fingerprint.feedback_frequency && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Check-ins</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.feedback_frequency}
                      </div>
                    </div>
                  )}
                </div>

                {/* Measurement Approach */}
                {fingerprint.measurement_approach && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      How to Measure Progress
                    </div>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {fingerprint.measurement_approach}
                    </p>
                  </div>
                )}

                {/* Intangible Benefits */}
                {Array.isArray(fingerprint.intangible_benefits) && fingerprint.intangible_benefits.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-3">
                      Beyond Deliverables
                    </div>
                    <div className="space-y-2">
                      {fingerprint.intangible_benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 mt-1.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground/80">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Cognitive Load */}
                  {fingerprint.cognitive_load_preference && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Cognitive Load</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.cognitive_load_preference}
                      </div>
                    </div>
                  )}

                  {/* Info Density */}
                  {fingerprint.information_density && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Info Density</div>
                      <div className="text-sm font-medium capitalize">
                        {fingerprint.information_density}
                      </div>
                    </div>
                  )}

                  {/* Learning Sensitivity */}
                  {fingerprint.learning_sensitivity && (
                    <div>
                      <div className="text-xs text-muted-foreground/50 mb-1">Adaptivity</div>
                      <div className="text-sm font-medium">
                        {fingerprint.learning_sensitivity}/10
                      </div>
                    </div>
                  )}
                </div>

                {/* Motivation Styles */}
                {Array.isArray(fingerprint.motivation_style) && fingerprint.motivation_style.length > 0 && (
                  <div className="pt-4 border-t border-border/10">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground/50 mb-2">
                      What Motivates You
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fingerprint.motivation_style.map((style, idx) => (
                        <span 
                          key={idx}
                          className="px-2.5 py-1 bg-muted/30 rounded-full text-xs text-muted-foreground/80"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Metadata */}
          {fingerprint.created_at && (
            <div className="px-6 py-3 border-t border-border/20 bg-muted/5">
              <div className="flex items-center justify-between text-xs text-muted-foreground/40">
                <div>
                  DNA formed {new Date(fingerprint.created_at).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                {fingerprint.intelligence_version && (
                  <div>Intelligence v{fingerprint.intelligence_version}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}