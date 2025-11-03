'use client'

import React, { useState } from 'react'
import { AssignmentItem } from './AssignmentItem'
import { ChevronDown, Plus, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface AssignmentsSectionProps {
  projects: any[] | undefined
}

/**
 * AssignmentsSection - Active assignments/projects section
 * 
 * Displays active projects with progress tracking
 */
export function AssignmentsSection({ projects }: AssignmentsSectionProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent')

  // Loading state
  if (projects === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Assignments</h2>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="w-full h-40 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Assignments</h2>
          
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sort by</span>
              <button
                onClick={() => {
                  setSortBy(prev => {
                    if (prev === 'recent') return 'oldest'
                    if (prev === 'oldest') return 'name'
                    return 'recent'
                  })
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-colors"
              >
                {sortBy === 'recent' && 'Recent'}
                {sortBy === 'oldest' && 'Oldest'}
                {sortBy === 'name' && 'Name'}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            {/* Add button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/living-projects')}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-center py-12 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground">No active projects. Create one to get started!</p>
        </div>
      </div>
    )
  }

  // Filter and sort
  const sortedProjects = [...projects].sort((a, b) => {
    if (sortBy === 'recent') return b.updatedAt - a.updatedAt
    if (sortBy === 'oldest') return a.updatedAt - b.updatedAt
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return 0
  })

  return (
    <div className="space-y-4">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Assignments</h2>
        
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by</span>
            <button
              onClick={() => {
                // Cycle through sort options
                setSortBy(prev => {
                  if (prev === 'recent') return 'oldest'
                  if (prev === 'oldest') return 'name'
                  return 'recent'
                })
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-colors"
            >
              {sortBy === 'recent' && 'Recent'}
              {sortBy === 'oldest' && 'Oldest'}
              {sortBy === 'name' && 'Name'}
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          {/* Add button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/living-projects')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Assignment Items */}
      <div className="space-y-4">
        {sortedProjects.slice(0, 4).map((project: any) => (
          <AssignmentItem key={project._id} project={project} />
        ))}
      </div>
      
      {/* Browse all link */}
      {projects.length > 4 && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/dashboard/living-projects')}
            className="text-sm text-primary-dark hover:text-primary flex items-center gap-2 transition-colors font-medium hover:underline"
          >
            Browse all assignments
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
    </div>
  )
}


