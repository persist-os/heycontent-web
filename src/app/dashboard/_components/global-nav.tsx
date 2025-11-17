'use client'

import React, { memo, useCallback, useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Compass,
  Folder,
  Plus,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { useSidebar } from '@/app/context/sidebar-context'
import { useAuth } from '@/app/context/auth-context'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover'
import { T } from '@/components/translation'
import { useTranslation } from '@/hooks/useTranslation'

export const GlobalNav = memo(function GlobalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { setIsExpanded } = useSidebar()
  const { firebaseUser } = useAuth()
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
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
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [setIsExpanded, isMobile])

  // Handle folder icon click - navigates to Files/Notes
  const handleFolderClick = useCallback(() => {
    router.push('/dashboard/notes')
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [router, isMobile])

  // Handle plus icon click - navigates to Thinking Lab
  const handlePlusClick = useCallback(() => {
    router.push('/dashboard/thinking_lab')
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [router, isMobile])

  // Handle profile click - navigate to settings
  const handleProfileClick = useCallback(() => {
    router.push('/settings')
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [router, isMobile])
  
  // Handle notifications open/close - close mobile sidebar when opening
  const handleNotificationsChange = useCallback((open: boolean) => {
    setShowNotifications(open)
    if (open && isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }, [isMobile])
  
  // Handle hamburger menu toggle
  const handleHamburgerToggle = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev)
  }, [])
  
  // Close mobile sidebar when clicking backdrop
  const handleBackdropClick = useCallback(() => {
    setIsMobileSidebarOpen(false)
  }, [])

  // Check if current path matches
  const isNotesActive = pathname.startsWith('/dashboard/notes')
  const isSettingsActive = pathname.startsWith('/settings')

  // Translated strings for aria-labels and text
  const { text: commandPaletteAriaLabel } = useTranslation('Open command palette', {
    context: 'aria.command_palette'
  })
  const { text: notificationsAriaLabel } = useTranslation('Notifications', {
    context: 'aria.notifications'
  })
  const { text: filesAriaLabel } = useTranslation('Files', {
    context: 'aria.files'
  })
  const { text: thinkingLabAriaLabel } = useTranslation('Thinking Lab', {
    context: 'aria.thinking_lab'
  })
  const { text: profileSettingsAriaLabel } = useTranslation('Profile & Settings', {
    context: 'aria.profile_settings'
  })
  const { text: toggleNavAriaLabel } = useTranslation('Toggle navigation menu', {
    context: 'aria.toggle_nav'
  })

  return (
    <>
      {/* Mobile: Hamburger Menu Button */}
      {isMobile && (
        <button
          onClick={handleHamburgerToggle}
          className="fixed top-4 left-4 z-[100] w-10 h-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-card border border-border hover:bg-muted transition-colors md:hidden shadow-lg"
          aria-label={toggleNavAriaLabel}
        >
          {isMobileSidebarOpen ? (
            <X className="w-5 h-5 text-foreground" />
          ) : (
            <Menu className="w-5 h-5 text-foreground" />
          )}
        </button>
      )}
      
      {/* Mobile: Backdrop Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[70] md:hidden"
          onClick={handleBackdropClick}
          aria-hidden="true"
        />
      )}
      
      {/* Mobile: Compact Dropdown Menu */}
      {isMobile && isMobileSidebarOpen && (
        <div
          className={cn(
            "fixed top-16 left-4 z-[90] w-48 bg-card border border-border rounded-xl shadow-2xl backdrop-blur-md overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            "md:hidden"
          )}
        >
          <div className="flex flex-col p-2 gap-1">
            {/* Compass/Command Palette */}
            <button
              onClick={handleCompassClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              aria-label={commandPaletteAriaLabel}
            >
              <Compass className="w-5 h-5 text-foreground rotate-90" />
              <span className="text-sm font-medium text-foreground">
                <T context="nav.command_palette">Command Palette</T>
              </span>
            </button>

            {/* Notifications */}
            <NotificationsPopover
              a2aNotes={a2aNotes}
              open={showNotifications}
              onOpenChange={handleNotificationsChange}
              trigger={
                <button
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left w-full min-h-[44px]"
                  aria-label={notificationsAriaLabel}
                >
                  <Bell className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    <T context="nav.notifications">Notifications</T>
                  </span>
                </button>
              }
            />

            {/* Folder/Files */}
            <button
              onClick={handleFolderClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left",
                isNotesActive && "bg-muted"
              )}
              aria-label={filesAriaLabel}
            >
              <Folder className={cn(
                "w-5 h-5",
                isNotesActive ? "text-primary" : "text-foreground"
              )} />
              <span className={cn(
                "text-sm font-medium",
                isNotesActive ? "text-primary" : "text-foreground"
              )}>
                <T context="nav.files">Files</T>
              </span>
            </button>

            {/* Plus/Thinking Lab */}
            <button
              onClick={handlePlusClick}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
              aria-label={thinkingLabAriaLabel}
            >
              <Plus className="w-5 h-5 text-foreground" />
              <span className="text-sm font-medium text-foreground">
                <T context="nav.thinking_lab">Thinking Lab</T>
              </span>
            </button>

            {/* Divider */}
            <div className="h-px bg-border my-1" />

            {/* Profile/Settings */}
            <button
              onClick={handleProfileClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left",
                isSettingsActive && "bg-muted"
              )}
              aria-label={profileSettingsAriaLabel}
            >
              <Avatar className="w-5 h-5 border border-border">
                <AvatarImage src={getUserPhoto()} />
                <AvatarFallback className="bg-[#C00011] text-foreground text-xs">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <span className={cn(
                "text-sm font-medium",
                isSettingsActive ? "text-primary" : "text-foreground"
              )}>
                <T context="nav.settings">Settings</T>
              </span>
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar - Fixed on desktop only */}
      <div className={cn(
        "hidden md:flex fixed left-0 top-0 bottom-0 flex-col items-center justify-between py-[60px] bg-background border-r border-border z-[90] w-14 px-3 md:px-4"
      )}>
      {/* Top Section: Logo/Compass */}
      <div className="flex flex-col items-center gap-2 md:gap-6">
        {/* Compass/Logo Icon */}
        <button
          onClick={handleCompassClick}
          className="relative group min-w-[40px] min-h-[40px] md:min-w-[44px] md:min-h-[44px] flex items-center justify-center"
          aria-label={commandPaletteAriaLabel}
          title={`${commandPaletteAriaLabel} (⌘K)`}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-primary/20 blur-md rounded-xl opacity-0 group-hover:opacity-60 transition-opacity" />
          
          {/* Icon container with gradient border */}
          <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-card backdrop-blur-[10px] border-border flex items-center justify-center transition-all duration-200 hover:border-primary overflow-hidden shadow-sm">
            {/* Gradient background effect - subtle blue glow (dark mode only) */}
            <div className="absolute inset-0 rounded-xl opacity-0 dark:opacity-30 bg-gradient-to-br from-[rgba(101,181,255,0.6)] via-[rgba(154,205,255,0.4)] to-transparent" />
            {/* Compass icon */}
            <Compass className="relative w-5 h-5 md:w-6 md:h-6 text-foreground rotate-90 z-10" />
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
                ? "bg-muted" 
                : "hover:bg-muted"
            )}
            aria-label={filesAriaLabel}
          >
            <Folder className={cn(
              "w-5 h-5 md:w-6 md:h-6",
              isNotesActive ? "text-primary" : "text-foreground"
            )} />
          </button>

          {/* Plus/Create - Navigate to Thinking Lab */}
          <button
            onClick={handlePlusClick}
            className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-muted min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px]"
            aria-label={thinkingLabAriaLabel}
            title={thinkingLabAriaLabel}
          >
            <Plus className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
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
          aria-label={profileSettingsAriaLabel}
        >
          <Avatar className="w-10 h-10 md:w-11 md:h-11 border-2 border-border">
            <AvatarImage src={getUserPhoto()} />
            <AvatarFallback 
              className="bg-[#C00011] text-foreground text-[28px] md:text-[32px] font-normal"
            >
              {getUserInitial()}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
      </div>
    </>
  )
})
