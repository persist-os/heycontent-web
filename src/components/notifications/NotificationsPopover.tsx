/**
 * NOTIFICATIONS POPOVER COMPONENT
 * 
 * Extracted notifications UI from global-nav.
 * Displays A2A notes in a popover with routing support.
 * 
 * DESIGN COMPLIANCE:
 * - Uses existing UI components (Popover, Badge, Button)
 * - Follows design system patterns
 * - Responsive and accessible
 */

'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotificationRouting } from '@/hooks/useNotificationRouting'

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
}

export function NotificationsPopover({
  a2aNotes = [],
  open,
  onOpenChange,
}: NotificationsPopoverProps) {
  const {
    getNotificationRoute,
    formatNotificationText,
    getNotificationIcon,
    formatRelativeTime,
    handleNotificationClick,
  } = useNotificationRouting()

  const hasNotifications = (a2aNotes?.length || 0) > 0

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-background/10 dark:hover:bg-background/10 hover:bg-[hsl(var(--muted))] min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px]"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 md:w-6 md:h-6 text-[#EEF1FE] dark:text-[#EEF1FE] text-[hsl(var(--foreground))]" />
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
                      onClick={() => handleNotificationClick(note, () => onOpenChange?.(false))}
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
  )
}

