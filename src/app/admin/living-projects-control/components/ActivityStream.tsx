'use client'

/**
 * Activity Stream Component
 * 
 * Shows decision engine activity through EXISTING message stream.
 * Pattern 4 (A2A messages) from LOT's audit.
 * 
 * Design: PHASE_2_ADMIN_DASHBOARD_DESIGN_SPEC_2025_11_03.md
 * 
 * Key Insight: Decision engine posts A2A messages with contentType="widget_coordination"
 * We filter and display these as logs - no separate logging system needed!
 */

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import type { Id } from '@/convex/_generated/dataModel'

interface ActivityStreamProps {
  projectId: Id<"projects">
}

export function ActivityStream({ projectId }: ActivityStreamProps) {
  // LOT's Pattern 4 (Step 1): Get project conversation
  const conversation = useQuery(api.chatQueries.getProjectScopedConversation, {
    projectId
  })

  // LOT's Pattern 4 (Step 2): Get messages if conversation exists
  const messages = useQuery(
    conversation?._id 
      ? api.messagesQueries.getConversationMessages
      : null,
    conversation?._id 
      ? { conversationId: conversation._id }
      : 'skip' as any
  )

  if (messages === undefined) {
    return (
      <Card className="bg-card p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Activity Stream
        </h2>
        <Skeleton className="h-48 w-full" />
      </Card>
    )
  }

  // Filter for decision engine activity:
  // - contentType="widget_coordination" (A2A messages from Phase 1!)
  // - role="assistant" and contains decision/trigger keywords
  const activityMessages = messages?.filter(m => 
    m.contentType === 'widget_coordination' ||
    (m.role === 'assistant' && (
      m.content.toLowerCase().includes('decision') ||
      m.content.toLowerCase().includes('trigger') ||
      m.content.toLowerCase().includes('widget') ||
      m.content.toLowerCase().includes('coordinat')
    ))
  ) || []

  return (
    <Card className="bg-card p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Activity Stream
      </h2>

      {activityMessages.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No activity yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Decision engine activity will appear here
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {activityMessages.map(msg => (
              <ActivityItem
                key={msg._id}
                time={formatTimestamp(msg._creationTime)}
                type={msg.contentType || 'system'}
                content={msg.content}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  )
}

interface ActivityItemProps {
  time: string
  type: string
  content: string
}

function ActivityItem({ time, type, content }: ActivityItemProps) {
  // Use different styling based on message type
  const isCoordination = type === 'widget_coordination'
  
  return (
    <div 
      className={`
        p-3 rounded-lg text-sm
        ${isCoordination 
          ? 'bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800' 
          : 'bg-card border border-border'
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCoordination && <span className="text-base">🤝</span>}
          <span className="text-xs font-medium text-foreground uppercase tracking-wide">
            {isCoordination ? 'Widget Coordination' : 'System'}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {time}
        </span>
      </div>

      {/* Content */}
      <p className={`
        ${isCoordination 
          ? 'text-blue-900 dark:text-blue-100' 
          : 'text-foreground'
        }
      `}>
        {content}
      </p>
    </div>
  )
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

