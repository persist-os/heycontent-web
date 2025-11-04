'use client'

import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThreadCard } from './ThreadCard'
import { MessageSquarePlus } from 'lucide-react'

interface ThreadQuickAccessProps {
  userId: string | null
}

export function ThreadQuickAccess({ userId }: ThreadQuickAccessProps) {
  const router = useRouter()
  
  // Get recent threads (main + top 3-4 projects)
  const recentThreads = useQuery(
    api.chatQueries.getRecentThreads,
    userId ? { userId, limit: 4 } : 'skip'
  )
  
  if (!userId || !recentThreads || recentThreads.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Your Conversations
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Continue where you left off or start something new
            </p>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <MessageSquarePlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start your first conversation or create a project
          </p>
          <Button onClick={() => router.push('/dashboard/thinking_lab')}>
            Start Conversation
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Your Conversations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Continue where you left off or start something new
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => router.push('/dashboard/thinking_lab')}
        >
          See All →
        </Button>
      </div>
      
      {/* Thread Cards - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentThreads.map(thread => (
          <ThreadCard key={thread._id} thread={thread} />
        ))}
      </div>
    </div>
  )
}

