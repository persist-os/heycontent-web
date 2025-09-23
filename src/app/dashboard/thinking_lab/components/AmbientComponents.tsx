/**
 * Ambient Components
 * 
 * Floating and contextual interface elements that provide ambient functionality
 * without obstructing the main workflow. Replaces existing ambient features.
 * 
 * Features:
 * - Bottom action bar with contextual actions
 * - Floating insights and suggestions
 * - Progress indicators
 * - Quick access shortcuts
 * 
 * Dependencies: useLabCore hooks
 */

import React from 'react'
import { useDialogue, useReflection, useInsight, useLabLayout } from '../hooks/useLabCore'

// =============================================================================
// INTERFACES
// =============================================================================

interface AmbientComponentsProps {
  className?: string
  showBottomBar?: boolean
  showFloatingInsights?: boolean
  showProgressIndicators?: boolean
}

interface BottomBarProps {
  actions: ActionItem[]
  position?: 'bottom' | 'top'
}

interface FloatingInsightsProps {
  insights: InsightItem[]
  position?: 'top-right' | 'bottom-left' | 'floating'
}

interface ActionItem {
  id: string
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  hidden?: boolean
}

interface InsightItem {
  id: string
  content: string
  type: 'suggestion' | 'tip' | 'progress'
  priority: number
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AmbientComponents({
  className = '',
  showBottomBar = true,
  showFloatingInsights = true,
  showProgressIndicators = true
}: AmbientComponentsProps) {
  const dialogue = useDialogue()
  const reflection = useReflection()
  const insight = useInsight()
  const layout = useLabLayout()

  // Generate contextual actions based on current state
  const actions: ActionItem[] = [
    {
      id: 'new-conversation',
      label: 'New Chat',
      action: dialogue.actions.startNewConversation,
      disabled: dialogue.state.isLoading
    },
    {
      id: 'open-notepad',
      label: reflection.state.isOpen ? 'Close Notes' : 'Open Notes',
      action: reflection.state.isOpen 
        ? reflection.actions.closeNotepad 
        : () => reflection.actions.openNotepad(),
    },
    {
      id: 'toggle-search',
      label: insight.state.searchEnabled ? 'Hide Search' : 'Show Search',
      action: insight.actions.toggleSearch
    },
    {
      id: 'save-notes',
      label: 'Save Notes',
      action: reflection.actions.saveNote,
      disabled: !reflection.state.isDirty || reflection.state.isSaving,
      hidden: !reflection.state.isOpen
    }
    // TODO: Add any other actions your current system has
  ]

  // Generate contextual insights
  const insights: InsightItem[] = [
    // TODO: Add logic to generate contextual insights based on current state
    ...(dialogue.state.messages.length === 0 ? [{
      id: 'welcome',
      content: 'Start a conversation to begin exploring ideas',
      type: 'suggestion' as const,
      priority: 1
    }] : []),
    
    ...(reflection.state.isDirty ? [{
      id: 'unsaved',
      content: 'You have unsaved notes',
      type: 'tip' as const,
      priority: 2
    }] : []),
    
    ...(insight.state.activeContexts.length > 0 ? [{
      id: 'active-contexts',
      content: `${insight.state.activeContexts.length} contexts ready to inject`,
      type: 'progress' as const,
      priority: 3
    }] : [])
  ]

  return (
    <div className={`ambient-components ${className}`}>
      {showBottomBar && (
        <BottomActionBar 
          actions={actions.filter(a => !a.hidden)}
          position="bottom"
        />
      )}

      {showFloatingInsights && insights.length > 0 && (
        <FloatingInsights
          insights={insights}
          position="top-right"
        />
      )}

      {showProgressIndicators && (
        <ProgressIndicators
          messageCount={dialogue.state.messages.length}
          hasUnsavedNotes={reflection.state.isDirty}
          activeContexts={insight.state.activeContexts.length}
        />
      )}
    </div>
  )
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function BottomActionBar({ 
  actions, 
  position = 'bottom' 
}: BottomBarProps) {
  return (
    <div className={`bottom-action-bar position-${position}`}>
      {/* TODO: Copy your existing bottom bar structure and styling */}
      <div className="action-bar-container">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={action.disabled}
            className={`action-button action-${action.id}`}
            title={action.label}
          >
            {/* TODO: Add your icons based on action.icon or action.id */}
            {action.icon && <span className="action-icon">{action.icon}</span>}
            <span className="action-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function FloatingInsights({ 
  insights, 
  position = 'top-right' 
}: FloatingInsightsProps) {
  // Sort insights by priority (higher priority first)
  const sortedInsights = [...insights].sort((a, b) => a.priority - b.priority)
  
  // Show only top 3 insights to avoid clutter
  const visibleInsights = sortedInsights.slice(0, 3)

  if (visibleInsights.length === 0) {
    return null
  }

  return (
    <div className={`floating-insights position-${position}`}>
      {/* TODO: Copy your existing floating insights structure and styling */}
      <div className="insights-container">
        {visibleInsights.map((insight) => (
          <InsightItem
            key={insight.id}
            insight={insight}
            onDismiss={() => {
              // TODO: Add dismiss functionality if needed
              console.log('Dismiss insight:', insight.id)
            }}
          />
        ))}
      </div>
    </div>
  )
}

function InsightItem({ 
  insight, 
  onDismiss 
}: { 
  insight: InsightItem
  onDismiss: () => void 
}) {
  return (
    <div className={`insight-item insight-${insight.type}`}>
      {/* TODO: Style insight items to match your design */}
      <div className="insight-content">
        {insight.content}
      </div>
      
      <button
        onClick={onDismiss}
        className="insight-dismiss"
        title="Dismiss"
      >
        {/* TODO: Add your dismiss icon */}
        ✕
      </button>
    </div>
  )
}

function ProgressIndicators({
  messageCount,
  hasUnsavedNotes,
  activeContexts
}: {
  messageCount: number
  hasUnsavedNotes: boolean
  activeContexts: number
}) {
  return (
    <div className="progress-indicators">
      {/* TODO: Copy your existing progress indicators structure and styling */}
      <div className="indicators-container">
        
        {/* Message count indicator */}
        <div className="indicator message-indicator">
          <span className="indicator-value">{messageCount}</span>
          <span className="indicator-label">messages</span>
        </div>

        {/* Unsaved notes indicator */}
        {hasUnsavedNotes && (
          <div className="indicator unsaved-indicator">
            <span className="indicator-icon">●</span>
            <span className="indicator-label">unsaved</span>
          </div>
        )}

        {/* Active contexts indicator */}
        {activeContexts > 0 && (
          <div className="indicator context-indicator">
            <span className="indicator-value">{activeContexts}</span>
            <span className="indicator-label">contexts</span>
          </div>
        )}

        {/* TODO: Add any other progress indicators you want */}
      </div>
    </div>
  )
}

// =============================================================================
// QUICK ACCESS COMPONENT
// =============================================================================

export function QuickActions({
  className = ''
}: {
  className?: string
}) {
  const dialogue = useDialogue()
  const reflection = useReflection()
  const insight = useInsight()

  const quickActions = [
    {
      id: 'quote-last',
      label: 'Quote Last Message',
      action: () => {
        const lastMessage = dialogue.state.messages[dialogue.state.messages.length - 1]
        if (lastMessage) {
          dialogue.actions.quoteMessage(lastMessage.id)
        }
      },
      disabled: dialogue.state.messages.length === 0,
      shortcut: 'Ctrl+Q'
    },
    {
      id: 'save-quick',
      label: 'Quick Save',
      action: reflection.actions.saveNote,
      disabled: !reflection.state.isDirty,
      shortcut: 'Ctrl+S'
    },
    {
      id: 'search-quick',
      label: 'Quick Search',
      action: insight.actions.toggleSearch,
      shortcut: 'Ctrl+K'
    }
    // TODO: Add any other quick actions you want
  ]

  // TODO: Add keyboard shortcut handling
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'q':
            e.preventDefault()
            quickActions[0].action()
            break
          case 's':
            e.preventDefault()
            quickActions[1].action()
            break
          case 'k':
            e.preventDefault()
            quickActions[2].action()
            break
          // TODO: Add more shortcuts as needed
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`quick-actions ${className}`}>
      {/* TODO: Copy your existing quick actions structure and styling */}
      <div className="quick-actions-container">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={action.disabled}
            className={`quick-action-button quick-${action.id}`}
            title={`${action.label} (${action.shortcut})`}
          >
            <span className="action-label">{action.label}</span>
            <span className="action-shortcut">{action.shortcut}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AmbientComponents
export { QuickActions }
export type {
    AmbientComponentsProps,
    ActionItem,
    InsightItem,
    BottomBarProps,
    FloatingInsightsProps
}