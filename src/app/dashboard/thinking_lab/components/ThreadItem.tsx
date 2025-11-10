'use client'

import React from 'react'
import { Home, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ThreadItemProps {
  thread: {
    _id: string
    title: string
    threadType: 'main' | 'project'
    lastMessagePreview?: string
    messageCount: number
    lastMessageAt?: number
    hasUnread?: boolean
  }
  isActive: boolean
  onClick: () => void
}

export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps) {
  const isMain = thread.threadType === 'main'
  const isUnread = thread.hasUnread
  
  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return ''
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    if (hours < 24) return `${hours}h`
    return `${days}d`
  }
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 text-left border-l-2 transition-colors",
        "hover:bg-muted/50",
        isActive && "bg-muted border-l-primary",
        !isActive && "border-l-transparent",
        isUnread && "bg-destructive/10"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0">
          {isMain ? (
            <Home className="w-4 h-4 text-muted-foreground" />
          ) : (
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "text-sm font-medium truncate",
              isActive && "text-foreground",
              !isActive && "text-muted-foreground"
            )}>
              {thread.title}
            </span>
            {isUnread && <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">!</Badge>}
          </div>
          
          {thread.lastMessagePreview && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {thread.lastMessagePreview}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{thread.messageCount} msgs</span>
            <span>{formatRelativeTime(thread.lastMessageAt)}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

