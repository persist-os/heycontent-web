'use client'

import React from 'react'
import { ArtifactCard } from './ArtifactCard'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ArtifactsSectionProps {
  artifacts: any[] | undefined
}

/**
 * ArtifactsSection - "Delivered to You" section
 * 
 * Displays recent artifacts (widget outputs) across all projects
 */
export function ArtifactsSection({ artifacts }: ArtifactsSectionProps) {
  // Loading state
  if (artifacts === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex gap-6 overflow-x-auto pb-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-80 h-44 rounded-2xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!artifacts || artifacts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Delivered to You <span className="text-pink-500">♡33</span></h2>
          <Link 
            href="/dashboard/living-projects"
            className="flex items-center gap-2 text-sm text-primary-dark hover:text-primary transition-colors font-medium"
          >
            See all artifacts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground">No artifacts yet. Create a project and generate some widgets!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/artifacts"
          className="flex items-center gap-2 text-sm text-primary-dark hover:text-primary transition-colors font-medium"
        >
          See all artifacts
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      {/* Artifact Cards Grid */}
      <div className="flex gap-6 overflow-x-auto pb-2">
        {artifacts.map((artifact: any) => (
          <ArtifactCard key={artifact._id} artifact={artifact} />
        ))}
      </div>
      
    </div>
  )
}


