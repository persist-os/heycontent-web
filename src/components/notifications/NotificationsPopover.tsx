/**
 * NOTIFICATIONS POPOVER COMPONENT
 * 
 * Extracted notifications UI from global-nav.
 * Displays A2A notes in a popover with routing support.
 * 
 * DESIGN COMPLIANCE:
 * - Uses existing UI components (Popover, Badge, Button, Dialog)
 * - Follows design system patterns
 * - Responsive and accessible
 * - Mobile: Bottom sheet drawer (iOS-style)
 * - Desktop: Popover (unchanged)
 */

'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationRouting } from '@/hooks/useNotificationRouting'
import { T } from '@/components/translation'
import { useTranslation } from '@/hooks/useTranslation'

interface A2ANote {
  _id: string
  report?: {
    announcement?: string
    summary?: string
    artifact_id?: string
    widget_id?: string
    metadata?: {
      artifact_id?: string
      artifactId?: string
      widget_id?: string
      widgetId?: string
    }
  }
  agentId?: string
  conversationId?: string
  projectId?: string
  createdAt: number
}

interface NotificationsPopoverProps {
  a2aNotes?: A2ANote[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Optional: Custom trigger button (for mobile dropdown menu)
   * If provided, PopoverTrigger will not render its own button
   */
  trigger?: React.ReactNode
}

/**
 * Shared notifications list content (used by both Popover and Drawer)
 */
function NotificationsList({
  a2aNotes,
  onNotificationClick,
}: {
  a2aNotes: A2ANote[]
  onNotificationClick: (note: A2ANote) => void
}) {
  const {
    getNotificationRoute,
    formatNotificationText,
    getNotificationIcon,
    formatRelativeTime,
    handleNotificationClick,
  } = useNotificationRouting()

  if (!a2aNotes || a2aNotes.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        <T context="notifications.empty">No notifications</T>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {a2aNotes.map((note) => {
        const Icon = getNotificationIcon(note)
        const text = formatNotificationText(note)
        const route = getNotificationRoute(note)
        
        return (
          <button
            key={note._id}
            onClick={() => handleNotificationClick(note, () => onNotificationClick(note))}
            disabled={!route}
            className={cn(
              "w-full px-4 py-3 text-left hover:bg-muted/50 active:bg-muted transition-colors min-h-[60px] flex items-center",
              !route && "opacity-50 cursor-not-allowed"
            )}
            aria-label={text}
          >
            <div className="flex items-start gap-3 w-full">
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
  )
}

export function NotificationsPopover({
  a2aNotes = [],
  open,
  onOpenChange,
  trigger,
}: NotificationsPopoverProps) {
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

  const hasNotifications = (a2aNotes?.length || 0) > 0

  // Translated aria-labels
  const { text: notificationsAriaLabel } = useTranslation('Notifications', {
    context: 'aria.notifications'
  })
  const { text: closeNotificationsAriaLabel } = useTranslation('Close notifications', {
    context: 'aria.close_notifications'
  })

  // Mobile: Bottom sheet drawer (iOS-style)
  if (isMobile) {
    return (
      <>
        {/* Trigger button (custom or default) */}
        {trigger ? (
          <div onClick={() => onOpenChange?.(true)}>
            {trigger}
          </div>
        ) : (
          <button
            onClick={() => onOpenChange?.(true)}
            className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10 dark:hover:bg-background/10 hover:bg-[hsl(var(--muted))] min-w-[44px] min-h-[44px]"
            aria-label={notificationsAriaLabel}
          >
            <Bell className="w-5 h-5 text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))]" />
            {hasNotifications && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        )}

        {/* Mobile Bottom Sheet Drawer */}
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            className={cn(
              "fixed bottom-0 left-0 right-0 top-auto translate-y-0 translate-x-0",
              "w-full max-w-none rounded-t-2xl rounded-b-none",
              "max-h-[85vh] p-0 flex flex-col",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom-2",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "z-[80]"
            )}
            aria-describedby={undefined}
          >
            {/* Header */}
            <div className="sticky top-0 bg-background border-b px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <DialogTitle className="font-semibold text-base m-0">
                  <T context="notifications.title">Notifications</T>
                </DialogTitle>
                {hasNotifications && (
                  <Badge variant="default" className="text-xs">
                    {a2aNotes?.length || 0}
                  </Badge>
                )}
              </div>
              <button
                onClick={() => onOpenChange?.(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={closeNotificationsAriaLabel}
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 max-h-[calc(85vh-60px)]">
              <NotificationsList
                a2aNotes={a2aNotes}
                onNotificationClick={() => onOpenChange?.(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Desktop: Popover (unchanged)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
      ) : (
        <PopoverTrigger asChild>
          <button
            className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10 dark:hover:bg-background/10 hover:bg-[hsl(var(--muted))] min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px]"
            aria-label={notificationsAriaLabel}
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))]" />
          </button>
        </PopoverTrigger>
      )}
      <PopoverContent 
        className="w-80 p-0" 
        align="start"
        side="right"
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                <T context="notifications.title">Notifications</T>
              </h3>
              {hasNotifications && (
                <Badge variant="default" className="text-xs">
                  {a2aNotes?.length || 0}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            <NotificationsList
              a2aNotes={a2aNotes}
              onNotificationClick={() => onOpenChange?.(false)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

