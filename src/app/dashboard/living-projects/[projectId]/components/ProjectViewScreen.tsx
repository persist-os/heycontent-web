'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useProjectFingerprintStore } from '@/store/project-fingerprint-store'
import { useConvex } from 'convex/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft,
  MoreHorizontal,
  Edit3,
  RefreshCw,
  Trash2,
  X,
  Calendar,
  Clock,
  Target,
  Palette,
  Layers,
  Activity
} from 'lucide-react'
import { AgentGeneratedWidgets } from './widgets/AgentGeneratedWidgets'
import { ConstellationTransition } from '@/app/dashboard/living-projects/components/widgets/ConstellationTransition'
import { DeleteProjectModal } from './DeleteProjectModal'
import { ProjectWidgetsData, WidgetConfig } from '@/types/projectWidgets'
import { usePanZoom } from '../../hooks/usePanZoom'
import { ConnectionLines } from '../../components/ConnectionLines'
import { ConstellationControls } from '../../components/ConstellationControls'
import { ConstellationMinimap } from '../../components/ConstellationMinimap'
// Simple date formatting utility
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return options?.addSuffix ? 'just now' : 'now'
  if (diffMinutes < 60) return options?.addSuffix ? `${diffMinutes} minutes ago` : `${diffMinutes}m`
  if (diffHours < 24) return options?.addSuffix ? `${diffHours} hours ago` : `${diffHours}h`
  if (diffDays < 7) return options?.addSuffix ? `${diffDays} days ago` : `${diffDays}d`
  
  return date.toLocaleDateString()
}

// Helper function to get widget theme classes
const getWidgetThemeClasses = (theme: string) => {
  switch (theme) {
    case 'warm':
      return 'bg-gradient-to-br from-orange-50/50 to-yellow-50/30 dark:from-orange-950/30 dark:to-yellow-950/20 border-orange-200/60 dark:border-orange-800/40 text-orange-700 dark:text-orange-300 shadow-orange-200/50 dark:shadow-orange-900/30'
    case 'clean':
      return 'bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20 border-slate-200/60 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 shadow-slate-200/50 dark:shadow-slate-900/30'
    case 'professional':
      return 'bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 shadow-blue-200/50 dark:shadow-blue-900/30'
    case 'creative':
      return 'bg-gradient-to-br from-purple-50/50 to-pink-50/30 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200/60 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 shadow-purple-200/50 dark:shadow-purple-900/30'
    default:
      return 'bg-gradient-to-br from-slate-50/50 to-gray-50/30 dark:from-slate-950/30 dark:to-gray-950/20 border-slate-200/60 dark:border-slate-800/40 text-slate-700 dark:text-slate-300 shadow-slate-200/50 dark:shadow-slate-900/30'
  }
}

// Helper function to get widget size classes
const getWidgetSizeClasses = (size: string) => {
  switch (size) {
    case 'small':
      return 'col-span-1 row-span-1'
    case 'medium':
      return 'col-span-2 row-span-1'
    case 'large':
      return 'col-span-2 row-span-2'
    case 'xlarge':
      return 'col-span-3 row-span-2'
    default:
      return 'col-span-2 row-span-1'
  }
}

