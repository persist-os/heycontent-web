/**
 * ARTIFACT DISPLAY CARD
 * 
 * Wraps ArtifactRenderer with elegant card chrome + metadata.
 * Provides visual hierarchy and context for individual artifacts.
 */

'use client'

import React from 'react'
import { Artifact } from '@/types/artifacts'
import { ArtifactRenderer } from '@/components/artifacts/ArtifactRenderer'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  List, 
  Lightbulb, 
  BarChart3, 
  Activity, 
  Clock 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ArtifactDisplayCardProps {
  artifact: Artifact
  editable?: boolean
  onUpdate?: (data: any) => void
  widgetTitle?: string
}

/**
 * Get icon and color for artifact type
 */
function getArtifactVisuals(type: string) {
  const visuals = {
    structured_list: {
      icon: List,
      color: 'text-blue-500',
      label: 'List'
    },
    report: {
      icon: FileText,
      color: 'text-purple-500',
      label: 'Report'
    },
    analysis: {
      icon: Lightbulb,
      color: 'text-amber-500',
      label: 'Analysis'
    },
    summary: {
      icon: BarChart3,
      color: 'text-green-500',
      label: 'Summary'
    },
    tracker: {
      icon: Activity,
      color: 'text-orange-500',
      label: 'Tracker'
    },
    timeline: {
      icon: Clock,
      color: 'text-indigo-500',
      label: 'Timeline'
    }
  }

  return visuals[type as keyof typeof visuals] || {
    icon: FileText,
    color: 'text-muted-foreground',
    label: type
  }
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatTimestamp(timestamp: number): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    return 'recently'
  }
}

export function ArtifactDisplayCard({
  artifact,
  editable = false,
  onUpdate,
  widgetTitle
}: ArtifactDisplayCardProps) {
  const visuals = getArtifactVisuals(artifact.type)
  const Icon = visuals.icon
  
  // Extract metadata
  const version = artifact.metadata?.version || '1.0'
  const lastUpdated = artifact.metadata?.lastUpdatedAt || Date.now()
  const updatedBy = artifact.metadata?.lastUpdatedBy || 'system'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      {/* Header: Type badge + metadata */}
      <CardHeader className="p-4 pb-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-2">
            <Icon className={`h-3.5 w-3.5 ${visuals.color}`} />
            <span className="capitalize">{visuals.label}</span>
          </Badge>
          
          <div className="text-xs text-muted-foreground/70 flex items-center gap-2">
            <span>v{version}</span>
            <span>•</span>
            <span>{formatTimestamp(lastUpdated)}</span>
          </div>
        </div>
      </CardHeader>

      {/* Content: Rendered artifact */}
      <CardContent className="p-6">
        <ArtifactRenderer 
          artifact={artifact}
          editable={editable}
          onUpdate={onUpdate}
        />
      </CardContent>

      {/* Footer: Source attribution */}
      {widgetTitle && (
        <div className="px-6 pb-4 pt-2 border-t border-border/20">
          <div className="text-xs text-muted-foreground/70 flex items-center gap-2">
            <span>Source:</span>
            <span className="font-medium text-muted-foreground">{widgetTitle}</span>
            <span>•</span>
            <span>Updated by {updatedBy === 'system' ? 'AI' : updatedBy}</span>
          </div>
        </div>
      )}
    </Card>
  )
}

