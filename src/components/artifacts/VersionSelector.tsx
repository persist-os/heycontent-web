/**
 * VERSION SELECTOR
 * 
 * Dropdown component for viewing artifact versions.
 * Shows current version and allows switching between versions (when history is available).
 * 
 * Currently shows current version only - full history support coming soon.
 */

'use client'

import React from 'react'
import { ArtifactMetadata } from '@/types/artifacts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'

interface VersionSelectorProps {
  metadata: ArtifactMetadata
  onVersionChange?: (version: number) => void
  className?: string
}

export function VersionSelector({
  metadata,
  onVersionChange,
  className = ''
}: VersionSelectorProps) {
  const currentVersion = metadata?.version || 1
  const editHistory = metadata?.editHistory || []
  
  // Generate version list (current version + any historical versions)
  // For now, we only show current version since we don't store full snapshots
  const versions = Array.from({ length: currentVersion }, (_, i) => i + 1)
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <History className="w-3 h-3 text-muted-foreground" />
      <Select
        value={currentVersion.toString()}
        onValueChange={(value) => {
          const version = parseInt(value, 10)
          if (onVersionChange && version !== currentVersion) {
            onVersionChange(version)
          }
        }}
      >
        <SelectTrigger className="h-6 px-2 text-xs w-auto min-w-[60px]">
          <SelectValue>
            <Badge variant="outline" className="text-xs">
              v{currentVersion}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {versions.map((version) => (
            <SelectItem key={version} value={version.toString()}>
              <div className="flex items-center gap-2">
                <Badge variant={version === currentVersion ? "default" : "outline"} className="text-xs">
                  v{version}
                </Badge>
                {version === currentVersion && (
                  <span className="text-xs text-muted-foreground">(current)</span>
                )}
              </div>
            </SelectItem>
          ))}
          {editHistory.length > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {editHistory.length} edit{editHistory.length !== 1 ? 's' : ''} in history
              </div>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

