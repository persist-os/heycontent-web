'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BaseCard } from '@/components/ui/base-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Home, FolderOpen, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { wakeProject } from '@/app/lib/services/projectService'
import { toast } from 'sonner'

interface ThreadCardProps {
  thread: {
    _id: string
    title: string
    threadType: 'main' | 'project'
    lastMessagePreview?: string
    messageCount: number
    lastMessageAt?: number
    hasUnread?: boolean
    projectId?: string
    projectStatus?: 'working' | 'sleeping' | 'stable' | 'completed'
  }
  onClick?: () => void
  onStatusChange?: () => void
}

export function ThreadCard({ thread, onClick, onStatusChange }: ThreadCardProps) {
  const router = useRouter()
  const [isWaking, setIsWaking] = useState(false)
  
  const isMain = thread.threadType === 'main'
  const isUnread = thread.hasUnread
  const isActive = thread.lastMessageAt && 
    thread.lastMessageAt > Date.now() - 3600000 // < 1 hour
  const isSleeping = thread.projectStatus === 'sleeping'
  
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Navigate to Thinking Lab with this conversation
      const params = new URLSearchParams()
      if (thread._id) params.set('chatId', thread._id) // Use existing chatId parameter
      if (thread.projectId) params.set('projectId', thread.projectId)
      router.push(`/dashboard/thinking_lab?${params.toString()}`)
    }
  }
  
  const handleWakeProject = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (!thread.projectId || isWaking) return
    
    setIsWaking(true)
    try {
      await wakeProject(thread.projectId)
      toast.success('Project awakened! 🌅')
      onStatusChange?.() // Notify parent to refresh
    } catch (error) {
      toast.error(`Failed to wake project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsWaking(false)
    }
  }
  
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }
  
  return (
    <BaseCard
      variant="thread"
      onClick={handleClick}
      className={cn(
        "w-full sm:w-64 h-48 p-4 border-l-4",
        "flex flex-col justify-between text-left",
        "transition-all hover:shadow-lg hover:scale-[1.02]",
        isUnread && "bg-destructive/10 border-destructive ring-2 ring-destructive/20",
        isActive && !isUnread && "bg-primary/10 border-primary",
        !isActive && !isUnread && isMain && "border-accent/30",
        !isActive && !isUnread && !isMain && "border-border"
      )}
    >
      {/* Header: Icon + Name + Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isMain ? (
            <Home className="w-5 h-5 flex-shrink-0" />
          ) : (
            <FolderOpen className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-semibold text-sm truncate">
            {thread.title}
          </span>
        </div>
        <div className="flex-shrink-0">
          {isSleeping && (
            <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              💤 Sleeping
            </Badge>
          )}
          {isUnread && !isSleeping && (
            <Badge variant="destructive" className="animate-pulse">
              !
            </Badge>
          )}
          {isActive && !isUnread && !isSleeping && (
            <Badge className="bg-primary/20 text-primary">
              ✨
            </Badge>
          )}
        </div>
      </div>
      
      {/* Last Message Preview */}
      <div className="flex-1 flex items-center">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {thread.lastMessagePreview || 'Start conversation...'}
        </p>
      </div>
      
      {/* Footer: Count + Time OR Wake Button */}
      <div className="flex items-center justify-between text-xs">
        {isSleeping ? (
          <Button
            onClick={handleWakeProject}
            disabled={isWaking}
            size="sm"
            className="w-full"
          >
            {isWaking ? 'Waking...' : 'Wake Project 🌅'}
          </Button>
        ) : (
          <>
            <span className="text-muted-foreground">
              {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatTime(thread.lastMessageAt)}</span>
        </div>
          </>
        )}
      </div>
    </BaseCard>
  )
}

