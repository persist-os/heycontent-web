'use client'

import React from 'react'
import { MessageSquare, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  activeTab: 'chat' | 'panel'
  onTabChange: (tab: 'chat' | 'panel') => void
}

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="flex-shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex h-14">
        <button
          onClick={() => onTabChange('chat')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            activeTab === 'chat'
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-xs font-medium">Chat</span>
        </button>
        
        <button
          onClick={() => onTabChange('panel')}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-colors",
            activeTab === 'panel'
              ? "text-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          )}
        >
          <FileText className="w-5 h-5" />
          <span className="text-xs font-medium">Panel</span>
        </button>
      </div>
    </nav>
  )
}

