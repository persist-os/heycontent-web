/**
 * ARTIFACT CARD HEADER
 * 
 * Shared CardHeader component for all artifact layout renderers.
 * Centralizes responsive header layout pattern (mobile-first design).
 * 
 * LAW VI: This eliminates duplication across 8+ layout renderers.
 * Single source of truth for artifact header layout.
 */

'use client'

import React from 'react'
import { CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Pencil } from 'lucide-react'
import { ArtifactVersionSelector } from '../../ArtifactVersionSelector'
import { ArtifactMetadata, Artifact } from '@/types/artifacts'
import { Id } from '@/convex/_generated/dataModel'
import { UniversalArtifactActionBar } from '../../UniversalArtifactActionBar'

interface ArtifactCardHeaderProps {
  /** Artifact type display name (e.g., "Analysis", "Summary") */
  artifactTypeDisplay: string
  /** Whether artifact is editable */
  editable?: boolean
  /** Edit button element (created by EditableArtifactRenderer) */
  editButton?: React.ReactNode
  /** Artifact ID for version selector */
  artifactId?: Id<'artifacts'>
  /** Currently selected version number */
  selectedVersion?: number
  /** Callback when version changes */
  onVersionChange?: (version: number) => void
  /** Artifact metadata (for version badge fallback) */
  metadata?: ArtifactMetadata
  /** Icon element to display on left side */
  icon?: React.ReactNode
  /** Optional additional icon to show (e.g., Eye icon when editing) */
  secondaryIcon?: React.ReactNode
  /** Optional className for icon container */
  iconClassName?: string
  /** Artifact object (for action bar) */
  artifact?: Artifact
}

/**
 * ArtifactCardHeader - Shared header component for all artifact layouts
 * 
 * Provides consistent responsive header layout:
 * - Mobile: Compact layout with reduced gaps, icon-only edit button
 * - Desktop: Full layout with text labels and normal spacing
 * - Handles version selector and edit button automatically
 */
export function ArtifactCardHeader({
  artifactTypeDisplay,
  editable = false,
  editButton,
  artifactId,
  selectedVersion,
  onVersionChange,
  metadata,
  icon,
  secondaryIcon,
  iconClassName = '',
  artifact
}: ArtifactCardHeaderProps) {
  const artifactMetadata = metadata || {
    version: 1,
    lastUpdatedBy: 'unknown',
    lastUpdatedAt: Date.now()
  }

  return (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between flex-wrap gap-1 md:gap-2 mb-2">
        {/* Left: Icon + Type Display */}
        <div className="flex items-center gap-2">
          {icon && (
            <div className={iconClassName}>
              {icon}
            </div>
          )}
          <span className="text-sm font-medium text-foreground">{artifactTypeDisplay}</span>
          {editable && !secondaryIcon && (
            <Pencil className="w-3 h-3 text-muted-foreground/60" />
          )}
          {secondaryIcon && (
            <div className={iconClassName}>
              {secondaryIcon}
            </div>
          )}
        </div>
        
        {/* Right: Edit Button + Version Selector */}
        <div className="flex items-center gap-1 md:gap-2">
          {editButton}
          {artifactId && selectedVersion !== undefined && onVersionChange ? (
            <ArtifactVersionSelector
              artifactId={artifactId}
              currentVersion={selectedVersion}
              onVersionChange={onVersionChange}
            />
          ) : (
            <Badge variant="outline" className="text-xs">
              v{artifactMetadata.version}
            </Badge>
          )}
        </div>
      </div>
      {/* Action Bar - Integrated in CardHeader */}
      {artifact && <UniversalArtifactActionBar artifact={artifact} />}
    </CardHeader>
  )
}

