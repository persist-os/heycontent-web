/**
 * TRUE UNIFIED GALLERY VIEW - Full Screen Experience
 * 
 * Sophisticated gradient-based gallery showing artifacts and widgets.
 * Visual distinction through color themes (no icons).
 * 
 * DESIGN COMPLIANCE:
 * - Artifact theme: Blue/Cyan gradients
 * - Widget theme: Purple/Indigo gradients
 * - Glassmorphism throughout
 * - No icons - pure gradient styling
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Textarea } from '@/components/ui/textarea'
import { UnifiedGalleryViewProps } from '@/types/gallery'
import { GallerySidebar } from './GallerySidebar'
import { GalleryNavigation } from './GalleryNavigation'
import { useGalleryNavigation } from '@/hooks/useGalleryNavigation'
import { EditableArtifactRenderer } from '@/components/artifacts/EditableArtifactRenderer'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import { WidgetScheduleControls } from '@/app/dashboard/living-projects/[projectId]/components/widgets/WidgetScheduleControls'
import { useAdminAuth } from '@/app/lib/admin-auth'
import { ProgressiveWidgetView } from './ProgressiveWidgetView'
import { T } from '@/components/translation/T'
import { useIsMobile } from '@/app/dashboard/thinking_lab/layouts/ResponsiveLayout'

export function UnifiedGalleryView({
  projectId,
  initialItemId,
  items,
  onClose,
  userId
}: UnifiedGalleryViewProps & { userId?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isAdmin } = useAdminAuth()
  const isMobile = useIsMobile()
  
  // On mobile, sidebar should be closed by default
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])
  
  const {
    currentItem,
    currentIndex,
    total,
    hasPrev,
    hasNext,
    goToPrev,
    goToNext,
    goToIndex
  } = useGalleryNavigation({
    items,
    initialItemId,
    projectId,
    onClose
  })
  
  // Widget-specific data queries
  // WHY: Only fetch widget data when viewing a widget (not an artifact)
  const isArtifact = currentItem?.itemType === 'artifact'
  const widgetId = !isArtifact && currentItem ? currentItem._id : null
  const entityId = currentItem?._id || null
  const entityType = isArtifact ? 'artifact' : 'widget_output'
  
  // Query existing feedback for current item
  const existingFeedback = useQuery(
    api.feedback.getFeedbackByEntity,
    entityId && userId ? {
      entityType: entityType as any,
      entityId: entityId
    } : 'skip'
  )
  
  // Get current user's rating (most recent feedback from this user)
  const currentRating = useMemo(() => {
    if (!existingFeedback || !userId) return undefined
    const userFeedback = existingFeedback.find((f: any) => f.userId === userId)
    return userFeedback?.rating
  }, [existingFeedback, userId])
  
  // Feedback submission state
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  
  // Convex mutation for feedback submission
  const submitFeedback = useMutation(api.feedback.createContentFeedback)
  
  // Handler for feedback submission (direct Convex call)
  const handleFeedbackSubmit = async (rating: number, feedbackText?: string) => {
    if (!userId || !entityId || !projectId) {
      console.warn('Missing required fields for feedback', { userId, entityId, projectId })
      return
    }
    
    setIsSubmittingFeedback(true)
    try {
      // Build content snapshot based on entity type
      const contentSnapshot: any = {}
      if (isArtifact) {
        contentSnapshot.artifactType = (currentItem as any).type || 'unknown'
        if (widgetId) {
          contentSnapshot.widgetId = widgetId
        }
      } else {
        contentSnapshot.widgetType = 'unknown'
        if (widgetId) {
          contentSnapshot.widgetId = widgetId
        }
      }
      
      // Call Convex mutation directly (no backend needed)
      const feedbackId = await submitFeedback({
        entityType: entityType as any,
        entityId,
        rating,
        userId,
        contentSnapshot,
        feedbackText: feedbackText || undefined,
        projectId,
        widgetId: widgetId || undefined,
      })
      
      console.log('Feedback submitted successfully:', feedbackId)
      
      // Backend will process feedback signals via background job
      // No need to wait for backend processing
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      throw error // Re-throw to let StarRating component handle it
    } finally {
      setIsSubmittingFeedback(false)
    }
  }
  
  // Background jobs (for widget activity)
  // WHY: Real-time visibility into widget execution status for "What's Happening" section
  // Uses Convex reactive query - UI updates automatically when job status changes
  const jobs = useQuery(
    api.backgroundJobs.getUserJobs,
    userId && widgetId ? { userId, jobType: 'widget_execution' as any, limit: 100 } : 'skip'
  )
  const widgetJob = useMemo(() => 
    jobs?.find((j: any) => j.payload?.widget_id === widgetId),
    [jobs, widgetId]
  )
  
  
  // Widget artifacts
  // WHY: Display "What It's Made" section with latest widget-generated artifacts
  // Uses Convex index 'by_widget' for efficient querying (Pattern: Convex Direct Access)
  const outputs = useQuery(
    api.artifactQueries.getWidgetArtifacts,
    widgetId ? {
      widgetId: widgetId as any
    } : 'skip'
  )
  
  // A2A messages (via Convex query)
  // WHY: A2A notes are stored in Convex, so we query directly for reactive updates.
  // Convex queries automatically update when data changes, providing real-time activity feed.
  const a2aMessages = useQuery(
    api.a2aQueries.getLatestA2ANotesPublic,
    projectId && !isArtifact ? { projectId, limit: 10 } : 'skip'
  ) || []
  
  // Widget execution prompts (generated by widget_prompt_generator.py)
  // WHY: Display custom prompts used by widget agents during execution
  // Uses Convex reactive query - UI updates automatically when prompts change
  const widgetPrompts = useQuery(
    api.promptsQueries.queryPromptsByScope,
    widgetId ? {
      scope: "widget",
      scopeId: widgetId as any,
      limit: 20
    } : 'skip'
  )
  
  // Empty state
  if (items.length === 0) {
    return (
      <div className="fixed inset-0 bg-background">
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center space-y-4 max-w-md w-full">
            <h2 className={cn(
              "font-semibold text-foreground",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              <T context="gallery.empty.title">No Items Yet</T>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              <T context="gallery.empty.description">This project doesn't have any artifacts or widgets yet</T>
            </p>
            <Button 
              onClick={onClose} 
              variant="outline"
              className={isMobile ? "min-h-[44px] w-full sm:w-auto" : ""}
            >
              <T context="button.back.to.project">Back to Project</T>
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // No current item (safety check)
  if (!currentItem) {
    return null
  }
  
  const typeLabel = isArtifact ? (
    <T context="gallery.type.artifact">Artifact</T>
  ) : (
    <T context="gallery.type.widget">Widget</T>
  )
  
  // Gradient themes based on type
  const headerGradient = isArtifact
    ? 'bg-gradient-to-br from-blue-500/10 via-cyan-500/8 to-blue-500/5'
    : 'bg-gradient-to-br from-purple-500/10 via-indigo-500/8 to-purple-500/5'
  
  const accentBorder = isArtifact
    ? 'border-blue-500/20'
    : 'border-purple-500/20'
  
  const typeBadgeGradient = isArtifact
    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400'
    : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400'
  
  // Render current item based on its type
  const renderCurrentItem = () => {
    if (isArtifact) {
      return (
        <div className={cn(
          "bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl space-y-4",
          isMobile ? "p-4" : "p-6"
        )}>
          {/* Star Rating for Artifact */}
          {userId && (
            <div className="flex items-center justify-end">
              <StarRating
                size="sm"
                value={currentRating}
                onRate={handleFeedbackSubmit}
                disabled={isSubmittingFeedback}
                allowFeedbackText={true}
              />
            </div>
          )}
          
          <EditableArtifactRenderer 
            artifact={currentItem as any} 
            userId={userId}
          />
        </div>
      )
    } else if (!userId) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>
            <T context="gallery.auth.required">User authentication required to view widget details</T>
          </p>
        </div>
      )
    } else {
      // Use extracted component
      return (
        <ProgressiveWidgetView
          currentItem={currentItem}
          widgetId={widgetId}
          userId={userId}
          projectId={projectId}
          widgetJob={widgetJob}
          a2aMessages={a2aMessages}
          widgetPrompts={widgetPrompts}
          outputs={outputs}
          currentRating={currentRating}
          onFeedbackSubmit={handleFeedbackSubmit}
          isSubmittingFeedback={isSubmittingFeedback}
        />
      )
    }
  }
  
  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-background flex flex-col">
        {/* Header with gradient theme */}
        <div className={cn(
          "border-b backdrop-blur-xl",
          headerGradient,
          accentBorder
        )}>
          <div className={cn(
            "mx-auto px-4 py-3 sm:px-6 sm:py-4",
            isMobile ? "w-full" : "max-w-[1800px]"
          )}>
            <div className={cn(
              "flex items-center justify-between",
              isMobile ? "flex-col gap-3" : "flex-row"
            )}>
              {/* Left: Title & Type Badge */}
              <div className={cn(
                "flex items-center gap-2 sm:gap-4",
                isMobile ? "w-full justify-between" : ""
              )}>
                <h1 className={cn(
                  "font-semibold text-foreground",
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  <T context="gallery.title">Project Gallery</T>
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "px-2 py-1 sm:px-3 sm:py-1 font-medium border-0 text-xs sm:text-sm",
                    typeBadgeGradient
                  )}
                >
                  {typeLabel}
                </Badge>
                <span className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {currentIndex + 1} <T context="gallery.pagination.of">of</T> {total}
                </span>
              </div>
              
              {/* Right: Actions */}
              <div className={cn(
                "flex items-center gap-2 sm:gap-3",
                isMobile ? "w-full justify-between" : ""
              )}>
                {/* Toggle Sidebar */}
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "sm"}
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    isMobile ? "min-h-[44px] px-4" : ""
                  )}
                >
                  {sidebarOpen ? (
                    <T context="button.gallery.hide.list">Hide List</T>
                  ) : (
                    <T context="button.gallery.show.list">Show List</T>
                  )}
                </Button>
                
                {/* Back to Constellation */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  className={cn(
                    "backdrop-blur-sm border-0",
                    isMobile ? "min-h-[44px] px-4" : "",
                    isArtifact 
                      ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400" 
                      : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                  )}
                >
                  <T context="button.gallery.back.to.constellation">Back to Constellation</T>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Body with Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Sidebar - Mobile: Overlay, Desktop: Side */}
          {sidebarOpen && (
            <>
              {/* Mobile: Backdrop overlay */}
              {isMobile && (
                <div
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
              
              {/* Sidebar */}
              <div className={cn(
                isMobile 
                  ? "fixed left-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] shadow-xl"
                  : "relative"
              )}>
                <GallerySidebar
                  items={items}
                  currentIndex={currentIndex}
                  onSelectItem={(index) => {
                    goToIndex(index)
                    if (isMobile) {
                      setSidebarOpen(false)
                    }
                  }}
                />
              </div>
            </>
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className={cn(
              "mx-auto py-4 sm:py-8",
              isMobile ? "px-4 max-w-full" : "px-6 max-w-5xl"
            )}>
              {/* Render current item with fade transition */}
              <div className="animate-in fade-in-0 duration-300">
                {renderCurrentItem()}
              </div>
              
              {/* Navigation Controls */}
              <div className={cn("mt-4 sm:mt-6")}>
                <GalleryNavigation
                  hasPrev={hasPrev}
                  hasNext={hasNext}
                  currentIndex={currentIndex}
                  total={total}
                  onPrev={goToPrev}
                  onNext={goToNext}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
