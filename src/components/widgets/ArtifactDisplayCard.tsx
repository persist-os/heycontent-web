/**
 * ARTIFACT DISPLAY CARD
 * 
 * Wraps ArtifactRenderer with elegant card chrome + metadata.
 * Provides visual hierarchy and context for individual artifacts.
 */

'use client'

import React from 'react'
import { Artifact } from '@/types/artifacts'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'
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
  userId: string  // Required: always available for editing
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
  widgetTitle,
  userId
}: ArtifactDisplayCardProps) {
  const visuals = getArtifactVisuals(artifact.type)
  const Icon = visuals.icon
  
  // Extract title with fallback chain
  let artifactTitle: string | undefined = (artifact as any).title;
  if (!artifactTitle && (artifact.data as any)?.title) {
    artifactTitle = (artifact.data as any).title;
  }
  if (!artifactTitle && artifact.type === 'report' && (artifact.data as any)?.markdown) {
    const match = (artifact.data as any).markdown.match(/^#\s+(.+)$/m);
    if (match) {
      artifactTitle = match[1].trim();
    }
  }
  if (!artifactTitle) {
    artifactTitle = visuals.label;
  }
  
  // Extract metadata
  const version = artifact.metadata?.version || '1.0'
  const lastUpdated = artifact.metadata?.lastUpdatedAt || Date.now()
  const updatedBy = artifact.metadata?.lastUpdatedBy || 'system'

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/40 hover:bg-card/80 transition-all duration-300">
      {/* Header: Title + Type badge + metadata */}
      <CardHeader className="p-4 pb-3 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-foreground flex-1 pr-2">
            {artifactTitle}
          </h3>
          <Badge variant="outline" className="gap-2 flex-shrink-0">
            <Icon className={`h-3.5 w-3.5 ${visuals.color}`} />
            <span className="capitalize">{visuals.label}</span>
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground/70 flex items-center gap-2">
          <span>v{version}</span>
          <span>•</span>
          <span>{formatTimestamp(lastUpdated)}</span>
        </div>
      </CardHeader>

      {/* Content: Rendered artifact */}
      <CardContent className="p-6">
        <EditableArtifactRenderer 
          artifact={artifact}
          userId={userId}
          editable={editable}
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

