'use client'

import React from 'react'
import { useDialogueStore } from '../stores/dialogueStore'
import { Badge } from '@/components/ui/badge'
import { X, Layers, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

/**
 * Context Indicator
 * 
 * Shows a subtle badge when user is in a project/widget context container.
 * Allows user to exit the context and return to general chat.
 */
export function ContextIndicator() {
  const { projectId, widgetId, widgetOutputId, clearProjectContext } = useDialogueStore()
  const router = useRouter()
  
  // Only show if there's an active context
  const hasContext = !!(projectId || widgetId || widgetOutputId)
  if (!hasContext) return null
  
  // Determine context type
  const isWidgetContext = !!widgetId
  const isProjectContext = !!projectId && !widgetId
  
  const handleExitContext = () => {
    console.log('[CONTEXT INDICATOR] Exiting context container')
    clearProjectContext()
    // Navigate to clean thinking lab (back button behavior)
    router.push('/dashboard/thinking_lab')
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
      <Badge variant="outline" className="flex items-center gap-2 text-xs font-normal">
        {isWidgetContext && (
          <>
            <Layers className="h-3 w-3" />
            <span>Widget Context</span>
          </>
        )}
        {isProjectContext && (
          <>
            <FolderKanban className="h-3 w-3" />
            <span>Project Context</span>
          </>
        )}
      </Badge>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExitContext}
        className="h-6 px-2 text-xs hover:bg-destructive/10"
        title="Exit context and return to general chat"
      >
        <X className="h-3 w-3 mr-1" />
        Exit
      </Button>
      
      <span className="text-xs text-muted-foreground">
        All conversations and notes in this session will be linked to this context
      </span>
    </div>
  )
}

