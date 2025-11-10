/**
 * GALLERY LOADING SKELETON - Glowing Skeleton for Gallery Loading State
 * 
 * Matches gallery structure with sidebar + main content area.
 * Uses established skeleton patterns with glowing effects.
 * 
 * DESIGN COMPLIANCE:
 * - Sidebar skeleton matching GallerySidebar structure
 * - Main content skeleton matching UnifiedGalleryView structure
 * - Glowing background orbs (pattern from value-cards.tsx)
 * - Uses Skeleton component from ui/skeleton.tsx
 */

'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function GalleryLoadingSkeleton() {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md overflow-hidden relative">
      {/* Glowing background orbs */}
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/[0.15] to-accent/[0.10] dark:from-primary/[0.08] dark:to-accent/[0.05] rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 left-1/4 w-[450px] h-[450px] bg-gradient-to-br from-accent/[0.12] to-primary/[0.08] dark:from-accent/[0.06] dark:to-primary/[0.04] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1.5s'}} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-primary/[0.10] to-accent/[0.08] dark:from-primary/[0.05] dark:to-accent/[0.04] rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '3s'}} />
      
      <div className="flex h-full relative z-10">
        {/* Sidebar Skeleton */}
        <div className="w-80 border-r border-border/40 bg-muted/20 overflow-y-auto">
          <div className="p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => {
              const isArtifact = index % 2 === 0 // Alternate between artifact and widget theme
              const baseGradient = isArtifact
                ? 'bg-gradient-to-br from-blue-500/8 via-cyan-500/6 to-blue-500/4'
                : 'bg-gradient-to-br from-purple-500/8 via-indigo-500/6 to-purple-500/4'
              
              return (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-lg border border-border/40 backdrop-blur-sm p-4 pl-5",
                    baseGradient
                  )}
                >
                  {/* Left accent bar skeleton */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
                    isArtifact 
                      ? "bg-gradient-to-b from-blue-500/30 to-cyan-500/30"
                      : "bg-gradient-to-b from-purple-500/30 to-indigo-500/30"
                  )} />
                  
                  {/* Content */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            {/* Header skeleton */}
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-64 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-96 rounded" />
            </div>
            
            {/* Content card skeleton */}
            <div className="bg-card/40 border border-border/50 rounded-lg p-8 mb-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/4 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-11/12 rounded" />
                  <Skeleton className="h-4 w-5/6 rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                </div>
                <div className="mt-6">
                  <Skeleton className="h-64 w-full rounded-md" />
                </div>
              </div>
            </div>
            
            {/* Navigation controls skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