// Constellation layout hook for widget positioning
function useWidgetLayout(widgets: WidgetConfig[]): {
  positions: Array<{
    id: string
    x: number
    y: number
    size: 'small' | 'medium' | 'large'
    importance: number
    cluster?: number
  }>
  canvasWidth: number
  canvasHeight: number
  connections: Array<{ from: string; to: string; strength: number }>
} {
  return React.useMemo(() => {
    // Handle SSR - use default values when window is not available
    const isSSR = typeof window === 'undefined'
    const defaultWidth = isSSR ? 2400 : window.innerWidth * 3
    const defaultHeight = isSSR ? 1600 : window.innerHeight * 2.5
    
    if (!widgets.length) {
      return {
        positions: [],
        canvasWidth: defaultWidth,
        canvasHeight: defaultHeight,
        connections: []
      }
    }

    const canvasWidth = Math.max(defaultWidth, 2400)
    const canvasHeight = Math.max(defaultHeight, 1600)

    // Calculate widget importance scores
    const widgetsWithImportance = widgets.map(widget => {
      const isHighPriority = widget.priority > 7
      const isLarge = widget.size === 'large'
      const isRecent = true // Widgets are always "current"

      let importance = 0.3 // Base importance

      if (isHighPriority) importance += 0.4
      if (isLarge) importance += 0.2
      if (isRecent) importance += 0.3

      importance = Math.min(importance, 1)

      return { ...widget, importance }
    })

    // Sort by importance for cluster generation
    const sortedWidgets = [...widgetsWithImportance].sort((a, b) => b.importance - a.importance)

    // Generate cluster centers for important widgets
    const numClusters = Math.min(Math.ceil(widgets.length / 4), 6)
    const clusterCenters: Array<{ x: number; y: number; radius: number }> = []

    for (let i = 0; i < numClusters; i++) {
      const angle = (i / numClusters) * Math.PI * 2
      const distance = Math.min(canvasWidth, canvasHeight) * 0.3
      const centerX = canvasWidth / 2 + Math.cos(angle) * distance
      const centerY = canvasHeight / 2 + Math.sin(angle) * distance

      // Add some randomness to break perfect symmetry
      const randomOffsetX = (Math.random() - 0.5) * 150
      const randomOffsetY = (Math.random() - 0.5) * 150

      clusterCenters.push({
        x: centerX + randomOffsetX,
        y: centerY + randomOffsetY,
        radius: 120 + Math.random() * 80
      })
    }

    // Position widgets using force-directed algorithm
    const positions: Array<{
      id: string
      x: number
      y: number
      size: 'small' | 'medium' | 'large'
      importance: number
      cluster?: number
    }> = []
    const minDistance = 200 // Minimum distance between widgets

    sortedWidgets.forEach((widget, index) => {
      let bestPosition = { x: 0, y: 0 }
      let bestScore = -Infinity
      const maxAttempts = 40

      // Try multiple positions and pick the best one
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let x: number, y: number

        if (index < clusterCenters.length) {
          // Important widgets get cluster centers
          const cluster = clusterCenters[index]
          x = cluster.x + (Math.random() - 0.5) * cluster.radius
          y = cluster.y + (Math.random() - 0.5) * cluster.radius
        } else {
          // Other widgets are placed near existing clusters
          const nearestCluster = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
          const angle = Math.random() * Math.PI * 2
          const distance = nearestCluster.radius + Math.random() * 150
          x = nearestCluster.x + Math.cos(angle) * distance
          y = nearestCluster.y + Math.sin(angle) * distance
        }

        // Ensure position is within canvas bounds
        x = Math.max(150, Math.min(canvasWidth - 150, x))
        y = Math.max(120, Math.min(canvasHeight - 120, y))

        // Check distance from other widgets
        let validPosition = true
        let score = 0

        for (const existingPos of positions) {
          const distance = Math.sqrt(
            Math.pow(x - existingPos.x, 2) + Math.pow(y - existingPos.y, 2)
          )

          if (distance < minDistance) {
            validPosition = false
            break
          }

          // Prefer positions that create interesting visual patterns
          score += Math.min(distance, 400) / 400
        }

        if (validPosition && score > bestScore) {
          bestScore = score
          bestPosition = { x, y }
        }
      }

      positions.push({
        id: widget.widget_id,
        x: bestPosition.x,
        y: bestPosition.y,
        size: widget.size as 'small' | 'medium' | 'large',
        importance: widget.importance,
        cluster: Math.floor(index / Math.ceil(widgets.length / numClusters))
      })
    })

    // Generate connections between related widgets
    const connections: Array<{ from: string; to: string; strength: number }> = []

    positions.forEach((pos1, i) => {
      positions.slice(i + 1).forEach(pos2 => {
        const widget1 = widgetsWithImportance.find(w => w.widget_id === pos1.id)!
        const widget2 = widgetsWithImportance.find(w => w.widget_id === pos2.id)!

        let connectionStrength = 0

        // Same cluster = stronger connection
        if (pos1.cluster === pos2.cluster) {
          connectionStrength += 0.3
        }

        // Same theme = related
        if (widget1.theme === widget2.theme) {
          connectionStrength += 0.2
        }

        // Similar priority = related
        if (Math.abs(widget1.priority - widget2.priority) <= 2) {
          connectionStrength += 0.2
        }

        // Distance-based connection (closer = more likely to connect)
        const distance = Math.sqrt(
          Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2)
        )
        if (distance < 300) {
          connectionStrength += 0.2 * (1 - distance / 300)
        }

        // Only create connection if strength is above threshold
        if (connectionStrength > 0.25) {
          connections.push({
            from: pos1.id,
            to: pos2.id,
            strength: Math.min(connectionStrength, 1)
          })
        }
      })
    })

    return {
      positions,
      canvasWidth,
      canvasHeight,
      connections
    }
  }, [widgets])
}

