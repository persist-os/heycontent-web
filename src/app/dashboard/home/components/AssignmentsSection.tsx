'use client'

import React, { useState } from 'react'
import { AssignmentItem } from './AssignmentItem'
import { ChevronDown, Plus, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { T } from '@/components/translation/T'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface AssignmentsSectionProps {
  projects: any[] | undefined
  userId?: string | null
}

/**
 * AssignmentsSection - Active assignments/projects section
 * 
 * Displays active projects with progress tracking
 */
export function AssignmentsSection({ projects, userId }: AssignmentsSectionProps) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent')

  // Loading state
  if (projects === undefined) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground"><T context="dashboard.home.assignments.title">Assignments</T></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-full h-[280px] rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-foreground"><T context="dashboard.home.assignments.title">Assignments</T></h2>
          
          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground"><T context="dashboard.home.assignments.sort.label">Sort by</T></span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-colors">
                    {sortBy === 'recent' && <T context="dashboard.home.assignments.sort.recent">Recent</T>}
                    {sortBy === 'oldest' && <T context="dashboard.home.assignments.sort.oldest">Oldest</T>}
                    {sortBy === 'name' && <T context="dashboard.home.assignments.sort.name">Name</T>}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSortBy('recent')}
                    className="cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span><T context="dashboard.home.assignments.sort.recent">Recent</T></span>
                    {sortBy === 'recent' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('oldest')}
                    className="cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span><T context="dashboard.home.assignments.sort.oldest">Oldest</T></span>
                    {sortBy === 'oldest' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('name')}
                    className="cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span><T context="dashboard.home.assignments.sort.name">Name</T></span>
                    {sortBy === 'name' && <Check className="w-4 h-4 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-muted-foreground"><T context="dashboard.home.assignments.empty">No active projects. Create one to get started!</T></p>
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
    <div className="space-y-6">
      
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-foreground"><T context="dashboard.home.assignments.title">Assignments</T></h2>
        
        <div className="flex items-center gap-3">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground"><T context="dashboard.home.assignments.sort.label">Sort by</T></span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-foreground transition-colors">
                  {sortBy === 'recent' && <T context="dashboard.home.assignments.sort.recent">Recent</T>}
                  {sortBy === 'oldest' && <T context="dashboard.home.assignments.sort.oldest">Oldest</T>}
                  {sortBy === 'name' && <T context="dashboard.home.assignments.sort.name">Name</T>}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setSortBy('recent')}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span><T context="dashboard.home.assignments.sort.recent">Recent</T></span>
                  {sortBy === 'recent' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy('oldest')}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span><T context="dashboard.home.assignments.sort.oldest">Oldest</T></span>
                  {sortBy === 'oldest' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSortBy('name')}
                  className="cursor-pointer flex items-center justify-between gap-2"
                >
                  <span><T context="dashboard.home.assignments.sort.name">Name</T></span>
                  {sortBy === 'name' && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
      
      {/* Assignment Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.slice(0, 6).map((project: any) => (
          <AssignmentItem key={project._id} project={project} userId={userId} />
        ))}
      </div>
      
      {/* Browse all link */}
      {projects.length > 6 && (
        <div className="flex justify-end">
          <button
            onClick={() => router.push('/dashboard/living-projects')}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-2 transition-colors font-medium hover:underline"
          >
            <T context="dashboard.home.assignments.browse_all">Browse all assignments</T>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      
    </div>
  )
}


