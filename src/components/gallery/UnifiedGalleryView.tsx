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
import { ProjectCollaboratorsModal } from '@/components/projects/ProjectCollaboratorsModal'
import { ProjectPresenceIndicator } from '@/components/projects/ProjectPresenceIndicator'
import { Share2 } from 'lucide-react'
import type { Id } from '@/convex/_generated/dataModel'
import { getCurrentUserId } from '@/app/lib/api-helpers'

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
  
  // Collaboration state
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  
  // Get user ID if not provided
  const [currentUserId, setCurrentUserId] = useState<string | null>(userId || null)
  useEffect(() => {
    if (!userId) {
      const fetchUserId = async () => {
        try {
          const id = await getCurrentUserId()
          setCurrentUserId(id)
        } catch (error) {
          console.error('Failed to get user ID:', error)
        }
      }
      fetchUserId()
    }
  }, [userId])
  
  // Get user permission for project
  const userPermission = useQuery(
    api.contentAccessHelpers.getUserContentPermission,
    projectId && currentUserId ? {
      userId: currentUserId,
      contentType: 'project',
      contentId: projectId,
    } : 'skip'
  )
  
  // Get project name for modal
  const project = useQuery(
    api.projectsQueries.getById,
    projectId && currentUserId ? {
      projectId: projectId as Id<'projects'>,
      userId: currentUserId,
    } : 'skip'
  )
  
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
  
  // Keyboard navigation support
  // CRITICAL: Must come AFTER useGalleryNavigation hook to access hasPrev/hasNext
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key: Close sidebar on mobile
      if (e.key === 'Escape' && isMobile && sidebarOpen) {
        setSidebarOpen(false)
        return
      }
      
      // Arrow keys: Navigate gallery (only when sidebar is closed or on desktop)
      if (!sidebarOpen || !isMobile) {
        if (e.key === 'ArrowLeft' && hasPrev) {
          e.preventDefault()
          goToPrev()
        } else if (e.key === 'ArrowRight' && hasNext) {
          e.preventDefault()
          goToNext()
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMobile, sidebarOpen, hasPrev, hasNext, goToPrev, goToNext])
  
  // Widget-specific data queries
  // WHY: Only fetch widget data when viewing a widget (not an artifact)
  const isArtifact = currentItem?.itemType === 'artifact'
  const widgetId = !isArtifact && currentItem ? currentItem._id : null
  const entityId = currentItem?._id || null
  const entityType = isArtifact ? 'artifact' : 'widget_output'
  
  // Use currentUserId consistently (from prop or fetched)
  const effectiveUserId = currentUserId || userId
  
  // Query existing feedback for current item
  const existingFeedback = useQuery(
    api.feedback.getFeedbackByEntity,
    entityId && effectiveUserId ? {
      entityType: entityType as any,
      entityId: entityId
    } : 'skip'
  )
  
  // Get current user's rating (most recent feedback from this user)
  const currentRating = useMemo(() => {
    if (!existingFeedback || !effectiveUserId) return undefined
    const userFeedback = existingFeedback.find((f: any) => f.userId === effectiveUserId)
    return userFeedback?.rating
  }, [existingFeedback, effectiveUserId])
  
  // Feedback submission state
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  
  // Convex mutation for feedback submission
  const submitFeedback = useMutation(api.feedback.createContentFeedback)
  
  // Handler for feedback submission (direct Convex call)
  const handleFeedbackSubmit = async (rating: number, feedbackText?: string) => {
    if (!effectiveUserId || !entityId || !projectId) {
      console.warn('Missing required fields for feedback', { userId: effectiveUserId, entityId, projectId })
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
        userId: effectiveUserId,
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
    effectiveUserId && widgetId ? { userId: effectiveUserId, jobType: 'widget_execution' as any, limit: 100 } : 'skip'
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
    widgetId && effectiveUserId ? {
      widgetId: widgetId as any,
      userId: effectiveUserId
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
      <div className="fixed inset-0 left-0 md:ml-14 bg-background z-0">
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
              className={cn(
                "min-h-[44px] min-w-[44px]",
                isMobile ? "w-full sm:w-auto" : ""
              )}
              aria-label="Go back to project"
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
    ? 'bg-primary/50 text-foreground dark:bg-primary/40 dark:text-foreground border border-primary/30 dark:border-primary/40'
    : 'bg-accent/50 text-foreground dark:bg-accent/40 dark:text-foreground border border-accent/30 dark:border-accent/40'
  
  // Render current item based on its type
  const renderCurrentItem = () => {
    if (isArtifact) {
      return (
        <div className={cn(
          "bg-card/50 backdrop-blur-sm border border-border/40 rounded-xl space-y-4",
          isMobile ? "p-4" : "p-6"
        )}>
          {/* Star Rating for Artifact */}
          {effectiveUserId && (
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
            userId={effectiveUserId}
          />
        </div>
      )
    } else if (!effectiveUserId) {
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
          userId={effectiveUserId}
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
      <div className="fixed inset-0 left-0 md:ml-14 bg-background flex flex-col z-0">
        {/* Collaborators Modal */}
        {projectId && project && (
          <ProjectCollaboratorsModal
            projectId={projectId as Id<'projects'>}
            projectName={project.name || 'Untitled Project'}
            isOpen={showCollaboratorsModal}
            onClose={() => setShowCollaboratorsModal(false)}
          />
        )}
        
        {/* Header with gradient theme - Compact design */}
        <div className={cn(
          "border-b backdrop-blur-xl",
          headerGradient,
          accentBorder,
          // Mobile: Reduced top padding (60px instead of 80px) to avoid hamburger menu
          "pt-[60px] md:pt-0"
        )}>
          <div className={cn(
            "mx-auto px-3 py-2 sm:px-4 sm:py-2.5",
            isMobile ? "w-full" : "max-w-[1800px]"
          )}>
            <div className={cn(
              "flex items-center justify-between",
              isMobile ? "flex-row gap-2" : "flex-row"
            )}>
              {/* Left: Empty space for back button (omnipresent back button handles navigation) */}
              <div className={cn(isMobile ? "w-16" : "w-20")} /> {/* Compact spacer */}
              
              {/* Center: Title & Type Badge - Compact */}
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2",
                isMobile ? "flex-1 justify-center min-w-0" : "flex-1 justify-center"
              )}>
                <h1 className={cn(
                  "font-semibold text-foreground truncate",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  <T context="gallery.title">Assignment Gallery</T>
                </h1>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "px-1.5 py-0.5 sm:px-2 sm:py-1 font-medium border-0 text-[10px] sm:text-xs shrink-0",
                    typeBadgeGradient
                  )}
                >
                  {typeLabel}
                </Badge>
                <span className={cn(
                  "text-muted-foreground shrink-0",
                  isMobile ? "text-[10px]" : "text-xs"
                )}>
                  {currentIndex + 1}/{total}
                </span>
              </div>
              
              {/* Right: Collaboration & Actions - Compact */}
              <div className={cn(
                "flex items-center gap-1.5 sm:gap-2",
                isMobile ? "shrink-0" : ""
              )}>
                {/* Collaboration Features - Show when in project context */}
                {projectId && currentUserId && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Presence Indicator */}
                    <ProjectPresenceIndicator
                      projectId={projectId as Id<'projects'>}
                      currentView={isArtifact ? 'artifact' : 'widget'}
                      currentItemId={entityId || undefined}
                    />
                    
                    {/* Share Button - Show if user has permission - Icon only on mobile */}
                    {(userPermission === 'owner' || userPermission === 'editor') && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCollaboratorsModal(true)}
                        className={cn(
                          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                          "min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]",
                          isMobile ? "px-2" : "px-3"
                        )}
                        title="Share project with collaborators"
                        aria-label="Share project with collaborators"
                      >
                        <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                        <span className={isMobile ? "hidden" : "ml-1.5 text-xs"}>Share</span>
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Toggle Sidebar - Compact */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={cn(
                    "text-muted-foreground hover:text-foreground",
                    "min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px]",
                    isMobile ? "px-2 text-xs" : "px-2 text-xs"
                  )}
                  aria-label={sidebarOpen ? "Hide sidebar list" : "Show sidebar list"}
                  aria-expanded={sidebarOpen}
                >
                  {sidebarOpen ? (
                    <T context="button.gallery.hide.list">Hide</T>
                  ) : (
                    <T context="button.gallery.show.list">List</T>
                  )}
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
                  className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[70]"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
              )}
              
              {/* Sidebar */}
              <div className={cn(
                isMobile 
                  ? "fixed left-0 top-0 bottom-0 z-[90] w-80 max-w-[85vw] shadow-xl"
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
