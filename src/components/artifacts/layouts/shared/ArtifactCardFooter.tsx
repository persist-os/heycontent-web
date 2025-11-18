/**
 * ARTIFACT CARD FOOTER
 * 
 * Shared footer component for all artifact layout renderers.
 * Centralizes metadata footer pattern (version + updated date).
 * 
 * LAW VI: This eliminates duplication across 8+ layout renderers.
 * Single source of truth for artifact footer layout.
 */

'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { ArtifactMetadata } from '@/types/artifacts'

interface ArtifactCardFooterProps {
  /** Artifact metadata (for version and lastUpdatedAt) */
  metadata?: ArtifactMetadata
}

/**
 * ArtifactCardFooter - Shared footer component for all artifact layouts
 * 
 * Displays:
 * - Version badge
 * - Last updated date
 * 
 * Note: Source/author information removed per user request.
 */
export function ArtifactCardFooter({
  metadata
}: ArtifactCardFooterProps) {
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 border-t border-border/20 pt-3 mt-4">
      <Badge variant="outline" className="text-xs">
        v{artifactMetadata.version}
      </Badge>
      <span>•</span>
      <span>Updated {formatDate(artifactMetadata.lastUpdatedAt)}</span>
    </div>
  )
}

