'use client'

import React, { useState, useEffect } from 'react'
import { LivingProjectView } from './LivingProjectView'
import { ConstellationTransition } from './ConstellationTransition'
import { ProjectFingerprint } from './WidgetFactory'
import { Button } from '@/components/ui/button'
import { ChevronLeft, RotateCcw, ChevronDown, ChevronUp, Eye } from 'lucide-react'

// TODO: Remove all sample data imports and replace with backend queries
// TODO: Implement real-time fingerprint evolution tracking
// TODO: Add fingerprint comparison and versioning system
// TODO: Implement fingerprint collaboration and sharing features

interface ProjectRevealProps {
  fingerprint: ProjectFingerprint | null
  onBack?: () => void
}

export function ProjectReveal({
  fingerprint,
  onBack
}: ProjectRevealProps) {
  const [showTransition, setShowTransition] = useState(false)
  const [showProjectView, setShowProjectView] = useState(false)
  const [isOverlayExpanded, setIsOverlayExpanded] = useState(false)

  // Use the provided fingerprint directly, with null safety
  const currentFingerprint = fingerprint

  // Early return if no fingerprint is available
  if (!currentFingerprint) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No fingerprint available</div>
          <div className="text-sm text-muted-foreground">Please complete the project discovery process</div>
        </div>
      </div>
    )
  }

  const handleStarsDiscovered = () => {
    setShowTransition(true)
  }

  const handleTransitionComplete = () => {
    setShowTransition(false)
    setShowProjectView(true)
  }

  const handleReset = () => {
    setShowProjectView(false)
    setShowTransition(false)
  }


  return (
    <>
      {/* TODO: Replace fingerprint overlay with backend-driven fingerprint viewer */}
      {/* TODO: Implement fingerprint real-time updates and collaboration */}
      {/* TODO: Add fingerprint export/import functionality */}
      {/* Project Fingerprint Overlay - Simple scrollable div */}
      <div className={`fixed top-24 right-6 z-[9999] bg-background/95 backdrop-blur-sm border border-border/30 rounded-xl shadow-lg transition-all duration-300 ease-in-out ${
        isOverlayExpanded ? 'max-w-4xl w-full' : 'max-w-sm'
      }`}>
        <div className="p-6 max-h-[70vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
          {/* Header with toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-muted-foreground" />
              <div className="text-sm font-medium text-foreground">Project Fingerprint</div>
            </div>
            <button
              onClick={() => setIsOverlayExpanded(!isOverlayExpanded)}
              className="p-1 hover:bg-muted/50 rounded-md transition-colors"
            >
              {isOverlayExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Basic Info - Always Visible */}
          <div className="space-y-3 mb-4">
              <div>
              <div className="text-sm font-medium text-foreground mb-1">Project Name:</div>
              <div className="text-muted-foreground font-medium text-sm bg-muted/30 px-3 py-2 rounded-md">
                {currentFingerprint.name || 'Unnamed Project'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="font-medium text-foreground">Domain:</span> <span className="text-muted-foreground">{currentFingerprint.domain || 'Unknown'}</span></div>
              <div><span className="font-medium text-foreground">Complexity:</span> <span className="text-muted-foreground">{currentFingerprint.complexity_level || 0}/10</span></div>
              <div><span className="font-medium text-foreground">Pattern:</span> <span className="text-muted-foreground">{currentFingerprint.primary_pattern?.replace('_', ' ') || 'Unknown'}</span></div>
              <div><span className="font-medium text-foreground">Collaboration:</span> <span className="text-muted-foreground">{currentFingerprint.collaboration_style?.replace('_', ' ') || 'Unknown'}</span></div>
            </div>
          </div>

          {/* Expanded Content */}
          {isOverlayExpanded && (
            <div className="border-t border-border/20 pt-4 space-y-4">
              {/* TODO: Replace hardcoded fingerprint display with dynamic backend queries */}
              {/* TODO: Implement fingerprint field validation and type safety */}
              {/* TODO: Add fingerprint change tracking and audit log */}
              {/* Full Fingerprint Data */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Complete Fingerprint Data:</div>
                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-mono space-y-1">
                    <div><span className="text-muted-foreground">name:</span> <span className="text-foreground">"{currentFingerprint.name || 'Unnamed Project'}"</span></div>
                    <div><span className="text-muted-foreground">domain:</span> <span className="text-foreground">"{currentFingerprint.domain || 'Unknown'}"</span></div>
                    <div><span className="text-muted-foreground">complexity_level:</span> <span className="text-foreground">{currentFingerprint.complexity_level || 0}</span></div>

                    {currentFingerprint.primary_pattern && (
                      <div><span className="text-muted-foreground">primary_pattern:</span> <span className="text-foreground">"{currentFingerprint.primary_pattern}"</span></div>
                    )}

                    {currentFingerprint.collaboration_style && (
                      <div><span className="text-muted-foreground">collaboration_style:</span> <span className="text-foreground">"{currentFingerprint.collaboration_style}"</span></div>
                    )}

                    {currentFingerprint.description && (
                      <div><span className="text-muted-foreground">description:</span> <span className="text-foreground">"{currentFingerprint.description}"</span></div>
                    )}

                    {currentFingerprint.time_horizon && (
                      <div><span className="text-muted-foreground">time_horizon:</span> <span className="text-foreground">"{currentFingerprint.time_horizon}"</span></div>
                    )}

                    {currentFingerprint.working_style && currentFingerprint.working_style.length > 0 && (
                      <div><span className="text-muted-foreground">working_style:</span> <span className="text-foreground">[{currentFingerprint.working_style.map((style: string) => `"${style}"`).join(', ')}]</span></div>
                    )}

                    {currentFingerprint.core_intention && (
                      <div><span className="text-muted-foreground">core_intention:</span> <span className="text-foreground">"{currentFingerprint.core_intention}"</span></div>
                    )}

                    {currentFingerprint.success_vision && (
                      <div><span className="text-muted-foreground">success_vision:</span> <span className="text-foreground">"{currentFingerprint.success_vision}"</span></div>
                    )}

                    {currentFingerprint.personal_growth && currentFingerprint.personal_growth.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">personal_growth:</span>
                        <div className="ml-4 text-foreground">
                          {currentFingerprint.personal_growth.map((growth: string, idx: number) => (
                            <div key={idx} className="text-xs">• {growth.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFingerprint.key_phases && currentFingerprint.key_phases.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">key_phases:</span>
                        <div className="ml-4 text-foreground">
                          {currentFingerprint.key_phases.map((phase: any, idx: number) => (
                            <div key={idx} className="text-xs">• {typeof phase === 'string' ? phase.replace('_', ' ') : phase.name || phase}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFingerprint.tangible_deliverables && currentFingerprint.tangible_deliverables.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">tangible_deliverables:</span>
                        <div className="ml-4 text-foreground">
                          {currentFingerprint.tangible_deliverables.map((deliverable: string, idx: number) => (
                            <div key={idx} className="text-xs">• {deliverable.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFingerprint.potential_obstacles && currentFingerprint.potential_obstacles.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">potential_obstacles:</span>
                        <div className="ml-4 text-foreground">
                          {currentFingerprint.potential_obstacles.map((obstacle: string, idx: number) => (
                            <div key={idx} className="text-xs">• {obstacle.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFingerprint.support_systems && currentFingerprint.support_systems.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">support_systems:</span>
                        <div className="ml-4 text-foreground">
                          {currentFingerprint.support_systems.map((system: string, idx: number) => (
                            <div key={idx} className="text-xs">• {system.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFingerprint.status && (
                      <div><span className="text-muted-foreground">status:</span> <span className="text-foreground">"{currentFingerprint.status}"</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Widget Information */}
              <div className="pt-2 border-t border-border/20">
                <div className="text-sm font-medium text-foreground mb-2">Widget Configuration:</div>
                <div className="text-xs text-muted-foreground/70 bg-muted/30 px-3 py-2 rounded-md">
                  <div><span className="font-medium text-foreground">Generated Widgets:</span> Widgets will be generated by the agent system</div>
                  <div className="mt-1">
                    <span className="font-medium text-foreground">Status:</span> <span className="text-muted-foreground">Waiting for agent generation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main container - separate from overlay */}
      <div className="min-h-screen bg-background">
        {/* Header with controls */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </Button>
                )}

                <div>
                  <h1 className="text-lg font-medium text-foreground">
                    Project Reveal
                  </h1>
                  <p className="text-sm text-muted-foreground/70">
                    Watch your fingerprint transform into a personalized dashboard
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Reset button */}
                {showProjectView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative">
          <LivingProjectView fingerprint={currentFingerprint} />

          {/* Transition overlay */}
          <ConstellationTransition
            isActive={showTransition}
            onComplete={handleTransitionComplete}
            duration={3000}
          />
        </div>
      </div>
    </>
  )
}
