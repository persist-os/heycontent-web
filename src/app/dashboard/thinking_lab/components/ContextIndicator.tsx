'use client'

import React from 'react'
// Removed dialogueStore import - using conversation hooks instead
import { Badge } from '@/components/ui/badge'
import { X, Layers, FolderKanban, ArrowLeft, Share2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ProjectPresenceIndicator } from '@/components/projects/ProjectPresenceIndicator'
import type { Id } from '@/convex/_generated/dataModel'

interface ContextIndicatorProps {
  projectId?: string
  widgetId?: string
  widgetOutputId?: string
  userId?: string | null
  userPermission?: 'owner' | 'editor' | 'read' | null
  currentView?: string
  conversationId?: string
  onShareClick?: () => void
}

/**
 * Context Indicator
 * 
 * Shows a subtle badge when user is in a project/widget context container.
 * Allows user to exit the context and return to general chat.
 * Also shows collaboration features when in a project context.
 */
export function ContextIndicator({
  projectId,
  widgetId,
  widgetOutputId,
  userId,
  userPermission,
  currentView,
  conversationId,
  onShareClick
}: ContextIndicatorProps = {}) {
  const router = useRouter()

  // Only show if there's an active context
  const hasContext = !!(projectId || widgetId || widgetOutputId)
  if (!hasContext) return null

  // Determine context type
  const isWidgetContext = !!widgetId
  const isProjectContext = !!projectId && !widgetId
  
  const handleBackToWidget = () => {
    if (!widgetId || !projectId) return
    console.log('[CONTEXT INDICATOR] Navigating back to widget:', { widgetId, projectId })
    router.push(`/dashboard/living-projects/${projectId}/gallery?id=${widgetId}`)
  }

  const handleExitContext = () => {
    console.log('[CONTEXT INDICATOR] Exiting context container')
    // Navigate to clean thinking lab (back button behavior)
    router.push('/dashboard/thinking_lab')
  }
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border/60 backdrop-blur-sm">
      {/* Left spacer */}
      <div className="flex-1"></div>

      {/* Center - Context Badge */}
      <div className="flex items-center justify-center flex-1">
        <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium px-3 py-1">
          {isWidgetContext && (
            <>
              <Layers className="h-4 w-4" />
              <span>Widget Context</span>
            </>
          )}
          {isProjectContext && (
            <>
              <FolderKanban className="h-4 w-4" />
              <span>Project Context</span>
            </>
          )}
        </Badge>
      </div>

      {/* Right - Collaboration Features & Actions */}
      <div className="flex items-center gap-3 flex-1 justify-end">
        {/* Collaboration Features - Show when in project context */}
        {isProjectContext && projectId && userId && (
          <div className="flex items-center gap-3 mr-2">
            {/* Presence Indicator */}
            <ProjectPresenceIndicator
              projectId={projectId as Id<'projects'>}
              currentView={currentView}
              currentItemId={conversationId}
            />
            
            {/* Share Button - Show if user has permission */}
            {(userPermission === 'owner' || userPermission === 'editor') && onShareClick && (
              <Button
                variant="default"
                size="sm"
                onClick={onShareClick}
                className="h-8 px-4 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm flex items-center gap-2"
                title="Share project with collaborators"
              >
                <Share2 className="h-4 w-4" />
                Share Project
              </Button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {isWidgetContext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToWidget}
              className="h-7 px-3 text-sm hover:bg-muted-foreground/10 font-medium"
              title="Return to widget page"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Widget
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExitContext}
            className="h-7 px-3 text-sm hover:bg-destructive/10 font-medium"
            title="Exit context and return to general chat"
          >
            <X className="h-4 w-4 mr-1.5" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}

