/**
 * Live activity feed showing recent family updates.
 * 
 * Replaces "status dashboard" - shows continuous stream of activity.
 */

'use client'

import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { MessageCircle } from 'lucide-react'

interface ActivityFeedProps {
  userId: string | null
}

export function ActivityFeed({ userId }: ActivityFeedProps) {
  // Query recent family update messages
  const recentActivities = useQuery(
    api.messagesQueries.getRecentFamilyUpdates,
    userId ? { userId, limit: 10 } : 'skip'
  )
  
  if (!userId) {
    return null
  }
  
  if (!recentActivities || recentActivities.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No recent activity
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground mb-3">Recent Activity</h3>
      
      {recentActivities.map((activity: any) => (
        <div
          key={activity._id}
          className="flex items-start gap-3 p-3 rounded-lg bg-card/30 hover:bg-card/50 transition-colors"
        >
          {/* Family icon */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          
          {/* Activity content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              {activity.content}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

