'use client'

import React, { useState, useEffect } from 'react'
import { LivingProjectView } from './LivingProjectView'
import { ConstellationTransition } from './ConstellationTransition'
import { LivingProjectViewDemo } from './LivingProjectViewDemo'
import { ProjectFingerprint } from './WidgetFactory'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, RotateCcw, Sparkles, Star, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import sampleFingerprintsData from '@/data/sample-fingerprints.json'
import sampleWidgetsData from '@/data/sample-widgets.json'
import { WidgetConfig } from './WidgetFactory'

interface ProjectRevealProps {
  fingerprint: ProjectFingerprint
  onBack?: () => void
}

export function ProjectReveal({
  fingerprint,
  onBack
}: ProjectRevealProps) {
  const [showTransition, setShowTransition] = useState(false)
  const [showProjectView, setShowProjectView] = useState(false)
  const [selectedDemoFingerprint, setSelectedDemoFingerprint] = useState(0)
  const [isOverlayExpanded, setIsOverlayExpanded] = useState(false)

  const demoFingerprints = sampleFingerprintsData.fingerprints

  // Use the provided fingerprint directly
  const currentFingerprint = fingerprint

  // Function to convert sample widget data to WidgetConfig format
  function convertSampleWidgetsToConfig(fingerprintId: string): WidgetConfig[] {
    const widgetData = sampleWidgetsData.widget_data[fingerprintId]

    if (!widgetData) {
      return []
    }

    const widgets: WidgetConfig[] = []

    // Convert each widget in the sample data to WidgetConfig format
    Object.entries(widgetData).forEach(([widgetKey, widgetInfo]: [string, any], index) => {
      // Determine theme based on fingerprint domain
      let theme: 'warm' | 'clean' | 'professional' = 'clean'
      const fingerprint = demoFingerprints.find(fp => fp.projectId === fingerprintId)
      if (fingerprint) {
        switch (fingerprint.domain) {
          case 'creative':
            theme = 'warm'
            break
          case 'business':
            theme = 'professional'
            break
          case 'academic':
            theme = 'clean'
            break
          default:
            theme = 'clean'
        }
      }

      // Determine size and priority based on widget type
      let size: 'small' | 'medium' | 'large' = 'medium'
      let priority = 8 - index // Decreasing priority for each widget

      // Special sizing for certain widget types
      if (widgetKey.includes('timeline') || widgetKey.includes('tracker') || widgetKey.includes('chart')) {
        size = 'large'
        priority = 9
      } else if (widgetKey.includes('board') || widgetKey.includes('pipeline')) {
        size = 'medium'
        priority = 8
      } else {
        size = 'small'
        priority = 7
      }

      widgets.push({
        id: widgetKey,
        type: widgetKey,
        title: widgetInfo.title,
        priority: Math.max(1, Math.min(10, priority)),
        theme,
        size,
        data: widgetInfo.data
      })
    })

    // Sort by priority and limit to 6 widgets
    return widgets
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6)
  }

  const sampleWidgets = convertSampleWidgetsToConfig(demoFingerprints[selectedDemoFingerprint].projectId)

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
                {demoFingerprints[selectedDemoFingerprint].name}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><span className="font-medium text-foreground">Domain:</span> <span className="text-muted-foreground">{demoFingerprints[selectedDemoFingerprint].domain}</span></div>
              <div><span className="font-medium text-foreground">Complexity:</span> <span className="text-muted-foreground">{demoFingerprints[selectedDemoFingerprint].complexity_level}/10</span></div>
              <div><span className="font-medium text-foreground">Pattern:</span> <span className="text-muted-foreground">{demoFingerprints[selectedDemoFingerprint].primary_pattern?.replace('_', ' ')}</span></div>
              <div><span className="font-medium text-foreground">Collaboration:</span> <span className="text-muted-foreground">{demoFingerprints[selectedDemoFingerprint].collaboration_style?.replace('_', ' ')}</span></div>
            </div>
          </div>

          {/* Expanded Content */}
          {isOverlayExpanded && (
            <div className="border-t border-border/20 pt-4 space-y-4">
              {/* Full Fingerprint Data */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Complete Fingerprint Data:</div>
                <div className="bg-muted/20 rounded-lg p-4 space-y-2">
                  <div className="text-xs font-mono space-y-1">
                    <div><span className="text-muted-foreground">projectId:</span> <span className="text-foreground">{demoFingerprints[selectedDemoFingerprint].projectId}</span></div>
                    <div><span className="text-muted-foreground">name:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].name}"</span></div>
                    <div><span className="text-muted-foreground">domain:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].domain}"</span></div>
                    <div><span className="text-muted-foreground">complexity_level:</span> <span className="text-foreground">{demoFingerprints[selectedDemoFingerprint].complexity_level}</span></div>

                    {demoFingerprints[selectedDemoFingerprint].primary_pattern && (
                      <div><span className="text-muted-foreground">primary_pattern:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].primary_pattern}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].collaboration_style && (
                      <div><span className="text-muted-foreground">collaboration_style:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].collaboration_style}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].description && (
                      <div><span className="text-muted-foreground">description:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].description}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].time_horizon && (
                      <div><span className="text-muted-foreground">time_horizon:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].time_horizon}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].working_style && demoFingerprints[selectedDemoFingerprint].working_style.length > 0 && (
                      <div><span className="text-muted-foreground">working_style:</span> <span className="text-foreground">[{demoFingerprints[selectedDemoFingerprint].working_style.map((style: string) => `"${style}"`).join(', ')}]</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].core_intention && (
                      <div><span className="text-muted-foreground">core_intention:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].core_intention}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].success_vision && (
                      <div><span className="text-muted-foreground">success_vision:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].success_vision}"</span></div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].personal_growth && demoFingerprints[selectedDemoFingerprint].personal_growth.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">personal_growth:</span>
                        <div className="ml-4 text-foreground">
                          {demoFingerprints[selectedDemoFingerprint].personal_growth.map((growth: string, idx: number) => (
                            <div key={idx} className="text-xs">• {growth.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].key_phases && demoFingerprints[selectedDemoFingerprint].key_phases.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">key_phases:</span>
                        <div className="ml-4 text-foreground">
                          {demoFingerprints[selectedDemoFingerprint].key_phases.map((phase: string, idx: number) => (
                            <div key={idx} className="text-xs">• {phase.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].tangible_deliverables && demoFingerprints[selectedDemoFingerprint].tangible_deliverables.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">tangible_deliverables:</span>
                        <div className="ml-4 text-foreground">
                          {demoFingerprints[selectedDemoFingerprint].tangible_deliverables.map((deliverable: string, idx: number) => (
                            <div key={idx} className="text-xs">• {deliverable.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].potential_obstacles && demoFingerprints[selectedDemoFingerprint].potential_obstacles.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">potential_obstacles:</span>
                        <div className="ml-4 text-foreground">
                          {demoFingerprints[selectedDemoFingerprint].potential_obstacles.map((obstacle: string, idx: number) => (
                            <div key={idx} className="text-xs">• {obstacle.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].support_systems && demoFingerprints[selectedDemoFingerprint].support_systems.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">support_systems:</span>
                        <div className="ml-4 text-foreground">
                          {demoFingerprints[selectedDemoFingerprint].support_systems.map((system: string, idx: number) => (
                            <div key={idx} className="text-xs">• {system.replace('_', ' ')}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {demoFingerprints[selectedDemoFingerprint].status && (
                      <div><span className="text-muted-foreground">status:</span> <span className="text-foreground">"{demoFingerprints[selectedDemoFingerprint].status}"</span></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Widget Information */}
              <div className="pt-2 border-t border-border/20">
                <div className="text-sm font-medium text-foreground mb-2">Widget Configuration:</div>
                <div className="text-xs text-muted-foreground/70 bg-muted/30 px-3 py-2 rounded-md">
                  <div><span className="font-medium text-foreground">Generated Widgets:</span> {sampleWidgets.length} widgets from sample data</div>
                  <div className="mt-1">
                    <span className="font-medium text-foreground">Widget Types:</span>
                    <div className="ml-2 mt-1 space-y-1">
                      {sampleWidgets.map((widget, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span>{widget.type}</span>
                          <span className="text-muted-foreground">({widget.size}, prio: {widget.priority})</span>
                        </div>
                      ))}
                    </div>
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
                {/* Demo project selector */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm text-muted-foreground/70 font-medium whitespace-nowrap">Select Project:</span>
                  <Select
                    value={selectedDemoFingerprint.toString()}
                    onValueChange={(value) => setSelectedDemoFingerprint(parseInt(value))}
                  >
                    <SelectTrigger className="min-w-[200px] max-w-[300px] border-border/40 hover:border-border/60 transition-colors">
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent className="min-w-[280px]">
                      {demoFingerprints.map((fp, index) => (
                        <SelectItem key={fp.projectId} value={index.toString()}>
                          <div className="flex flex-col py-2 min-w-0">
                            <span className="font-medium text-sm truncate">{fp.name}</span>
                            <span className="text-xs text-muted-foreground/70 truncate">
                              {fp.domain} • {fp.primary_pattern?.replace('_', ' ')} • {fp.collaboration_style?.replace('_', ' ')}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>


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
        {!showProjectView ? (
          <div>
            {/* Living Project Demo - seamless connection */}
            <LivingProjectViewDemo selectedFingerprint={selectedDemoFingerprint} />
          </div>
        ) : (
          <LivingProjectView fingerprint={currentFingerprint} />
        )}

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