// Floating Widget Card Component for constellation view
function FloatingWidgetCard({
  widget,
  x,
  y,
  size,
  importance,
  isHighlighted = false,
  scale,
  onClick,
  onHover
}: {
  widget: WidgetConfig
  x: number
  y: number
  size: 'small' | 'medium' | 'large'
  importance: number
  isHighlighted?: boolean
  scale: number
  onClick: () => void
  onHover?: (widgetId: string | null) => void
}) {
  // Dynamic sizing based on zoom level and content
  const getCardDimensions = () => {
    // Base sizes
    const baseSizes = {
      small: { width: 280, minHeight: 200 }, // Smaller for constellation
      medium: { width: 320, minHeight: 240 },
      large: { width: 360, minHeight: 280 }
    }
    
    // Default to medium if size is undefined
    const baseSize = baseSizes[size] || baseSizes.medium
    
    // Scale up dimensions based on zoom level for better readability
    const zoomMultiplier = Math.max(0.8, scale * 0.8) // Subtle scaling with zoom
    
    return {
      width: baseSize.width * zoomMultiplier,
      minHeight: baseSize.minHeight * zoomMultiplier
    }
  }

  const { width, minHeight } = getCardDimensions()

  // Show different levels of detail based on zoom
  const showDescription = scale > 0.8
  const showMetadata = scale > 1.0
  const showFullDetails = scale > 1.4

  // Calculate opacity based on importance and scale
  const baseOpacity = Math.max(0.7, importance)
  const scaleOpacity = Math.min(1, Math.max(0.6, scale))
  const finalOpacity = baseOpacity * scaleOpacity

  return (
    <div
      className="absolute cursor-pointer group transition-all duration-300 ease-out will-change-transform"
      style={{
        left: `${x - width/2}px`,
        top: `${y - minHeight/2}px`,
        width: `${width}px`,
        minHeight: `${minHeight}px`,
        opacity: finalOpacity
      }}
      onClick={onClick}
      onMouseEnter={() => onHover?.(widget.widget_id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Main Card */}
      <div className={`
        relative w-full rounded-xl border-2 backdrop-blur-sm
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:z-10
        ${getWidgetThemeClasses(widget.theme)}
        ${isHighlighted ? 'ring-2 ring-blue-400/60 scale-[1.01]' : 'ring-1 ring-border/50'}
      `} style={{ minHeight: `${minHeight}px` }}>
        {/* Subtle border glow effect */}
        <div className={`
          absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300
          bg-gradient-to-br from-white/5 via-transparent to-white/5
        `} />

        {/* Content */}
        <div className="relative p-6 flex flex-col h-full">
          {/* Widget Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`
                font-semibold text-foreground leading-tight transition-colors duration-300
                group-hover:text-blue-600 dark:group-hover:text-blue-400 break-words
                ${size === 'large' ? 'text-lg' : size === 'medium' ? 'text-base' : 'text-sm'}
              `}>
                {widget.title}
              </h3>
              <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                {widget.widget_type}
              </div>
            </div>
            {showDescription && (
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {widget.description}
              </p>
            )}
          </div>

          {/* Widget Content */}
          <div className="flex-grow space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-medium text-foreground">{widget.category}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Priority:</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(widget.priority / 10) * 100}%` }}
                  />
                </div>
                <span className="font-medium text-foreground text-xs">{widget.priority}/10</span>
              </div>
            </div>
            {showMetadata && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium text-foreground capitalize">{widget.size}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Theme:</span>
                  <span className="font-medium text-foreground capitalize">{widget.theme}</span>
                </div>
              </>
            )}
          </div>

          {/* Widget Footer */}
          {showFullDetails && (
            <div className="mt-4 pt-4 border-t border-current/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground/50">
                <span>ID: {widget.widget_id}</span>
                <span className="capitalize">{widget.update_frequency}</span>
              </div>
            </div>
          )}
        </div>

        {/* Importance indicator - subtle corner accent */}
        <div
          className={`
            absolute top-0 right-0 w-3 h-3 rounded-bl-lg rounded-tr-lg
            transition-opacity duration-300
            ${importance > 0.7 ? 'bg-blue-400/30' : importance > 0.4 ? 'bg-blue-400/20' : 'bg-blue-400/10'}
            ${isHighlighted ? 'opacity-100' : 'opacity-60'}
          `}
        />
      </div>
    </div>
  )
}

// Widget Details Panel Component
const WidgetDetailsPanel = ({ 
  widget, 
  isOpen, 
  onClose 
}: { 
  widget: WidgetConfig | null
  isOpen: boolean
  onClose: () => void
}) => {
  if (!isOpen || !widget) return null

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 dark:text-red-400'
    if (priority >= 6) return 'text-orange-600 dark:text-orange-400'
    if (priority >= 4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 8) return 'Critical'
    if (priority >= 6) return 'High'
    if (priority >= 4) return 'Medium'
    return 'Low'
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background/95 backdrop-blur-sm border-l border-border/50 shadow-xl z-30 transform transition-transform duration-300 ease-out">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getWidgetThemeClasses(widget.theme).includes('orange') ? 'bg-orange-400' : getWidgetThemeClasses(widget.theme).includes('blue') ? 'bg-blue-400' : getWidgetThemeClasses(widget.theme).includes('purple') ? 'bg-purple-400' : 'bg-slate-400'}`} />
            <h2 className="text-lg font-semibold text-foreground">{widget.title}</h2>
          </div>
          <button
            title="Close"
            onClick={onClose}
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm text-foreground leading-relaxed">{widget.description}</p>
          </div>

          {/* Widget Type & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
              <Badge variant="secondary" className="text-xs">
                {widget.widget_type}
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Category</h3>
              <Badge variant="outline" className="text-xs">
                {widget.category}
              </Badge>
            </div>
          </div>

          {/* Priority */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Priority</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    widget.priority >= 8 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                    widget.priority >= 6 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                    widget.priority >= 4 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${(widget.priority / 10) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getPriorityColor(widget.priority)}`}>
                  {getPriorityLabel(widget.priority)}
                </span>
                <span className="text-xs text-muted-foreground">({widget.priority}/10)</span>
              </div>
            </div>
          </div>

          {/* Size & Theme */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Size</h3>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.size}</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Theme</h3>
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground capitalize">{widget.theme}</span>
              </div>
            </div>
          </div>

          {/* Update Frequency */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Update Frequency</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground capitalize">{widget.update_frequency}</span>
            </div>
          </div>

          {/* Widget ID */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Widget ID</h3>
            <div className="bg-muted/30 rounded-md p-3">
              <code className="text-xs text-muted-foreground font-mono break-all">
                {widget.widget_id}
              </code>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-border/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Activity className="w-4 h-4 mr-2" />
                View Activity
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Target className="w-4 h-4 mr-2" />
                Configure Settings
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Updates
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/30">
          <div className="text-xs text-muted-foreground/60 text-center">
            Widget created by AI • Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Widget Generation Loading Animation Component
const WidgetGenerationLoader = () => (
  <div className="min-h-screen p-8 flex items-center justify-center">
    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Animated Constellation */}
      <div className="relative w-64 h-64 mx-auto">
        {/* Central pulsing core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shadow-lg shadow-blue-500/50"></div>
        </div>
        
        {/* Orbiting particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-spin"
            style={{
              top: '50%',
              left: '50%',
              transformOrigin: `${120 + i * 20}px 0px`,
              transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateX(${120 + i * 20}px)`,
              animation: `orbit ${3 + i * 0.5}s linear infinite`
            }}
          />
        ))}
        
        {/* Floating widgets */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg opacity-70 animate-bounce"
            style={{
              top: `${20 + i * 20}%`,
              left: `${10 + i * 25}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + i * 0.3}s`
            }}
          />
        ))}
      </div>
      
      {/* Loading Text */}
      <div className="space-y-4">
        <h2 className="text-3xl font-light text-foreground">
          Generating Your Project Constellation
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Our AI is analyzing your project fingerprint and creating personalized widgets 
          tailored to your unique working style and project characteristics.
        </p>
        
        {/* Progress Steps */}
        <div className="flex justify-center space-x-8 mt-8">
          {[
            { step: 1, text: 'Analyzing Fingerprint', status: 'active' },
            { step: 2, text: 'Generating Categories', status: 'pending' },
            { step: 3, text: 'Creating Widgets', status: 'pending' },
            { step: 4, text: 'Optimizing Layout', status: 'pending' }
          ].map(({ step, text, status }) => (
            <div key={step} className="flex flex-col items-center space-y-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${status === 'active' 
                  ? 'bg-blue-500 text-white animate-pulse' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                {step}
              </div>
              <span className="text-xs text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <style jsx>{`
      @keyframes orbit {
        from { transform: translate(-50%, -50%) rotate(0deg) translateX(120px) rotate(0deg); }
        to { transform: translate(-50%, -50%) rotate(360deg) translateX(120px) rotate(-360deg); }
      }
    `}</style>
  </div>
)

interface ProjectViewScreenProps {
  projectId: string
}

export function ProjectViewScreen({ projectId }: ProjectViewScreenProps) {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const convex = useConvex()
  const [showTransition, setShowTransition] = useState(false)
  const [showProjectView, setShowProjectView] = useState(false)
  const [isGeneratingWidgets, setIsGeneratingWidgets] = useState(false)
  const [widgetGenerationAttempted, setWidgetGenerationAttempted] = useState(false)
  const [highlightedWidget, setHighlightedWidget] = useState<string | null>(null)
  const [selectedWidget, setSelectedWidget] = useState<WidgetConfig | null>(null)
  const [showWidgetPanel, setShowWidgetPanel] = useState(false)
  const [viewportSize, setViewportSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  })
  
  // Menu and delete state
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const deleteProject = useMutation(api.projectsMutations.deleteProject)

  // Fetch project data
  const project = useQuery(
    api.projectsQueries.getProjectDetails,
    projectId && firebaseUser?.uid ? { 
      projectId: projectId as any, 
      userId: firebaseUser.uid 
    } : 'skip'
  )

  // Fetch project widgets
  const projectWidgets = useQuery(
    api.projectWidgetsQueries.getProjectWidgetsByProject,
    projectId ? { projectId: projectId as any } : 'skip'
  )

  // Initialize fingerprint store
  const { initializeFingerprintData, currentFingerprint, isLoading: fingerprintLoading } = useProjectFingerprintStore()

  useEffect(() => {
    if (firebaseUser?.uid && projectId && convex) {
      initializeFingerprintData(projectId, firebaseUser.uid, convex)
    }
  }, [firebaseUser?.uid, projectId, convex, initializeFingerprintData])

  // Generate constellation layout
  const layout = useWidgetLayout((projectWidgets?.widgets || []) as WidgetConfig[])

  // Pan and zoom functionality
  const {
    transform,
    containerRef,
    handleWheel,
    handleMouseDown,
    zoomIn,
    zoomOut,
    resetView,
    focusOnPoint
  } = usePanZoom(layout.canvasWidth, layout.canvasHeight, viewportSize.width, viewportSize.height)

  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  // Prevent page scroll when constellation is active
  useEffect(() => {
    // Store original body styles
    const originalOverflow = document.body.style.overflow
    const originalHeight = document.body.style.height
    const originalPosition = document.body.style.position

    // Lock body scroll
    document.body.style.overflow = 'hidden'
    document.body.style.height = '100vh'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'

    // Prevent wheel events on document
    const preventWheel = (e: WheelEvent) => {
      if (e.target instanceof Element) {
        // Only prevent if the event target is within our constellation container
        const constellationElement = containerRef.current
        if (constellationElement && constellationElement.contains(e.target as Node)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    // Prevent touch scrolling on mobile
    const preventTouch = (e: TouchEvent) => {
      if (e.target instanceof Element) {
        const constellationElement = containerRef.current
        if (constellationElement && constellationElement.contains(e.target as Node)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    document.addEventListener('wheel', preventWheel, { passive: false })
    document.addEventListener('touchmove', preventTouch, { passive: false })

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.height = originalHeight
      document.body.style.position = originalPosition
      document.body.style.width = ''
      document.removeEventListener('wheel', preventWheel)
      document.removeEventListener('touchmove', preventTouch)
    }
  }, [containerRef])

  // Virtual rendering - only render widgets visible in viewport + buffer
  const visibleWidgets = React.useMemo(() => {
    const buffer = 400 // Buffer zone around viewport
    const viewportLeft = -transform.x / transform.scale - buffer
    const viewportTop = -transform.y / transform.scale - buffer
    const viewportRight = viewportLeft + (viewportSize.width / transform.scale) + (buffer * 2)
    const viewportBottom = viewportTop + (viewportSize.height / transform.scale) + (buffer * 2)

    return layout.positions.filter(position =>
      position.x >= viewportLeft &&
      position.x <= viewportRight &&
      position.y >= viewportTop &&
      position.y <= viewportBottom
    )
  }, [layout.positions, transform, viewportSize])

  // Create widget lookup for performance
  const widgetMap = React.useMemo(() => {
    const map = new Map<string, WidgetConfig>()
    if (projectWidgets?.widgets) {
      projectWidgets.widgets.forEach(widget => map.set(widget.widget_id, widget as WidgetConfig))
    }
    return map
  }, [projectWidgets?.widgets])

  // Handle widget click
  const handleWidgetClick = React.useCallback((widget: WidgetConfig) => {
    console.log('Widget clicked:', widget.title, widget.widget_type)
    setSelectedWidget(widget)
    setShowWidgetPanel(true)
  }, [])

  // Handle minimap viewport click
  const handleMinimapClick = React.useCallback((x: number, y: number) => {
    focusOnPoint(x, y)
  }, [focusOnPoint])

  // Handle widget hover for connection highlighting
  const handleWidgetHover = React.useCallback((widgetId: string | null) => {
    setHighlightedWidget(widgetId)
  }, [])

  // Handle wheel events to prevent page scroll conflicts
  const handleCanvasWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleWheel(e)
  }, [handleWheel])

  // Handle mouse events to prevent conflicts
  const handleCanvasMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleMouseDown(e)
  }, [handleMouseDown])

  // Auto-generate widgets if project doesn't have widgetId
  useEffect(() => {
    const autoGenerateWidgets = async () => {
      if (
        project && 
        currentFingerprint && 
        !projectWidgets?.widgets?.length && 
        !isGeneratingWidgets &&
        !widgetGenerationAttempted &&
        firebaseUser
      ) {
        console.log('[AUTO-GENERATE] Starting automatic widget generation')
        setIsGeneratingWidgets(true)
        setWidgetGenerationAttempted(true)
        
        try {
          console.log('[AUTO-GENERATE] Calling widget generation with:', {
            fingerprint_id: currentFingerprint._id,
            project_id: projectId,
            currentFingerprint: currentFingerprint,
            project: project
          })
          
          const response = await fetch(`/api/projects/${projectId}/generate-widgets`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
            },
            body: JSON.stringify({
              fingerprint_id: currentFingerprint._id,
              project_id: projectId,
              user_preferences: {}
            })
          })

          if (response.ok) {
            console.log('[AUTO-GENERATE] Widgets generated successfully')
            // Widgets will be automatically updated via Convex real-time sync
          } else {
            console.error('[AUTO-GENERATE] Failed to generate widgets')
            // Don't reset the attempted flag on authorization errors to prevent infinite loop
            // Only reset on network/technical errors
            if (response.status === 401 || response.status === 403) {
              console.log('[AUTO-GENERATE] Authorization error - not retrying to prevent infinite loop')
            } else {
              setWidgetGenerationAttempted(false)
            }
          }
        } catch (error) {
          console.error('[AUTO-GENERATE] Error generating widgets:', error)
          // Only reset on network/technical errors, not authorization errors
          if (error instanceof Error && !error.message.includes('Unauthorized')) {
            setWidgetGenerationAttempted(false)
          }
        } finally {
          setIsGeneratingWidgets(false)
        }
      }
    }

    autoGenerateWidgets()
  }, [project, currentFingerprint, isGeneratingWidgets, widgetGenerationAttempted, firebaseUser, projectId])

  const handleStartChat = () => {
    router.push(`/dashboard/chat?projectId=${projectId}`)
  }

  const handleCreateNote = () => {
    router.push(`/dashboard/notes?projectId=${projectId}`)
  }

  const handleEditFingerprint = () => {
    router.push(`/dashboard/project-discovery?projectId=${projectId}`)
  }

  const handleRegenerateWidgets = async () => {
    if (!currentFingerprint || !firebaseUser) return
    
    setIsGeneratingWidgets(true)
    setWidgetGenerationAttempted(false) // Reset flag to allow regeneration
    
    try {
      console.log('[REGENERATE] Calling widget generation with:', {
        fingerprint_id: currentFingerprint._id,
        project_id: projectId,
        currentFingerprint: currentFingerprint,
        project: project
      })
      
      // Call the widget generation API
      const response = await fetch(`/api/projects/${projectId}/generate-widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await firebaseUser.getIdToken()}`
        },
        body: JSON.stringify({
          fingerprint_id: currentFingerprint._id,
          project_id: projectId,
          user_preferences: {}
        })
      })

      if (response.ok) {
        // Widgets will be automatically updated via Convex real-time sync
        console.log('Widgets regeneration triggered successfully')
      } else {
        console.error('Failed to regenerate widgets')
      }
    } catch (error) {
      console.error('Error regenerating widgets:', error)
    } finally {
      setIsGeneratingWidgets(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!firebaseUser?.uid) return
    
    try {
      setIsDeleting(true)
      await deleteProject({ 
        projectId: projectId as any, 
        userId: firebaseUser.uid 
      })
      
      // Redirect to projects list after successful deletion
      router.push('/dashboard/living-projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleMenuClick = () => {
    setShowMenu(!showMenu)
  }

  const handleCloseWidgetPanel = () => {
    setShowWidgetPanel(false)
    setSelectedWidget(null)
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

  if (!firebaseUser) {
    return <div>Loading...</div>
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <button 
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse mx-auto" />
              <h2 className="text-xl font-light text-foreground">Loading project</h2>
              <p className="text-muted-foreground/60 text-sm">Preparing your project intelligence...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const lastEvolution = currentFingerprint?.last_evolution 
    ? formatDistanceToNow(new Date(currentFingerprint.last_evolution), { addSuffix: true })
    : 'Never'

  return (
    <>

      {/* Main container - Constellation View */}
      <div className="min-h-screen bg-background">
        {/* Header with controls */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/30">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              {/* Left: Back button */}
              <div className="flex-shrink-0">
                <button 
                  onClick={() => router.push('/dashboard/living-projects')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to projects
                </button>
              </div>

              {/* Center: Project title and description */}
              <div className="flex-1 text-center px-8">
                <h1 className="text-2xl font-medium text-foreground mb-1">
                  {project?.name || 'Project Dashboard'}
                </h1>
                <p className="text-sm text-muted-foreground/70">
                  {project?.description || 'AI-powered project management and insights'}
                </p>
                <div className="text-xs text-muted-foreground/60 mt-2">
                  {isGeneratingWidgets ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      Generating widgets...
                    </span>
                  ) : (
                    `Active: ${projectWidgets?.widgets?.length || 0} widgets • ${projectWidgets?.categories?.length || 0} categories • ${currentFingerprint ? '100%' : '0%'} zoom`
                  )}
                </div>
              </div>

              {/* Right: 3-dots menu */}
              <div className="flex-shrink-0 relative" ref={menuRef}>
                <button
                  onClick={handleMenuClick}
                  className="p-2 hover:bg-muted/50 rounded-md transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-12 bg-background border border-border rounded-md shadow-lg z-30 min-w-[180px]">
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleEditFingerprint()
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit fingerprint
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        handleRegenerateWidgets()
                      }}
                      disabled={isGeneratingWidgets}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {isGeneratingWidgets ? 'Generating...' : 'Regenerate widgets'}
                    </button>
                    <div className="border-t border-border/20 my-1" />
                    <button
                      onClick={() => {
                        setShowMenu(false)
                        setShowDeleteModal(true)
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative">

          {/* Main Content Area */}
          <div className="relative">
            {/* Show loading animation when generating widgets */}
            {isGeneratingWidgets ? (
              <WidgetGenerationLoader />
            ) : currentFingerprint ? (
              <div className={`relative h-screen bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden transition-all duration-300 ${showWidgetPanel ? 'w-[calc(100vw-24rem)]' : 'w-screen'}`} style={{ overscrollBehavior: 'none' }}>
                {/* Widget Constellation Canvas */}
                <div
                  ref={containerRef}
                  className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
                  onWheel={handleCanvasWheel}
                  onMouseDown={handleCanvasMouseDown}
                  onContextMenu={(e) => e.preventDefault()} // Prevent right-click menu
                  style={{
                    willChange: 'transform',
                    overscrollBehavior: 'none', // Prevent scroll chaining
                    touchAction: 'none' // Prevent touch scrolling on mobile
                  }}
                >
                  {/* Canvas Container */}
                  <div
                    className="relative transition-transform duration-100 ease-out"
                    style={{
                      transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                      transformOrigin: '0 0',
                      width: layout.canvasWidth,
                      height: layout.canvasHeight,
                      willChange: 'transform'
                    }}
                  >
                    {/* Connection Lines */}
                    <ConnectionLines
                      connections={layout.connections}
                      positions={layout.positions}
                      canvasWidth={layout.canvasWidth}
                      canvasHeight={layout.canvasHeight}
                      scale={transform.scale}
                      translateX={transform.x}
                      translateY={transform.y}
                      highlightedProject={highlightedWidget}
                      viewportWidth={viewportSize.width}
                      viewportHeight={viewportSize.height}
                    />

                    {/* Floating Widget Cards - Virtual Rendering */}
                    {visibleWidgets.map(position => {
                      const widget = widgetMap.get(position.id)
                      if (!widget) return null

                      return (
                        <FloatingWidgetCard
                          key={position.id}
                          widget={widget}
                          x={position.x}
                          y={position.y}
                          size={position.size}
                          importance={position.importance}
                          isHighlighted={highlightedWidget === position.id}
                          scale={transform.scale}
                          onClick={() => handleWidgetClick(widget)}
                          onHover={handleWidgetHover}
                        />
                      )
                    })}

                    {/* Canvas bounds indicator (subtle) */}
                    <div
                      className="absolute inset-0 border border-border/10 rounded-lg pointer-events-none"
                      style={{
                        width: layout.canvasWidth,
                        height: layout.canvasHeight
                      }}
                    />
                  </div>
                </div>

                {/* Navigation Controls */}
                <ConstellationControls
                  scale={transform.scale}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onReset={resetView}
                  className="absolute bottom-6 left-6 z-10"
                />

                {/* Minimap */}
                <ConstellationMinimap
                  positions={layout.positions}
                  canvasWidth={layout.canvasWidth}
                  canvasHeight={layout.canvasHeight}
                  viewportWidth={viewportSize.width}
                  viewportHeight={viewportSize.height}
                  currentTransform={transform}
                  onViewportClick={handleMinimapClick}
                  className="absolute bottom-6 right-6 z-10"
                />

                {/* Stats Overlay - Subtle */}
                <div className="absolute top-6 right-6 left-1/2 z-10 pointer-events-none">
                  <div className="bg-background/60 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2 shadow-sm max-w-xs">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                      <span>
                        Active: {projectWidgets?.widgets?.filter(w => w.priority > 7).length || 0}
                      </span>
                      <span>•</span>
                      <span>
                        {Math.round(transform.scale * 100)}% zoom
                      </span>
                    </div>
                  </div>
                </div>

                {/* Keyboard shortcuts hint */}
                {transform.scale < 0.6 && (
                  <div className="absolute bottom-6 left-1/2 z-10 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
                    <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-4 py-2 shadow-lg">
                      <div className="text-xs text-muted-foreground/70 text-center">
                        Drag to explore • Scroll to zoom • Click widgets to interact
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-muted-foreground mb-2">No fingerprint available</div>
                  <div className="text-sm text-muted-foreground">Please complete the project discovery process</div>
                </div>
              </div>
            )}


            {/* Transition overlay */}
            <ConstellationTransition
              isActive={showTransition}
              onComplete={handleTransitionComplete}
              duration={3000}
            />
          </div>
        </div>

      </div>

      {/* Delete Project Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProject}
        projectName={project?.name || 'Project'}
        isDeleting={isDeleting}
      />

      {/* Widget Details Panel */}
      <WidgetDetailsPanel
        widget={selectedWidget}
        isOpen={showWidgetPanel}
        onClose={handleCloseWidgetPanel}
      />
    </>
  )
}
