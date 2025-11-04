'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThreadItem } from './ThreadItem'

interface ThreadSidebarProps {
  userId: string
  activeThreadId?: string
  onThreadSelect: (threadId: string) => void
  onNewThread: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function ThreadSidebar({
  userId,
  activeThreadId,
  onThreadSelect,
  onNewThread,
  isCollapsed = false,
  onToggleCollapse
}: ThreadSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  
  // Get all user threads
  const allThreads = useQuery(
    api.chatQueries.getAllUserThreads,
    userId ? { userId } : 'skip'
  )
  
  // Filter threads by search
  const filteredThreads = useMemo(() => {
    if (!allThreads || !searchQuery) return allThreads
    const query = searchQuery.toLowerCase()
    return allThreads.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.lastMessagePreview?.toLowerCase().includes(query)
    )
  }, [allThreads, searchQuery])
  
  // Collapsed state (40px width)
  if (isCollapsed) {
    return (
      <div className="w-[40px] h-full bg-card border-r border-border flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    )
  }
  
  // Expanded state (280px width)
  return (
    <div className="w-[280px] h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Threads</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>
      
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads && filteredThreads.length > 0 ? (
          filteredThreads.map(thread => (
            <ThreadItem
              key={thread._id}
              thread={thread}
              isActive={thread._id === activeThreadId}
              onClick={() => onThreadSelect(thread._id)}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchQuery ? 'No matching threads' : 'No threads yet'}
          </div>
        )}
      </div>
      
      {/* New Thread Button */}
      <div className="p-4 border-t border-border">
        <Button onClick={onNewThread} className="w-full gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Thread
        </Button>
      </div>
    </div>
  )
}

