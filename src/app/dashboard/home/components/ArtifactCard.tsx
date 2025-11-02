'use client'

import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ArtifactCardProps {
  artifact: any
}

/**
 * ArtifactCard - Individual artifact card with gradient styling
 * 
 * Displays:
 * - Artifact name
 * - Project/widget tag
 * - Type/date metadata
 * - Click to navigate to artifact
 */
export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const router = useRouter()

  const handleClick = () => {
    // Navigate to artifact detail
    if (artifact.projectId) {
      router.push(`/dashboard/living-projects/${artifact.projectId}/artifacts/${artifact._id}`)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex-shrink-0 w-80 h-44",
        "rounded-2xl p-6",
        "bg-gradient-to-br from-primary/25 via-primary-light/20 to-background",
        "border border-primary/40",
        "cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/30",
        "hover:border-primary/60",
        "backdrop-blur-sm"
      )}
    >
      
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Arrow icon (top-right) */}
      <div className="absolute top-6 right-6 z-10">
        <ArrowUpRight className="w-5 h-5 text-primary group-hover:text-primary-dark transition-colors" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        
        {/* Top: Artifact name */}
        <div>
          <h3 className="text-lg font-semibold text-foreground line-clamp-2 pr-8">
            {artifact.artifactName || artifact.title || artifact.widgetId || 'Untitled Artifact'}
          </h3>
        </div>
        
        {/* Middle: Project/widget tag */}
        <div>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/30 border border-primary/50 text-sm text-primary-darker font-semibold shadow-sm">
            {artifact.projectName || 'Project'}
          </span>
        </div>
        
        {/* Bottom: Metadata */}
        <div className="text-sm font-medium text-muted-foreground">
          {artifact.artifactType || 'output'} • {new Date(artifact.createdAt || Date.now()).toLocaleDateString()}
        </div>
        
      </div>
    </div>
  )
}


