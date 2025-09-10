'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { CreateProjectModal } from './CreateProjectModal'
import { ProjectCard } from './ProjectCard'
import { EmptyState } from './EmptyState'
import { LoadingState } from './LoadingState'

export function LivingProjectsScreen() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'discovering' | 'completed'>('all')

  // Fetch user's projects
  const projects = useQuery(
    api.projectsQueries.getProjectsForUser,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : 'skip'
  )

  // Filter projects based on selected filter
  const filteredProjects = useMemo(() => {
    if (!projects) return []
    
    switch (selectedFilter) {
      case 'active':
        return projects.filter(p => p.fingerprintId) // Has a fingerprint = active
      case 'discovering':
        return projects.filter(p => !p.fingerprintId) // No fingerprint = still discovering
      case 'completed':
        return projects.filter(p => p.fingerprintId && p.updatedAt < Date.now() - (7 * 24 * 60 * 60 * 1000)) // Older projects
      default:
        return projects
    }
  }, [projects, selectedFilter])

  // Handle creating a new project
  const handleCreateProject = (name: string, description?: string) => {
    // Navigate to project discovery with project data
    const params = new URLSearchParams({
      mode: 'create',
      name,
      ...(description && { description })
    })
    router.push(`/dashboard/project-discovery?${params}`)
  }

  // Handle clicking on a project
  const handleProjectClick = (project: any) => {
    if (project.fingerprintId) {
      // Project has a fingerprint - go to project view
      router.push(`/dashboard/living-projects/${project._id}`)
    } else {
      // Project needs discovery - go to discovery chat
      router.push(`/dashboard/project-discovery?projectId=${project._id}`)
    }
  }

  if (!firebaseUser) {
    return <LoadingState />
  }

  const isLoading = projects === undefined

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header Section - Asymmetric Layout */}
        <div className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            {/* Title Section */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                <div className="flex items-baseline gap-4">
                  <h1 className="text-5xl lg:text-6xl font-light tracking-tight text-foreground">
                    Living
                  </h1>
                  <div className="h-px bg-border flex-1 mb-4" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-medium text-muted-foreground ml-8">
                  Projects that think with you
                </h2>
                <div className="ml-16 mt-6">
                  <p className="text-muted-foreground/80 max-w-md leading-relaxed">
                    Each project develops its own intelligence through conversation, 
                    evolving to match how you work and what you're trying to achieve.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Section */}
            <div className="flex flex-col items-start lg:items-end">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-foreground text-background hover:bg-foreground/90 transition-colors duration-300 px-6 py-3 text-sm font-medium"
                size="lg"
              >
                Start a project
              </Button>
              <p className="text-xs text-muted-foreground/60 mt-2 lg:text-right">
                Begin with just a name and description
              </p>
            </div>
          </div>

          {/* Filter Navigation - Minimal */}
          {projects && projects.length > 0 && (
            <div className="mt-12 flex items-center gap-8 border-b border-border/30">
              {[
                { key: 'all', label: 'Everything', count: projects.length },
                { key: 'active', label: 'Active', count: projects.filter(p => p.fingerprintId).length },
                { key: 'discovering', label: 'Discovering', count: projects.filter(p => !p.fingerprintId).length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setSelectedFilter(key as any)}
                  className={`pb-4 px-1 text-sm font-medium transition-colors duration-200 relative ${
                    selectedFilter === key 
                      ? 'text-foreground' 
                      : 'text-muted-foreground hover:text-foreground/70'
                  }`}
                >
                  {label}
                  <span className="ml-2 text-xs opacity-60">({count})</span>
                  {selectedFilter === key && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingState />
        ) : !projects || projects.length === 0 ? (
          <EmptyState onCreateProject={() => setShowCreateModal(true)} />
        ) : (
          <>
            {/* Projects Display - Flowing River Layout */}
            <div className="mt-12 space-y-8">
              {/* Flowing List Layout - Content-driven */}
              <div className="space-y-6">
                {filteredProjects.map((project, index) => {
                  const hasFingerprint = !!project.fingerprintId
                  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000
                  
                  // Create natural groupings and varied layouts
                  const isEven = index % 2 === 0
                  const isThird = index % 3 === 0
                  const isFifth = index % 5 === 0
                  
                  return (
                    <div key={project._id} className="relative">
                      {/* Contextual dividers between different project types */}
                      {index > 0 && (
                        filteredProjects[index - 1].fingerprintId !== project.fingerprintId && (
                          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mb-8" />
                        )
                      )}
                      
                      {/* Flowing layout based on content and status */}
                      <div className={`
                        ${isEven ? 'md:ml-8 lg:ml-12' : 'md:mr-8 lg:mr-12'}
                        ${isThird ? 'lg:ml-24' : ''}
                        ${isFifth && hasFingerprint ? 'md:ml-0 md:mr-0 lg:mx-16' : ''}
                        transition-all duration-500 hover:scale-[1.01]
                      `}>
                        {/* River-style project display */}
                        <div 
                          className="group cursor-pointer relative"
                          onClick={() => handleProjectClick(project)}
                        >
                          {/* Status-based visual treatment */}
                          <div className={`
                            border-l-2 pl-6 py-4 transition-all duration-300
                            ${hasFingerprint 
                              ? isRecent 
                                ? 'border-blue-400/60 hover:border-blue-400 bg-blue-50/20 dark:bg-blue-950/10' 
                                : 'border-muted-foreground/30 hover:border-muted-foreground/50 bg-card/50'
                              : 'border-amber-400/60 hover:border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                            }
                            hover:pl-8 hover:bg-opacity-30
                          `}>
                            
                            {/* Project header with natural hierarchy */}
                            <div className="space-y-3">
                              <div className="flex items-baseline justify-between">
                                <div className="flex-1">
                                  <h3 className="text-xl font-light tracking-tight text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                                    {project.name}
                                  </h3>
                                  <div className="flex items-center gap-4 mt-1">
                                    <span className="text-xs text-muted-foreground/70 font-mono tracking-wide">
                                      {hasFingerprint 
                                        ? isRecent ? 'active' : 'living'
                                        : 'discovering'
                                      }
                                    </span>
                                    <div className="h-px bg-border/30 flex-1 max-w-24" />
                                    <span className="text-xs text-muted-foreground/50 font-mono">
                                      {new Date(hasFingerprint ? project.updatedAt : project.createdAt).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors text-sm">
                                  →
                                </div>
                              </div>
                              
                              {project.description && (
                                <div className="ml-4">
                                  <p className="text-muted-foreground/80 leading-relaxed max-w-2xl">
                                    {project.description}
                                  </p>
                                </div>
                              )}
                              
                              {/* Subtle status indicator */}
                              <div className="ml-4 pt-2">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-muted-foreground/60">
                                    {hasFingerprint 
                                      ? 'Intelligence active • Ready to explore'
                                      : 'Awaiting discovery • Click to begin'
                                    }
                                  </span>
                                  {isRecent && hasFingerprint && (
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* No filtered results */}
            {filteredProjects.length === 0 && projects.length > 0 && (
              <div className="py-16 text-center">
                <div className="space-y-4">
                  <h3 className="text-xl font-light text-muted-foreground">
                    Nothing here yet
                  </h3>
                  <p className="text-muted-foreground/60 text-sm max-w-md mx-auto leading-relaxed">
                    Try a different view, or start a new project to get things moving.
                  </p>
                  <div className="pt-4">
                    <button
                      onClick={() => setSelectedFilter('all')}
                      className="text-sm text-foreground hover:text-foreground/70 transition-colors underline underline-offset-4"
                    >
                      Show everything
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateProject={handleCreateProject}
        />
      </div>
    </div>
  )
}
