'use client'

import React from 'react'
import { MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileTabBarProps {
  activeTab: 'chat' | 'notes'
  onTabChange: (tab: 'chat' | 'notes') => void
  hasUnreadNotepadChanges: boolean
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
  activeTab,
  onTabChange,
  hasUnreadNotepadChanges
}) => {
  return (
    <div className="sm:hidden border-b border-border bg-background">
      <div className="flex">
        {/* Chat Tab */}
        <button
          onClick={() => onTabChange('chat')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 relative transition-all duration-200",
            activeTab === 'chat'
              ? "text-foreground bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">Chat</span>
          
          {/* Active indicator */}
          {activeTab === 'chat' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        {/* Notes Tab */}
        <button
          onClick={() => onTabChange('notes')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 relative transition-all duration-200",
            activeTab === 'notes'
              ? "text-foreground bg-muted/50"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <div className="relative">
            <FileText className="w-4 h-4" />
            {/* Badge indicator */}
            {hasUnreadNotepadChanges && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </div>
          <span className="text-sm font-medium">Notes</span>
          
          {/* Active indicator */}
          {activeTab === 'notes' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>
    </div>
  )
}
