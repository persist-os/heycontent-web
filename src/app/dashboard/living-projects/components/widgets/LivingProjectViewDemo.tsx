'use client'

import React from 'react'
import { LivingProjectView } from './LivingProjectView'
import sampleFingerprintsData from '@/data/sample-fingerprints.json'
import sampleWidgetsData from '@/data/sample-widgets.json'
import { WidgetConfig } from './WidgetFactory'

interface LivingProjectViewDemoProps {
  selectedFingerprint: number
}

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
    const fingerprint = sampleFingerprintsData.fingerprints.find(fp => fp.projectId === fingerprintId)
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

export function LivingProjectViewDemo({ selectedFingerprint }: LivingProjectViewDemoProps) {
  const fingerprints = sampleFingerprintsData.fingerprints // Use all 5 fingerprints for demo
  const fingerprint = fingerprints[selectedFingerprint]
  const sampleWidgets = convertSampleWidgetsToConfig(fingerprint.projectId)

  return (
    <LivingProjectView
      fingerprint={fingerprint}
      sampleWidgets={sampleWidgets}
    />
  )
}
