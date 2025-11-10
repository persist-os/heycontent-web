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

export function UnifiedGalleryView({
  projectId,
  initialItemId,
  items,
  onClose,
  userId
}: UnifiedGalleryViewProps & { userId?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isAdmin } = useAdminAuth()
  
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
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-semibold text-foreground">
              <T context="gallery.empty.title">No Items Yet</T>
            </h2>
            <p className="text-muted-foreground">
              <T context="gallery.empty.description">This project doesn't have any artifacts or widgets yet</T>
            </p>
            <Button onClick={onClose} variant="outline">
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
        <div className="bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl p-6 space-y-4">
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
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Left: Title & Type Badge */}
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-foreground">
                  <T context="gallery.title">Project Gallery</T>
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "px-3 py-1 font-medium border-0",
                    typeBadgeGradient
                  )}
                >
                  {typeLabel}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} <T context="gallery.pagination.of">of</T> {total}
                </span>
              </div>
              
              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                {/* Toggle Sidebar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-muted-foreground hover:text-foreground"
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
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <GallerySidebar
              items={items}
              currentIndex={currentIndex}
              onSelectItem={goToIndex}
            />
          )}
          
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-8">
              {/* Render current item with fade transition */}
              <div className="animate-in fade-in-0 duration-300">
                {renderCurrentItem()}
              </div>
              
              {/* Navigation Controls */}
              <div className="mt-6">
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
