'use client'

import React from 'react'
import { LivingProjectView } from './LivingProjectView'
import sampleFingerprintsData from '@/data/sample-fingerprints.json'
import sampleWidgetsData from '@/data/sample-widgets.json'
import { WidgetConfig } from './WidgetFactory'

// TODO: Remove all sample data imports and replace with backend queries
// TODO: Implement real fingerprint loading from Convex database
// TODO: Add widget configuration persistence and sync
// TODO: Implement demo mode that doesn't save to backend

interface LivingProjectViewDemoProps {
  selectedFingerprint: number
}

// TODO: Replace this entire function with backend widget generation API
// TODO: Implement intelligent widget suggestion based on fingerprint analysis
// TODO: Add widget personalization based on user behavior patterns
// TODO: Implement widget A/B testing and optimization
// Function to convert sample widget data to WidgetConfig format
function convertSampleWidgetsToConfig(fingerprintId: string): WidgetConfig[] {
  const widgetData = sampleWidgetsData.widget_data[fingerprintId]

  if (!widgetData) {
    // TODO: Implement fallback widget generation for unknown fingerprints
    return []
  }

  const widgets: WidgetConfig[] = []

  // TODO: Replace hardcoded theme logic with backend theme configuration
  // TODO: Implement dynamic theme assignment based on user preferences
  // Convert each widget in the sample data to WidgetConfig format
  Object.entries(widgetData).forEach(([widgetKey, widgetInfo]: [string, any], index) => {
    // Determine theme based on fingerprint domain
    let theme: 'warm' | 'clean' | 'professional' = 'clean'
    const fingerprint = sampleFingerprintsData.fingerprints.find(fp => fp.projectId === fingerprintId)
    if (fingerprint) {
      // TODO: Load theme mappings from backend configuration
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

    // TODO: Replace hardcoded sizing logic with backend widget configuration
    // TODO: Implement dynamic widget sizing based on content and user preferences
    // TODO: Add widget priority calculation based on usage analytics
    // Determine size and priority based on widget type
    let size: 'small' | 'medium' | 'large' = 'medium'
    let priority = 8 - index // Decreasing priority for each widget

    // TODO: Load widget type configurations from backend
    // TODO: Implement ML-based widget sizing recommendations
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

  // TODO: Replace hardcoded sorting with backend widget ranking algorithm
  // TODO: Implement dynamic widget limits based on user preferences and screen size
  // TODO: Add widget recommendation system based on usage patterns
  // Sort by priority and limit to 6 widgets
  return widgets
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6)
}

// TODO: Replace demo component with real project loading from backend
// TODO: Implement fingerprint selection from user's actual projects
// TODO: Add demo mode toggle that doesn't persist changes to backend
export function LivingProjectViewDemo({ selectedFingerprint }: LivingProjectViewDemoProps) {
  // TODO: Load fingerprints from Convex database instead of sample data
  // TODO: Implement fingerprint caching and offline support
  const fingerprints = sampleFingerprintsData.fingerprints // Use all 5 fingerprints for demo
  const fingerprint = fingerprints[selectedFingerprint]
  // TODO: Replace with real widget loading from backend
  // TODO: Implement widget lazy loading and pagination
  const sampleWidgets = convertSampleWidgetsToConfig(fingerprint.projectId)

  return (
    <LivingProjectView
      fingerprint={fingerprint}
      sampleWidgets={sampleWidgets}
    />
  )
}
