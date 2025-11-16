'use client'

import React, { memo, useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Folder,
  Plus,
} from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'
import { useAuth } from '@/app/context/auth-context'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover'

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

  // Check if current path matches
  const isNotesActive = pathname.startsWith('/dashboard/notes')
  const isSettingsActive = pathname.startsWith('/settings')

  return (
    <div className="fixed left-0 top-0 bottom-0 w-14 md:w-16 bg-[hsl(var(--background))] flex flex-col items-center justify-between py-[60px] px-3 md:px-4 z-50">
      {/* Top Section: Logo/Compass */}
      <div className="flex flex-col items-center gap-2 md:gap-6">
        {/* Compass/Logo Icon */}
        <button
          onClick={handleCompassClick}
          className="relative group min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
          aria-label="Open command palette"
          title="Open command palette (⌘K)"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-hover:opacity-60 transition-opacity" />
          
          {/* Icon container with gradient border */}
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl dark:bg-[#0B1018] bg-[hsl(var(--card))] backdrop-blur-[10px] dark:border-[rgba(154,203,255,0.88)] border-[hsl(var(--border))] flex items-center justify-center transition-all duration-200 dark:group-hover:border-[rgba(154,203,255,1)] group-hover:border-[hsl(var(--border))] overflow-hidden shadow-sm">
            {/* Gradient background effect - subtle blue glow (dark mode only) */}
            <div className="absolute inset-0 rounded-xl opacity-0 dark:opacity-30 bg-gradient-to-br from-[rgba(101,181,255,0.6)] via-[rgba(154,205,255,0.4)] to-transparent" />
            {/* Compass icon */}
            <Compass className="relative w-5 h-5 md:w-6 md:h-6 text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))] rotate-90 z-10" />
          </div>
        </button>

        {/* Navigation Icons */}
        <div className="flex flex-col gap-2 md:gap-3 items-center">
          {/* Notifications */}
          <NotificationsPopover
            a2aNotes={a2aNotes}
            open={showNotifications}
            onOpenChange={setShowNotifications}
          />

          {/* Folder/Files */}
          <button
            onClick={handleFolderClick}
            className={cn(
              "relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px]",
              isNotesActive 
                ? "bg-background/20 dark:bg-background/20 bg-[hsl(var(--muted))]" 
                : "hover:bg-background/10 dark:hover:bg-background/10 hover:bg-[hsl(var(--muted))]"
            )}
            aria-label="Files"
          >
            <Folder className={cn(
              "w-5 h-5 md:w-6 md:h-6",
              isNotesActive ? "text-primary" : "text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))]"
            )} />
          </button>

          {/* Plus/Create - Navigate to Thinking Lab */}
          <button
            onClick={handlePlusClick}
            className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10 dark:hover:bg-background/10 hover:bg-[hsl(var(--muted))] min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px]"
            aria-label="Thinking Lab"
            title="Thinking Lab"
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))]" />
          </button>
        </div>
      </div>

      {/* Bottom Section: Profile */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleProfileClick}
          className={cn(
            "relative transition-opacity hover:opacity-80 min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center",
            isSettingsActive && "opacity-100"
          )}
          aria-label="Profile & Settings"
        >
          <Avatar className="w-10 h-10 md:w-11 md:h-11 border-2 border-[rgba(154,203,255,0.3)] dark:border-[rgba(154,203,255,0.3)] border-[hsl(var(--border))]">
            <AvatarImage src={getUserPhoto()} />
            <AvatarFallback 
              className="bg-[#C00011] text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))] text-[28px] md:text-[32px] font-normal"
            >
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    </div>
  )
})
