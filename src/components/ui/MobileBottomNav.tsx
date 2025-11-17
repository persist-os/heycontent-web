'use client'

import React from 'react'
import { MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  activeTab: 'chat' | 'panel'
  onTabChange: (tab: 'chat' | 'panel') => void
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, tab: 'chat' | 'panel') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onTabChange(tab)
    } else if (e.key === 'ArrowLeft' && tab === 'panel') {
      e.preventDefault()
      onTabChange('chat')
    } else if (e.key === 'ArrowRight' && tab === 'chat') {
      e.preventDefault()
      onTabChange('panel')
    }
  }

  return (
    <nav 
      className="flex-shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-xl safe-area-inset-bottom z-[100]"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex h-14">
        <button
          onClick={() => onTabChange('chat')}
          onKeyDown={(e) => handleKeyDown(e, 'chat')}
          aria-label="Switch to Chat view"
          aria-pressed={activeTab === 'chat'}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            activeTab === 'chat'
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <MessageSquare className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        
        <button
          onClick={() => onTabChange('panel')}
          onKeyDown={(e) => handleKeyDown(e, 'panel')}
          aria-label="Switch to Panel view"
          aria-pressed={activeTab === 'panel'}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            activeTab === 'panel'
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <FileText className="w-5 h-5" aria-hidden="true" />
          <span className="text-xs font-medium">Panel</span>
        </button>
      </div>
    </nav>
  )
}

