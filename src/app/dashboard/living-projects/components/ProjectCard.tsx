'use client'

import React from 'react'
// Simple date formatting utility
const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean }) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface ProjectCardProps {
  project: {
    _id: string
    name: string
    description?: string
    fingerprintId?: string
    createdAt: number
    updatedAt: number
  }
  onClick: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const hasFingerprint = !!project.fingerprintId
  const isRecent = Date.now() - project.updatedAt < 24 * 60 * 60 * 1000 // Less than 24 hours
  
  const getProjectStatus = () => {
    if (!hasFingerprint) {
      return {
        label: 'Discovering',
        stage: 'early'
      }
    }
    
    if (isRecent) {
      return {
        label: 'Active',
        stage: 'active'
      }
    }
    
    return {
      label: 'Living',
      stage: 'established'
    }
  }

  const status = getProjectStatus()

  return (
    <div 
      className="group cursor-pointer transition-all duration-500 hover:scale-[1.02] relative"
      onClick={onClick}
    >
      {/* Main Card */}
      <div className="bg-card border border-border/50 hover:border-border transition-colors duration-300 relative overflow-hidden">
        {/* Status Indicator - Subtle line */}
        <div className={`h-px w-full ${
          status.stage === 'early' ? 'bg-gradient-to-r from-transparent via-amber-400/60 to-transparent' :
          status.stage === 'active' ? 'bg-gradient-to-r from-transparent via-blue-400/60 to-transparent' :
          'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
        }`} />
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                  {project.name}
                </h3>
                <div className="mt-1 text-xs text-muted-foreground/70 font-mono tracking-wide">
                  {status.label.toLowerCase()}
                </div>
              </div>
              <div className="text-xs text-muted-foreground/50 font-mono">
                →
              </div>
            </div>
            
            {project.description && (
              <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2 mt-3">
                {project.description}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-border/30">
            {hasFingerprint ? (
              /* Active Project */
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    Intelligence active
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                    Open
                  </div>
                  {isRecent && (
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full ml-auto animate-pulse" />
                  )}
                </div>
              </div>
            ) : (
              /* Discovery Phase */
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="text-muted-foreground/60">
                    Awaiting discovery
                  </div>
                  <div className="text-muted-foreground/50 font-mono">
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </div>
                </div>
                <div className="text-muted-foreground/80 hover:text-foreground transition-colors cursor-pointer">
                  Begin
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  )
}
