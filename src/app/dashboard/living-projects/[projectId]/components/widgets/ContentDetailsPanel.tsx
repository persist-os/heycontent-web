/**
 * CONTENT DETAILS PANEL COMPONENT
 * 
 * Unified side panel for displaying detailed information about any content type:
 * notes, conversations, crystals, and shards. Quantum-themed with consciousness aesthetics.
 */

'use client'

import React, { useState, useRef, useCallback } from 'react'
import { 
  X, 
  FileText, 
  MessageCircle, 
  Gem, 
  Sparkles,
  Calendar,
  Clock,
  Tag,
  Layers,
  TrendingUp,
  Brain,
  Zap,
  Heart,
  ExternalLink,
  User,
  Edit,
  Trash2,
  Star,
  AlertCircle,
  GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

interface ContentDetailsPanelProps {
  item: any | null
  itemType: 'note' | 'conversation' | 'crystal' | 'shard' | null
  isOpen: boolean
  onClose: () => void
  projectId: string
  width?: number
  onWidthChange?: (width: number) => void
}

/**
 * Content details panel - Quantum observation of knowledge particles
 */
export function ContentDetailsPanel({ 
  item, 
  itemType,
  isOpen, 
  onClose,
  projectId,
  width = 448, // Default 28rem
  onWidthChange
}: ContentDetailsPanelProps) {
  const router = useRouter()
  const resizeRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const startPos = useRef({ x: 0 })
  const startWidth = useRef(448)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true
    startPos.current = { x: e.clientX }
    startWidth.current = width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return

      const deltaX = startPos.current.x - moveEvent.clientX // Inverted for right-side resize
      const newWidth = Math.max(320, Math.min(800, startWidth.current + deltaX))

      onWidthChange?.(newWidth)
    }

    const handleMouseUp = () => {
      isResizing.current = false
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, onWidthChange])

  if (!isOpen || !item || !itemType) return null

  // Get type-specific styling and data
  const getTypeConfig = () => {
    switch (itemType) {
      case 'note':
        return {
          icon: FileText,
          title: item.title || 'Untitled Note',
          bgGradient: 'from-blue-500/10 to-cyan-500/10',
          borderColor: 'border-blue-500/20',
          accentColor: 'bg-blue-500',
          textColor: 'text-blue-600 dark:text-blue-400',
          primaryLabel: 'Note Type',
          primaryValue: item.type || 'note',
          metadata: [
            { label: 'Tags', value: item.tags?.join(', ') || 'None', icon: Tag },
            { label: 'Important', value: item.important ? 'Yes' : 'No', icon: Star },
            { label: 'References', value: item.references?.length || 0, icon: Layers },
            { label: 'Platform', value: item.platform || 'N/A', icon: FileText },
          ]
        }
      case 'conversation':
        return {
          icon: MessageCircle,
          title: item.title || 'Thinking Session',
          bgGradient: 'from-emerald-500/10 to-teal-500/10',
          borderColor: 'border-emerald-500/20',
          accentColor: 'bg-emerald-500',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          primaryLabel: 'Conversation Type',
          primaryValue: item.conversationType || 'general',
          metadata: [
            { label: 'Messages', value: item.messageCount || 0, icon: MessageCircle },
            { label: 'Starred', value: item.starred ? 'Yes' : 'No', icon: Star },
            { label: 'Last Message', value: item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : 'N/A', icon: Clock },
          ]
        }
      case 'crystal':
        return {
          icon: Gem,
          title: item.name || 'Unnamed Pattern',
          bgGradient: 'from-violet-500/10 to-fuchsia-500/10',
          borderColor: 'border-violet-500/20',
          accentColor: 'bg-violet-500',
          textColor: 'text-violet-600 dark:text-violet-400',
          primaryLabel: 'Crystal Type',
          primaryValue: item.crystal_type || 'pattern',
          metadata: [
            { label: 'Dimension', value: item.dimension || 'N/A', icon: Layers },
            { label: 'Confidence', value: item.confidence_score || item.evidence_strength || 'N/A', icon: TrendingUp },
            { label: 'Observations', value: item.observation_count || item.usage_count || 0, icon: Brain },
            { label: 'Stability', value: item.stability_trend || 'N/A', icon: Zap },
            { label: 'Consistency', value: item.consistency_rating || 'N/A', icon: AlertCircle },
          ]
        }
      case 'shard':
        return {
          icon: Sparkles,
          title: item.dimension || 'Quantum Fragment',
          bgGradient: 'from-amber-500/10 to-yellow-500/10',
          borderColor: 'border-amber-500/20',
          accentColor: 'bg-amber-500',
          textColor: 'text-amber-600 dark:text-amber-400',
          primaryLabel: 'Extraction Method',
          primaryValue: item.extraction_method || 'observation',
          metadata: [
            { label: 'Source Type', value: item.source_type || 'N/A', icon: FileText },
            { label: 'Confidence', value: item.confidence_level || 'N/A', icon: TrendingUp },
            { label: 'Intensity', value: item.linguistic_intensity || 'N/A', icon: Zap },
            { label: 'Emotion', value: item.emotional_weight || 'N/A', icon: Heart },
            { label: 'Specificity', value: item.specificity || 'N/A', icon: AlertCircle },
            { label: 'Referenced', value: item.reference_count || 0, icon: Layers },
          ]
        }
    }
  }

  const config = getTypeConfig()
  const Icon = config.icon

  // Get content preview
  const getContentPreview = () => {
    switch (itemType) {
      case 'note':
        return item.content || 'No content available'
      case 'conversation':
        return item.messages?.[0]?.content || 'No messages yet'
      case 'crystal':
        return item.core_insight || item.detailed_analysis || item.description || 'Forming...'
      case 'shard':
        return item.exact_quote || item.what_it_reveals || 'No content'
    }
  }

  // Handle navigation to full view
  const handleOpenFullView = () => {
    switch (itemType) {
      case 'note':
        router.push(`/dashboard/notes/${item._id}`)
        break
      case 'conversation':
        router.push(`/dashboard/thinking_lab?conversationId=${item._id}`)
        break
      case 'crystal':
        router.push(`/dashboard/crystals?crystalId=${item.crystal_id || item._id}`)
        break
      case 'shard':
        router.push(`/dashboard/crystals?shardId=${item._id}`)
        break
    }
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A'
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  }

  return (
    <div 
      ref={resizeRef}
      className="fixed inset-y-0 right-0 bg-background/95 backdrop-blur-md border-l border-border/50 shadow-2xl z-30 transform transition-transform duration-300 ease-out"
      style={{ width: `${width}px` }}
    >
      <div className="h-full flex flex-col">
        {/* Header with quantum styling */}
        <div className={`relative p-6 border-b border-border/30 bg-gradient-to-br ${config.bgGradient}`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2.5 rounded-lg ${config.accentColor}/20 backdrop-blur-sm`}>
              <Icon className={`w-5 h-5 ${config.textColor}`} />
            </div>
            <button
              title="Close"
              onClick={onClose}
              className="p-2 hover:bg-background/50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {config.title}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${config.textColor} border-current/30`}>
                {itemType}
              </Badge>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                {config.primaryValue.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Content Preview */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Content
            </h3>
            <div className="bg-muted/30 rounded-lg p-4 border border-border/30">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {getContentPreview()}
              </p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {config.metadata.map((meta, idx) => {
                const MetaIcon = meta.icon
                return (
                  <div key={idx} className="bg-muted/20 rounded-lg p-3 border border-border/20">
                    <div className="flex items-center gap-2 mb-1">
                      <MetaIcon className="w-3 h-3 text-muted-foreground/60" />
                      <span className="text-xs text-muted-foreground">{meta.label}</span>
                    </div>
                    <div className="text-sm font-medium text-foreground capitalize">
                      {meta.value}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Crystal-specific: Supporting Evidence */}
          {itemType === 'crystal' && item.supporting_quotes && item.supporting_quotes.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Supporting Evidence
              </h3>
              <div className="space-y-2">
                {item.supporting_quotes.slice(0, 3).map((quote: string, idx: number) => (
                  <div key={idx} className="bg-violet-500/5 rounded-lg p-3 border border-violet-500/10">
                    <p className="text-xs text-foreground/80 italic">"{quote}"</p>
                  </div>
                ))}
                {item.supporting_quotes.length > 3 && (
                  <div className="text-xs text-muted-foreground/60 text-center">
                    +{item.supporting_quotes.length - 3} more quotes
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shard-specific: Revelation Analysis */}
          {itemType === 'shard' && (item.what_it_reveals || item.why_significant) && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quantum Analysis
              </h3>
              <div className="space-y-3">
                {item.what_it_reveals && (
                  <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                    <div className="text-xs font-medium text-muted-foreground mb-1">What it Reveals</div>
                    <p className="text-xs text-foreground/80">{item.what_it_reveals}</p>
                  </div>
                )}
                {item.why_significant && (
                  <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Why Significant</div>
                    <p className="text-xs text-foreground/80">{item.why_significant}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note-specific: Analysis */}
          {itemType === 'note' && item.analysis && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Analysis
              </h3>
              <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/10">
                <p className="text-xs text-foreground/80">{item.analysis}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground font-medium">{formatTimestamp(item.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground font-medium">{formatTimestamp(item.updatedAt)}</span>
              </div>
              {itemType === 'crystal' && item.last_evolution && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Last Evolution</span>
                  <span className="text-foreground font-medium">{formatTimestamp(item.last_evolution)}</span>
                </div>
              )}
            </div>
          </div>

          {/* ID Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Identifier</h3>
            <div className="bg-muted/30 rounded-lg p-3 border border-border/20">
              <code className="text-xs text-muted-foreground font-mono break-all">
                {itemType === 'crystal' ? item.crystal_id : item._id}
              </code>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-border/30 space-y-3">
          <Button 
            onClick={handleOpenFullView}
            className={`w-full ${config.accentColor} hover:opacity-90 text-white`}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Full View
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="w-full text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>

          <div className="text-xs text-muted-foreground/60 text-center pt-2">
            {itemType.charAt(0).toUpperCase() + itemType.slice(1)} • Living intelligence
          </div>
        </div>
      </div>

      {/* Quantum glow effect */}
      <div className={`
        absolute inset-0 -z-10 opacity-20 pointer-events-none
        bg-gradient-to-br ${config.bgGradient}
      `} />

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute top-0 left-0 w-1 h-full cursor-ew-resize group z-50 hover:bg-border/50 transition-colors"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors">
          <GripVertical className="w-4 h-4 rotate-90" />
        </div>
      </div>
    </div>
  )
}

