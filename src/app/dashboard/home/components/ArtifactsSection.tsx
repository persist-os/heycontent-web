'use client'

import React from 'react'
import { ArtifactCard } from './ArtifactCard'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ArtifactsSectionProps {
  artifacts: any[] | undefined
}

/**
 * ArtifactsSection - Recent artifacts section
 * 
 * Displays recent artifacts from the new artifacts table
 * CRITICAL: Uses api.artifactQueries.getUserArtifacts (not widget_outputs)
 */
export function ArtifactsSection({ artifacts }: ArtifactsSectionProps) {
  // Loading state
  if (artifacts === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Recent Artifacts</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-72 h-40 rounded-xl bg-muted/30 animate-pulse flex-shrink-0" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground">Recent Artifacts</h2>
          <Link 
            href="/dashboard/living-projects"
            className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors font-medium hover:underline"
          >
            See all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-muted-foreground">No artifacts yet. Create a project and generate some widgets!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground">Recent Artifacts</h2>
        <Link 
          href="/dashboard/living-projects"
          className="flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors font-medium hover:underline"
        >
          See all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Artifact Cards - Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
        {artifacts.map((artifact: any) => (
          <ArtifactCard key={artifact._id} artifact={artifact} />
        ))}
      </div>
      
    </div>
  )
}


