'use client'

import React, { memo, useCallback, useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Bell,
  Folder,
  Plus,
  CheckCircle,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'
import { useAuth } from '@/app/context/auth-context'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

export const GlobalNav = memo(function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { setIsExpanded } = useSidebar()
  const { firebaseUser } = useAuth()
  
  // Get user data for avatar
  const userData = useQuery(
    api.userQueries.getUser,
    firebaseUser?.uid ? { userId: firebaseUser.uid } : "skip"
  )
  
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Query A2A notes for notifications
  const a2aNotes = useQuery(
    api.a2aQueries.getLatestA2ANotesPublic,
    { limit: 20 }
  )

  // Get user initial for avatar
  const getUserInitial = useCallback(() => {
    if (userData?.name) {
      return userData.name.charAt(0).toUpperCase()
    }
    if (firebaseUser?.displayName) {
      return firebaseUser.displayName.charAt(0).toUpperCase()
    }
    if (firebaseUser?.email) {
      return firebaseUser.email.charAt(0).toUpperCase()
    }
    return 'U'
  }, [userData, firebaseUser])

  // Get user photo URL
  const getUserPhoto = useCallback(() => {
    return userData?.image || firebaseUser?.photoURL || undefined
  }, [userData, firebaseUser])

  // Handle compass icon click - opens command palette
  const handleCompassClick = useCallback(() => {
    setIsExpanded(true)
  }, [setIsExpanded])

  // Handle folder icon click - navigates to Files/Notes
  const handleFolderClick = useCallback(() => {
    router.push('/dashboard/notes')
  }, [router])

  // Handle plus icon click - navigates to Thinking Lab
  const handlePlusClick = useCallback(() => {
    router.push('/dashboard/thinking_lab')
  }, [router])

  // Handle profile click - navigate to settings
  const handleProfileClick = useCallback(() => {
    router.push('/settings')
  }, [router])

  // Get notification route from A2A note
  const getNotificationRoute = useCallback((note: any) => {
    const report = note.report || {}
    const metadata = report.metadata || {}
    
    // Artifact completed → gallery
    const artifactId = metadata.artifact_id || metadata.artifactId || report.artifact_id
    if (artifactId && note.projectId) {
      return `/dashboard/living-projects/${note.projectId}/gallery?id=${artifactId}`
    }
    
    // Widget completed → gallery
    const widgetId = metadata.widget_id || metadata.widgetId || report.widget_id
    if (widgetId && note.projectId) {
      return `/dashboard/living-projects/${note.projectId}/gallery?id=${widgetId}`
    }
    
    // Conversation update → thinking lab
    if (note.conversationId) {
      return `/dashboard/thinking_lab?chatId=${note.conversationId}`
    }
    
    // Default: project view
    if (note.projectId) {
      return `/dashboard/living-projects/${note.projectId}`
    }
    
    return null
  }, [])
  
  // Format notification text from A2A note
  const formatNotificationText = useCallback((note: any) => {
    const report = note.report || {}
    const agentId = note.agentId || report.agent_id || "orchestrator"
    const announcement = report.announcement || report.summary
    
    // Try to extract meaningful text
    if (announcement) {
      return announcement
    }
    
    // Check for artifact/widget completion
    const metadata = report.metadata || {}
    if (metadata.artifact_id || metadata.artifactId) {
      return "Artifact completed"
    }
    if (metadata.widget_id || metadata.widgetId) {
      return "Widget completed"
    }
    
    // Default based on agent
    if (agentId === "orchestrator") {
      return "Orchestration update"
    }
    
    return "New update"
  }, [])
  
  // Get notification icon
  const getNotificationIcon = useCallback((note: any) => {
    const report = note.report || {}
    const metadata = report.metadata || {}
    
    if (metadata.artifact_id || metadata.artifactId || report.artifact_id) {
      return FileText
    }
    if (metadata.widget_id || metadata.widgetId || report.widget_id) {
      return Sparkles
    }
    if (note.conversationId) {
      return MessageSquare
    }
    return CheckCircle
  }, [])
  
  // Format relative time
  const formatRelativeTime = useCallback((timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return new Date(timestamp).toLocaleDateString()
  }, [])
  
  // Handle notification click
  const handleNotificationClick = useCallback((note: any) => {
    const route = getNotificationRoute(note)
    if (route) {
      router.push(route)
      setShowNotifications(false)
    }
  }, [router, getNotificationRoute])
  
  // Check if we have notifications
  const hasNotifications = useMemo(() => {
    return (a2aNotes?.length || 0) > 0
  }, [a2aNotes])

  // Check if current path matches
  const isNotesActive = pathname.startsWith('/dashboard/notes')
  const isSettingsActive = pathname.startsWith('/settings')

  return (
    <div className="fixed left-0 top-0 bottom-0 w-16 bg-[#1C1B1C] flex flex-col items-center justify-between py-[60px] px-4 z-50">
      {/* Top Section: Logo/Compass */}
      <div className="flex flex-col items-center gap-6">
        {/* Compass/Logo Icon */}
        <button
          onClick={handleCompassClick}
          className="relative group"
          aria-label="Open command palette"
          title="Open command palette (⌘K)"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-hover:opacity-60 transition-opacity" />
          
          {/* Icon container with gradient border */}
          <div className="relative w-11 h-11 rounded-xl bg-[#0B1018] backdrop-blur-[10px] border border-[rgba(154,203,255,0.88)] flex items-center justify-center transition-all duration-200 group-hover:border-[rgba(154,203,255,1)] overflow-hidden">
            {/* Gradient background effect - subtle blue glow */}
            <div className="absolute inset-0 rounded-xl opacity-30 bg-gradient-to-br from-[rgba(101,181,255,0.6)] via-[rgba(154,205,255,0.4)] to-transparent" />
            {/* Compass icon */}
            <Compass className="relative w-6 h-6 text-[#EEF1FE] rotate-90 z-10" />
          </div>
        </button>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-3 items-center">
          {/* Notifications */}
          <Popover open={showNotifications} onOpenChange={setShowNotifications}>
            <PopoverTrigger asChild>
              <button
                className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10"
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-[#EEF1FE]" />
                {hasNotifications && (
                  <div className="absolute top-[20%] right-[20%] w-2 h-2 bg-[#FF5449] rounded-full" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-80 p-0" 
              align="start"
              side="right"
            >
              <div className="flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {hasNotifications && (
                      <Badge variant="default" className="text-xs">
                        {a2aNotes?.length || 0}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {!a2aNotes || a2aNotes.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    <div className="divide-y">
                      {a2aNotes.map((note) => {
                        const Icon = getNotificationIcon(note)
                        const text = formatNotificationText(note)
                        const route = getNotificationRoute(note)
                        
                        return (
                          <button
                            key={note._id}
                            onClick={() => handleNotificationClick(note)}
                            disabled={!route}
                            className={cn(
                              "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                              !route && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground line-clamp-2">
                                  {text}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatRelativeTime(note.createdAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Folder/Files */}
          <button
            onClick={handleFolderClick}
            className={cn(
              "relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              isNotesActive 
                ? "bg-background/20" 
                : "hover:bg-background/10"
            )}
            aria-label="Files"
          >
            <Folder className={cn(
              "w-6 h-6",
              isNotesActive ? "text-primary" : "text-[#EEF1FE]"
            )} />
          </button>

          {/* Plus/Create - Navigate to Thinking Lab */}
          <button
            onClick={handlePlusClick}
            className="relative w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10"
            aria-label="Thinking Lab"
            title="Thinking Lab"
          >
            <Plus className="w-6 h-6 text-[#EEF1FE]" />
          </button>
        </div>
      </div>

      {/* Bottom Section: Profile */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleProfileClick}
          className={cn(
            "relative transition-opacity hover:opacity-80",
            isSettingsActive && "opacity-100"
          )}
          aria-label="Profile & Settings"
        >
          <Avatar className="w-11 h-11 border-2 border-[rgba(154,203,255,0.3)]">
            <AvatarImage src={getUserPhoto()} />
            <AvatarFallback 
              className="bg-[#C00011] text-[#EEF1FE] text-[32px] font-normal"
            >
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  )
})
